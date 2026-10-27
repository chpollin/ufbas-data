// The domain ontology, its RDF/XML for GAMS, and the SHACL shapes that hold the refactored
// RDF and the SKOS of the taxonomy to it (knowledge/domain.md, section Domain ontology).
//
// SHACL engine: rdf-validate-shacl, a Node package on the RDF/JS stack, with Oxigraph,
// already used by sparql.mjs, as the parser. pyShacl would add a Python step to a Node
// harness, the second toolchain ADR-21 argued against. shacl-engine would bring SPARQL
// constraints, at the price of Comunica and an install several times larger. The shapes
// therefore stay in SHACL Core, and the one rule Core cannot state, that the data use no
// predicate or class outside ufbas-ont:, gams: and rdf:type, is a SPARQL query below.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import SHACLValidator from 'rdf-validate-shacl';
import { here, root } from '../gams.mjs';
import { ontologyRDF, taxonomySKOS } from '../derive-rdf.mjs';
import { jsonldFile, ontologyJSONLD, ontologyRDFXML, ontologyStore, outFile, relabelBlankNodes, shapesQuads as canonicalShapes, shapesRDFXML, shapesRdfFile, ttlFile } from '../make-ontology.mjs';
import { oxigraph, rows as answer, runner } from './lib.mjs';

const ONT = 'https://gams.uni-graz.at/o:ufbas.ontology#';
const DATA = 'http://gams.uni-graz.at/o:ufbas.1563';
const RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
const RDFS = 'http://www.w3.org/2000/01/rdf-schema#';
const OWL = 'http://www.w3.org/2002/07/owl#';
const ALIGNED = ['http://www.cidoc-crm.org/cidoc-crm/', 'https://www.ica.org/standards/RiC/ontology#',
  'http://www.w3.org/ns/prov#', 'http://www.w3.org/2004/02/skos/core#', 'http://gams.uni-graz.at/o:gams-ontology#', OWL];
const PREFIXES = `PREFIX rdf: <${RDF}> PREFIX rdfs: <${RDFS}> PREFIX owl: <${OWL}> PREFIX ufbas-ont: <${ONT}>`;

const { test, done } = runner('ontology', 'checks');

const fixture = (name) => readFileSync(resolve(here, 'test/fixtures', name), 'utf8');
const rows = (store, query) => answer(store.query(`${PREFIXES} ${query}`));
const ntriples = (quads) => new Set(quads.map(String));

// Quads come from oxigraph.parse, not from a Store, which folds xsd:nonNegativeInteger and
// the other derived integer types into xsd:integer and would hide them from sh:datatype.
// A Store is built only where SPARQL is needed.
const load = (parts) => parts.flatMap(([text, format]) => oxigraph.parse(text, { format }));

const ontologyQuads = load([[readFileSync(ttlFile, 'utf8'), 'text/turtle']]);
const ontology = ontologyStore();
const shapesQuads = load([[readFileSync(resolve(root, 'data/ontology/ufbas.shapes.ttl'), 'utf8'), 'text/turtle']]);
const shapesStore = new oxigraph.Store(shapesQuads);
const validator = new SHACLValidator(shapesQuads);

// the data graph of a validation holds the ontology, since sh:class follows rdfs:subClassOf there
async function validate(quads) {
  const report = await validator.validate(validator.factory.dataset([...quads, ...ontologyQuads]));
  return report.results.map((r) => ({ focus: r.focusNode?.value, path: r.path?.value, severity: r.severity?.value.replace(/^.*#/, ''),
    message: r.message.map((m) => m.value).join(' ') }));
}

// Core cannot select nodes by namespace, so this is the closed-world check across all data nodes
function foreignTerms(quads) {
  return rows(new oxigraph.Store(quads), `SELECT DISTINCT ?term WHERE {
    { ?s ?term ?o FILTER (?term != rdf:type && !STRSTARTS(STR(?term), "${ONT}") && !STRSTARTS(STR(?term), "http://gams.uni-graz.at/o:gams-ontology#")) }
    UNION { ?s rdf:type ?term FILTER (!STRSTARTS(STR(?term), "${ONT}")) }
    FILTER (STRSTARTS(STR(?s), "${DATA}")) }`).map((r) => r.term);
}

await test('the ontology parses and declares every ufbas-ont: term it uses', () => {
  assert.ok(ontologyQuads.length > 0);
  const used = new Set(ontologyQuads.flatMap((q) => [q.subject, q.predicate, q.object]).filter((t) => t.termType === 'NamedNode' && t.value.startsWith(ONT)).map((t) => t.value));
  const declared = new Set(rows(ontology, `SELECT ?t WHERE { { ?t a ?k VALUES ?k { owl:Class owl:ObjectProperty owl:DatatypeProperty } } UNION { ?t a ?c . ?c a owl:Class } }`).map((r) => r.t));
  assert.deepEqual([...used].filter((t) => !declared.has(t)), [], 'ufbas-ont: terms used but not declared as class, property or individual');
});

await test('every class and property has a German and an English label', () => {
  const missing = rows(ontology, `SELECT ?t ?lang WHERE {
    ?t a ?k VALUES ?k { owl:Class owl:ObjectProperty owl:DatatypeProperty } VALUES ?lang { "de" "en" }
    FILTER NOT EXISTS { ?t rdfs:label ?l FILTER (LANG(?l) = ?lang) } }`).map((r) => `${r.t.replace(ONT, 'ufbas-ont:')}@${r.lang}`);
  assert.deepEqual(missing, []);
});

await test('every superclass and superproperty outside ufbas-ont: is one of CRM, RiC, PROV, SKOS, GAMS or OWL', () => {
  const foreign = rows(ontology, 'SELECT ?t WHERE { ?s rdfs:subClassOf|rdfs:subPropertyOf ?t }').map((r) => r.t)
    .filter((t) => !t.startsWith(ONT) && !ALIGNED.some((ns) => t.startsWith(ns)));
  assert.deepEqual(foreign, []);
});

await test('ufbas.ontology.rdf is the graph of ufbas.ontology.ttl', () => {
  const committed = ntriples(load([[readFileSync(outFile, 'utf8'), 'application/rdf+xml']]));
  const fresh = ntriples(load([[ontologyRDFXML(), 'application/rdf+xml']]));
  const ttl = ntriples(ontologyQuads);
  assert.deepEqual([...fresh].filter((t) => !ttl.has(t)), [], 'the conversion changes the graph');
  const differ = [...committed].filter((t) => !fresh.has(t)).concat([...fresh].filter((t) => !committed.has(t)));
  assert.deepEqual(differ, [], `${outFile} differs from ${ttlFile}, run node make-ontology.mjs and review the difference`);
});

// The page of the ontology offers JSON-LD and reads the shapes as RDF/XML, so both derived
// files have to be the graphs of their Turtle sources, and a fresh conversion has to give
// the committed file. The blank nodes of the shapes are compared by their canonical labels.
await test('ufbas.ontology.jsonld is the graph of ufbas.ontology.ttl', () => {
  const committed = ntriples(load([[readFileSync(jsonldFile, 'utf8'), 'application/ld+json']]));
  const fresh = ntriples(load([[ontologyJSONLD(), 'application/ld+json']]));
  const ttl = ntriples(ontologyQuads);
  const differ = (a, b) => [...a].filter((t) => !b.has(t)).concat([...b].filter((t) => !a.has(t)));
  assert.deepEqual(differ(fresh, ttl), [], 'the conversion changes the graph');
  assert.deepEqual(differ(committed, fresh), [], `${jsonldFile} differs from ${ttlFile}, run node make-ontology.mjs and review the difference`);
});

await test('ufbas.shapes.rdf is the graph of ufbas.shapes.ttl', () => {
  const committed = ntriples(relabelBlankNodes(load([[readFileSync(shapesRdfFile, 'utf8'), 'application/rdf+xml']])));
  const fresh = ntriples(relabelBlankNodes(load([[shapesRDFXML(), 'application/rdf+xml']])));
  const ttl = ntriples(canonicalShapes());
  const differ = (a, b) => [...a].filter((t) => !b.has(t)).concat([...b].filter((t) => !a.has(t)));
  assert.deepEqual(differ(fresh, ttl), [], 'the conversion changes the graph');
  assert.deepEqual(differ(committed, fresh), [], `${shapesRdfFile} differs from the shapes in Turtle, run node make-ontology.mjs and review the difference`);
});

await test('the units of the monetary amount shape are the currency units of the ontology', () => {
  const declared = rows(ontology, 'SELECT ?u WHERE { ?u a ufbas-ont:CurrencyUnit }').map((r) => r.u).sort();
  const inShape = rows(shapesStore, `PREFIX sh: <http://www.w3.org/ns/shacl#>
    SELECT ?u WHERE { ?p sh:path ufbas-ont:unitAsWritten ; sh:in/rdf:rest*/rdf:first ?u }`).map((r) => r.u).sort();
  assert.deepEqual(inShape, declared);
});

const eintrag0 = () => load([[fixture('eintrag-0.ttl'), 'text/turtle'], [fixture('eintrag-0.skos.ttl'), 'text/turtle']]);

await test('Eintrag-0 in the target model conforms to the shapes and uses only ufbas-ont:, gams: and rdf:type', async () => {
  const data = eintrag0();
  assert.deepEqual(foreignTerms(data), []);
  assert.deepEqual(await validate(data), []);
});

// Each case changes one statement of Eintrag-0 and has to fail with exactly its message and severity.
const PRE = `@prefix ufbas: <${DATA}#> . @prefix ufbas-ont: <${ONT}> . @prefix ufbas-kat: <http://gams.uni-graz.at/ufbas/#> .
  @prefix xsd: <http://www.w3.org/2001/XMLSchema#> . `;
const BROKEN = [
  { name: 'an offence with a Strafe category', node: 'offence-TatBetrug-0', property: `${ONT}category`,
    add: 'ufbas:offence-TatBetrug-0 ufbas-ont:category ufbas-kat:StrafeErmahnung .',
    expect: [['Violation', 'The category of an offence lies under ufbas-kat:Tat.']] },
  { name: 'a date typed xsd:date', node: 'time-DatumUrfehde-0', property: `${ONT}dateAsCoded`,
    add: 'ufbas:time-DatumUrfehde-0 ufbas-ont:dateAsCoded "1563-01-03"^^xsd:date .',
    expect: [['Violation', 'A date as coded is one xsd:string of the form YYYY, YYYY-MM or YYYY-MM-DD, never an xsd:date.']] },
  { name: 'an unknown unit', node: 'amount-TatBetrug-0-1', property: `${ONT}unitAsWritten`,
    add: 'ufbas:amount-TatBetrug-0-1 ufbas-ont:unitAsWritten ufbas-ont:unit-kreuzer .',
    expect: [['Violation', 'A monetary amount has at most one unit as written, a currency unit declared in the ontology.']] },
  // an empty TEI element is a fact of the published edition, so this one is a warning
  { name: 'a span without text', node: 'TatBetrug-0', property: 'http://gams.uni-graz.at/o:gams-ontology#textualContent',
    add: '', expect: [['Warning', 'A span has no gams:textualContent, since its TEI element is empty.']] }
];
for (const c of BROKEN) {
  await test(`the shapes reject ${c.name}`, async () => {
    const all = eintrag0();
    const kept = all.filter((q) => !(q.subject.value === `${DATA}#${c.node}` && q.predicate.value === c.property));
    // a renamed node would leave the fixture unchanged and the case would test nothing
    assert.equal(all.length - kept.length, 1, `the fixture has no single ${c.property} on ${c.node}`);
    assert.deepEqual((await validate(kept.concat(load([[PRE + c.add, 'text/turtle']])))).map((r) => [r.severity, r.message]), c.expect);
  });
}

// Facts of the published TEI that the derivation keeps and the shapes report as warnings,
// documented in knowledge/data.md: annotated elements without content, Eintrag-439, which
// breaks off before any coded part, and currency measures without @quantity or @unit. The
// counts are exact, so a new such fact in the TEI turns the test red until it is documented.
const WARNINGS = {
  'A span has no gams:textualContent, since its TEI element is empty.': 27,
  'A proceeding has no part, since its entry codes none.': 1,
  'A monetary amount has no quantity, since its measure has no @quantity.': 3,
  'A monetary amount has no unit, since its measure has no @unit.': 3
};

// Last, since it needs the derivations of the other two modules: the whole refactored RDF
// with the SKOS of the taxonomy and the ontology in one graph. Conformance means no
// sh:Violation, the warnings are the known facts above.
await test('the refactored RDF and the SKOS conform to the shapes, with the known warnings of the TEI', async () => {
  const data = load([[await ontologyRDF(), 'application/rdf+xml']]);
  const skos = load([[await taxonomySKOS(), 'application/rdf+xml']]);
  const found = foreignTerms(data).map((t) => `outside ufbas-ont:, gams: and rdf:type: ${t}`);
  // one line per message, with its count and the first node, so a systematic defect reads as one
  const byMessage = new Map();
  const warnings = {};
  for (const r of await validate([...data, ...skos])) {
    if (r.severity === 'Warning') { warnings[r.message] = (warnings[r.message] || 0) + 1; continue; }
    const seen = byMessage.get(r.message) || { count: 0, first: `${r.focus} ${r.path || ''}` };
    byMessage.set(r.message, { ...seen, count: seen.count + 1 });
  }
  for (const [message, { count, first }] of byMessage) { found.push(`${count}x ${message} First: ${first}`); }
  assert.ok(found.length === 0, `\n  ${found.slice(0, 20).join('\n  ')}`);
  assert.deepEqual(warnings, WARNINGS);
});

done();
