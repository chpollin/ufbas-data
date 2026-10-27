// ufbas-TORDF-ontology.xsl, run on the taxonomy, derives the SKOS scheme of the taxonomy
// Urfehdekodierung. Its concepts have to stay at the IRIs of the published RDF, mirror the nesting of the
// taxonomy, and cover every category the edition codes with. The sanction groups and
// colour classes are written out in the stylesheet, so they are compared with
// ufbas-context.xsl and js/exploration.js, which the pages read.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { JSDOM } from 'jsdom';
import { GAMS, fetchCached, root, dataRoot } from '../gams.mjs';
import { taxonomySKOS } from '../derive-rdf.mjs';
import { oxigraph, rows, runner } from './lib.mjs';

const KAT = 'http://gams.uni-graz.at/ufbas/#';
const SCHEME = `${KAT}Urfehdekodierung`;
const PREFIXES = 'PREFIX skos: <http://www.w3.org/2004/02/skos/core#>\n';

const store = new oxigraph.Store();
store.load(await taxonomySKOS(), { format: 'application/rdf+xml', base_iri: 'http://gams.uni-graz.at/' });
const select = (query) => rows(store.query(PREFIXES + query));
const values = (query, name) => select(query).map((row) => row[name]);

const xml = (file) => new JSDOM(readFileSync(resolve(file.endsWith('.xsl') ? root : dataRoot, file), 'utf8'), { contentType: 'application/xml' }).window.document;
const taxonomy = [...xml('tei/ufbas.kategorien.xml').getElementsByTagName('taxonomy')].find((t) => t.getAttribute('xml:id') === 'Urfehdekodierung');
const categories = [...taxonomy.getElementsByTagName('category')];
const iri = (category) => KAT + category.getAttribute('xml:id').replace(/^uf_/, '');
const text = (category, name) => (category.querySelector(`:scope > catDesc > ${name}`)?.textContent || '').replace(/\s+/g, ' ').trim();
const concepts = new Set(values('SELECT ?c WHERE { ?c a skos:Concept ; skos:inScheme <' + SCHEME + '> }', 'c'));

const { test, done } = runner('skos', 'checks');

await test('every category is one concept of the scheme at its IRI, and nothing else is', () => {
  const ids = categories.map(iri);
  assert.equal(new Set(ids).size, ids.length, 'duplicate category ids');
  assert.deepEqual([...concepts].sort(), [...ids].sort());
  assert.deepEqual(values('SELECT ?c WHERE { ?c a skos:Concept }', 'c').sort(), [...ids].sort());
});

// the published RDF of o:ufbas.kategorien, fetched once into cache/ like test/rdf.test.mjs
await test('the concepts are those of the published taxonomy RDF', async () => {
  const published = new oxigraph.Store();
  published.load((await fetchCached(`${GAMS}/archive/objects/o:ufbas.kategorien/datastreams/RDF/content`)).body,
    { format: 'application/rdf+xml', base_iri: 'http://gams.uni-graz.at/', lenient: true });
  const old = published.query(PREFIXES + 'SELECT ?c WHERE { ?c a skos:Concept }').map((row) => row.get('c').value);
  assert.deepEqual([...concepts].sort(), old.sort());
});

// Eintrag and Eingangsnotiz have no catDesc; their label is their id, as in o:ufbas.schema.
await test('the prefLabel of every concept is its term, or its id where the taxonomy gives none', () => {
  const labels = new Map(select('SELECT ?c ?l WHERE { ?c skos:prefLabel ?l FILTER(lang(?l) = "de") }').map((r) => [r.c, r.l]));
  const counts = select('SELECT ?c (COUNT(?l) AS ?n) WHERE { ?c a skos:Concept ; skos:prefLabel ?l } GROUP BY ?c');
  assert.deepEqual(counts.filter((r) => r.n !== '1').map((r) => r.c), []);
  const wrong = categories.filter((c) => labels.get(iri(c)) !== (text(c, 'term') || c.getAttribute('xml:id').replace(/^uf_/, '')));
  assert.deepEqual(wrong.map(iri), []);
});

// The nine glosses of knowledge/domain.md that carry a coding rule beside the definition,
// in parentheses that name another category or a Tatbestand.
const RULES = ['TatUngehorsam', 'TatWiderstandgegenObrigkeit', 'TatBeihilfe', 'TatUnzucht', 'TatLeichtfertigkeit',
  'SchlagwortAndrohungTodesstrafe', 'StrafeVerbot', 'StrafeWiedergutmachung', 'SchlagwortSchulden'];

await test('the definition is the gloss wherever it differs from the term, its coding rule moved to the scope note', () => {
  const definitions = new Map(select('SELECT ?c ?d WHERE { ?c skos:definition ?d FILTER(lang(?d) = "de") }').map((r) => [r.c, r.d]));
  const notes = new Map(select('SELECT ?c ?n WHERE { ?c skos:scopeNote ?n FILTER(lang(?n) = "de") }').map((r) => [r.c, r.n]));
  assert.equal(select('SELECT ?n WHERE { ?c skos:scopeNote ?n }').length, notes.size, 'a concept with two scope notes');
  assert.deepEqual([...notes.keys()].sort(), RULES.map((id) => KAT + id).sort());
  // the gloss without the parenthesis of its rule is the definition, so no word is lost
  const expected = new Map(categories.filter((c) => text(c, 'gloss') && text(c, 'gloss') !== text(c, 'term')).map((c) => [iri(c),
    notes.has(iri(c)) ? text(c, 'gloss').replace(` (${notes.get(iri(c))})`, '') : text(c, 'gloss')]));
  assert.deepEqual([...definitions].sort(), [...expected].sort());
  assert.deepEqual([...notes].filter(([c, n]) => !text(categories.find((k) => iri(k) === c), 'gloss').includes(`(${n})`)), []);
});

await test('broader, narrower and top concepts follow the nesting of the taxonomy', () => {
  const broader = select('SELECT ?c ?b WHERE { ?c skos:broader ?b }').map((r) => `${r.c} ${r.b}`).sort();
  const narrower = select('SELECT ?c ?b WHERE { ?b skos:narrower ?c }').map((r) => `${r.c} ${r.b}`).sort();
  const nested = categories.filter((c) => c.parentElement.localName === 'category').map((c) => `${iri(c)} ${iri(c.parentElement)}`).sort();
  assert.deepEqual(broader, nested);
  assert.deepEqual(narrower, nested);
  const top = categories.filter((c) => c.parentElement === taxonomy).map(iri).sort();
  assert.deepEqual(values(`SELECT ?c WHERE { <${SCHEME}> skos:hasTopConcept ?c }`, 'c').sort(), top);
  assert.deepEqual(values(`SELECT ?c WHERE { ?c skos:topConceptOf <${SCHEME}> }`, 'c').sort(), top);
  assert.deepEqual(values('SELECT ?s WHERE { ?s a skos:ConceptScheme }', 's'), [SCHEME]);
});

await test('neither skos:defintion nor skos:Schema appears', () => {
  const terms = values('SELECT DISTINCT ?t WHERE { { ?s ?t ?o } UNION { ?s a ?t } }', 't');
  assert.deepEqual(terms.filter((t) => /skos\/core#(defintion|Schema)$/.test(t)), []);
});

await test('every collection member is a concept of the scheme', () => {
  const members = select('SELECT ?k ?m WHERE { ?k a skos:Collection ; skos:member ?m }');
  assert.ok(members.length > 0);
  assert.deepEqual(members.filter((r) => !concepts.has(r.m)).map((r) => `${r.k} ${r.m}`), []);
});

const collection = (key) => ({
  label: values(`SELECT ?l WHERE { <${KAT}${key}> a skos:Collection ; skos:prefLabel ?l }`, 'l')[0],
  members: values(`SELECT ?m WHERE { <${KAT}${key}> skos:member ?m }`, 'm').map((m) => m.slice(KAT.length)).sort()
});

await test('the sanction-group collections equal $sanctionGroups of ufbas-context.xsl', () => {
  const variable = [...xml('ufbas-context.xsl').getElementsByTagNameNS('http://www.w3.org/1999/XSL/Transform', 'variable')]
    .find((v) => v.getAttribute('name') === 'sanctionGroups');
  const groups = [...variable.children].map((g) => ({ key: g.getAttribute('key'), label: g.getAttribute('label'), members: g.getAttribute('members').split(' ').sort() }));
  assert.equal(groups.length, 4);
  for (const g of groups) { assert.deepEqual(collection(`collection-${g.key}`), { label: g.label, members: g.members }, g.key); }
  assert.deepEqual(values('SELECT ?k WHERE { ?k a skos:Collection FILTER(STRSTARTS(STR(?k), "' + KAT + 'collection-")) }', 'k').length, groups.length);
});

// CLASSES is an array literal of plain values, evaluated on its own without the view.
await test('the colour-class collections equal CLASSES of js/exploration.js', () => {
  const source = readFileSync(resolve(root, 'js/exploration.js'), 'utf8');
  const literal = /var CLASSES = (\[[\s\S]*?\n\s*\]);/.exec(source)[1];
  // through JSON, since strict equality also compares the prototypes of the other context
  const classes = JSON.parse(JSON.stringify(runInNewContext(literal)));
  const strafe = categories.find((c) => c.getAttribute('xml:id') === 'uf_Strafe');
  const classified = classes.flatMap((c) => c.members);
  // "ohne" is the class of entries without any other class, so its categories are the
  // Strafe categories in no other class
  const rest = [...strafe.getElementsByTagName('category')].map((c) => c.getAttribute('xml:id').replace(/^uf_/, '')).filter((id) => !classified.includes(id));
  for (const c of classes) {
    const members = (c.key === 'ohne' ? rest : c.members).slice().sort();
    assert.deepEqual(collection(`klasse-${c.key}`), { label: c.label, members }, c.key);
    assert.deepEqual(values(`SELECT ?l WHERE { <${KAT}klasse-${c.key}> skos:altLabel ?l }`, 'l'), c.short ? [c.short] : [], c.key);
  }
  assert.deepEqual(values('SELECT ?k WHERE { ?k a skos:Collection FILTER(STRSTARTS(STR(?k), "' + KAT + 'klasse-")) }', 'k').length, classes.length);
});

await test('every category the edition codes with in @ana is a concept of the scheme', () => {
  const used = new Set();
  for (const element of xml('tei/ufbas.1563.xml').querySelectorAll('[ana]')) {
    for (const token of element.getAttribute('ana').split(/\s+/)) { if (token.startsWith('#uf_')) { used.add(KAT + token.slice(4)); } }
  }
  assert.ok(used.size > 0);
  assert.deepEqual([...used].filter((c) => !concepts.has(c)), []);
});

done();
