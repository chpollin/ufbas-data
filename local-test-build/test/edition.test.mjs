// Edition page: derived labels, heading hierarchy, folio of an entry, page head, the
// markup of marginal notes and the table of contents following the reading position.
// Expected strings are taken from tei/ufbas.1563.xml.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { JSDOM } from 'jsdom';
import { root } from '../gams.mjs';
import { built, editionTEI, open, runner } from './lib.mjs';

const html = built('edition');
const doc = new JSDOM(html).window.document;
const entry = (id) => doc.getElementById(id);
const title = (id) => entry(id).querySelector('.entry-title').textContent.replace(/\s+/g, ' ').trim();
const tocLink = (id) => doc.querySelector(`.edition-toc a[href="#${id}"]`);

const { test, done } = runner('edition', 'tests');

await test('a word broken across manuscript lines is joined in every derived label', () => {
  // <roleName>mey<lb break="no"/> ger</roleName>, which string() turned into "mey ger"
  assert.equal(entry('Eintrag-146').getAttribute('data-taeter'), 'Hanns Zwilchenbart der meyger');
  assert.match(tocLink('Eintrag-146').textContent, /^26\.01\. Hanns Zwilchenbart der meyger$/);
  assert.ok(title('Eintrag-146').endsWith('Hanns Zwilchenbart der meyger'), title('Eintrag-146'));
});

await test('editorial notes and the Kringel mark stay out of derived labels', () => {
  // <forename>Jacob<note resp="#editor">unsichere Lesung</note></forename>
  assert.equal(entry('Eintrag-152').getAttribute('data-taeter'), 'Jacob Herr ein friheit allhie');
  // <surname>Wagner</surname><lb/><metamark>°</metamark>von
  assert.ok(entry('Eintrag-602').getAttribute('data-taeter').startsWith('Hans Wagner von Buttkhen; '));
  const labels = [...doc.querySelectorAll('article.entry')].map((a) => a.getAttribute('data-taeter'))
    .concat([...doc.querySelectorAll('.edition-toc a, .entry-title')].map((e) => e.textContent))
    .concat([...doc.querySelectorAll('.ann')].map((a) => a.getAttribute('data-label')));
  assert.equal(labels.filter((l) => /unsichere Lesung|°/.test(l)).length, 0, 'note text or Kringel in a label');
});

await test('each entry is a heading level 3 below the book sections, without skipped levels', () => {
  assert.equal(doc.querySelectorAll('article.entry').length, doc.querySelectorAll('article.entry > .entry-head > h3.entry-title').length);
  const levels = [...doc.querySelectorAll('main h1, main h2, main h3, main h4, main h5, main h6')].map((h) => Number(h.tagName[1]));
  const skips = levels.filter((level, i) => i > 0 && level > levels[i - 1] + 1);
  assert.equal(skips.length, 0, `skipped heading levels: ${skips.length}`);
  assert.ok(doc.querySelector('.edition-body .book-head').tagName === 'H2');
  assert.equal(doc.querySelectorAll('.entry-text h3, .entry-text h5').length, 0);
  assert.equal(doc.querySelector('.facsimile h2').textContent.replace(/\s+/g, ' ').trim(), 'Seitenbild fol. 1r');
});

await test('the entry heading shows date and folio, names the offender for screen readers and links to the entry', () => {
  assert.equal(title('Eintrag-0'), '03.01.1563 fol. 1r Bastean Doldter der kupfferschmidt burger inn mindren Basell');
  const hidden = entry('Eintrag-0').querySelector('.entry-title .visually-hidden');
  assert.equal(hidden.textContent.trim(), 'Bastean Doldter der kupfferschmidt burger inn mindren Basell');
  assert.equal([...doc.querySelectorAll('.entry-title')].filter((h) => h.textContent.includes('…')).length, 0, 'shortened heading');
  // starts after the page break to image 99, a page break to image 100 inside it
  assert.equal(entry('Eintrag-187').querySelector('.entry-folio').textContent, 'fol. 39r–39v');
  assert.equal(entry('Eintrag-146').querySelector('.entry-title a').getAttribute('href'), '#Eintrag-146');
  // the id is in the address of the heading link, not a second label
  assert.ok(!doc.querySelector('.entry-id'));
  assert.equal([...doc.querySelectorAll('.entry-folio')].filter((f) => !/^(fol\. \d+a?[rv](–\d+a?[rv])?|unfoliiert|fol\. \d+a?[rv] – unfoliiert|unfoliiert – fol\. \d+a?[rv])$/.test(f.textContent)).length, 0);
});

await test('folios are counted over the page breaks, as the editors and the About page cite them', () => {
  // the statements on fol. 3r, cited so by the editors' note on the Urfehde they belong to
  assert.equal(entry('Eintrag-10').querySelector('.entry-folio').textContent, 'fol. 3r');
  // the entry broken off before the cut-out pages, fol. 69r on the About page
  assert.equal(entry('Eintrag-363').querySelector('.entry-folio').textContent, 'fol. 69r');
  // the drafts on the inserted leaf 32a
  assert.ok(entry('Eintrag-147').querySelector('.entry-folio').textContent.startsWith('fol. 32a'));
});

await test('page head in the shared form with the source links as icons', () => {
  const head = doc.querySelector('main > .page-head');
  // the display title as on the home page, the archival title of the TEI stays in the citation
  assert.equal(head.firstElementChild.tagName, 'H1');
  assert.equal(head.firstElementChild.textContent, 'Urfehdebuch X der Stadt Basel, 1563–1569');
  // one line with the signature, the link to the Lesesaal stands in the image pane
  assert.deepEqual([...head.querySelectorAll('.page-meta')].map((p) => p.textContent), ['Staatsarchiv Basel-Stadt, Ratsbücher O 10']);
  assert.ok(head.querySelector(':scope > h1 + p.page-meta + .head-side'));
  const actions = [...head.querySelectorAll('ul.page-actions[role="list"] a.icon-link')];
  assert.deepEqual(actions.map((a) => a.querySelector('img').getAttribute('alt')), ['TEI-Quelle herunterladen', 'RDF herunterladen']);
  assert.deepEqual(actions.map((a) => a.getAttribute('download')), ['ufbas.1563.tei.xml', 'ufbas.1563.rdf']);
  // the citation stands in full, no disclosure
  const cite = head.querySelector('p.page-cite');
  assert.ok(!head.querySelector('details'));
  assert.equal(cite.querySelector('.page-cite-label').textContent, 'Zitiervorschlag');
  assert.ok(cite.textContent.startsWith('Zitiervorschlag Urfehdenbuch X der Stadt Basel (1563–1569), in: Die Urfehdebücher'));
  assert.equal(cite.querySelector('a').getAttribute('href'), 'https://hdl.handle.net/11471/1010.2.1');
  // the handle stands in the stylesheet, not in RELS-EXT, which staging objects lack
  assert.equal(cite.querySelector('a').textContent, 'hdl:11471/1010.2.1');
  assert.ok(head.querySelector('.head-side .head-tools fieldset.view-switch + ul.page-actions'), 'view switch and source icons side by side');
});

await test('tools column and entries in the shared layout, text on white surfaces only', () => {
  const layout = doc.querySelector('.with-tools');
  assert.ok(layout.querySelector(':scope > aside.tools .mark-switches') && layout.querySelector(':scope > aside.tools nav.edition-toc'));
  const body = layout.querySelector(':scope > .main-col.edition-body');
  const loose = [...body.children].filter((c) => !c.matches('article.entry, div.book-part'));
  assert.equal(loose.length, 0, `elements directly on the page background: ${loose.map((c) => c.className).join(' ')}`);
  assert.equal([...body.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim()).length, 0);
});

await test('marginal notes keep their place in the text and name their kind', () => {
  const note = entry('Eintrag-0').querySelector('.entry-text .margin-note');
  assert.equal(note.getAttribute('data-kind'), 'Eingangsnotiz');
  assert.equal(note.textContent.replace(/\s+/g, ' ').trim(), 'Steck - 1');
  // <note ana="#uf_Eingangsnotiz #uf_SchlagwortAuffällig" rend="margin">: the kind also with a second category
  assert.equal(entry('Eintrag-222').querySelector('.margin-note.ann').getAttribute('data-kind'), 'Eingangsnotiz');
  // a plain note in the margin names no kind, its place says it
  assert.ok([...doc.querySelectorAll('.margin-note:not([data-kind])')].length > 0);
  // the notes between entries stand in the block before the next entry
  assert.ok(doc.querySelector('.book-part > .margin-note[data-kind="Nachtrag am Rand"]'));
});

await test('the page carries no title attribute, the kinds of marks are one label per meaning', () => {
  const titled = [...doc.querySelectorAll('body [title]')].map((e) => e.className || e.tagName);
  assert.equal(titled.length, 0, `title attributes: ${[...new Set(titled)].join(', ')}`);
  // <metamark rend="Kringel"> and rend="kringel", <add rend="margin Verweiszeichen"> and rend="margin"
  const kinds = new Set([...doc.querySelectorAll('[data-kind]')].map((e) => e.getAttribute('data-kind')));
  assert.deepEqual([...kinds].sort(), ['Am Rand hinzugefügt', 'Am Rand hinzugefügt, mit Verweiszeichen', 'Blume', 'Eingangsnotiz', 'Kringel', 'Nachtrag am Rand']);
  assert.equal(doc.querySelectorAll('.expan[data-kind], .expan[data-tip]').length, 0, 'expansions are marked by italics and brackets');
  assert.deepEqual([...doc.querySelectorAll('.facsimile-zoom [data-tip]')].map((b) => b.getAttribute('data-tip')), ['Vergrößern', 'Verkleinern']);
  assert.ok([...doc.querySelectorAll('.editor-note')].every((n) => n.getAttribute('data-note') && n.getAttribute('aria-label') === 'Anmerkung: ' + n.getAttribute('data-note')));
});

await test('a change of scribe is a focusable marker with its name for screen readers', () => {
  // <head><handShift scribe="s2"/><persName …>Barbel Gygery …, one marker per handShift of the TEI
  const marks = [...doc.querySelectorAll('.hand-shift')];
  assert.equal(marks.length, editionTEI().match(/<handShift\b/g).length);
  for (const mark of marks) {
    assert.deepEqual(['tabindex', 'role', 'aria-label', 'data-tip'].map((a) => mark.getAttribute(a)), ['0', 'note', 'Schreiberwechsel', 'Schreiberwechsel']);
    // the text stays the bar of 2017, also in the paragraphs the Datenkorb copies
    assert.equal(mark.textContent.trim(), '|');
    assert.equal(mark.querySelector('[aria-hidden="true"]').textContent, '|');
  }
  assert.ok(entry('Eintrag-15').querySelector('.entry-rubric > .hand-shift'));
  assert.ok(doc.querySelector('.entry-text .p .hand-shift'));
});

await test('annotations carry their group and the label of their categories in the text', () => {
  // <persName ana="#uf_PersonTäter">Bastean ... <placeName ana="#uf_OrtWohnort">mindren Basell</placeName></persName>
  const offender = entry('Eintrag-0').querySelector('.entry-rubric .ann[data-group="Person"]');
  assert.equal(offender.getAttribute('data-label'), 'Täter');
  assert.ok(offender.textContent.includes('Bastean'));
  const place = offender.querySelector('.ann[data-group="Ort"]');
  assert.equal(place.getAttribute('data-label'), 'Wohnort');
  assert.equal(place.textContent, 'mindren Basell');
  // <seg ana="#uf_TatOrdnungsstörung #uf_TatSachbeschädigung">: two categories of one group, one label
  assert.ok(doc.querySelector('.ann[data-group="Tat"][data-label="Ordnungsstörung / Sachbeschädigung"]'));
  // <term ana="#uf_SchlagwortLadenherren #uf_PersonKläger">: one span per group, nested
  const both = doc.querySelector('.ann[data-group="Schlagwort"][data-label="Ladenherren"] > .ann[data-group="Person"][data-label="Kläger"]');
  assert.ok(both && both.parentElement.textContent === both.textContent, 'element in two groups');
  // persons without a category are labelled with their group
  assert.ok(doc.querySelector('.ann[data-group="Person"][data-label="Person"]'));
  // an annotated note is the annotation itself, since the float takes no underline from a parent
  const note = entry('Eintrag-222').querySelector('.margin-note.ann');
  assert.deepEqual([note.getAttribute('data-group'), note.getAttribute('data-label'), note.textContent], ['Schlagwort', 'Auffällig', 'Köferlj']);
  // the label is an attribute, so the text of the entry and the Datenkorb stay as they are
  assert.ok(!entry('Eintrag-0').querySelector('.entry-text').textContent.includes('Täter'));
});

await test('folio labels name their page image, also for unfoliated pages and the inserted leaf', () => {
  const folios = [...doc.querySelectorAll('.folio')];
  assert.deepEqual([folios[0].textContent, folios[0].getAttribute('data-facs')], ['fol. 1r', '19']);
  const byText = (text) => folios.filter((f) => f.textContent === text).map((f) => f.getAttribute('data-facs'));
  assert.deepEqual(byText('unfoliiert'), ['45', '46']);
  assert.deepEqual(byText('fol. 32ar').concat(byText('fol. 32av')), ['85', '86']);
  // the image service and size come from the surface the page break points to (ADR-34)
  assert.match(folios[0].getAttribute('data-image'), /^https:\/\/sos-ch-dk-2\.exo\.io\/hfp-stabs-dls\/.+\/Ratsbuecher_O_10_0019$/);
  assert.deepEqual([folios[0].getAttribute('data-width'), folios[0].getAttribute('data-height')], ['3047', '4275']);
});

await test('the page of a TEI without facsimile shows the text alone and says why', () => {
  const plain = new JSDOM(built('edition-ohne-bild')).window.document;
  assert.equal(plain.querySelector('.facsimile, .view-switch'), null);
  assert.equal(plain.querySelector('.head-tools > p.view-note').textContent, 'Das Seitenbild neben dem Text ist in Kürze hier verfügbar.');
  assert.equal(plain.querySelectorAll('.folio').length, doc.querySelectorAll('.folio').length);
});

await test('the Datenkorb switch of an entry is a labelled checkbox shown as an icon', () => {
  const label = entry('Eintrag-0').querySelector('.entry-head .entry-actions > label.basket-icon');
  assert.equal(label.querySelector('input[type="checkbox"].basket-check').getAttribute('data-entryid'), 'Eintrag-0');
  assert.equal(label.textContent.trim(), 'In den Datenkorb');
  assert.ok(!label.hasAttribute('title'), 'the tooltip comes from data-tip, not a second native one');
  assert.equal(label.getAttribute('data-tip'), 'In den Datenkorb legen');
  assert.equal(label.getAttribute('data-tip-on'), 'Aus dem Datenkorb nehmen');
  const css = readFileSync(resolve(root, 'css/template.css'), 'utf8');
  assert.match(css, /\.basket-icon:has\(input:checked\)::after \{[^}]*mask-image:/, 'no filled icon for the checked state');
  assert.match(css, /\[data-tip\]::before \{[^}]*content: attr\(data-tip\) \/ "";/, 'the tooltip stays out of the accessible name');
});

await test('the text keeps its rhythm with marked groups and takes no labels into its lines', () => {
  const css = readFileSync(resolve(root, 'css/edition.css'), 'utf8');
  const js = readFileSync(resolve(root, 'js/highlighting.js'), 'utf8');
  assert.match(css, /\.entry-text \{[^}]*line-height: 1\.8;/);
  // a wrapped manuscript line indents its continuation, not the line after a br
  assert.match(css, /\.entry-lines \{[^}]*text-indent: 1\.5em hanging each-line;/);
  // the lines after the head form a block of their own, whose first line starts at the edge
  const text = entry('Eintrag-0').querySelector('.entry-text');
  assert.deepEqual([...text.children].map((c) => c.className), ['margin-note', 'entry-rubric', 'entry-lines']);
  assert.ok(text.querySelector(':scope > .entry-lines > .p'));
  assert.ok(!/--marks|line-height:[^;]*var\(/.test(css + js), 'a line height that depends on the marking');
  // generated labels exist only as visually hidden text for screen readers
  const rules = [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].filter((m) => /content: attr\(data-label\)/.test(m[2]));
  assert.ok(rules.length > 0);
  assert.ok(rules.every((m) => /clip: rect\(0, 0, 0, 0\)/.test(m[2]) && /position: absolute/.test(m[2])), 'a visible label in the text');
});

await test('groups that nest in the TEI never share an underline slot, and there are three slots at most', () => {
  const css = readFileSync(resolve(root, 'css/edition.css'), 'utf8');
  const slot = {};
  for (const m of css.matchAll(/\.edition-layout \[data-group="(\w+)"\] \{ --slot: (\d);/g)) { slot[m[1]] = Number(m[2]); }
  const inner = {};
  for (const m of css.matchAll(/\.edition-layout \.ann\[data-group="(\w+)"\] \.ann\[data-group="(\w+)"\] \{ --slot: (\d); \}/g)) { inner[`${m[1]} > ${m[2]}`] = Number(m[3]); }
  const lines = ['Person', 'Tat', 'Strafe', 'Ort'];
  assert.deepEqual(Object.keys(slot).sort(), [...lines].sort(), 'Schlagwort is a band and takes no slot');
  assert.ok(new Set(Object.values(slot)).size <= 3 && Math.max(...Object.values(slot)) <= 2);
  // the slot of a span as edition.css gives it: the contextual rule for a group inside another wins
  const slotOf = (span) => {
    const group = span.getAttribute('data-group');
    for (const [pair, value] of Object.entries(inner)) {
      const [outer, own] = pair.split(' > ');
      if (own === group && span.parentElement.closest(`.ann[data-group="${outer}"]`)) { return value; }
    }
    return slot[group];
  };
  const clashes = new Set();
  for (const span of doc.querySelectorAll('.ann')) {
    if (!lines.includes(span.getAttribute('data-group'))) { continue; }
    for (let outer = span.parentElement.closest('.ann'); outer; outer = outer.parentElement.closest('.ann')) {
      const pair = `${outer.getAttribute('data-group')} > ${span.getAttribute('data-group')}`;
      if (lines.includes(outer.getAttribute('data-group')) && outer.getAttribute('data-group') !== span.getAttribute('data-group') && slotOf(outer) === slotOf(span)) { clashes.add(pair); }
    }
  }
  assert.deepEqual([...clashes], []);
});

await test('the view switch is a template of its own and each entry with annotations has its index switch', () => {
  const xsl = readFileSync(resolve(root, 'ufbas-object.xsl'), 'utf8');
  assert.match(xsl, /<xsl:template name="view-switch">/);
  assert.equal(doc.querySelectorAll('fieldset.view-switch').length, 1);
  assert.equal(doc.querySelectorAll('.view-switch input:checked').length, 0, 'the script chooses the view by width and fragment');
  assert.equal(entry('Eintrag-0').querySelector('.index-toggle').textContent, 'Kategorien');
});

await test('content-visibility stays on the entries', () => {
  const css = readFileSync(resolve(root, 'css/edition.css'), 'utf8');
  assert.match(css, /\.entry \{[^}]*content-visibility: auto;/);
});

await test('book sections stand apart, page breaks alone join the next entry', () => {
  const sections = [...doc.querySelectorAll('.book-part.book-section')];
  assert.ok(sections.some((s) => /Anno d.*1563/.test(s.querySelector('.book-head')?.textContent || '')));
  assert.equal([...doc.querySelectorAll('.book-head')].filter((h) => !h.closest('.book-section')).length, 0, 'book heading outside a section');
  assert.ok(doc.querySelector('.book-part:not(.book-section) > .folio'));
});

// the sticky tools column must not scroll as a whole, which hid the marking block
await test('only the table of contents scrolls in the tools column, never the page', () => {
  const css = readFileSync(resolve(root, 'css/edition.css'), 'utf8');
  assert.match(css, /\.edition-side\.tools \{[^}]*overflow: visible;/);
  assert.match(css, /\.edition-toc \{[^}]*overflow-y: auto;/);
  const js = readFileSync(resolve(root, 'js/highlighting.js'), 'utf8');
  assert.ok(!/\.scrollIntoView\(|tools\.scrollTop/.test(js), 'scrolls the page or the whole column');
});

// IntersectionObserver is stubbed; the callback gets the entries the test names
async function openWithObserver(extraHead = '') {
  const observers = [];
  const window = await open(html.replace('</head>', `${extraHead}</head>`), { scripts: ['highlighting.js'], before: (w) => {
    w.IntersectionObserver = function (callback, options) {
      this.targets = [];
      this.observe = (el) => { this.targets.push(el); };
      this.callback = callback;
      this.options = options;
      observers.push(this);
    };
  } });
  const show = (ids, hide = []) => observers[0].callback(ids.map((id) => ({ target: window.document.getElementById(id), isIntersecting: true }))
    .concat(hide.map((id) => ({ target: window.document.getElementById(id), isIntersecting: false }))));
  return { window, observers, show };
}

await test('the table of contents marks the entry being read', async () => {
  const { window, observers, show } = await openWithObserver();
  const d = window.document;
  assert.equal(observers.length, 1);
  assert.equal(observers[0].targets.length, d.querySelectorAll('article.entry').length);
  show(['Eintrag-147', 'Eintrag-146']);
  assert.equal(d.querySelector('.edition-toc a[href="#Eintrag-146"]').getAttribute('aria-current'), 'location', 'the upper of two entries in view');
  show(['Eintrag-300'], ['Eintrag-146', 'Eintrag-147']);
  assert.equal(d.querySelectorAll('.edition-toc [aria-current]').length, 1);
  assert.equal(d.querySelector('.edition-toc a[href="#Eintrag-300"]').getAttribute('aria-current'), 'location');
  // the tools column is not sticky here (no styles), so no year is opened
  assert.equal(d.querySelectorAll('.edition-toc details[open]').length, 0);
});

await test('where the tools column is sticky, the year of the entry opens and the previous one closes', async () => {
  const { window, show } = await openWithObserver('<style>.tools { position: sticky; }</style>');
  const d = window.document;
  show(['Eintrag-146']);
  const year = d.querySelector('.edition-toc a[href="#Eintrag-146"]').closest('details');
  assert.equal(year.open, true);
  assert.equal(year.querySelector('summary').textContent, '1564');
  show(['Eintrag-600'], ['Eintrag-146']);
  assert.equal(year.open, false, 'a year opened by the script closes again');
  assert.equal(d.querySelector('.edition-toc a[href="#Eintrag-600"]').closest('details').open, true);
});

await test('without IntersectionObserver the table of contents stays as rendered', async () => {
  const window = await open(html, { scripts: ['highlighting.js'], before: (w) => { delete w.IntersectionObserver; } });
  assert.equal(window.document.querySelectorAll('.edition-toc [aria-current]').length, 0);
  assert.equal(window.document.querySelector('.mark-switches').hidden, false, 'the rest of the script still runs');
});

done();
