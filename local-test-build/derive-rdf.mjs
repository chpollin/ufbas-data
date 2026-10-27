// Derives the refactored RDF of the edition under the domain ontology and the SKOS concept
// scheme of the taxonomy from the TEI in tei/ with ufbas-TORDF-ontology.xsl, the one
// TORDF transformation meant for cirilo:ufbas, which turns each of the two TEI objects
// into its RDF. test/rdf-ontology.test.mjs checks the data against the TEI reference of
// make-exploration-data.mjs, test/skos.test.mjs the concept scheme. Run as a script it
// writes data/ontology/ufbas.example.rdf, the example of the page Ontologie, and
// build/ufbas.1563.ontology.rdf and build/ufbas.kategorien.skos.rdf, the files the
// operator ingests ahead of the re-ingest.
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import SaxonJS from 'saxon-js';
import { here, root, dataRoot, compileSEF, datastream, derived, parse } from './gams.mjs';

const oxigraph = createRequire(import.meta.url)('oxigraph');

export const xsl = resolve(dataRoot, 'gams', 'ufbas-TORDF-ontology.xsl');
export const outFile = resolve(here, 'build/ufbas.1563.ontology.rdf');
export const skosFile = resolve(here, 'build/ufbas.kategorien.skos.rdf');

// The SEF goes to a temporary folder, as in make-exploration-data.mjs.
function compile() {
  const dir = mkdtempSync(resolve(tmpdir(), 'ufbas-derive-rdf-'));
  const text = readFileSync(compileSEF(xsl, resolve(dir, 'ufbas-TORDF-ontology.sef.json')), 'utf8');
  rmSync(dir, { recursive: true, force: true });
  return text;
}

let stylesheetText;
async function tordf(name, input) {
  return derived(name, [readFileSync(xsl, 'utf8'), input], async () => {
    stylesheetText ??= compile();
    const result = await SaxonJS.transform({ stylesheetText, sourceNode: await parse(input), destination: 'serialized' }, 'async');
    return result.principalResult;
  });
}

export async function ontologyRDF({ editionText } = {}) {
  return tordf('ufbas.1563.ontology.rdf', editionText ?? await datastream('o:ufbas.1563', 'TEI_SOURCE'));
}

export async function taxonomySKOS({ taxonomyText } = {}) {
  return tordf('ufbas.kategorien.skos.rdf', taxonomyText ?? await datastream('o:ufbas.kategorien', 'TEI_SOURCE'));
}

// The example of the page Ontologie, Eintrag-0 as the derivation gives it: the entry with
// its spans, every node derived from them or from the entry, the proceeding, the page and
// the places of the place list these nodes refer to. The page reads it as RDF/XML from the
// served folder, test/rdf-ontology.test.mjs compares the file with a fresh derivation.
export const exampleFile = resolve(root, 'data/ontology/ufbas.example.rdf');
export const EXAMPLE = 'Eintrag-0';

export async function exampleStore() {
  const store = new oxigraph.Store();
  store.load(await ontologyRDF(), { format: 'application/rdf+xml', base_iri: 'http://gams.uni-graz.at/' });
  const example = new oxigraph.Store();
  const e = `<http://gams.uni-graz.at/o:ufbas.1563#${EXAMPLE}>`;
  for (const quad of store.query(`PREFIX o: <https://gams.uni-graz.at/o:ufbas.ontology#> PREFIX g: <http://gams.uni-graz.at/o:gams-ontology#>
    CONSTRUCT { ?s ?p ?o } WHERE {
      { VALUES ?s { ${e} } } UNION { ${e} o:documents ?s } UNION { ${e} o:onPage ?s } UNION { ${e} o:mentionsPlace ?s }
      UNION { ?s g:isPartOf ${e} } UNION { ?s o:derivedFrom ${e} } UNION { ?s o:derivedFrom ?x . ?x g:isPartOf ${e} }
      UNION { ?n o:derivedFrom ?x . ?x g:isPartOf ${e} . ?n ?q ?s . ?s a o:Place }
      ?s ?p ?o }`)) {
    example.add(quad);
  }
  return example;
}

export async function exampleRDFXML() {
  return (await exampleStore()).dump({ format: 'application/rdf+xml', from_graph_name: oxigraph.defaultGraph() });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  writeFileSync(exampleFile, await exampleRDFXML());
  console.log(`wrote ${exampleFile}`);
  for (const [file, text] of [[outFile, await ontologyRDF()], [skosFile, await taxonomySKOS()]]) {
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, text);
    console.log(`wrote ${file} (${Buffer.byteLength(text)} bytes)`);
  }
}
