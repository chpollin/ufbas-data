// The Exploration view in jsdom with the real scripts, answering its query from the
// refactored RDF as sparql.mjs does. Two kinds of checks:
// - an invariant over the whole view: every count is a button, and after a click the
//   table and the full marks hold exactly as many entries as the count said (FR-06,
//   "every count unfolds");
// - one scenario per user story of knowledge/specification.md, whose expected answer is
//   computed from the TEI by exploration-data.xsl, not from the RDF the view reads, so
//   a scenario fails when TEI, RDF, query or script disagree.
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { explorationData } from '../make-exploration-data.mjs';
import { queryJSON } from '../sparql.mjs';
import { ORIGIN, answering, built, genderClass, open as openPage, runner } from './lib.mjs';

const PAGE = ORIGIN + '/archive/objects/context:ufbas/methods/sdef:Context/get?mode=exploration';
const html = built('exploration');
const answer = JSON.stringify(await queryJSON('query:ufbas.exploration'));
const tei = JSON.parse(await explorationData({ generated: 'test' }));

async function open(hash = '', storage = {}) {
  const requests = [];
  const window = await openPage(html, { url: PAGE + hash, storage, scripts: ['datenkorb.js', 'exploration.js'], before: (w) => {
    w.fetch = answering(answer, requests);
    w.URL.revokeObjectURL = () => {};
    // a wide screen, where every filter shows ten values
    w.matchMedia = () => ({ matches: true });
  } });
  await window.ufbasExploration.ready;
  window.requests = requests;
  return window;
}


const doc = (w) => w.document;
// the table shows the first rows of a long selection, the button below it the rest
const showAll = (w) => { const more = doc(w).querySelector('.explore-table-more:not([hidden])'); if (more) { more.click(); } };
const shownRows = (w) => [...doc(w).querySelectorAll('#explore-list > tr:not([hidden])')];
const listIds = (w) => { showAll(w); return shownRows(w).map((tr) => tr.getAttribute('data-uri')); };
const count = (button) => Number(button.querySelector('.explore-count, .explore-key-count').textContent);
const reset = (w) => doc(w).getElementById('explore-reset').click();
// the values of a filter exist while its menu is open
function menu(w, key) {
  const details = doc(w).querySelector(`.explore-filter[data-facet="${key}"]`);
  if (!details.open) {
    details.open = true;
    details.dispatchEvent(new w.Event('toggle'));
  }
  return details;
}
const facetButton = (w, key, value) => menu(w, key).querySelector(`[data-key="facet:${key}:${value}"]`);
// the marks of the entries in the selection, one per entry in the time view
const fullMarks = (w) => [...doc(w).querySelectorAll('.explore-mark:not(.is-out):not(.is-leaving)')];
const markY = (mark) => Number(mark.style.transform.match(/,(-?[\d.]+)px/)[1]);

// the reference: the TEI entries with the categories of a filter
const teiHas = (entry, category) => entry.annotations.some((a) => a.category === category);
const teiGender = (entry) => genderClass(entry.offenders.map((o) => o.gender || ''));
// the sanction classes of the colour, as js/exploration.js reads the group Sanktionen
const CLASSES = {
  ausweisung: ['StrafeAusweisung'],
  haft: ['StrafeGefängnis', 'StrafeKörperstrafe', 'StrafeAmtsentlassung'],
  geld: ['StrafeGeldstrafe'],
  verbot: ['StrafeVerbotWirtshaus', 'StrafeVerbotWaffen', 'StrafeVerbotSpiel', 'StrafeVerbotTanz', 'StrafeVerbot', 'StrafeHausarrest']
};
const teiClasses = (entry) => {
  const found = Object.keys(CLASSES).filter((k) => CLASSES[k].some((c) => teiHas(entry, c)));
  return found.length ? found : ['ohne'];
};
// the losses of the published RDF that test/exploration-rdf.test.mjs lists; a scenario
// on a value they touch leaves those entries out of the comparison
const RDF_LOSSES = new Set(['Eintrag-124', 'Eintrag-176', 'Eintrag-376']);

const { test, done } = runner('exploration', 'checks');

await test('the view reads the query once and draws a mark per entry, filters, legend and table', async () => {
  const w = await open();
  assert.deepEqual(w.requests, ['/archive/objects/query:ufbas.exploration/methods/sdef:Query/getJSON']);
  assert.equal(doc(w).getElementById('explore').hidden, false);
  assert.equal(listIds(w).length, tei.entries.length, 'without selection the table holds every entry');
  assert.equal(doc(w).querySelectorAll('.explore-mark').length, tei.entries.length, 'a mark per entry');
  assert.equal(doc(w).querySelectorAll('.explore-filter').length, 6, 'six filters');
  assert.equal(doc(w).querySelectorAll('.explore-key').length, 5, 'five sanction classes');
  assert.equal(doc(w).getElementById('explore-selection').hidden, true, 'no standing count without a selection');
  assert.equal(doc(w).querySelectorAll('.explore-key-count').length, 0, 'no holdings counts in the legend without a selection');
  assert.ok(!/\d/.test(doc(w).getElementById('explore-legend').textContent), 'nor in its accessible names');
  assert.equal(doc(w).getElementById('explore-list-title').textContent, 'Einträge', 'the count stands only in the selection row');
  assert.equal(doc(w).getElementById('explore-status').textContent, '');
  const texts = [...doc(w).querySelectorAll('.explore-year, .explore-band')].map((t) => t.textContent);
  assert.ok(texts.includes('undatiert') && texts.includes('ohneAngabe'), 'full words for undated entries and unknown gender');
  assert.ok(!texts.some((t) => /o\. [DA]\./.test(t)), 'no abbreviations');
  const row = doc(w).querySelector('#explore-list > tr');
  assert.deepEqual([...row.querySelectorAll('td[data-label]')].map((td) => td.getAttribute('data-label')), ['Täter', 'Tatbestand', 'Strafe', 'Herkunft'], 'cells named for the stacked rows');
});

await test('every count unfolds: after a click the table and the full marks hold as many entries as the count said', async () => {
  const w = await open();
  const keys = [...doc(w).querySelectorAll('.explore-key')].map((b) => b.getAttribute('data-key'));
  for (const key of ['geschlecht', 'tat', 'strafe', 'verfahren', 'schlagwort']) {
    const details = menu(w, key);
    const more = details.querySelector('.explore-more');
    if (more) { more.click(); }
    keys.push(...[...menu(w, key).querySelectorAll('.explore-value')].map((b) => b.getAttribute('data-key')));
    details.open = false;
    details.dispatchEvent(new w.Event('toggle'));
  }
  const wrong = [];
  for (const key of keys) {
    reset(w);
    // the legend counts only under a selection of the other filters
    if (key.startsWith('klasse:')) { facetButton(w, 'geschlecht', 'm').click(); }
    const facet = key.split(':')[1];
    const button = key.startsWith('facet:') ? facetButton(w, facet, key.split(':').slice(2).join(':')) : doc(w).querySelector(`[data-key="${key}"]`);
    const expected = count(button);
    button.click();
    if (listIds(w).length !== expected || fullMarks(w).length !== expected) {
      wrong.push(`${key}: ${expected} shown, ${listIds(w).length} listed, ${fullMarks(w).length} marks`);
    }
  }
  assert.ok(keys.length > 120, `only ${keys.length} counts found`);
  assert.deepEqual(wrong, []);
});

await test('under a selection a count says how many selected entries also have the value, and a click leaves those', async () => {
  const w = await open('#tat=TatDiebstahl');
  const thefts = tei.entries.filter((e) => teiHas(e, 'TatDiebstahl'));
  for (const [key, value] of [['strafe', 'StrafeAusweisung'], ['tat', 'TatEinbruch'], ['schlagwort', 'SchlagwortHalseisen']]) {
    const expected = thefts.filter((e) => teiHas(e, value)).map((e) => e.id).sort();
    const button = facetButton(w, key, value);
    assert.equal(count(button), expected.length, value);
    button.click();
    assert.deepEqual([...listIds(w)].sort(), expected, value);
    facetButton(w, key, value).click();
  }
  assert.equal(count(facetButton(w, 'tat', 'TatDiebstahl')), thefts.length, 'a chosen value counts the whole selection');
});

// Epic 1, offence and sanction
await test('story offence and sanction: the row of Diebstahl holds its entries and gives the share of each sanction class of the TEI', async () => {
  const w = await open('#ansicht=tat');
  const thefts = tei.entries.filter((e) => teiHas(e, 'TatDiebstahl'));
  const label = [...doc(w).querySelectorAll('.explore-rowlabel')].find((t) => t.textContent === 'Diebstahl');
  assert.ok(label, 'a row for Diebstahl');
  const banished = thefts.filter((e) => teiHas(e, 'StrafeAusweisung')).length;
  const seg = [...doc(w).querySelectorAll('.explore-seg[data-klasse="ausweisung"]')].find((s) => s.getAttribute('data-tip-svg').startsWith('Diebstahl:'));
  assert.equal(seg.getAttribute('data-tip-svg'), `Diebstahl: ${Math.round(100 * banished / thefts.length)} % Ausweisung von ${thefts.length} Einträgen`);
  label.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
  assert.deepEqual([...listIds(w)].sort(), thefts.map((e) => e.id).sort(), 'a row label chooses its offence');
  doc(w).querySelector('[data-key="klasse:ausweisung"]').click();
  assert.deepEqual([...listIds(w)].sort(), thefts.filter((e) => teiHas(e, 'StrafeAusweisung')).map((e) => e.id).sort());
  assert.equal(w.location.hash, '#tat=TatDiebstahl&klasse=ausweisung&ansicht=tat');
});

await test('story sanctions and modalities: the colour carries the sanctions, entries with modalities only stay hollow', async () => {
  const w = await open();
  const hollow = tei.entries.filter((e) => teiClasses(e)[0] === 'ohne').length;
  assert.equal(doc(w).querySelectorAll('.explore-mark[data-klasse="ohne"]').length, hollow);
  const onlyAdmonished = tei.entries.find((e) => teiHas(e, 'StrafeErmahnung') && teiClasses(e)[0] === 'ohne');
  assert.equal(doc(w).querySelector(`.explore-mark[data-id="${onlyAdmonished.id}"]`).getAttribute('data-klasse'), 'ohne');
  const two = tei.entries.find((e) => teiClasses(e).length > 1 && !RDF_LOSSES.has(e.id));
  const mark = doc(w).querySelector(`.explore-mark[data-id="${two.id}"]`);
  assert.deepEqual([mark.getAttribute('data-klasse'), mark.getAttribute('data-ring')], teiClasses(two).slice(0, 2), 'fill and ring');
});

await test('story gender: the women of the TEI, their offences, and their marks below the axis', async () => {
  const w = await open();
  facetButton(w, 'geschlecht', 'f').click();
  const women = tei.entries.filter((e) => teiGender(e) === 'f');
  assert.deepEqual([...listIds(w)].sort(), women.map((e) => e.id).sort());
  assert.equal(count(facetButton(w, 'tat', 'TatDiebstahl')), women.filter((e) => teiHas(e, 'TatDiebstahl')).length);
  const marks = [...doc(w).querySelectorAll('.explore-mark')];
  const ys = (g) => marks.filter((m) => {
    const e = tei.entries.find((x) => x.id === m.getAttribute('data-id'));
    return e && e.date && !RDF_LOSSES.has(e.id) && teiGender(e) === g;
  }).map(markY);
  assert.ok(Math.min(...ys('f')) > Math.max(...ys('m')), 'women below the men');
});

await test('story change over time: a month and the undated entries select what the TEI dates there', async () => {
  for (const month of ['1565-09', '1568-05', '1563-01', 'undatiert']) {
    const w = await open('#zeit=' + month);
    const expected = tei.entries.filter((e) => month === 'undatiert' ? !e.date : (e.date || '').startsWith(month)).map((e) => e.id).sort();
    assert.deepEqual([...listIds(w)].sort(), expected, month);
  }
});

// Epic 2
await test('story origin of the banished: with Ausweisung chosen the origins count only banished offenders', async () => {
  const w = await open('#strafe=StrafeAusweisung');
  const banished = new Set(tei.entries.filter((e) => teiHas(e, 'StrafeAusweisung')).map((e) => e.id));
  assert.deepEqual(new Set(listIds(w)), banished);
  const origins = [...menu(w, 'herkunft').querySelectorAll('[data-key^="facet:herkunft:"]')];
  assert.ok(origins.length >= 10, 'origins listed');
  origins[0].click();
  assert.ok(listIds(w).every((id) => banished.has(id)), 'an origin keeps the banishment filter');
  const find = menu(w, 'herkunft').querySelector('.explore-find');
  find.value = 'zurich';
  find.dispatchEvent(new w.Event('input'));
  assert.ok([...menu(w, 'herkunft').querySelectorAll('.explore-value-label')].some((l) => l.textContent === 'Zürich'), 'the search ignores diacritics');
});

// Epic 3
await test('story prior instance: the procedure filter lists the entries with a prior instance in the TEI', async () => {
  const w = await open('#verfahren=Vorinstanz');
  assert.deepEqual([...listIds(w)].sort(), tei.entries.filter((e) => teiHas(e, 'Vorinstanz')).map((e) => e.id).sort());
});

// Epic 4
await test('story reading behind a pattern: every row and the open entry link to its anchor in the edition', async () => {
  const w = await open('#tat=TatGotteslästerung&eintrag=Eintrag-64');
  const edition = new Set([...new JSDOM(built('edition')).window.document.querySelectorAll('[id^="Eintrag-"]')].map((e) => e.id));
  const links = [...doc(w).querySelectorAll('#explore-list a, #explore-detail a')].map((a) => a.getAttribute('href'));
  assert.ok(links.length > 10);
  assert.deepEqual(links.filter((href) => !href.startsWith('/o:ufbas.1563#') || !edition.has(href.split('#')[1])), []);
  assert.equal(doc(w).getElementById('explore-detail').hidden, false, 'the entry of the address is open');
});

await test('story gaps in transmission: the cut-out pages are hatched with their reason, and they lie where the TEI puts them', async () => {
  const w = await open();
  const gap = doc(w).querySelector('.explore-gap');
  assert.match(gap.getAttribute('data-tip-svg'), /nach fol\. 69r herausgeschnitten/);
  const data = JSON.parse(doc(w).getElementById('explore-data').textContent);
  assert.deepEqual(data.gap, { from: '1566-11', to: '1567-06' });
  // the last dated entry before fol. 70r and the first on it bound the gap
  const first70 = tei.entries.findIndex((e) => e.folio === '70r');
  const before = tei.entries.slice(0, first70).filter((e) => e.date && e.folio.replace(/\D/g, '') >= 60).map((e) => e.date).sort().pop();
  assert.equal(before.slice(0, 7), '1566-11');
  assert.equal(tei.entries[first70].date.slice(0, 7), '1567-07');
});

await test('story what a category means: a filter value and a row carry the definition of the taxonomy', async () => {
  const w = await open('#ansicht=tat');
  const gloss = tei.categories.find((c) => c.id === 'TatUngehorsam').gloss;
  assert.ok(gloss.length > 20);
  assert.equal(facetButton(w, 'tat', 'TatUngehorsam').getAttribute('data-tip'), gloss);
  assert.equal(doc(w).querySelector('.explore-rowlabel[data-row="TatUngehorsam"]').getAttribute('data-tip-svg'), gloss);
});

// Epic 5
await test('story where a figure comes from: the filters name their level, entries with several offences or sanctions', async () => {
  const w = await open();
  assert.equal(doc(w).querySelector('[data-key="menu:tat"]').getAttribute('data-tip'), 'Ein Eintrag kann mehrere Tatbestände haben');
  assert.equal(doc(w).querySelector('[data-key="menu:strafe"]').getAttribute('data-tip'), 'Ein Eintrag kann mehrere Strafen haben');
});

await test('story a citable state: the address of a selection opens the same selection, view and entry', async () => {
  const w = await open();
  facetButton(w, 'tat', 'TatUnzucht').click();
  facetButton(w, 'geschlecht', 'f').click();
  doc(w).querySelector('[data-key="klasse:geld"]').click();
  const hash = w.location.hash;
  assert.equal(hash, '#geschlecht=f&tat=TatUnzucht&klasse=geld');
  const ids = listIds(w);
  const again = await open(hash + '&ansicht=tat');
  assert.deepEqual(listIds(again), ids);
  assert.equal(doc(again).querySelector('#explore-views input:checked').value, 'tat');
  assert.equal(doc(again).getElementById('explore-summary').textContent, `${ids.length} von ${tei.entries.length} Einträgen`);
  assert.equal(doc(again).querySelectorAll('#explore-chips .explore-chip').length, 3, 'a chip per chosen value');
  doc(again).querySelector('#explore-chips .explore-chip').click();
  assert.equal(again.location.hash, '#tat=TatUnzucht&klasse=geld&ansicht=tat', 'a chip takes its value out');
});

await test('story taking the selection along: all selected entries go into the Datenkorb, the CSV holds them with their categories', async () => {
  const w = await open('#tat=TatBetteln', { 'ufbas.datenkorb': '[]' });
  const ids = listIds(w);
  doc(w).querySelector('.basket-add-all').click();
  const basket = JSON.parse(w.localStorage.getItem('ufbas.datenkorb'));
  assert.deepEqual(basket.map((i) => i.uri).sort(), [...ids].sort());
  assert.ok(basket.every((i) => i.datum !== undefined && i.taeter !== undefined));
  assert.ok([...doc(w).querySelectorAll('#explore-list .basket-check')].every((b) => b.checked), 'switches show the state');
  const csv = w.ufbasExploration.csv().replace(/^﻿/, '').trim().split('\r\n');
  assert.equal(csv.length, ids.length + 1);
  assert.equal(csv[0], '"url";"eintrag";"datum";"täter";"geschlecht";"herkunft";"tatbestände";"strafen";"verfahren";"schlagworte";"inhalt"');
  assert.ok(csv.slice(1).every((row) => row.includes('Betteln')), 'every row names the offence');
});

await test('the table shows 50 rows of a long selection, the button the rest, and a new selection starts again at 50', async () => {
  const w = await open();
  const more = doc(w).querySelector('.explore-table-more');
  assert.equal(shownRows(w).length, 50);
  assert.equal(more.hidden, false);
  assert.equal(more.textContent, `Alle ${tei.entries.length} Einträge zeigen`);
  more.click();
  assert.equal(shownRows(w).length, tei.entries.length);
  assert.equal(more.hidden, true);
  const first = doc(w).querySelectorAll('#explore-list > tr')[50].querySelector('.explore-open');
  assert.equal(doc(w).activeElement, first, 'the focus goes to the first row shown by the click');
  // opening an entry keeps the rows, a sort starts again at the limit
  first.click();
  assert.equal(shownRows(w).length, tei.entries.length, 'opening an entry keeps all rows');
  doc(w).querySelector('[data-key="tsort:taeter"]').click();
  assert.equal(shownRows(w).length, 50, 'a sort starts again at 50');
  const w2 = await open('#tat=TatBetteln');
  assert.ok(shownRows(w2).length <= 50);
  assert.equal(doc(w2).querySelector('.explore-table-more').hidden, doc(w2).querySelectorAll('#explore-list > tr').length <= 50);
});

await test('an entry already in the Datenkorb shows its switch checked', async () => {
  const w = await open('', { 'ufbas.datenkorb': JSON.stringify([{ uri: 'Eintrag-3', datum: '', taeter: '', inhalt: '' }]) });
  assert.equal(doc(w).querySelector('.basket-check[data-entryid="Eintrag-3"]').checked, true);
  assert.equal(doc(w).querySelector('.basket-check[data-entryid="Eintrag-4"]').checked, false);
});

await test('the table sorts by a column and back', async () => {
  const w = await open('#tat=TatBetteln');
  doc(w).querySelector('[data-key="tsort:taeter"]').click();
  showAll(w);
  const names = shownRows(w).map((tr) => tr.getAttribute('data-taeter'));
  assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b, 'de')));
  assert.equal(doc(w).querySelector('th[aria-sort]').getAttribute('aria-sort'), 'ascending');
  doc(w).querySelector('[data-key="tsort:taeter"]').click();
  assert.equal(doc(w).querySelector('th[aria-sort]').getAttribute('aria-sort'), 'descending');
});

await test('keyboard: the marks are one tab stop, arrow keys move between them, Enter opens the entry', async () => {
  const w = await open();
  const stops = [...doc(w).querySelectorAll('.explore-mark')].filter((m) => m.getAttribute('tabindex') === '0');
  assert.equal(stops.length, 1);
  stops[0].focus();
  stops[0].dispatchEvent(new w.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  const next = doc(w).activeElement;
  assert.ok(next.classList.contains('explore-mark') && next !== stops[0], 'the focus moved to another mark');
  next.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  assert.equal(w.location.hash, '#eintrag=' + next.getAttribute('data-id'));
  assert.equal(doc(w).getElementById('explore-detail').hidden, false);
  doc(w).dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(doc(w).getElementById('explore-detail').hidden, true, 'Escape closes the entry');
});

await test('while the query runs the status shows a loading ring with its text', async () => {
  const w = await openPage(html, { url: PAGE, scripts: ['exploration.js'], before: (window) => { window.fetch = () => new Promise(() => {}); } });
  const status = w.document.getElementById('explore-status');
  assert.ok(status.classList.contains('is-loading'));
  assert.equal(status.textContent, 'Einträge werden geladen');
  assert.equal(status.getAttribute('role'), 'status');
});

await test('an answer that cannot be read leaves a message and no half view', async () => {
  const w = await openPage(html, { url: PAGE, scripts: ['exploration.js'], before: (window) => { window.fetch = answering('http://localhost:8080/sesame/sparqlendpoint'); } });
  await w.ufbasExploration.ready;
  assert.equal(w.document.getElementById('explore').hidden, true);
  assert.equal(w.document.getElementById('explore-status').textContent, 'Die Einträge konnten nicht geladen werden.');
  assert.ok(!w.document.getElementById('explore-status').classList.contains('is-loading'), 'no ring after a failure');
});

done();
