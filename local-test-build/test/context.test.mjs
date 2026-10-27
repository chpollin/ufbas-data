// Checks of the pages of context:ufbas built by build.mjs (home, about, datenkorb,
// exploration, ontologie): the quote on the home page and the project text are those of the ABOUT
// datastream, headings skip no level, the table of contents reaches every section.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { JSDOM } from 'jsdom';
import { here, root, dataRoot } from '../gams.mjs';
import { runner } from './lib.mjs';

const doc = (name) => new JSDOM(readFileSync(resolve(here, 'build', `${name}.html`), 'utf8')).window.document;
const about = new JSDOM(readFileSync(resolve(dataRoot, 'gams/datastreams/context-ufbas.ABOUT.xml'), 'utf8'), { contentType: 'text/xml' }).window.document;
const body = about.getElementsByTagName('body')[0];
const squash = (text) => text.replace(/\s+/g, '');

const { test, done } = runner('context', 'tests');

test('headings of the context pages skip no level', () => {
  for (const name of ['home', 'about', 'datenkorb', 'exploration', 'ontologie']) {
    let level = 0;
    for (const h of doc(name).querySelectorAll('main h1, main h2, main h3, main h4')) {
      const next = Number(h.tagName[1]);
      assert.ok(next <= level + 1, `${name}: ${h.tagName} "${h.textContent.trim()}" after h${level}`);
      level = next;
    }
  }
});

test('home: title, the quote verbatim from ABOUT and the ways into the edition', () => {
  const home = doc('home');
  assert.equal(home.querySelector('h1').textContent, 'Urfehdebuch X der Stadt Basel, 1563–1569');
  const quote = home.querySelector('.home-excerpt').textContent.replace(/\s+/g, ' ').trim();
  const source = body.textContent.replace(/\s+/g, ' ');
  assert.ok(quote.startsWith('Die hier veröffentlichte Edition stellt das Urfehdebuch X'), quote.slice(0, 40));
  assert.ok(source.includes(quote), 'the quote is not verbatim in ABOUT');
  assert.ok(/[.!?]$/.test(quote), 'the quote ends with a whole sentence');
  // the following sentence of ABOUT claims facsimile links per entry, which no longer holds
  assert.ok(!quote.includes('Digitalisat'), 'the quote repeats the outdated facsimile claim');
  const figure = home.querySelector('a.home-figure');
  assert.equal(figure.getAttribute('href'), '/o:ufbas.1563#Eintrag-0');
  assert.ok(figure.querySelector('img') && figure.querySelector('figcaption').textContent === 'Erster Eintrag, 3. Januar 1563');
  const ways = [...home.querySelectorAll('.home-way h2 a')].map((a) => [a.textContent, a.getAttribute('href')]);
  assert.deepEqual(ways, [
    ['Urfehdebuch lesen', '/o:ufbas.1563'],
    ['Suchen', '/archive/objects/query:ufbas.search/methods/sdef:Query/get?params='],
    ['Kategorien', '/o:ufbas.kategorien'],
    ['Exploration', '/archive/objects/context:ufbas/methods/sdef:Context/get?mode=exploration']
  ]);
  assert.ok([...home.querySelectorAll('a')].some((a) => a.textContent === 'Einführung lesen' && a.getAttribute('href').endsWith('mode=about')));
  // the contact address stands in the footer of every page, the home page does not repeat it
  assert.ok(home.querySelector('.site-footer a[href="mailto:burghartz-sekretariat-geschichte@unibas.ch"]'));
  const examples = [...home.querySelectorAll('.home-examples a')].map((a) => decodeURIComponent(a.getAttribute('href').split('params=')[1]));
  assert.ok(examples.length === 2 && examples.every((p) => p.startsWith('$1|') && p.includes(';$2|')), 'example searches with params');
  assert.deepEqual([...home.querySelectorAll('.home-groups a')].map((a) => a.getAttribute('href').split('#')[1]),
    ['gruppe-person', 'gruppe-tat', 'gruppe-strafe', 'gruppe-ort', 'gruppe-schlagwort']);
});

test('about: the text of ABOUT is rendered completely and in order', () => {
  const page = doc('about');
  const source = body.cloneNode(true);
  // footnotes are compared on their own, the graphic description becomes the figure caption
  [...source.getElementsByTagName('note'), ...source.getElementsByTagName('desc')].forEach((n) => n.remove());
  const main = page.querySelector('.main-col').cloneNode(true);
  main.querySelectorAll('sup, .footnotes, figure').forEach((n) => n.remove());
  const head = page.querySelector('.page-head h1').textContent;
  assert.equal(squash(head + main.textContent), squash(source.textContent));
  const notes = [...page.querySelectorAll('.footnotes li')].map((li) => squash(li.textContent.replace('↩', '')));
  const sourceNotes = [...body.getElementsByTagName('note')].map((n) => squash(n.textContent));
  assert.deepEqual(notes, sourceNotes);
});

test('about: the placeholders of the editors link to their category groups, wording unchanged (ADR-26)', () => {
  const links = [...doc('about').querySelectorAll('.main-col a[href^="/o:ufbas.kategorien#gruppe-"]')]
    .map((a) => [a.textContent, a.getAttribute('href').split('#')[1]]);
  assert.deepEqual(links, [['link Tatbestände', 'gruppe-tat'], ['link Strafen', 'gruppe-strafe'], ['link Schlagworte', 'gruppe-schlagwort']]);
  const groups = doc('kategorien');
  assert.ok(links.every(([, id]) => groups.getElementById(id)), 'a group anchor is missing on the category page');
});

test('about: the table of contents reaches every section heading', () => {
  const page = doc('about');
  const sections = [...page.querySelectorAll('.main-col > h2')].map((h) => h.id);
  const toc = [...page.querySelectorAll('.tools .toc-list a')].map((a) => a.getAttribute('href').slice(1));
  assert.ok(toc.length >= 10, `sections in the table of contents: ${toc.length}`);
  assert.deepEqual(toc, sections);
});

test('about: the rail holds only the table of contents, the page head the title and the TEI link', () => {
  const page = doc('about');
  const rail = page.querySelector('.with-tools > aside.tools');
  assert.deepEqual([...rail.children].map((c) => `${c.tagName.toLowerCase()}.${c.className}`), ['nav.about-toc']);
  assert.equal(rail.querySelector('#toc-title').textContent, 'Inhalt');
  const head = page.querySelector('.page-head');
  // the editors stand once, in the opening "hg. von" of the ABOUT text
  assert.ok(!head.querySelector('.page-meta'), 'line of editors repeated in the page head');
  assert.ok(page.querySelector('.text-panel').textContent.includes('hg. von Susanna Burghartz, Sonia Calvi, Georg Vogeler'));
  assert.ok(head.querySelector('.page-actions a.icon-link[href="/archive/objects/context:ufbas/datastreams/ABOUT/content"] img[alt="Projektbeschreibung als TEI herunterladen"]'));
  // edition and categories are in the navigation, the contact address in the footer
  assert.ok(!page.querySelector('main a[href^="mailto:"]'), 'contact address repeated in the page');
});

test('imprint: the sections of IMPRINT in their order with a row per fact, the revision credited in the footer of every other page', () => {
  const page = doc('imprint');
  assert.equal(page.querySelector('.imprint h1').textContent, 'Impressum');
  assert.deepEqual([...page.querySelectorAll('.imprint > .imprint-section > h2')].map((h) => h.textContent), ['Die Edition', 'Umsetzung', 'Rechtliches']);
  const rows = [...page.querySelectorAll('.imprint-section > .imprint-row > h3')].map((h) => h.textContent);
  assert.ok(rows.includes('Überarbeitung 2026') && rows.includes('Lizenz') && rows.includes('Information gemäß § 5 E-Commerce-Gesetz'), rows.join(' | '));
  assert.ok(!page.body.textContent.includes('Zentrum für Informationsmodellierung'));
  for (const name of ['home', 'about']) {
    const credit = doc(name).querySelector('.site-footer .footer-credit');
    assert.ok(credit?.textContent.includes('Überarbeitung 2026 von Christopher Pollin, Institut für Digitale Geisteswissenschaften'), name);
  }
  // the imprint names the credit in its own block, so the footer line would repeat it (ADR-20)
  assert.ok(!page.querySelector('.site-footer .footer-credit'), 'credit twice on the imprint');
});

test('datenkorb: icon actions in the page head, the storage note and no count', () => {
  const page = doc('datenkorb');
  assert.equal(page.querySelector('h1').textContent, 'Datenkorb');
  const tools = page.getElementById('basket-tools');
  assert.ok(tools.hasAttribute('hidden'), 'actions hidden until the script runs');
  assert.deepEqual([...tools.querySelectorAll('.icon-button[data-tip]')].map((b) => b.id), ['basket-download', 'basket-clear']);
  assert.ok(page.querySelector('#basket-download .icon-download') && page.querySelector('#basket-clear .icon-clear'));
  assert.ok(![...tools.querySelectorAll('[title]')].length, 'tooltips from data-tip only');
  assert.ok(!page.getElementById('basket-count') && !page.getElementById('basket-sort'));
  assert.ok(page.querySelector('.page-head .basket-note:not([hidden])'));
});

done();
