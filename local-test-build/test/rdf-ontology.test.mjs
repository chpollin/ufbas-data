// The refactored RDF of ufbas-TORDF-ontology.xsl, derived from the TEI in tei/, has to
// carry what the TEI reference of make-exploration-data.mjs reads from the same TEI: the
// entries, their offence, sanction, keyword and procedure categories, the Urfehde date and
// the gender composition of the offenders. The reference merges a fragment into the entry it
// continues (ADR-12), as the RDF lets the fragment document that entry's proceeding, so the
// values are compared per proceeding. The losses of the RDF of 2017 must not recur. Entry
// types, editors' cross-references and date conflicts are checked against the curated
// tables of research-artefacts/ and the findings of knowledge/data.md. The graph is also checked on its
// own terms: every term it uses is declared in the ontology, every derived node points to
// a span or entry of the TEI, and every category is one of the taxonomy. The place names,
// the amounts outside any span and the references to other proceedings are read from the
// TEI by XPath, independently of the stylesheet.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { explorationData } from '../make-exploration-data.mjs';
import { exampleFile, exampleStore, ontologyRDF } from '../derive-rdf.mjs';
import SaxonJS from 'saxon-js';
import { datastream, parse } from '../gams.mjs';
import { ttlFile } from '../make-ontology.mjs';
import { filterCategories, fragmentHosts, genderClass, oxigraph, rows, runner, tsv } from './lib.mjs';

const DATA = 'http://gams.uni-graz.at/o:ufbas.1563#';
const ONT = 'https://gams.uni-graz.at/o:ufbas.ontology#';
const KAT = 'http://gams.uni-graz.at/ufbas/#';
const GAMS = 'http://gams.uni-graz.at/o:gams-ontology#';
const PREFIXES = `PREFIX ufbas: <${DATA}>\nPREFIX ufbas-ont: <${ONT}>\nPREFIX ufbas-kat: <${KAT}>\nPREFIX gams: <${GAMS}>\n`;
const GROUPS = ['Person', 'Tat', 'Strafe', 'Ort', 'Schlagwort', 'Datum'];

const { test, done } = runner('rdf-ontology', 'checks');

const edition = await datastream('o:ufbas.1563', 'TEI_SOURCE');
const rdf = await ontologyRDF({ editionText: edition });
const tei = JSON.parse(await explorationData({ generated: 'test' }));
const teiDoc = await parse(edition);
// strings from the TEI by XPath, independent of the stylesheet
const xpath = (expression) => SaxonJS.XPath.evaluate(expression, teiDoc, { resultForm: 'array' }).map(String);
const store = new oxigraph.Store();
// strict, so an IRI the stylesheet writes badly fails here
store.load(rdf, { format: 'application/rdf+xml', base_iri: DATA });
const ontology = new oxigraph.Store();
ontology.load(readFileSync(ttlFile, 'utf8'), { format: 'text/turtle' });

// the curated tables of the research of 2026-09-24, which the derivation has to reproduce
const entryTypes = tsv('entry-types.tsv');
const crossrefs = tsv('editorial-crossrefs.tsv');
const fragments = fragmentHosts();

const select = (query) => rows(store.query(PREFIXES + query));
const local = (iri) => iri.slice(iri.lastIndexOf('#') + 1);
// entry id -> set of values, from rows with ?e and one value column
const byEntry = (rows, column) => {
  const map = new Map();
  for (const row of rows) {
    const id = local(row.e);
    if (!map.has(id)) { map.set(id, new Set()); }
    if (row[column] !== undefined) { map.get(id).add(row[column]); }
  }
  return map;
};
const groupOf = (id) => GROUPS.find((g) => id.startsWith(g)) || 'Weitere';
const taxonomy = new Set(tei.categories.map((c) => c.id));
const inFilter = filterCategories(tei.categories);

await test('the RDF/XML is UTF-8 and declares the four prefixes of the domain ontology', () => {
  assert.match(rdf, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  for (const [prefix, iri] of [['ufbas', DATA], ['ufbas-ont', ONT], ['ufbas-kat', KAT], ['gams', GAMS]]) {
    assert.ok(rdf.includes(`xmlns:${prefix}="${iri}"`), `prefix ${prefix} not declared`);
  }
});

await test('every ufbas-ont: term of the data is declared in the ontology', () => {
  const declared = new Set(ontology.query(`SELECT DISTINCT ?t WHERE { ?t ?p ?o FILTER(STRSTARTS(STR(?t), "${ONT}")) }`).map((r) => r.get('t').value));
  const used = new Set(select(`SELECT DISTINCT ?t WHERE { { ?s ?t ?o } UNION { ?s ?p ?t } FILTER(STRSTARTS(STR(?t), "${ONT}")) }`).map((r) => r.t));
  assert.deepEqual([...used].filter((t) => !declared.has(t)), []);
});

await test('one entry per entry of the TEI reference and per fragment, part of the volume and documenting one proceeding', () => {
  const entries = select('SELECT ?e WHERE { ?e a ufbas-ont:Entry ; gams:isPartOf ufbas:Urfehdebuch-X . ufbas:Urfehdebuch-X a ufbas-ont:Volume }').map((r) => local(r.e));
  assert.deepEqual(entries.sort(), [...tei.entries.map((e) => e.id), ...fragments.keys()].sort());
  const documents = select('SELECT ?e (COUNT(?p) AS ?n) WHERE { ?e a ufbas-ont:Entry ; ufbas-ont:documents ?p . ?p a ufbas-ont:UrfehdeProceeding } GROUP BY ?e');
  assert.equal(documents.length, entries.length);
  assert.deepEqual(documents.filter((r) => r.n !== '1').map((r) => local(r.e)), []);
});

await test('every entry is on the page of its folio, and every page has one folio and one image number', () => {
  const folios = byEntry(select('SELECT ?e ?folio WHERE { ?e a ufbas-ont:Entry ; ufbas-ont:onPage/ufbas-ont:folio ?folio }'), 'folio');
  assert.deepEqual(tei.entries.filter((e) => !folios.get(e.id)?.has(e.folio)).map((e) => e.id), []);
  const pages = select('SELECT ?p (COUNT(DISTINCT ?f) AS ?nf) (COUNT(DISTINCT ?i) AS ?ni) WHERE { ?p a ufbas-ont:Page ; ufbas-ont:folio ?f ; ufbas-ont:imageNumber ?i } GROUP BY ?p');
  assert.equal(pages.length, select('SELECT ?p WHERE { ?p a ufbas-ont:Page }').length);
  assert.deepEqual(pages.filter((r) => r.nf !== '1' || r.ni !== '1').map((r) => local(r.p)), []);
});

// ?e is an entry that continues no other, ?f every entry that documents its proceeding
const OWN = '?e ufbas-ont:documents ?p FILTER NOT EXISTS { ?e ufbas-ont:continues ?host } ?f ufbas-ont:documents ?p .';

await test('offence, sanction and procedure categories of the proceeding and the keywords of the spans equal the TEI', () => {
  const parts = byEntry(select(`SELECT ?e ?c WHERE { ${OWN} ?p ufbas-ont:hasPart ?x . ?x ufbas-ont:category ?c }`), 'c');
  const keywords = byEntry(select(`SELECT ?e ?c WHERE { ${OWN} ?s a ufbas-ont:Span ; gams:isPartOf ?f ; ufbas-ont:category ?c FILTER(STRSTARTS(STR(?c), "${KAT}Schlagwort")) }`), 'c');
  const found = [];
  for (const entry of tei.entries) {
    const fromTei = new Set(entry.annotations.map((a) => a.category).filter((c) => inFilter.has(c)));
    const fromRdf = new Set([...(parts.get(entry.id) || []), ...(keywords.get(entry.id) || [])].map(local).filter((c) => inFilter.has(c)));
    for (const c of fromTei) { if (!fromRdf.has(c)) { found.push(`${entry.id} -${c}`); } }
    for (const c of fromRdf) { if (!fromTei.has(c)) { found.push(`${entry.id} +${c}`); } }
  }
  assert.deepEqual(found, []);
});

await test('the spans of an entry and its fragment keep every category the TEI codes in them', () => {
  const spans = byEntry(select(`SELECT ?e ?c WHERE { ${OWN} ?s a ufbas-ont:Span ; gams:isPartOf ?f ; ufbas-ont:category ?c }`), 'c');
  const found = [];
  for (const entry of tei.entries) {
    const fromTei = new Set(entry.annotations.map((a) => a.category));
    const fromRdf = new Set([...(spans.get(entry.id) || [])].map(local));
    for (const c of fromTei) { if (!fromRdf.has(c)) { found.push(`${entry.id} -${c}`); } }
    for (const c of fromRdf) { if (!fromTei.has(c)) { found.push(`${entry.id} +${c}`); } }
  }
  assert.deepEqual(found, []);
});

await test('the Urfehde date of the oath equals the TEI, and every coded Urfehde date is reached from its proceeding', () => {
  const dates = byEntry(select(`SELECT ?e ?d WHERE {
    ?e ufbas-ont:documents ?p .
    { ?p ufbas-ont:hasPart ?o . ?o ufbas-ont:hasTimeSpan ?t } UNION { ?p ufbas-ont:hasTimeSpan ?t }
    ?t ufbas-ont:category ufbas-kat:DatumUrfehde ; ufbas-ont:dateAsCoded ?d }`), 'd');
  assert.deepEqual(tei.entries.filter((e) => e.date ? !dates.get(e.id)?.has(e.date) : dates.has(e.id)).map((e) => e.id), []);
  assert.deepEqual(select(`SELECT ?t WHERE { ?t ufbas-ont:category ufbas-kat:DatumUrfehde ; ufbas-ont:derivedFrom/gams:isPartOf ?e
    FILTER NOT EXISTS { ?e ufbas-ont:documents ?p . { ?p ufbas-ont:hasPart ?o . ?o ufbas-ont:hasTimeSpan ?t } UNION { ?p ufbas-ont:hasTimeSpan ?t } } }`), []);
});

await test('the offenders of the proceeding and their gender composition equal the TEI', () => {
  const rows = select(`SELECT ?e ?o ?g WHERE { ?e ufbas-ont:documents ?p FILTER NOT EXISTS { ?e ufbas-ont:continues ?host }
    ?p ufbas-ont:hasOffender ?o . OPTIONAL { ?o ufbas-ont:gender ?g } }`);
  const offenders = new Map();
  for (const row of rows) {
    const id = local(row.e);
    if (!offenders.has(id)) { offenders.set(id, new Map()); }
    const genders = offenders.get(id);
    genders.set(row.o, [...(genders.get(row.o) || []), ...(row.g ? [{ male: 'm', female: 'f' }[local(row.g)]] : [])]);
  }
  const found = [];
  for (const entry of tei.entries) {
    const genders = offenders.get(entry.id) || new Map();
    if (genders.size !== entry.offenders.length) { found.push(`${entry.id} täter ${entry.offenders.length}/${genders.size}`); }
    const g1 = genderClass(entry.offenders.map((o) => o.gender || ''));
    const g2 = genderClass([...genders.values()].flat());
    if (g1 !== g2) { found.push(`${entry.id} geschlecht ${g1}/${g2}`); }
  }
  assert.deepEqual(found, []);
});

await test('the losses of the RDF of 2017 do not recur', () => {
  const offenders = (id) => select(`SELECT ?o ?g WHERE { ufbas:${id} ufbas-ont:documents ?p . ?p ufbas-ont:hasOffender ?o . OPTIONAL { ?o ufbas-ont:gender ?g } }`);
  const e124 = offenders('Eintrag-124');
  assert.equal(new Set(e124.map((r) => r.o)).size, 2);
  assert.deepEqual(e124.map((r) => local(r.g || '')).sort(), ['female', 'male']);
  for (const id of ['Eintrag-176', 'Eintrag-376']) {
    assert.deepEqual(offenders(id).filter((r) => r.g), [], `${id} offender has a gender`);
  }
  // the keywords the RDF of 2017 lost (knowledge/data.md)
  for (const [id, keyword] of [['Eintrag-25', 'SchlagwortWelsche'], ['Eintrag-161', 'SchlagwortKnecht'], ['Eintrag-239', 'SchlagwortJuden'],
    ['Eintrag-243', 'SchlagwortWirtshaus'], ['Eintrag-273', 'SchlagwortObersterKnecht'], ['Eintrag-354', 'SchlagwortDienstmagd'],
    ['Eintrag-535', 'SchlagwortArmut'], ['Eintrag-571', 'SchlagwortSpital'], ['Eintrag-620', 'SchlagwortKnecht'], ['Eintrag-620', 'SchlagwortWirtshaus']]) {
    assert.ok(store.query(`${PREFIXES}ASK { ?s gams:isPartOf ufbas:${id} ; ufbas-ont:category ufbas-kat:${keyword} }`), `${id} ${keyword}`);
  }
});

await test('every derived node points to a span, which has text unless its TEI element is empty, and belongs to an entry', () => {
  // a proceeding has no element of its own and is derived from the entry that documents it,
  // an amount outside any span from its entry, checked below
  assert.deepEqual(select(`SELECT ?n ?s WHERE { ?n ufbas-ont:derivedFrom ?s
    FILTER NOT EXISTS { ?s a ufbas-ont:Span } FILTER NOT EXISTS { ?s a ufbas-ont:Entry ; ufbas-ont:documents ?n }
    FILTER NOT EXISTS { ?s a ufbas-ont:Entry . ?n a ufbas-ont:MonetaryAmount } }`), []);
  // the TEI has annotated elements without content, whose spans have no text
  const empty = new Set([...edition.matchAll(/<(\w+)\b[^>]*\sxml:id="([^"]+)"[^>]*>\s*<\/\1>/g)].map((m) => m[2]));
  const textless = select('SELECT ?s WHERE { ?s a ufbas-ont:Span FILTER NOT EXISTS { ?s gams:textualContent ?t } }').map((r) => local(r.s));
  assert.deepEqual(textless.filter((id) => !empty.has(id)), []);
  assert.deepEqual(select('SELECT ?s WHERE { ?s a ufbas-ont:Span FILTER NOT EXISTS { ?s gams:isPartOf ?e . ?e a ufbas-ont:Entry } }'), []);
  // the derived classes, the shared places of the place list excepted
  const underived = select(`SELECT ?n ?c WHERE { ?n a ?c
    FILTER(?c IN (ufbas-ont:Offence, ufbas-ont:Sanction, ufbas-ont:Detention, ufbas-ont:Oath, ufbas-ont:Pardon, ufbas-ont:PriorInstance,
      ufbas-ont:ProceedingReference, ufbas-ont:ProceedingPart, ufbas-ont:PersonMention, ufbas-ont:TimeSpan, ufbas-ont:MarginalNote,
      ufbas-ont:MonetaryAmount))
    FILTER NOT EXISTS { ?n ufbas-ont:derivedFrom ?s } }`);
  assert.deepEqual(underived, []);
  assert.deepEqual(select('SELECT ?n WHERE { ?n a ufbas-ont:Place , ufbas-ont:Span }'), []);
});

await test('every category is one of the taxonomy, and its id prefix names its group', () => {
  const used = select('SELECT DISTINCT ?c WHERE { ?n ufbas-ont:category ?c }').map((r) => r.c);
  assert.deepEqual(used.filter((c) => !c.startsWith(KAT) || !taxonomy.has(local(c))), []);
  // the stylesheet reads the kind of a node from the prefix of its category id
  assert.deepEqual(tei.categories.filter((c) => groupOf(c.id) !== c.group).map((c) => `${c.id} ${c.group}`), []);
});

await test('an offence has an agent only where its entry names exactly one offender and no accomplice', () => {
  const rows = select(`SELECT ?o WHERE { ?e ufbas-ont:documents ?p . ?p ufbas-ont:hasPart ?o . ?o ufbas-ont:committedBy ?x .
    { SELECT ?p (COUNT(?t) AS ?n) WHERE { ?p ufbas-ont:hasOffender ?t } GROUP BY ?p }
    FILTER(?n != 1 || EXISTS { ?p ufbas-ont:hasAccomplice ?a } || NOT EXISTS { ?p ufbas-ont:hasOffender ?x }) }`);
  assert.deepEqual(rows, []);
});

await test('a place of the place list carries its modern name, a place of one mention or outside the list none', () => {
  // place/@xml:id and its placeName in back/listPlace, read from the TEI
  const listed = new Map(xpath(`//*:back//*:place/concat(@xml:id, '|', normalize-space(*:placeName[1]))`).map((r) => r.split('|')));
  const names = select('SELECT ?p ?name WHERE { ?p a ufbas-ont:Place . OPTIONAL { ?p ufbas-ont:placeName ?name } OPTIONAL { ?p ufbas-ont:derivedFrom ?s } FILTER(!BOUND(?s)) }');
  assert.ok(names.length > 0);
  assert.ok(names.some((r) => listed.has(local(r.p))));
  // a @ref to an id the place list lacks gives a place without a name
  assert.deepEqual(names.filter((r) => listed.get(local(r.p)) !== r.name).map((r) => `${local(r.p)} ${r.name}`), []);
  assert.deepEqual(select('SELECT ?p WHERE { ?p ufbas-ont:placeName ?n ; ufbas-ont:derivedFrom ?s }'), []);
  assert.deepEqual(select('SELECT ?p WHERE { ?p ufbas-ont:placeName ?a , ?b FILTER(?a != ?b) }'), []);
});

await test('an entry mentions every place of the place list it names, and its text keeps the marginal notes and leaves the editors\' notes out', () => {
  const named = xpath(`for $e in //*:div[@ana = '#uf_Eintrag'], $r in distinct-values($e//*:placeName[@ref][ancestor::*:div[@ana = '#uf_Eintrag'][1] is $e]/normalize-space(@ref))
    return concat($e/@xml:id, ' ', substring-after($r, '#'))`);
  const mentioned = select('SELECT ?e ?p WHERE { ?e ufbas-ont:mentionsPlace ?p }').map((r) => `${local(r.e)} ${local(r.p)}`);
  assert.ok(named.length > 0);
  assert.deepEqual(mentioned.sort(), named.sort());
  const text = (id) => select(`SELECT ?t WHERE { ufbas:${id} gams:textualContent ?t }`)[0].t;
  assert.ok(text('Eintrag-0').startsWith('Steck - 1 Bastean Doldter'), 'the marginal note of Eintrag-0');
  assert.ok(!text('Eintrag-4').includes('kommt in einem anderen Urfehdeverfahren vor'), 'the editors\' note of Eintrag-4');
});

await test('an amount outside any span is derived from its entry, one per currency measure of the TEI', () => {
  // a measure outside any span: no ancestor inside the entry has an xml:id with @ana or is a persName
  const outside = xpath(`for $m in //*:div[@ana = '#uf_Eintrag']//*:measure[@type = 'currency']
    [not(ancestor::*[@xml:id][@ana or self::*:persName][ancestor::*:div[@ana = '#uf_Eintrag']])]
    return string($m/ancestor::*:div[@ana = '#uf_Eintrag'][1]/@xml:id)`);
  const fromEntry = select('SELECT ?e WHERE { ?a a ufbas-ont:MonetaryAmount ; ufbas-ont:derivedFrom ?e . ?e a ufbas-ont:Entry }').map((r) => local(r.e));
  assert.ok(outside.length > 0);
  assert.deepEqual(fromEntry.sort(), outside.sort());
  const all = xpath(`count(//*:div[@ana = '#uf_Eintrag']//*:measure[@type = 'currency'])`)[0];
  assert.equal(select('SELECT (COUNT(?a) AS ?n) WHERE { ?a a ufbas-ont:MonetaryAmount }')[0].n, all);
});

await test('a span coded as a reference to another proceeding gives a ProceedingReference, and no part stays generic', () => {
  const refs = ['FrüheresUrfehdeverfahren', 'AnderesUrfehdeverfahren'];
  // one part per element and reference category, as for every kind of part
  const spans = xpath(`for $e in //*:div[@ana = '#uf_Eintrag']//*[@xml:id], $t in distinct-values(tokenize(normalize-space($e/@ana), ' '))
    [. = ('#uf_${refs[0]}', '#uf_${refs[1]}')] return concat('${DATA}', $e/@xml:id)`);
  const parts = select(`SELECT ?s WHERE { ?e ufbas-ont:documents ?p . ?p ufbas-ont:hasPart ?x . ?x a ufbas-ont:ProceedingReference ;
    ufbas-ont:derivedFrom ?s ; ufbas-ont:category ?c VALUES ?c { ${refs.map((c) => `ufbas-kat:${c}`).join(' ')} } }`).map((r) => r.s);
  assert.ok(spans.length > 0);
  assert.deepEqual(parts.sort(), spans.sort());
  assert.deepEqual(select('SELECT ?x WHERE { ?x a ufbas-ont:ProceedingPart }'), []);
});

await test('every entry has the type of research-artefacts/entry-types.tsv, and a regular Urfehde where the table lists none', () => {
  const curated = new Map(entryTypes.map((r) => [r.entry, r.type.startsWith('fragment') ? 'fortsetzung'
    : r.type.startsWith('Urfehde') ? 'urfehde' : r.type.toLowerCase()]));
  const types = select('SELECT ?e ?t WHERE { ?e a ufbas-ont:Entry ; ufbas-ont:entryType ?t }');
  assert.equal(types.length, tei.entries.length + fragments.size);
  assert.deepEqual(types.filter((r) => local(r.t) !== (curated.get(local(r.e)) || 'urfehde')).map((r) => `${local(r.e)} ${local(r.t)}`), []);
});

await test('a fragment continues the entry its note cites and documents that entry\'s proceeding', () => {
  const rows = select('SELECT ?e ?h ?p ?q WHERE { ?e ufbas-ont:continues ?h ; ufbas-ont:documents ?p . ?h ufbas-ont:documents ?q }');
  assert.deepEqual(rows.map((r) => `${local(r.e)} ${local(r.h)}`).sort(), [...fragments].map(([f, h]) => `${f} ${h}`).sort());
  assert.deepEqual(rows.filter((r) => r.p !== r.q).map((r) => local(r.e)), []);
});

// Every citation of research-artefacts/editorial-crossrefs.tsv, and nothing else: a note on
// another proceeding links the two proceedings, a statement or continuation the two entries.
await test('the editors\' cross-references resolve to the entries of research-artefacts/editorial-crossrefs.tsv', () => {
  const proceeding = (id) => local(select(`SELECT ?p WHERE { ufbas:${id} ufbas-ont:documents ?p }`)[0].p);
  const expected = new Set(crossrefs.filter((r) => r.kind === 'person' && proceeding(r.source_entry) !== proceeding(r.target_entry))
    .map((r) => `${proceeding(r.source_entry)} ${proceeding(r.target_entry)}`));
  const found = new Set(select('SELECT ?a ?b WHERE { ?a ufbas-ont:refersToProceeding ?b }').map((r) => `${local(r.a)} ${local(r.b)}`));
  assert.ok(expected.size > 0);
  assert.deepEqual([...found].filter((x) => !expected.has(x)), [], 'links the table does not have');
  assert.deepEqual([...expected].filter((x) => !found.has(x)), [], 'links of the table missing');
  const related = select('SELECT ?a ?b WHERE { ?a ufbas-ont:relatedEntry ?b }').map((r) => `${local(r.a)} ${local(r.b)}`).sort();
  assert.deepEqual(related, crossrefs.filter((r) => r.kind !== 'person').map((r) => `${r.source_entry} ${r.target_entry}`).sort());
});

// The person links come from the same notes. Each joins two mentions of entries whose
// proceedings the notes link, with a name word in common, compared by its first four letters
// since the spelling varies (Hodell and Hodels), and the sample below was read in both
// entries of the TEI.
await test('a candidate person link joins mentions of linked proceedings that share a name', () => {
  const words = (name) => new Set(name.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().split(/[^\p{L}]+/u)
    .filter((w) => w.length >= 4).map((w) => w.slice(0, 4)));
  const rows = select(`SELECT ?a ?b ?na ?nb ?pa ?pb WHERE { ?a ufbas-ont:possiblySameAs ?b .
    ?a ufbas-ont:nameAsWritten ?na ; ufbas-ont:derivedFrom/gams:isPartOf/ufbas-ont:documents ?pa .
    ?b ufbas-ont:nameAsWritten ?nb ; ufbas-ont:derivedFrom/gams:isPartOf/ufbas-ont:documents ?pb }`);
  assert.ok(rows.length > 300, `${rows.length} links`);
  const linked = new Set(select('SELECT ?a ?b WHERE { ?a ufbas-ont:refersToProceeding ?b }').map((r) => `${r.a} ${r.b}`));
  assert.deepEqual(rows.filter((r) => !linked.has(`${r.pa} ${r.pb}`)).map((r) => `${local(r.a)} ${local(r.b)}`), [], 'link outside a linked pair of proceedings');
  assert.deepEqual(rows.filter((r) => ![...words(r.na)].some((w) => words(r.nb).has(w))).map((r) => `${r.na} / ${r.nb}`), []);
  assert.deepEqual(select('SELECT ?a WHERE { ?a ufbas-ont:possiblySameAs ?a }'), []);
  for (const [a, b] of [['PersonTäter-4', 'PersonTäter-360'], ['PersonTäter-668', 'PersonTäter-672'], ['PersonTäter-367', 'PersonMittäter-64'],
    ['PersonTäter-684', 'PersonTäter-686'], ['PersonOpfer-143', 'PersonTäter-368']]) {
    assert.ok(store.query(`${PREFIXES}ASK { ufbas:person-${a} ufbas-ont:possiblySameAs|^ufbas-ont:possiblySameAs ufbas:person-${b} }`), `${a} ${b}`);
  }
});

// The contradictions of knowledge/data.md, section Data quality, with the readings it gives,
// and Eintrag-513, which the weekday rule found beyond them.
await test('the coded dates that contradict their written form or their entry carry the conflict and the suggestion of knowledge/data.md', () => {
  const rows = select(`SELECT ?s ?k ?d WHERE { ?t ufbas-ont:dateConflict ?k ; ufbas-ont:derivedFrom ?s . OPTIONAL { ?t ufbas-ont:dateSuggested ?d } }`)
    .map((r) => `${local(r.s)} ${local(r.k)} ${r.d || ''}`.trim()).sort();
  assert.deepEqual(rows, [
    'DatumFrist-19 yearOutsideBook 1567-10-18',
    'DatumTat-23 deedAfterOath',
    'DatumTat-36 yearOutsideBook 1565-12-25',
    'DatumTat-37 deedAfterOath',
    'DatumUrfehde-146 writtenDateConfirmed 1565-05-24',
    'DatumUrfehde-223 writtenDateConfirmed 1565-10-24',
    'DatumUrfehde-248 writtenDateConfirmed 1566-01-05',
    'DatumUrfehde-257 writtenDateConfirmed 1566-02-16',
    'DatumUrfehde-261 writtenDateConfirmed 1566-02-20',
    'DatumUrfehde-464 writtenDateConfirmed 1568-05-26',
    'DatumUrfehde-478 writtenDateDiffers',
    'DatumUrfehde-493 writtenDateConfirmed 1568-08-07',
    'DatumUrfehde-501 writtenDateConfirmed 1568-09-09',
    'DatumUrfehde-523 writtenDateDiffers',
    'DatumUrfehde-524 codedDateConfirmed',
    'DatumUrfehde-608 writtenDateDiffers',
    'DatumUrfehde-96 codedDateConfirmed'
  ].sort());
  // the published value stays beside the suggestion
  assert.deepEqual(select('SELECT ?t WHERE { ?t ufbas-ont:dateSuggested ?d FILTER NOT EXISTS { ?t ufbas-ont:dateAsCoded ?c } }'), []);
});

await test('the example entry in ontology/ is the current derivation of Eintrag-0', async () => {
  const committed = oxigraph.parse(readFileSync(exampleFile, 'utf8'), { format: 'application/rdf+xml' }).map(String);
  const fresh = new Set((await exampleStore()).match().map(String));
  assert.ok(committed.length > 100);
  assert.deepEqual(committed.filter((t) => !fresh.has(t)).concat([...fresh].filter((t) => !committed.includes(t))), [],
    `${exampleFile} differs from the derivation, run node derive-rdf.mjs and review the difference`);
});

// Story "offence and sanction" of the specification, flat on the new RDF: the entries with
// a theft and a banishment, one join over the proceeding without property paths.
const theftAndBanishment = `SELECT (COUNT(DISTINCT ?entry) AS ?n) WHERE {
  ?entry ufbas-ont:documents ?proceeding .
  ?proceeding ufbas-ont:hasPart ?offence , ?sanction .
  ?offence a ufbas-ont:Offence ; ufbas-ont:category ufbas-kat:TatDiebstahl .
  ?sanction a ufbas-ont:Sanction ; ufbas-ont:category ufbas-kat:StrafeAusweisung .
}`;

await test('the story offence and sanction is one flat query and counts the entries of the TEI', () => {
  // no path operator at all, the query has no IRI in angle brackets that could hold a slash
  assert.ok(!/[*+/|^]/.test(theftAndBanishment), 'the query uses a property path');
  const expected = tei.entries.filter((e) => ['TatDiebstahl', 'StrafeAusweisung'].every((c) => e.annotations.some((a) => a.category === c))).length;
  assert.ok(expected > 0);
  assert.equal(Number(select(theftAndBanishment)[0].n), expected);
});

done();
