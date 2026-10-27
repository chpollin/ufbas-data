// Checks of the search and category result pages beyond the smoke test: the
// keyword-in-context excerpt, the category chips, the query read back from $2, the
// year links and the example searches of the form.
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { HITS, ORIGIN, built as html, open, runner } from './lib.mjs';

const searchUrl = ORIGIN + '/archive/objects/query:ufbas.search/methods/sdef:Query/get?params=';
const doc = (name) => new JSDOM(html(name)).window.document;
const norm = (text) => text.replace(/\s+/g, ' ').trim();
const GROUPS = ['Person', 'Tat', 'Strafe', 'Ort', 'Schlagwort'];

const { test, done } = runner('search', 'tests');

const resultPages = ['search-navbar-dieb', 'search-regex-or', 'search-regex-plus', 'search-date-only', 'search-wyn',
  'search-wyn-or', 'search-star-term', 'volltext-2017-link', 'category-browse'];

await test('every excerpt window is a passage of the full text, which holds the hits', () => {
  for (const page of resultPages) {
    for (const item of doc(page).querySelectorAll('li.entry-item')) {
      const full = item.querySelector('.result-text');
      assert.ok(full, `${page} ${item.id}: no .result-text`);
      const excerpt = item.querySelector('.result-excerpt');
      if (!excerpt) {
        // the excerpt showed everything, so it is the full text itself
        assert.ok(!item.querySelector('details'), `${page} ${item.id}: details without excerpt`);
        continue;
      }
      assert.ok(full.closest('details.result-full') && !full.closest('details').open, `${page} ${item.id}: full text not in a closed details`);
      const text = norm(full.textContent);
      const windows = norm(excerpt.textContent).replace(/^… /, '').replace(/ …$/, '').split(' … ');
      assert.ok(windows.length >= 1 && windows.length <= 3, `${page} ${item.id}: ${windows.length} windows`);
      for (const w of windows) { assert.ok(text.includes(w), `${page} ${item.id}: window not in the text: ${w.slice(0, 60)}`); }
      assert.ok(norm(excerpt.textContent).length < text.length, `${page} ${item.id}: excerpt not shorter than the text`);
    }
  }
});

await test('excerpts show the hits, or the beginning of the text without a pattern', () => {
  for (const page of resultPages.filter((p) => p !== 'search-date-only')) {
    const items = [...doc(page).querySelectorAll('li.entry-item')];
    const withHit = items.filter((i) => i.querySelector('.entry-item-text:not(details *) mark.hit'));
    assert.equal(withHit.length, items.length, `${page}: ${items.length - withHit.length} excerpts without a hit`);
  }
  for (const item of doc('search-date-only').querySelectorAll('li.entry-item')) {
    const excerpt = norm(item.querySelector('.entry-item-text').textContent);
    assert.ok(!excerpt.startsWith('…'), `${item.id}: date-only excerpt does not start at the beginning`);
    assert.ok(norm(item.querySelector('.result-text').textContent).startsWith(excerpt.replace(/ …$/, '')));
  }
});

await test('chips name a category of one of the five groups', () => {
  const d = doc('search-wyn');
  const chips = [...d.querySelectorAll('li.entry-item ul.chips > li.chip')];
  // a floor against a page that lost its chips, the build of 2026-10-26 shows 105
  assert.ok(chips.length > 50, `chips: ${chips.length}`);
  assert.ok(chips.every((c) => GROUPS.includes(c.getAttribute('data-group'))), 'chip without a group');
  const group = (term) => chips.find((c) => c.querySelector('.chip-term').textContent === term)?.getAttribute('data-group');
  // groups as the taxonomy o:ufbas.kategorien nests them
  assert.equal(group('Alkoholmissbrauch'), 'Tat');
  assert.equal(group('Wirtshausverbot'), 'Strafe');
  // Schulden exists as Tat and as Schlagwort, so the group is named in the text, not by colour alone
  assert.ok(chips.every((c) => c.querySelector('.chip-group').textContent === c.getAttribute('data-group') + ' '), 'group not named in the chip');
  assert.equal(doc('category-browse').querySelectorAll('.chip').length, 0, 'the browsed category repeated on every entry');
});

await test('the page head names hits and query as typed, the form is refilled from $2', () => {
  const cases = {
    'search-wyn': ['Treffer für „wyn“', 'wyn'],
    'search-wyn-or': ['Treffer für „wyn“ oder „win“', 'wyn |win'],
    'search-regex-or': ['Treffer für „Dieb“ oder „Hans“ (regulärer Ausdruck)', 'Dieb |Hans'],
    'search-navbar-dieb': ['Treffer für „Dieb*“', 'Dieb*'],
    'search-regex-plus': ['Treffer für „zunff+t“ (regulärer Ausdruck)', 'zunff+t'],
    'search-date-only': ['Treffer, Zeitraum 1565 bis 1565', ''],
    'volltext-2017-link': ['Treffer für „Dieb“', 'Dieb']
  };
  for (const [page, [meta, form]] of Object.entries(cases)) {
    const d = doc(page);
    assert.equal(norm(d.querySelector('.page-head .page-meta').textContent), `${HITS[page]} ${meta}`, page);
    assert.equal(d.getElementById('SucheErweitert-query').value, form, page);
    assert.ok(d.querySelector('aside.tools #SucheErweitert'), `${page}: form not in the tools column`);
  }
  const c = doc('category-browse');
  assert.equal(c.querySelector('h1').textContent, 'Kategorie: Diebstahl');
  assert.ok(!c.getElementById('SucheErweitert'), 'form on the category browse');
  // the icons of the Exploration view, each named in text and explained by its tooltip
  const actions = [...c.querySelectorAll('.page-head ul.page-actions[role="list"] > li')];
  assert.deepEqual(actions.map((li) => li.textContent.trim()), ['Alle Treffer in den Datenkorb', 'Trefferliste als CSV', 'Diebstahl in der Exploration zeigen']);
  assert.deepEqual(actions.map((li) => li.querySelector('[data-tip]').getAttribute('data-tip')),
    ['Alle Treffer in den Datenkorb legen', 'Trefferliste als CSV herunterladen', 'In der Exploration zeigen']);
  assert.ok(actions.every((li) => li.querySelector('.icon[aria-hidden="true"]') && !li.querySelector('[title]')), 'icon without hidden mark or with a second tooltip');
  assert.ok(actions[1].hidden, 'the CSV button stands without the script that builds the CSV');
  assert.equal(c.querySelector('.page-actions a.explore-link').getAttribute('href'),
    '/archive/objects/context:ufbas/methods/sdef:Context/get?mode=exploration#tat=TatDiebstahl');
  assert.ok(c.querySelector('.page-actions button.icon-button.basket-add-all'));
  for (const page of resultPages) { assert.ok(!doc(page).querySelector('a[href*="getHSSF"]'), `${page}: the XLS export is still offered`); }
});

await test('year links count the hits of their year and undated entries come last', () => {
  for (const page of ['search-regex-or', 'search-wyn', 'category-browse']) {
    const d = doc(page);
    const links = [...d.querySelectorAll('aside.tools .year-jump a')];
    const total = links.reduce((sum, a) => sum + Number(a.textContent.match(/\((\d+)\)$/)[1]), 0);
    assert.equal(total, d.querySelectorAll('li.entry-item').length, `${page}: year counts`);
    for (const a of links) {
      const target = d.getElementById(a.getAttribute('href').slice(1));
      const year = a.textContent.slice(0, 4);
      assert.ok(year === 'unda' ? !target.getAttribute('data-datum') : target.getAttribute('data-datum').startsWith(year), `${page}: ${a.textContent}`);
    }
    const dates = [...d.querySelectorAll('li.entry-item')].map((li) => li.getAttribute('data-datum'));
    const firstUndated = dates.indexOf('');
    assert.ok(firstUndated === -1 || dates.slice(firstUndated).every((x) => x === ''), `${page}: undated entries not last`);
  }
});

await test('example searches are hidden without the script and fill the form with it', async () => {
  const page = html('search-form');
  assert.ok(new JSDOM(page).window.document.querySelector('.search-examples').hasAttribute('hidden'));
  const window = await open(page, { url: searchUrl, scripts: ['buildquery.js'] });
  const d = window.document;
  const form = d.getElementById('SucheErweitert');
  assert.equal(d.querySelector('.search-examples').hidden, false);
  const buttons = [...d.querySelectorAll('.search-example')];
  const pick = (code) => buttons.find((b) => b.querySelector('code').textContent === code);
  form.elements.von.value = '1563';
  pick('wyn |win').click();
  assert.equal(form.elements.Stichwort.value, 'wyn |win');
  assert.equal(form.elements.regex.checked, false);
  assert.equal(form.elements.von.value, '', 'an example replaces the whole form state');
  assert.equal(d.activeElement, form.elements.Stichwort);
  pick('w[yi]n').click();
  assert.equal(form.elements.regex.checked, true);
  pick('1565').click();
  assert.deepEqual([form.elements.Stichwort.value, form.elements.von.value, form.elements.bis.value, form.elements.regex.checked], ['', '1565', '1565', false]);
  // every example is a search the form accepts
  for (const b of buttons) {
    b.click();
    const state = { terms: form.elements.Stichwort.value, regex: form.elements.regex.checked, from: form.elements.von.value, to: form.elements.bis.value };
    assert.ok(window.ufbasSearch.buildParams(state), b.textContent);
  }
});

await test('the empty form page is the fields with examples and closed rules in a rail', () => {
  const d = doc('search-form');
  assert.ok(!d.querySelector('.page-meta, .with-tools, .entry-list'));
  const form = d.querySelector('form#SucheErweitert[aria-labelledby="search-form-title"]');
  assert.ok(form);
  assert.ok(form.querySelector(':scope > .search-fields #SucheErweitert-query'), 'fields not in their column');
  assert.ok(form.querySelector(':scope > .tools.search-aids > .search-examples + details.search-help:not([open]) > summary'), 'examples and closed rules not in the rail');
  assert.ok(d.querySelector('.search-error.alert-query[role="alert"][hidden]'));
  // the examples are the one place of the syntax by example, the rules repeat none
  const rules = d.querySelector('.search-rules').textContent;
  for (const example of [...d.querySelectorAll('.search-example code')].map((c) => c.textContent).filter((c) => !/^\d+$/.test(c))) {
    assert.ok(!rules.includes(example), `rules repeat the example ${example}`);
  }
  assert.ok(!rules.includes('|win') && !rules.includes('Dieb*'), 'rules repeat an operator example');
  // a date field takes a year, a month or a day, so no placeholder claims the day format
  assert.ok(['von', 'bis'].every((id) => !d.getElementById(id).hasAttribute('placeholder')), 'date field with a placeholder');
});

// runs js/results.js (and js/datenkorb.js) on a built page, narrow as jsdom has no matchMedia
function withScripts(name, { hash = '', scripts = ['datenkorb.js', 'results.js'] } = {}) {
  return open(html(name), { url: searchUrl + 'x' + hash, scripts });
}

await test('on narrow screens the form of a result page waits behind "Suche ändern"', async () => {
  assert.ok(doc('search-regex-or').querySelector('button.search-toggle[hidden][aria-controls="SucheErweitert"]'), 'toggle not hidden without the script');
  const window = await withScripts('search-regex-or');
  const d = window.document;
  const toggle = d.querySelector('.search-toggle');
  const tools = d.querySelector('aside.tools');
  assert.equal(toggle.hidden, false);
  assert.equal(norm(toggle.textContent), 'Suche ändern Dieb |Hans', 'the toggle names the search as typed');
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.ok(tools.classList.contains('search-collapsed'));
  assert.ok(tools.querySelector('.year-nav'), 'the year links stay in the tools column');
  toggle.click();
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  assert.ok(!tools.classList.contains('search-collapsed'));
  assert.equal(d.activeElement, d.getElementById('SucheErweitert-query'));
  const dates = await withScripts('search-date-only');
  assert.equal(norm(dates.document.querySelector('.search-toggle').textContent), 'Suche ändern 1565 bis 1565');
});

await test('the CSV of the hits has the columns of the Datenkorb export, filled from the page', async () => {
  const head = '\ufeff"url";"eintrag";"datum";"täter";"geschlecht";"herkunft";"tatbestände";"strafen";"verfahren";"schlagworte";"inhalt"';
  const parse = (text) => text.slice(0, -2).split('\r\n').map((line) => line.slice(line.startsWith('\ufeff') ? 2 : 1, -1).split('";"'));
  // a search: the categories of the chips in the column of their group
  let window = await withScripts('search-wyn');
  assert.equal(window.document.querySelector('.result-csv').parentNode.hidden, false, 'the script shows the CSV button');
  let text = window.ufbasResults.csv();
  assert.ok(text.startsWith(head + '\r\n'), text.slice(0, 120));
  let rows = parse(text);
  const items = [...window.document.querySelectorAll('li.result')];
  assert.equal(rows.length - 1, items.length);
  rows.slice(1).forEach((row, i) => {
    const item = items[i];
    assert.equal(row.length, 11);
    assert.equal(row[0], 'https://gams.uni-graz.at/o:ufbas.1563#' + item.getAttribute('data-uri'));
    assert.deepEqual([row[1], row[2], row[3]], [item.getAttribute('data-uri'), item.getAttribute('data-datum'), item.getAttribute('data-taeter').split('; ').join(' | ')]);
    assert.deepEqual([row[4], row[5], row[8]], ['', '', ''], 'gender, origin and procedure are not on the page');
    const chips = (group) => [...new Set([...item.querySelectorAll(`.chip[data-group="${group}"] .chip-term`)].map((t) => t.textContent))].join(' | ');
    assert.deepEqual([row[6], row[7], row[9]], [chips('Tat'), chips('Strafe'), chips('Schlagwort')]);
    const whole = item.querySelector('.result-text');
    assert.equal(row[10], whole ? whole.textContent.replace(/\s+/g, ' ').trim().replace(/"/g, '""') : '', 'the text where the hit shows it whole');
  });
  assert.ok(rows.some((row) => row[10] !== ''), 'no hit with its whole text');
  assert.ok(rows.some((row) => row[6] !== ''), 'no offence taken from the chips');
  // a category browse: the browsed category in its column on every row
  window = await withScripts('category-browse');
  rows = parse(window.ufbasResults.csv());
  assert.equal(rows.length - 1, HITS['category-browse']);
  assert.ok(rows.slice(1).every((row) => row[6] === 'Diebstahl' && row[7] === '' && row[9] === ''));
});

await test('a category browse shows one year at a time, the Datenkorb still takes every hit', async () => {
  const plain = doc('category-browse');
  assert.ok(plain.querySelector('ol.result-list[data-by-year]'));
  assert.ok(![...plain.querySelectorAll('li.result')].some((li) => li.hidden), 'hits hidden without the script');
  assert.ok(!doc('search-regex-or').querySelector('[data-by-year]'), 'a search is paged by year');
  const window = await withScripts('category-browse', { scripts: ['datenkorb.js', 'results.js'] });
  const d = window.document;
  const items = [...d.querySelectorAll('li.result')];
  const shown = () => [...new Set(items.filter((li) => !li.hidden).map((li) => (li.getAttribute('data-datum') || 'undatiert').slice(0, 4)))];
  const links = [...d.querySelectorAll('.year-jump a')];
  assert.deepEqual(shown(), [links[0].textContent.slice(0, 4)], 'the first year alone');
  assert.equal(d.querySelector('.year-jump a[aria-current="true"]'), links[0]);
  links[2].click();
  assert.deepEqual(shown(), [links[2].textContent.slice(0, 4)]);
  assert.equal(d.querySelector('.year-jump a[aria-current="true"]'), links[2]);
  const next = d.querySelector('.year-next a');
  assert.equal(next.getAttribute('href'), links[3].getAttribute('href'));
  assert.equal(next.textContent, 'Weiter mit ' + links[3].textContent.slice(0, 4));
  // a shared link to a hit opens its year
  const target = items.at(-1);
  const opened = await withScripts('category-browse', { hash: '#' + target.id });
  assert.equal(opened.document.getElementById(target.id).hidden, false);
  assert.equal(opened.document.querySelector('.year-next').hidden, true, 'no next year after the last');
  d.querySelector('.basket-add-all').click();
  assert.equal(JSON.parse(window.localStorage.getItem('ufbas.datenkorb')).length, items.length, 'take all took only the year shown');
});

done();
