// The Exploration view counts what query:ufbas.exploration answers from the refactored RDF,
// which ufbas-TORDF-ontology.xsl derives and the re-ingest publishes. Two derivations have
// to agree: the query text of query/, run on that RDF with Oxigraph, and
// exploration-data.xsl, which reads the TEI of tei/ directly. They are compared per
// entry on every value the view shows: the categories of its filters, the Urfehde date, the
// gender composition and the offenders. Both merge a fragment into the entry it continues
// (ADR-12). The RDF of 2017 lost keywords and gender readings (knowledge/data.md); the
// refactored RDF loses none,
// so any difference fails, and a change of the query, the derivation or the TEI is
// reviewed before the view shows it.
import assert from 'node:assert/strict';
import { explorationData } from '../make-exploration-data.mjs';
import { queryJSON, queryText } from '../sparql.mjs';
import { filterCategories, genderClass, runner } from './lib.mjs';

const { test, done } = runner('exploration-rdf', 'checks');

const tei = JSON.parse(await explorationData({ generated: 'test' }));
const rows = await queryJSON('query:ufbas.exploration');
const inFilter = filterCategories(tei.categories);

await test('the query reads only the terms of the domain ontology and the GAMS ontology', () => {
  const prefixes = [...queryText('query:ufbas.exploration').matchAll(/^PREFIX\s+([\w-]*):\s*<([^>]+)>/gm)].map((m) => m[2]);
  assert.deepEqual(prefixes.sort(), ['http://gams.uni-graz.at/o:gams-ontology#', 'http://gams.uni-graz.at/ufbas/#',
    'https://gams.uni-graz.at/o:ufbas.ontology#'].sort());
});

await test('the query answers one row per entry of the TEI reference, with the entry as IRI', () => {
  const ids = rows.map((r) => r.eintrag.replace('http://gams.uni-graz.at/o:ufbas.1563#', ''));
  assert.deepEqual([...ids].sort(), tei.entries.map((e) => e.id).sort());
});

await test('RDF and TEI agree on every category, date, gender and offender the view shows', () => {
  const byId = new Map(rows.map((r) => [r.eintrag.split('#')[1], r]));
  const found = [];
  for (const entry of tei.entries) {
    const row = byId.get(entry.id);
    const fromTei = new Set(entry.annotations.map((a) => a.category).filter((c) => inFilter.has(c)));
    const fromRdf = new Set((row.kategorien || '').split(' ').filter((c) => inFilter.has(c)));
    for (const c of fromTei) { if (!fromRdf.has(c)) { found.push(`${entry.id} -${c}`); } }
    for (const c of fromRdf) { if (!fromTei.has(c)) { found.push(`${entry.id} +${c}`); } }
    if ((entry.date || '') !== (row.datum || '')) { found.push(`${entry.id} datum ${entry.date}/${row.datum}`); }
    const g1 = genderClass(entry.offenders.map((o) => o.gender || ''));
    const g2 = genderClass((row.taeter || '').split('|').map((t) => ({ male: 'm', female: 'f' })[t.split('~')[0]] || ''));
    if (g1 !== g2) { found.push(`${entry.id} geschlecht ${g1}/${g2}`); }
    // the query joins equal names, Eintrag-616 names its two offenders twice
    const names = new Set(entry.offenders.map((o) => o.label)).size;
    const answered = new Set((row.taeter || '').split('|').filter(Boolean).map((t) => t.slice(t.indexOf('~') + 1))).size;
    if (names !== answered) { found.push(`${entry.id} täter ${names}/${answered}`); }
  }
  assert.deepEqual(found, []);
});

done();
