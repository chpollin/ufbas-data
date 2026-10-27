// Runs js/datenkorb.js in jsdom on the pages built by build.mjs: the takeover of the basket
// of 2017, the switches of the result list and the edition, and the Datenkorb page with its
// table, sorting, CSV export and the categories from query:ufbas.exploration.
import assert from 'node:assert/strict';
import { explorationData } from '../make-exploration-data.mjs';
import { queryJSON } from '../sparql.mjs';
import { ORIGIN, answering, built, open, runner } from './lib.mjs';

const dump = (window) => Object.fromEntries(Object.keys(window.localStorage).map((k) => [k, window.localStorage.getItem(k)]));
const change = (window, box, checked) => {
  box.checked = checked;
  box.dispatchEvent(new window.Event('change', { bubbles: true }));
};

const { test, done } = runner('datenkorb', 'tests');

const searchUrl = ORIGIN + '/archive/objects/query:ufbas.search/methods/sdef:Query/get?params=x';
const legacy = JSON.stringify([
  { uri: 'Eintrag-141', taeter: 'Danit Mütt', inhalt: 'alt', datum: '1565-05-14', id: 'd1e2' },
  { uri: 'Eintrag-141', taeter: 'Danit Mütt', inhalt: 'alt', datum: '1565-05-14', id: 'd1e3' },
  { uri: 'SZD.1', taeter: 'other project' }
]);

await test('2017 basket entries are taken over once, the old key stays', async () => {
  const window = await open(built('search-navbar-dieb'), { url: searchUrl, storage: { itemsArray: legacy }, scripts: ['datenkorb.js'] });
  const items = JSON.parse(window.localStorage.getItem('ufbas.datenkorb'));
  assert.deepEqual(items.map((i) => i.uri), ['Eintrag-141']);
  assert.equal(window.localStorage.getItem('itemsArray'), legacy);
  assert.equal(window.document.getElementById('datenkorbstatic').textContent, 'Datenkorb (1)');
});

await test('checking, reloading and unchecking a result', async () => {
  let window = await open(built('search-navbar-dieb'), { url: searchUrl, scripts: ['datenkorb.js'] });
  const box = window.document.querySelector('.basket-check');
  const uri = box.getAttribute('data-entryid');
  change(window, box, true);
  const [item] = JSON.parse(window.localStorage.getItem('ufbas.datenkorb'));
  assert.equal(item.uri, uri);
  assert.ok(item.inhalt.length > 20, 'text taken from the result');
  const status = window.document.querySelector('.basket-status[role="status"]');
  assert.equal(status && status.textContent, 'In den Datenkorb gelegt, 1 Eintrag im Datenkorb', 'confirmation after the change');
  assert.equal(window.document.getElementById('datenkorbstatic').textContent, 'Datenkorb (1)');
  window = await open(built('search-navbar-dieb'), { url: searchUrl, storage: dump(window), scripts: ['datenkorb.js'] });
  const again = window.document.querySelector(`.basket-check[data-entryid="${uri}"]`);
  assert.equal(again.checked, true, 'checkbox restored after reload');
  change(window, again, false);
  assert.deepEqual(JSON.parse(window.localStorage.getItem('ufbas.datenkorb')), []);
});

await test('adding all results creates no duplicates', async () => {
  const window = await open(built('search-navbar-dieb'), { url: searchUrl, scripts: ['datenkorb.js'] });
  const boxes = window.document.querySelectorAll('.basket-check');
  change(window, boxes[0], true);
  window.document.querySelector('.basket-add-all').click();
  const items = JSON.parse(window.localStorage.getItem('ufbas.datenkorb'));
  assert.equal(items.length, boxes.length);
  assert.equal(new Set(items.map((i) => i.uri)).size, items.length);
});

await test('edition entry text goes into the basket without the heading', async () => {
  const window = await open(built('edition'), { scripts: ['datenkorb.js'] });
  change(window, window.document.querySelector('.basket-check[data-entryid="Eintrag-0"]'), true);
  const [item] = JSON.parse(window.localStorage.getItem('ufbas.datenkorb'));
  assert.equal(item.datum, '1563-01-03');
  assert.ok(item.inhalt.startsWith('Demnach er und Hanns'), item.inhalt.slice(0, 40));
  assert.ok(item.taeter.startsWith('Bastean Doldter'));
});

const basket = JSON.stringify([
  { uri: 'Eintrag-12', datum: '1563-05-01', taeter: 'B; "Beta"', inhalt: 'Text mit ; und "Anführung"' },
  { uri: 'Eintrag-3', datum: '1564-01-01', taeter: 'A', inhalt: 'Zweiter' }
]);
const basketUrl = ORIGIN + '/archive/objects/context:ufbas/methods/sdef:Context/get?mode=datenkorb';

await test('basket page lists, sorts, exports, removes and clears', async () => {
  const window = await open(built('datenkorb'), { url: basketUrl, storage: { 'ufbas.datenkorb': basket }, scripts: ['datenkorb.js'] });
  const doc = window.document;
  const shown = () => [...doc.querySelectorAll('.basket-table tbody tr')].map((tr) => tr.getAttribute('data-uri'));
  const stored = () => JSON.parse(window.localStorage.getItem('ufbas.datenkorb')).map((i) => i.uri);
  const head = (key) => doc.querySelector(`.basket-table .table-sort[data-sort="${key}"]`);
  let blob = null;
  window.URL.createObjectURL = (b) => { blob = b; return 'blob:csv'; };
  const download = async () => new Promise((done) => {
    const reader = new window.FileReader();
    reader.onload = () => done(reader.result);
    reader.readAsText(blob);
  });
  assert.deepEqual(shown(), ['Eintrag-12', 'Eintrag-3'], 'listed by date');
  assert.deepEqual([...doc.querySelectorAll('.basket-table thead .table-sort')].map((b) => b.textContent), ['Datum', 'Täter', 'Tatbestand', 'Strafe', 'Herkunft'], 'the columns of the Exploration table');
  const first = doc.querySelector('.basket-table tbody tr');
  assert.equal(first.querySelector('.entry-table-date').textContent, '01.05.1563');
  assert.equal(first.querySelector('td[data-label="Täter"]').textContent, 'B; "Beta"');
  assert.equal(first.querySelector('a.icon-button[data-tip="In der Edition lesen"]').getAttribute('href'), '/o:ufbas.1563#Eintrag-12');
  assert.ok(!doc.getElementById('basket-count'), 'no count beside the one of the navigation');
  assert.ok(!/\d/.test(doc.querySelector('.page-head').textContent), 'no count in the page head');
  assert.equal(doc.getElementById('basket-tools').hidden, false);
  assert.ok(!doc.querySelector('#datenkorbInhalt select, #basket-sort'), 'sorting by the column heads');
  const csv = window.ufbasDatenkorb.csv(JSON.parse(basket));
  assert.ok(csv.startsWith('﻿"url";"eintrag";"datum";"täter";"geschlecht";"herkunft";"tatbestände";"strafen";"verfahren";"schlagworte";"inhalt"\r\n'));
  assert.ok(csv.includes('"https://gams.uni-graz.at/o:ufbas.1563#Eintrag-12";"Eintrag-12";"1563-05-01";"B; ""Beta""";"";"";"";"";"";"";"Text mit ; und ""Anführung"""\r\n'), 'without the query answer the categories stay empty');
  assert.equal(head('datum').parentElement.getAttribute('aria-sort'), 'ascending');
  head('datum').click();
  assert.deepEqual(shown(), ['Eintrag-3', 'Eintrag-12'], 'a second click reverses');
  assert.equal(head('datum').parentElement.getAttribute('aria-sort'), 'descending');
  assert.equal(doc.activeElement, head('datum'), 'the focus stays on the column head');
  assert.deepEqual(stored(), ['Eintrag-12', 'Eintrag-3'], 'sorting leaves the stored order');
  assert.equal(doc.getElementById('basket-download').getAttribute('href'), 'blob:csv');
  const exported = await download();
  assert.ok(exported.indexOf('#Eintrag-3"') < exported.indexOf('#Eintrag-12"'), 'the CSV follows the order on screen');
  head('taeter').click();
  assert.deepEqual(shown(), ['Eintrag-3', 'Eintrag-12'], 'sorted by offender');
  head('datum').click();
  assert.deepEqual(shown(), ['Eintrag-12', 'Eintrag-3'], 'sorted by date again');
  // every entry is removed with the bookmark switch of the other lists
  const switches = [...doc.querySelectorAll('.basket-table label.basket-icon[data-tip][data-tip-on] > input.basket-check')];
  assert.equal(switches.length, 2);
  assert.ok(switches.every((box) => box.checked), 'switches show the entries in');
  assert.ok(!doc.querySelector('.basket-table button:not(.table-sort)'), 'no text button per entry');
  change(window, switches[0], false);
  assert.deepEqual(shown(), ['Eintrag-3']);
  assert.deepEqual(stored(), ['Eintrag-3']);
  assert.equal(doc.querySelector('.basket-status').textContent, 'Aus dem Datenkorb genommen, 1 Eintrag im Datenkorb');
  assert.equal(doc.getElementById('datenkorbstatic').textContent, 'Datenkorb (1)');
  assert.equal(doc.activeElement, doc.querySelector('.basket-table .basket-check[data-entryid="Eintrag-3"]'), 'focus on the entry that moved up');
  assert.equal(doc.getElementById('basket-clear').getAttribute('data-tip'), 'Alle Einträge aus dem Datenkorb entfernen');
  window.confirm = () => false;
  doc.getElementById('basket-clear').click();
  assert.deepEqual(stored(), ['Eintrag-3'], 'nothing cleared without confirmation');
  window.confirm = () => true;
  doc.getElementById('basket-clear').click();
  assert.deepEqual(stored(), []);
  assert.ok(doc.getElementById('datenkorbInhalt').textContent.startsWith('Der Datenkorb ist leer.'));
  assert.equal(doc.querySelectorAll('#datenkorbInhalt a[href="/o:ufbas.1563"], #datenkorbInhalt a[href*="query:ufbas.search"]').length, 2, 'ways to the edition and the search');
  assert.equal(doc.getElementById('basket-tools').hidden, true);
  assert.equal(doc.activeElement, doc.querySelector('.basket-empty'), 'focus on the empty state');
});

await test('basket entries show their categories from the query and export them in the CSV', async () => {
  const answer = JSON.stringify(await queryJSON('query:ufbas.exploration'));
  const reference = JSON.parse(await explorationData({ generated: 'test' })).entries.find((e) => e.id === 'Eintrag-0');
  const items = JSON.stringify([{ uri: 'Eintrag-0', datum: '1563-01-03', taeter: 'Bastean Doldter', inhalt: 'Demnach er und Hanns' }]);
  const requests = [];
  const window = await open(built('datenkorb'), { url: basketUrl, storage: { 'ufbas.datenkorb': items }, scripts: ['datenkorb.js'],
    before: (w) => { w.fetch = answering(answer, requests); } });
  await window.ufbasDatenkorb.ready();
  const doc = window.document;
  assert.deepEqual(requests, ['/archive/objects/query:ufbas.exploration/methods/sdef:Query/getJSON'], 'one request');
  const taxonomy = JSON.parse(doc.getElementById('basket-data').textContent).categories;
  const terms = (group) => [...new Set(reference.annotations.map((a) => taxonomy.find((c) => c.id === a.category && c.facet === group))
    .filter(Boolean).map((c) => c.term))];
  const shown = (label) => doc.querySelector(`.basket-table td[data-label="${label}"]`).textContent.split(', ').filter(Boolean);
  assert.deepEqual(shown('Tatbestand').sort(), terms('tat').sort(), 'offences of the TEI');
  assert.deepEqual(shown('Strafe').sort(), terms('strafe').sort(), 'sanctions of the TEI');
  assert.ok(!doc.getElementById('datenkorbInhalt').textContent.includes('Demnach er und Hanns'), 'no text in the table');
  const row = window.ufbasDatenkorb.csv(JSON.parse(items)).split('\r\n')[1].split(';');
  assert.deepEqual(row[6].slice(1, -1).split(' | ').sort(), terms('tat').sort(), 'offences in their column, joined by a bar');
  assert.equal(row[4], '"Männer"', 'gender composition exported');
  assert.equal(row[10], '"Demnach er und Hanns"', 'the text stays in the export');
});

done();
