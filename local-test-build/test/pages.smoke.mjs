// Structure checks on every page built by build.mjs. Expected hit counts are those of
// HITS in lib.mjs, the counts of entries and page breaks come from the TEI.
import { JSDOM } from 'jsdom';
import { HITS, built, editionTEI, teiEntryCount } from './lib.mjs';

const VOID = 'area|base|br|col|embed|hr|img|input|link|meta|source|track|wbr';
const failures = [];
const check = (page, condition, message) => { if (!condition) { failures.push(`${page}: ${message}`); } };

function common(page, html, doc) {
  // served as XML but parsed as HTML: an empty non-void element opens an unclosed tag
  const selfClosing = html.match(new RegExp(`<(?!(?:${VOID})\\b)[a-z][a-z0-9]*\\b[^>]*/>`, 'g')) || [];
  check(page, selfClosing.length === 0, `self-closing non-void elements: ${selfClosing.slice(0, 3).join(' ')}`);
  const ids = [...doc.querySelectorAll('[id]')].map((e) => e.id);
  const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
  check(page, dup.length === 0, `duplicate ids: ${[...new Set(dup)].slice(0, 5).join(', ')}`);
  const idSet = new Set(ids);
  const dead = [...doc.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute('href').slice(1)).filter((id) => id && !idSet.has(id));
  check(page, dead.length === 0, `anchors without target: ${[...new Set(dead)].slice(0, 5).join(', ')}`);
  check(page, doc.querySelectorAll('h1').length === 1, `expected one h1, found ${doc.querySelectorAll('h1').length}`);
  const visible = doc.body.cloneNode(true);
  visible.querySelectorAll('script, style').forEach((node) => node.remove());
  const text = visible.textContent;
  check(page, !/\bundefined\b|\bNaN\b/.test(text), 'text contains undefined or NaN');
  const noAlt = [...doc.querySelectorAll('img')].filter((img) => !img.hasAttribute('alt'));
  check(page, noAlt.length === 0, `images without alt: ${noAlt.length}`);
  const unlabelled = [...doc.querySelectorAll('input:not([type="hidden"]), select, textarea')].filter((input) =>
    !input.closest('label') && !(input.id && doc.querySelector(`label[for="${input.id}"]`)) && !input.getAttribute('aria-label'));
  check(page, unlabelled.length === 0, `form controls without label: ${unlabelled.length}`);
  check(page, !/href="http:\/\/(gams|www\.uni|dokumente)/.test(html), 'http link to a host that serves https');
  check(page, !html.includes('context:srbas'), 'asset of another project');
  // the shell is vanilla, Bootstrap and jQuery from the GAMS /lib/ path are gone
  check(page, !html.includes('/lib/'), 'asset from the GAMS /lib/ path');
  const unlistedLists = [...doc.querySelectorAll('.nav-list, .plain-list, .year-jump, .result-list, .edition-toc ul')].filter((l) => l.getAttribute('role') !== 'list');
  check(page, unlistedLists.length === 0, `unstyled lists without role list: ${unlistedLists.length}`);
}

const expectations = {
  home: (doc) => check('home', doc.querySelector('[aria-current="page"]')?.textContent === 'Home', 'Home not marked as current'),
  about: (doc) => {
    check('about', doc.querySelector('[aria-current="page"]')?.textContent === 'Projekt', 'Projekt not current');
    check('about', doc.querySelectorAll('.footnotes li').length === doc.querySelectorAll('sup a[href^="#note"]').length, 'footnote count differs from references');
    check('about', doc.querySelectorAll('table th').length > 0 && doc.querySelectorAll('table td').length > 0, 'table without head or body cells');
  },
  datenkorb: (doc) => check('datenkorb', doc.getElementById('datenkorbInhalt'), 'basket container missing'),
  ontologie: (doc) => {
    check('ontologie', doc.querySelector('[aria-current="page"]')?.textContent === 'Ontologie', 'Ontologie not current');
    check('ontologie', doc.querySelector('.onto-model svg a.onto-node'), 'model diagram missing');
    check('ontologie', doc.querySelector('.onto-downloads').getAttribute('role') === 'list' && doc.querySelector('.onto-shapes ul').getAttribute('role') === 'list', 'unstyled lists without role list');
  },
  kategorien: (doc) => {
    // floors against a page that lost its groups or links; categories.test.mjs checks both against the taxonomy
    check('kategorien', doc.querySelectorAll('.taxonomy section.cat-group').length >= 6, 'category groups missing');
    check('kategorien', !doc.querySelector('.taxonomy details'), 'collapsed categories are out of reach of find-in-page');
    const links = [...doc.querySelectorAll('.taxonomy a[href*="query:ufbas.kategorien"]')];
    check('kategorien', links.length > 100, `few category links: ${links.length}`);
    check('kategorien', links.every((a) => /params=%241%7C%253Chttp%3A%2F%2Fgams\.uni-graz\.at%2Fufbas%2F%2523/.test(a.getAttribute('href'))), 'category link with unexpected params');
  },
  edition: (doc) => {
    const entries = doc.querySelectorAll('article.entry');
    check('edition', entries.length === teiEntryCount(), `entries: ${entries.length}, the TEI has ${teiEntryCount()}`);
    const tocTargets = [...doc.querySelectorAll('.edition-toc a')].map((a) => a.getAttribute('href').slice(1));
    check('edition', new Set(tocTargets).size === entries.length, `table of contents covers ${new Set(tocTargets).size} of ${entries.length} entries`);
    const groups = ['Person', 'Tat', 'Strafe', 'Ort', 'Schlagwort'];
    const anns = [...doc.querySelectorAll('.ann')];
    // a floor against a page that lost its annotations, the build of 2026-10-26 has 7345 spans
    check('edition', anns.length > 7000, `annotations: ${anns.length}`);
    const badAnns = anns.filter((a) => !groups.includes(a.getAttribute('data-group')) || !a.getAttribute('data-label')?.trim());
    check('edition', badAnns.length === 0, `annotations without group or label: ${badAnns.length}`);
    check('edition', !doc.querySelector('.entry-cats, .cat-toggle, [data-groups]'), 'category panel left in the page');
    check('edition', doc.querySelectorAll('.basket-check').length === entries.length, 'basket checkbox per entry');
    check('edition', doc.querySelectorAll('label.basket-icon > input.basket-check').length === entries.length, 'basket switch as icon per entry');
    const views = [...doc.querySelectorAll('fieldset.view-switch[hidden] input[name="ansicht"]')].map((r) => r.value + (r.checked ? '*' : ''));
    check('edition', views.join() === 'text,bild', `view switch: ${views.join()}`);
    const annotated = [...entries].filter((e) => e.querySelector('.entry-text .ann'));
    check('edition', doc.querySelectorAll('.entry-head .index-toggle[hidden][aria-expanded="false"]').length === annotated.length
      && annotated.every((e) => e.querySelector('.index-toggle')), 'annotation index switch for every entry with annotations only');
    check('edition', doc.querySelector('.tools > button.toc-toggle[hidden][aria-controls="edition-toc"]') && doc.getElementById('edition-toc'), 'table of contents button');
    const pane = doc.querySelector('.with-tools > section.facsimile[hidden]');
    check('edition', pane && pane.getAttribute('data-images') === '/ufbas/data/ufbas-facsimile.json'
      && pane.getAttribute('data-viewer') === '/ufbas/js/openseadragon-6.1.1/openseadragon.min.js', 'page image pane with its dataset and viewer');
    check('edition', pane && pane.querySelector('.facsimile-missing[hidden] a[href^="https://dls.staatsarchiv.bs.ch/records/"]'), 'page image pane without the link to the Lesesaal');
    check('edition', !doc.querySelector('script[src*="openseadragon"]'), 'OpenSeadragon loaded before the view asks for it');
    const scripts = [...doc.querySelectorAll('script[src]')].map((s) => s.getAttribute('src').split('/').pop());
    check('edition', scripts.indexOf('highlighting.js') >= 0 && scripts.indexOf('highlighting.js') < scripts.indexOf('edition-views.js'), 'edition-views.js not loaded after highlighting.js');
    const folios = [...doc.querySelectorAll('.folio')];
    // one folio label per page break of the TEI
    check('edition', folios.length === editionTEI().match(/<pb\b/g).length && folios.every((f) => /^\d+$/.test(f.getAttribute('data-facs') || '')), 'folio label without its image number, or not one per page break');
    check('edition', doc.querySelector('[aria-current="page"]')?.textContent === 'Urfehdebuch', 'Urfehdebuch not current');
    const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember', 'ohne Monat'];
    const badMonths = [...doc.querySelectorAll('.toc-month')].filter((p) => !months.includes(p.textContent.trim()));
    check('edition', badMonths.length === 0, `month headings that are no single month: ${badMonths.length}`);
    const switches = [...doc.querySelectorAll('.mark-switches input[type="checkbox"][name="markierung"]')].map((r) => r.value);
    check('edition', switches.join() === groups.join(), `mark switches: ${switches.join()}`);
    check('edition', [...doc.querySelectorAll('.editor-note')].every((n) => /^Anmerkung: \S/.test(n.getAttribute('aria-label'))), 'editorial note without label');
  }
};

for (const [page, count] of Object.entries(HITS)) {
  expectations[page] = (doc) => {
    const results = doc.querySelectorAll('li.result');
    check(page, results.length === count, `results: ${results.length}, expected ${count}`);
    check(page, doc.querySelector('.result-summary strong')?.textContent === `${count} Treffer`, 'hit count text');
    check(page, doc.querySelectorAll('.basket-check').length === count, 'basket checkbox per result');
    const dates = [...results].map((r) => r.getAttribute('data-datum')).filter(Boolean);
    check(page, dates.every((d, i) => i === 0 || dates[i - 1] <= d), 'results not sorted by date');
    if (page !== 'search-date-only') { check(page, doc.querySelectorAll('mark.hit').length > 0, 'no highlighted hits'); }
  };
}
// a highlight pattern matching the empty string aborts the page in XSLT 2.0 on GAMS;
// SaxonJS tolerates it and would show empty marks instead
expectations['search-star-term'] = (doc) => {
  check('search-star-term', doc.querySelectorAll('li.result').length > 0, 'no results');
  check('search-star-term', [...doc.querySelectorAll('mark.hit')].every((m) => m.textContent !== ''), 'empty highlight');
};
expectations['search-invalid'] = (doc) => {
  check('search-invalid', doc.querySelector('.alert-query[role="alert"]:not([hidden])'), 'invalid query not reported');
  check('search-invalid', !doc.querySelector('.result-list'), 'result list on invalid query');
};
expectations['search-form'] = (doc) => {
  check('search-form', doc.getElementById('SucheErweitert'), 'form missing');
  check('search-form', !doc.querySelector('.search-help').hasAttribute('open'), 'rules open on the empty form, where the examples already show the syntax');
  check('search-form', !doc.querySelector('.result-summary'), 'result summary on empty form');
  check('search-form', doc.querySelector('h1')?.textContent === 'Erweiterte Suche', 'the form page is titled like its navigation item');
};
expectations['category-browse'] = ((base) => (doc) => {
  base(doc);
  check('category-browse', /^Kategorie: \S/.test(doc.querySelector('h1').textContent), 'category heading');
  check('category-browse', doc.querySelector('[aria-current="page"]')?.textContent === 'Kategorien', 'Kategorien not current');
})(expectations['category-browse']);

// the graph page forwards to the Exploration view with the category in the fragment
const explorationUrl = '/archive/objects/context:ufbas/methods/sdef:Context/get?mode=exploration';
for (const [page, heading, target] of [['graph', 'Graph: Diebstahl', `${explorationUrl}#tat=TatDiebstahl`],
  ['graph-vorinstanz', 'Graph: Vorinstanz', `${explorationUrl}#verfahren=Vorinstanz`]]) expectations[page] = (doc) => {
  check(page, doc.querySelector('h1')?.textContent === heading, 'heading does not name the category');
  check(page, doc.querySelector('meta[http-equiv="refresh"]')?.getAttribute('content') === `0; url=${target}`, 'no forward to the Exploration view with the category');
  check(page, doc.querySelector('.page-head a')?.getAttribute('href') === target, 'no link to the Exploration view');
  check(page, !doc.querySelector('script[src*="graph"], script[src*="d3"]'), 'graph script still loaded');
  check(page, doc.querySelector('[aria-current="page"]')?.textContent === 'Kategorien', 'Kategorien not current');
};

for (const [page, expect] of Object.entries(expectations)) {
  const html = built(page);
  const doc = new JSDOM(html).window.document;
  common(page, html, doc);
  expect(doc);
}
for (const page of ['imprint', 'exploration']) {
  const html = built(page);
  common(page, html, new JSDOM(html).window.document);
}

if (failures.length) {
  console.log(failures.join('\n'));
  process.exit(1);
}
console.log(`pages.smoke: ${Object.keys(expectations).length + 2} pages passed`);
