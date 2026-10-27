// Checks of the category page against the TEI in tei/. The stylesheet keeps the
// categories without entries as an explicit list, since loading the edition there
// would slow the page on GAMS; this test recomputes the list from the edition and
// fails when the two drift. It also checks that the page shows every category once,
// in the group order of the edition, and links only where a list can have entries.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { JSDOM } from 'jsdom';
import { here, root, dataRoot } from '../gams.mjs';

const failures = [];
const check = (condition, message) => { if (!condition) { failures.push(`categories: ${message}`); } };
const xml = (file) => new JSDOM(readFileSync(resolve(dataRoot, 'tei', file), 'utf8'), { contentType: 'application/xml' }).window.document;

const taxonomy = xml('ufbas.kategorien.xml').querySelector('taxonomy');
const edition = xml('ufbas.1563.xml');
const term = (category) => (category.querySelector(':scope > catDesc > term')?.textContent || '').trim().replace(/\s+/g, ' ');
const named = (parent) => [...parent.children].filter((c) => c.localName === 'category' && term(c) !== '');
const id = (category) => category.getAttribute('xml:id');

// a category has entries when an element of the edition names it in @ana
const used = new Set();
for (const element of edition.querySelectorAll('[ana]')) {
  for (const token of element.getAttribute('ana').split(/\s+/)) { used.add(token); }
}
const topLevel = named(taxonomy);
const groupOrder = ['uf_Person', 'uf_Tat', 'uf_Strafe', 'uf_Ort', 'uf_Schlagwort'];
const groups = [...groupOrder.map((g) => topLevel.find((c) => id(c) === g)),
  ...topLevel.filter((c) => named(c).length && !groupOrder.includes(id(c)))];
const loose = topLevel.filter((c) => !named(c).length);
const linkable = [...groups.flatMap(named), ...loose];
const expectedWithout = linkable.filter((c) => !used.has(`#${id(c)}`)).map(id).sort();

const stylesheet = readFileSync(resolve(root, 'ufbas-category.xsl'), 'utf8');
const listOf = (name) => {
  const select = stylesheet.match(new RegExp(`<xsl:variable name="${name}" select="\\(([^)]*)\\)"`));
  return select ? [...select[1].matchAll(/'([^']+)'/g)].map((m) => m[1]) : null;
};
const withoutEntries = listOf('withoutEntries');
check(withoutEntries, 'list withoutEntries not found in ufbas-category.xsl');
check(JSON.stringify([...(withoutEntries || [])].sort()) === JSON.stringify(expectedWithout),
  `withoutEntries in ufbas-category.xsl is ${withoutEntries?.join(', ')}, the edition gives ${expectedWithout.join(', ')}`);

// the page
const doc = new JSDOM(readFileSync(resolve(here, 'build', 'kategorien.html'), 'utf8')).window.document;
check(!doc.querySelector('details'), 'collapsed section on the page');
const sections = [...doc.querySelectorAll('.taxonomy > section.cat-group')];
const expectedSections = [...groups.map((g) => `gruppe-${id(g).slice(3).toLowerCase()}`), 'weitere-kategorien'];
check(sections.map((s) => s.id).join() === expectedSections.join(), `sections ${sections.map((s) => s.id).join()}`);
const nav = [...doc.querySelectorAll('aside.tools .group-nav a')].map((a) => a.getAttribute('href').slice(1));
check(nav.join() === expectedSections.join(), `group navigation ${nav.join()}`);
check(groupOrder.every((g, i) => sections[i]?.querySelector('h2 .swatch')?.getAttribute('data-group') === g.slice(3)), 'group heading without its colour swatch');

// every category once, in group order and within a group in TEI order
const expectedItems = [...groups.map(named), loose];
sections.forEach((section, i) => {
  const items = [...section.querySelectorAll('.cat-item')];
  const categories = expectedItems[i] || [];
  check(items.map((it) => it.querySelector('dt').textContent).join('|') === categories.map(term).join('|'), `categories of ${section.id} differ from the taxonomy`);
  items.forEach((item, j) => {
    const category = categories[j];
    if (!category) { return; }
    const list = item.querySelector('dt a[href*="query:ufbas.kategorien"]');
    const explore = item.querySelector('a.explore-link');
    const name = `${id(category)} (${term(category)})`;
    if (withoutEntries?.includes(id(category))) {
      check(!item.querySelector('a'), `${name} links to an empty list`);
      check(item.querySelector('.cat-empty')?.textContent === 'keine Einträge', `${name} not marked as without entries`);
      return;
    }
    check(list && list.getAttribute('href').endsWith(encodeURIComponent(`%23${id(category).slice(3)}%3E`)), `${name} without list link to its IRI`);
    check(!item.querySelector('a[href*="query:ufbas.graph"]'), `${name} still links to the graph page`);
    // the filter of the Exploration view follows the group, as uf:facet in ufbas-static.xsl
    const top = id(category.closest('taxonomy > category') || category);
    const facet = { uf_Tat: 'tat', uf_Strafe: 'strafe', uf_Schlagwort: 'schlagwort' }[top] ||
      (['uf_Vorinstanz', 'uf_FrüheresUrfehdeverfahren', 'uf_AnderesUrfehdeverfahren', 'uf_Untersuchungshaft'].includes(id(category)) ? 'verfahren' : '');
    if (facet) {
      check(explore?.getAttribute('href') === `/archive/objects/context:ufbas/methods/sdef:Context/get?mode=exploration#${facet}=${id(category).slice(3)}`,
        `${name} without its link into the Exploration view`);
      // the same icon link as on the category browse, its name naming the category
      check(explore?.textContent.trim() === `${term(category)} in der Exploration zeigen`, `${name} Exploration link without its category in the name`);
      check(explore?.getAttribute('data-tip') === 'In der Exploration zeigen' && explore.querySelector('.icon-explore[aria-hidden="true"]'), `${name} Exploration link not the icon with its tooltip`);
    } else {
      check(!explore, `${name} links into the Exploration view, which has no filter for it`);
    }
  });
});

if (failures.length) {
  console.log(failures.join('\n'));
  process.exit(1);
}
console.log(`categories: ${linkable.length} categories checked, without entries ${expectedWithout.join(', ')}`);
