// Derives the entries of the edition with their date, folio, offenders and annotations
// from the TEI in tei/ with exploration-data.xsl. The Exploration view reads the RDF
// through query:ufbas.exploration; this derivation reads the TEI directly and is the
// independent reference test/exploration-rdf.test.mjs compares the query with. Run as a
// script it writes build/ufbas-exploration.json, the file the ufbas-data package
// publishes.
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import SaxonJS from 'saxon-js';
import { here, dataRoot, compileSEF, datastream, derived, parse } from './gams.mjs';

export const outFile = resolve(here, 'build/ufbas-exploration.json');

// The SEF goes to a temporary folder, the stylesheet compiles in about a second.
function compile() {
  const dir = mkdtempSync(resolve(tmpdir(), 'ufbas-exploration-'));
  const text = readFileSync(compileSEF(resolve(here, 'exploration-data.xsl'), resolve(dir, 'exploration-data.sef.json')), 'utf8');
  rmSync(dir, { recursive: true, force: true });
  return text;
}

// The date is that of the last commit of the TEI files, not of the run, so the same
// TEI gives the same file and the byte comparison of the test holds on any day.
function teiDate() {
  // --follow with --diff-filter=AM keeps the date across a move of the TEI that changed no
  // content. --follow takes one path per call.
  const dates = ['tei/ufbas.1563.xml', 'tei/ufbas.kategorien.xml'].map((file) => spawnSync('git',
    ['log', '-1', '--follow', '--diff-filter=AM', '--format=%cs', '--', file], { cwd: dataRoot, encoding: 'utf8' }).stdout.trim()).filter(Boolean);
  return dates.sort().pop() || new Date().toISOString().slice(0, 10);
}

let stylesheetText;
export async function explorationData({ editionText, taxonomyText, generated = teiDate() } = {}) {
  const edition = editionText ?? await datastream('o:ufbas.1563', 'TEI_SOURCE');
  const taxonomy = taxonomyText ?? await datastream('o:ufbas.kategorien', 'TEI_SOURCE');
  // the stylesheet imports the rules of ufbas-TORDF-ontology.xsl
  const sources = [resolve(here, 'exploration-data.xsl'), resolve(dataRoot, 'gams', 'ufbas-TORDF-ontology.xsl')].map((f) => readFileSync(f, 'utf8'));
  return derived('ufbas-exploration.json', [...sources, edition, taxonomy, generated], async () => {
    stylesheetText ??= compile();
    const result = await SaxonJS.transform({
      stylesheetText,
      sourceNode: await parse(edition),
      stylesheetParams: { 'taxonomy-doc': await parse(taxonomy), generated },
      destination: 'serialized'
    }, 'async');
    return result.principalResult;
  });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const json = await explorationData();
  JSON.parse(json);
  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, json);
  console.log(`wrote ${outFile} (${Buffer.byteLength(json)} bytes)`);
}
