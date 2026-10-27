// Runs js/buildquery.js in jsdom: the params it builds for the documented cases, which must
// not contain | or backslash sequences (knowledge/architecture.md, Parameter channel), its
// messages on invalid input, and the form state shown again on the result page.
import assert from 'node:assert/strict';
import { ORIGIN, built, open, runner } from './lib.mjs';

const searchUrl = ORIGIN + '/archive/objects/query:ufbas.search/methods/sdef:Query/get?params=x';

const { test, done } = runner('search-params', 'tests');

await test('search params for the documented cases', async () => {
  const window = await open('<!DOCTYPE html><body></body>', { url: searchUrl, scripts: ['buildquery.js'] });
  const build = (state) => decodeURIComponent(window.ufbasSearch.buildParams(state));
  assert.equal(build({ terms: 'Dieb', prefix: true }), '$1|Dieb;$2|{ { ?inhalt bds:search "Dieb*" . ?inhalt bds:matchAllTerms "true" . }'
    + ' UNION { ?url ufbas-ont:mentionsPlace ?ort . ?ort ufbas-ont:placeName "Dieb" . } }');
  assert.ok(!build({ terms: 'Dieb |Hans', regex: true }).split(';$2|')[1].includes('|'), 'no pipe in $2');
  assert.ok(!build({ terms: 'w[yi]n', regex: true }).includes('\\'), 'no backslash');
  assert.ok(build({ terms: 'zunff+t', regex: true }).includes('%2B'), 'plus encoded in advance');
  assert.equal(build({ from: '1565', to: '1566' }), '$1|~;$2| FILTER(?datum >= "1565" && ?datum <= "1566~")');
  assert.match(build({ terms: 'Hans -Basel', regex: true }), /^\$1\|Hans;\$2\|FILTER\(!\(!\(regex\(.*\(Hans\).*\) && NOT EXISTS \{ \?url ufbas-ont:mentionsPlace \?ort \. \?ort ufbas-ont:placeName "Hans" \. \}\) && !regex\(.*\(Basel\)/);
  assert.throws(() => window.ufbasSearch.buildParams({ terms: 'Hans(', regex: true }), /Ungültiger regulärer Ausdruck/);
  assert.throws(() => window.ufbasSearch.buildParams({ terms: '-Basel' }), /ohne Minuszeichen/);
  assert.throws(() => window.ufbasSearch.buildParams({ terms: 'w[yi]n' }), /nur mit „Reguläre Ausdrücke“/, 'a pattern without the option');
  assert.ok(window.ufbasSearch.buildParams({ terms: 'w[yi]n', regex: true }), 'the same pattern with the option');
  assert.throws(() => window.ufbasSearch.buildParams({ terms: 'x', from: '15.3.1565' }), /JJJJ/);
});

await test('invalid input shows the message at the form', async () => {
  const window = await open(built('search-form'), { url: searchUrl, scripts: ['buildquery.js'] });
  const form = window.document.getElementById('SucheErweitert');
  form.elements.Stichwort.value = 'Hans(';
  form.elements.regex.checked = true;
  form.dispatchEvent(new window.Event('submit', { cancelable: true }));
  const box = form.querySelector('.search-error');
  assert.equal(box.hidden, false);
  assert.match(box.textContent, /Hans\(/);
});

await test('the result page shows the typed form state again', async () => {
  const params = 'P123';
  const state = { terms: 'Dieb |Hans', regex: true, from: '1565', to: '', prefix: false };
  const window = await open(built('search-regex-or'), {
    url: searchUrl.replace('params=x', 'params=' + params),
    session: { 'ufbas.search': JSON.stringify({ params, state }) },
    scripts: ['buildquery.js']
  });
  const form = window.document.getElementById('SucheErweitert');
  assert.equal(form.elements.Stichwort.value, 'Dieb |Hans');
  assert.equal(form.elements.regex.checked, true);
  assert.equal(form.elements.von.value, '1565');
});

await test('the quick search reports empty input without a global form2params', async () => {
  const html = '<!DOCTYPE html><body><form id="volltextsuche"><input name="Stichwort" value=""></form></body>';
  const window = await open(html, { url: searchUrl, scripts: ['buildquery.js'] });
  assert.equal(typeof window.form2params, 'undefined');
  let alerted = '';
  window.alert = (m) => { alerted = m; };
  window.document.getElementById('volltextsuche').dispatchEvent(new window.Event('submit', { cancelable: true }));
  assert.match(alerted, /Suchbegriff/);
});

done();
