// The page "Ontologie" (mode=ontologie of ufbas-context.xsl) against the ontology in
// data/ontology/: every class, property and individual has its anchor, the diagram draws
// every class once as a node and every object property with domain and range among the
// classes as an edge, every in-page link resolves, and every download is a served file.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { JSDOM } from 'jsdom';
import { here, root } from '../gams.mjs';
import { ttlFile } from '../make-ontology.mjs';
import { oxigraph, rows, runner } from './lib.mjs';

const ONT = 'https://gams.uni-graz.at/o:ufbas.ontology#';
const store = new oxigraph.Store();
store.load(readFileSync(ttlFile, 'utf8'), { format: 'text/turtle' });
const select = (query) => rows(store.query(`PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
  PREFIX owl: <http://www.w3.org/2002/07/owl#> ${query}`));
const local = (iri) => iri.slice(ONT.length);

const doc = new JSDOM(readFileSync(resolve(here, 'build', 'ontologie.html'), 'utf8')).window.document;
const classes = select('SELECT DISTINCT ?t WHERE { ?t a owl:Class }').map((r) => r.t).filter((t) => t.startsWith(ONT));

const { test, done } = runner('ontology-page', 'checks');

test('every class, property and individual of the ontology has its anchor in its section', () => {
  const sections = { klassen: 'owl:Class', objekteigenschaften: 'owl:ObjectProperty', datentypeigenschaften: 'owl:DatatypeProperty' };
  for (const [section, type] of Object.entries(sections)) {
    const terms = select(`SELECT DISTINCT ?t WHERE { ?t a ${type} }`).map((r) => r.t).filter((t) => t.startsWith(ONT)).map(local).sort();
    const anchors = [...doc.querySelectorAll(`section[aria-labelledby="${section}"] .onto-term`)].map((s) => s.id).sort();
    assert.deepEqual(anchors, terms, section);
  }
  const individuals = select('SELECT DISTINCT ?t WHERE { ?t a ?c . ?c a owl:Class }').map((r) => r.t).filter((t) => t.startsWith(ONT)).map(local).sort();
  assert.deepEqual([...doc.querySelectorAll('section[aria-labelledby="individuen"] .onto-term')].map((s) => s.id).sort(), individuals, 'individuen');
});

test('the diagram draws every class once and every object property between classes as an edge', () => {
  const svg = doc.querySelector('.onto-model svg');
  assert.ok(svg, 'no diagram');
  const nodes = [...svg.querySelectorAll('a.onto-node')];
  const solid = nodes.filter((a) => !a.getAttribute('class').includes('onto-node-ref')).map((a) => a.getAttribute('href').slice(1)).sort();
  assert.deepEqual(solid, classes.map(local).sort());
  const edges = select(`SELECT DISTINCT ?p WHERE { ?p a owl:ObjectProperty ; rdfs:domain ?d ; rdfs:range ?r . ?d a owl:Class . ?r a owl:Class
    FILTER (STRSTARTS(STR(?d), "${ONT}") && STRSTARTS(STR(?r), "${ONT}")) }`).map((r) => local(r.p)).sort();
  const drawn = [...new Set([...svg.querySelectorAll('.onto-edge-label a')].map((a) => a.getAttribute('href').slice(1)))].sort();
  assert.deepEqual(drawn, edges);
  // text inside a box may not run past it; the widths are estimated per character
  for (const a of nodes) {
    const rect = a.querySelector('rect');
    const chars = a.querySelector('text').textContent.length;
    assert.ok(Number(rect.getAttribute('width')) >= chars * 6.5 + 12, `box too narrow for ${a.textContent}`);
  }
});

test('every in-page link resolves, the terms of the ontology link their anchors', () => {
  const ids = new Set([...doc.querySelectorAll('[id]')].map((e) => e.id));
  const dead = [...doc.querySelectorAll('main a[href^="#"]')].map((a) => a.getAttribute('href').slice(1)).filter((id) => !ids.has(decodeURIComponent(id)));
  assert.deepEqual([...new Set(dead)], []);
  const internalByIri = [...doc.querySelectorAll('main a[href^="https://gams.uni-graz.at/o:ufbas.ontology"]')];
  assert.equal(internalByIri.length, 0, 'a term of the ontology links its IRI instead of its anchor');
});

test('every download is a file of the served folder, and the data links are server-relative', () => {
  const downloads = [...doc.querySelectorAll('.onto-downloads a[download]')];
  assert.deepEqual(downloads.map((a) => a.getAttribute('download')), ['ufbas.ontology.ttl', 'ufbas.ontology.rdf', 'ufbas.ontology.jsonld', 'ufbas.shapes.ttl']);
  for (const a of downloads) {
    const href = a.getAttribute('href');
    assert.ok(href.startsWith('/ufbas/'), `${href} is not in the served folder`);
    assert.ok(existsSync(resolve(root, href.slice('/ufbas/'.length))), `${href} does not exist`);
    assert.ok(a.getAttribute('data-tip') && a.querySelector('.visually-hidden')?.textContent.trim(), `${href} without tip or name`);
    assert.ok(!a.hasAttribute('title'), `${href} has a title beside its tip`);
  }
  const data = [...doc.querySelectorAll('.onto-ns a')].map((a) => a.getAttribute('href'));
  assert.deepEqual(data, ['/o:ufbas.1563/RDF', '/o:ufbas.kategorien/RDF', '/archive/objects/o:gams-ontology/methods/sdef:Ontology/get']);
  assert.ok(![...doc.querySelectorAll('main a[href]')].some((a) => /^https?:\/\/gams\.uni-graz\.at\//.test(a.getAttribute('href'))), 'a GAMS link with host');
});

test('the example shows every node of data/ontology/ufbas.example.rdf, the entry and its proceeding first, and is a download', () => {
  const example = new oxigraph.Store();
  example.load(readFileSync(resolve(root, 'data/ontology/ufbas.example.rdf'), 'utf8'), { format: 'application/rdf+xml' });
  const subjects = example.query('SELECT DISTINCT ?s WHERE { ?s ?p ?o }').map((r) => r.get('s').value.replace(/^.*#/, ''));
  const blocks = [...doc.querySelectorAll('section[aria-labelledby="beispiel"] .onto-example-node')].map((n) => n.id.replace(/^beispiel-/, ''));
  assert.ok(subjects.length > 20);
  assert.deepEqual([...blocks].sort(), subjects.sort());
  assert.deepEqual(blocks.slice(0, 2), ['Eintrag-0', 'proceeding-Eintrag-0']);
  const link = doc.querySelector('section[aria-labelledby="beispiel"] a[download="ufbas.example.rdf"]');
  assert.equal(link?.getAttribute('href'), '/ufbas/data/ontology/ufbas.example.rdf');
});

// o:ufbas.ontology renders its ONTOLOGY datastream with ufbas-ontology.xsl, so that its
// namespace IRI resolves to the anchors of the terms
test('the page of o:ufbas.ontology is the page Ontologie with its navigation item', () => {
  const object = new JSDOM(readFileSync(resolve(here, 'build', 'ontologie-objekt.html'), 'utf8')).window.document;
  assert.equal(object.querySelector('main').innerHTML, doc.querySelector('main').innerHTML);
  assert.equal(object.querySelector('[aria-current="page"]')?.textContent.trim(), 'Ontologie');
  assert.equal(object.title, doc.title);
});

test('the validation section has one row per node shape with a message', () => {
  const shapes = new oxigraph.Store();
  shapes.load(readFileSync(resolve(root, 'data/ontology/ufbas.shapes.ttl'), 'utf8'), { format: 'text/turtle' });
  const count = shapes.query(`PREFIX sh: <http://www.w3.org/ns/shacl#> SELECT (COUNT(DISTINCT ?s) AS ?n) WHERE {
    ?s a sh:NodeShape { ?s sh:message ?m } UNION { ?s sh:property/sh:message ?m } }`)[0].get('n').value;
  assert.equal(doc.querySelectorAll('.onto-shapes > div').length, Number(count));
  assert.ok(!doc.querySelector('main').textContent.includes('·'), 'middle dot in the page');
});

done();
