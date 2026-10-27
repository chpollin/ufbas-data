// The search query texts of query/, which read the refactored RDF, against the answers
// production gave on 2026-09-23 with the texts of 2017 on the RDF of 2017. Each search page
// of build.mjs runs locally through sparql.mjs, whose emulation of bds:search stands in for
// Blazegraph, and the hits are compared with the cached production answer of the same
// search, sent with the params js/buildquery.js built then (test/fixtures/search-params-2017.json).
// The differences listed below have a cause in the data, which the test checks where the
// TEI shows it; any other difference fails, and so does a listed one that disappears. The
// new texts also apply a date range and excluded terms to the place name, which the texts
// of 2017 did not.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import SaxonJS from 'saxon-js';
import { buildParams, searchPages } from '../build.mjs';
import { datastream, here, parse, queryResult, root } from '../gams.mjs';
import { queryText, queryXML } from '../sparql.mjs';
import { runner } from './lib.mjs';

const params2017 = JSON.parse(readFileSync(resolve(here, 'test/fixtures/search-params-2017.json'), 'utf8'));
const teiDoc = await parse(await datastream('o:ufbas.1563', 'TEI_SOURCE'));
const xpath = (expression) => SaxonJS.XPath.evaluate(expression, teiDoc, { resultForm: 'array' }).map(String);

// hits found only in an editors' note, whose wording the new entry text leaves out
const NOTE = { 'search-navbar-dieb': ['Dieb', ['Eintrag-529']],
  'search-regex-or': ['Hans', ['Eintrag-15', 'Eintrag-22', 'Eintrag-154', 'Eintrag-234', 'Eintrag-251', 'Eintrag-255', 'Eintrag-298',
    'Eintrag-300', 'Eintrag-351', 'Eintrag-374', 'Eintrag-391', 'Eintrag-394', 'Eintrag-448', 'Eintrag-460', 'Eintrag-484', 'Eintrag-486',
    'Eintrag-487', 'Eintrag-526', 'Eintrag-597', 'Eintrag-601']] };
const KNOWN = [
  ...Object.entries(NOTE).flatMap(([page, [, ids]]) => ids.map((id) => `${page} -${id}`)),
  // a p inside Eintrag-132 carries #uf_Eintrag (knowledge/data.md), the RDF of 2017 made it an entry
  'search-date-only -Eintrag-133', 'search-date-only +Eintrag-132',
  // the RDF of 2017 linked the Urfehde date of Eintrag-230 from the annotation it sits in,
  // not from the entry, so the date range of 2017 missed it
  'search-date-only +Eintrag-230',
  // an element coded TatEinbruch and TatDiebstahl, whose second category the RDF of 2017 lost
  'category-browse +Eintrag-23', 'category-browse +Eintrag-324'
];

const { test, done } = runner('search-queries', 'checks');

const results = (xml) => [...xml.matchAll(/<result>([\s\S]*?)<\/result>/g)].map((m) => ({
  id: (/<url uri="[^"#]*#([^"]+)"/.exec(m[1]) || [])[1],
  datum: (/<datum[^>]*>([^<]*)</.exec(m[1]) || [])[1] || ''
}));
const ids = (xml) => new Set(results(xml).map((r) => r.id));

await test('the search queries read only the domain ontology, the GAMS ontology, SKOS and the full-text search', () => {
  for (const pid of ['query:ufbas.search', 'query:ufbas.volltext', 'query:ufbas.kategorien']) {
    const used = [...queryText(pid).matchAll(/^PREFIX\s+[\w-]*:\s*<([^>]+)>/gm)].map((m) => m[1]);
    assert.deepEqual(used.filter((iri) => !['https://gams.uni-graz.at/o:ufbas.ontology#', 'http://gams.uni-graz.at/ufbas/#',
      'http://gams.uni-graz.at/o:gams-ontology#', 'http://www.w3.org/2004/02/skos/core#', 'http://www.bigdata.com/rdf/search#'].includes(iri)), [], pid);
    assert.ok(!/g2o:|uf:|oa:|tei:/.test(queryText(pid).replace(/^#.*$/gm, '')), `${pid} uses a term of 2017`);
  }
});

await test('every search page finds the hits of production, apart from the listed causes', async () => {
  const found = [];
  for (const [page, [pid, raw]] of Object.entries(searchPages)) {
    if (!raw || page === 'search-invalid') { continue; }
    const local = await queryXML(pid, raw);
    const production = await queryResult(pid, params2017[page] ?? raw);
    assert.ok(!local.invalid && !production.invalid, `${page} invalid`);
    const a = ids(local.xml);
    const b = ids(production.xml);
    for (const id of a) { if (!b.has(id)) { found.push(`${page} +${id}`); } }
    for (const id of b) { if (!a.has(id)) { found.push(`${page} -${id}`); } }
  }
  assert.deepEqual(found.filter((d) => !KNOWN.includes(d)), [], 'new differences');
  assert.deepEqual(KNOWN.filter((d) => !found.includes(d)), [], 'listed differences that no longer occur');
});

await test('the hits that only production finds hold the term in an editors\' note of the entry and nowhere else', () => {
  for (const [, [term, list]] of Object.entries(NOTE)) {
    for (const id of list) {
      const note = xpath(`string-join(//*:div[@xml:id = '${id}']//*:note[@resp = '#editor'], ' ')`)[0];
      const rest = xpath(`string-join(//*:div[@xml:id = '${id}']//text()[not(ancestor::*:note[@resp = '#editor'])], ' ')`)[0];
      assert.match(note, new RegExp(`(^|[^\\p{L}])${term}`, 'iu'), `${id} note`);
      assert.doesNotMatch(rest, new RegExp(`(^|[^\\p{L}])${term}([^\\p{L}]|$)`, 'iu'), `${id} text`);
    }
  }
});

await test('a place name finds every spelling of the place, within the date range and without the excluded terms', async () => {
  const run = async (state) => results((await queryXML('query:ufbas.search', buildParams(state))).xml);
  const riehen = await run({ terms: 'Riehen' });
  const spelled = riehen.filter((r) => !/riehen/i.test(xpath(`string(//*:div[@xml:id = '${r.id}'])`)[0]));
  assert.ok(spelled.length > 0, 'no entry that spells the place otherwise');
  const dated = await run({ terms: 'Riehen', from: '1566', to: '1566' });
  assert.ok(dated.length > 0 && dated.length < new Set(riehen.map((r) => r.id)).size);
  assert.deepEqual(dated.filter((r) => !r.datum.startsWith('1566')).map((r) => r.id), []);
  const excluded = await run({ terms: 'Riehen -Meygerhofer' });
  assert.ok(excluded.length > 0);
  assert.deepEqual(excluded.filter((r) => /(^|[^\p{L}])Meygerhofer([^\p{L}]|$)/iu.test(xpath(`string(//*:div[@xml:id = '${r.id}'])`)[0])).map((r) => r.id), []);
  assert.ok(riehen.some((r) => /Meygerhofer/i.test(xpath(`string(//*:div[@xml:id = '${r.id}'])`)[0])), 'the excluded term occurs among the hits without it');
});

await test('a query the endpoint cannot parse gives no results element, as GAMS answers it', async () => {
  const [pid, raw] = searchPages['search-invalid'];
  assert.equal((await queryXML(pid, raw)).invalid, true);
});

done();
