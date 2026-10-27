// Writes the derived forms of the ontology from the Turtle files, which are the ones that
// are edited: data/ontology/ufbas.ontology.rdf, the target value of the ONTOLOGY datastream
// of o:ufbas.ontology, since GAMS publishes ontologies as RDF/XML (knowledge/domain.md,
// section Domain ontology), ufbas.ontology.jsonld for the download of the ontology page,
// and ufbas.shapes.rdf, which ufbas-context.xsl reads for the validation section of that
// page, since XSLT cannot read Turtle. test/ontology.test.mjs fails when they drift apart.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { root } from './gams.mjs';

const oxigraph = createRequire(import.meta.url)('oxigraph');

export const ttlFile = resolve(root, 'data/ontology/ufbas.ontology.ttl');
export const outFile = resolve(root, 'data/ontology/ufbas.ontology.rdf');
export const jsonldFile = resolve(root, 'data/ontology/ufbas.ontology.jsonld');
export const shapesFile = resolve(root, 'data/ontology/ufbas.shapes.ttl');
export const shapesRdfFile = resolve(root, 'data/ontology/ufbas.shapes.rdf');

export function ontologyStore(text = readFileSync(ttlFile, 'utf8')) {
  const store = new oxigraph.Store();
  store.load(text, { format: 'text/turtle' });
  return store;
}

// RDF/XML and JSON-LD hold one graph, so the default graph is dumped rather than the dataset
const dump = (store, format) => store.dump({ format, from_graph_name: oxigraph.defaultGraph() });

export function ontologyRDFXML(text) {
  return dump(ontologyStore(text), 'application/rdf+xml');
}

export function ontologyJSONLD(text) {
  return dump(ontologyStore(text), 'application/ld+json');
}

// The parser gives blank nodes random labels, so every conversion of the shapes would
// differ as text and a comparison of N-Triples would fail. The blank nodes of the shapes
// form trees below named shapes (property shapes, paths, lists), so a label derived from
// the node's place under its named root and from its content is the same in every run,
// and two graphs are the same graph when their relabelled triples are the same set.
// Two blank nodes with the same place and content would get one label, so they stop it.
export function relabelBlankNodes(quads) {
  const out = new Map();
  const parents = new Map();
  for (const q of quads) {
    if (q.subject.termType === 'BlankNode') {
      const list = out.get(q.subject.value) || [];
      list.push(q);
      out.set(q.subject.value, list);
    }
    if (q.object.termType === 'BlankNode') {
      if (parents.has(q.object.value)) { throw new Error(`blank node ${q.object.value} has more than one parent, the labels would not be canonical`); }
      parents.set(q.object.value, q);
    }
  }
  const contentCache = new Map();
  const content = (b) => {
    if (!contentCache.has(b)) {
      contentCache.set(b, (out.get(b) || []).map((q) => `${q.predicate} ${q.object.termType === 'BlankNode' ? `[${content(q.object.value)}]` : String(q.object)}`).sort().join(' ; '));
    }
    return contentCache.get(b);
  };
  const anchor = (b) => {
    const p = parents.get(b);
    if (!p) { return ''; }
    return `${p.subject.termType === 'BlankNode' ? anchor(p.subject.value) + '/' + content(p.subject.value) : String(p.subject)} ${p.predicate}`;
  };
  const blanks = [...new Set(quads.flatMap((q) => [q.subject, q.object]).filter((t) => t.termType === 'BlankNode').map((t) => t.value))];
  const labels = new Map();
  for (const b of blanks) {
    const label = 'b' + createHash('sha1').update(`${anchor(b)} -> ${content(b)}`).digest('hex').slice(0, 16);
    if ([...labels.values()].includes(label)) { throw new Error(`two blank nodes share place and content: ${anchor(b)}`); }
    labels.set(b, label);
  }
  const term = (t) => t.termType === 'BlankNode' ? oxigraph.blankNode(labels.get(t.value)) : t;
  return quads.map((q) => oxigraph.quad(term(q.subject), q.predicate, term(q.object), q.graph));
}

export function shapesQuads(text = readFileSync(shapesFile, 'utf8')) {
  return relabelBlankNodes(oxigraph.parse(text, { format: 'text/turtle' }));
}

export function shapesRDFXML(text) {
  return dump(new oxigraph.Store(shapesQuads(text)), 'application/rdf+xml');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  for (const [file, text] of [[outFile, ontologyRDFXML()], [jsonldFile, ontologyJSONLD()], [shapesRdfFile, shapesRDFXML()]]) {
    writeFileSync(file, text);
    console.log(`wrote ${file} (${Buffer.byteLength(text)} bytes)`);
  }
}
