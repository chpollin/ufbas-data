// Read-only access to GAMS production with a local cache, plus the SaxonJS renderer.
// Every GAMS response is fetched once and then served from cache/, because GAMS must
// not be hit in loops.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import SaxonJS from 'saxon-js';

export const here = dirname(fileURLToPath(import.meta.url));
// The harness lives in the data repository; the stylesheets, scripts and served files it
// renders live in the gams-www checkout, by default the ZimLab clone beside it.
export const dataRoot = resolve(here, '..');
export const root = resolve(process.env.UFBAS_WWW || resolve(dataRoot, '..', 'ZIMLAB', 'ufbas'));
if (!existsSync(resolve(root, 'ufbas-static.xsl'))) {
  throw new Error(`no gams-www checkout at ${root}; set UFBAS_WWW to its path`);
}
export const GAMS = 'https://gams.uni-graz.at';
export const STAGING = 'https://gams-staging.uni-graz.at';
const cacheDir = resolve(here, 'cache');
const sefDir = resolve(here, 'sef');
const mirrorDir = resolve(dataRoot, 'gams', 'datastreams');

// GAMS.md: no request loops, no parallel fetching. Requests of one process go out one
// after the other, a process stops after FETCH_LIMIT of them, which filling the whole
// cache stays below, and UFBAS_OFFLINE=1 forbids any request, so a missing fixture fails.
const FETCH_LIMIT = 100;
let fetches = 0;
let queue = Promise.resolve();

export async function fetchCached(url, { binary = false } = {}) {
  const key = createHash('sha1').update(url).digest('hex');
  const file = resolve(cacheDir, key);
  if (!existsSync(file)) {
    if (process.env.UFBAS_OFFLINE === '1') { throw new Error(`not in cache/ and UFBAS_OFFLINE=1: ${url}`); }
    const turn = queue.then(async () => {
      if (existsSync(file)) { return; }
      if (++fetches > FETCH_LIMIT) { throw new Error(`more than ${FETCH_LIMIT} requests to GAMS in one run, stopped at ${url}`); }
      const response = await fetch(url, { headers: { 'User-Agent': 'ufbas-local-test-build' }, signal: AbortSignal.timeout(60000) });
      if (!response.ok) { throw new Error(`HTTP ${response.status} for ${url}`); }
      mkdirSync(cacheDir, { recursive: true });
      writeFileSync(file, Buffer.from(await response.arrayBuffer()));
      writeFileSync(file + '.type', response.headers.get('content-type') || '');
    });
    queue = turn.catch(() => {});
    await turn;
  }
  return { body: binary ? readFileSync(file) : readFileSync(file, 'utf8'), type: readFileSync(file + '.type', 'utf8') };
}

// Deliberate shortcut until the operator ingests o:ufbas.ontology (ADR-33): its ONTOLOGY
// datastream, which GAMS does not serve yet, is answered from its ingest source in
// ontology/. Upgrade path: once the object is on GAMS, delete this entry and its uses in
// serve.mjs and test/browser.test.mjs, so the datastream comes from cache/ like any other.
export const localDatastreams = { 'o:ufbas.ontology/ONTOLOGY': resolve(dataRoot, 'ontology', 'ufbas.ontology.rdf') };

// A datastream is read from the repository when it exists there, so that fixtures
// stay reviewable, and from the cached production copy otherwise. The TEI of an
// object is its ingest source in tei/, named after the PID without "o:".
export async function datastream(pid, ds) {
  const local = localDatastreams[`${pid}/${ds}`] ?? (ds === 'TEI_SOURCE'
    ? resolve(dataRoot, 'tei', `${pid.replace(/^o:/, '')}.xml`)
    : resolve(mirrorDir, `${pid.replace(':', '-')}.${ds}.xml`));
  if (existsSync(local)) { return readFileSync(local, 'utf8'); }
  return (await fetchCached(`${GAMS}/archive/objects/${pid}/datastreams/${ds}/content`)).body;
}

// The stylesheets call document() with server-relative paths. They are resolved
// against the stylesheet URI, of production or staging, and answered from this pool.
const poolDatastreams = [
  ['context:ufbas', 'ABOUT'], ['context:ufbas', 'DC'], ['context:ufbas', 'IMPRINT'],
  ['context:templates', 'SEARCH_HELP'], ['o:ufbas.kategorien', 'TEI_SOURCE'], ['o:ufbas.ontology', 'ONTOLOGY']
];

let pool;
async function documentPool() {
  if (pool) { return pool; }
  pool = {};
  for (const [pid, ds] of poolDatastreams) {
    let text;
    // context:templates/SEARCH_HELP no longer exists on GAMS. Leaving it out of the
    // pool reproduces production, where only a call of that template would fail.
    try { text = await datastream(pid, ds); } catch { continue; }
    const doc = await parse(text);
    for (const host of [GAMS, STAGING]) {
      pool[`${host}/${pid}/${ds}`] = doc;
      pool[`${host}/archive/objects/${pid}/datastreams/${ds}/content`] = doc;
    }
  }
  return pool;
}

// A derivation of the whole TEI takes up to half a minute in SaxonJS, and several checks
// need the same one, so its result is kept in build/derived/ under a hash of everything it
// reads: the compiled stylesheet with its imports, the input text and the parameters.
export async function derived(name, parts, make) {
  const hash = createHash('sha1');
  for (const part of parts) { hash.update(String(part)).update('\0'); }
  const dir = resolve(here, 'build/derived');
  const current = `${name}-${hash.digest('hex').slice(0, 16)}`;
  const file = resolve(dir, current);
  mkdirSync(dir, { recursive: true });
  // the other copies of this derivation belong to inputs that have changed since; a run of
  // make-exploration-data.mjs with the commit date replaces the copy of the tests once
  for (const old of readdirSync(dir)) {
    if (old !== current && old.startsWith(name + '-') && old.length === current.length) { rmSync(resolve(dir, old)); }
  }
  if (existsSync(file)) { return readFileSync(file, 'utf8'); }
  const text = await make();
  writeFileSync(file, text);
  return text;
}

export function parse(text) {
  return SaxonJS.getResource({ type: 'xml', text });
}

export function newestStylesheet() {
  return Math.max(...['context', 'object', 'category', 'search', 'graph', 'static', 'ontology']
    .map((p) => statSync(resolve(root, `ufbas-${p}.xsl`)).mtimeMs));
}

// Recompiles a stylesheet whenever it or any page stylesheet is newer than its SEF.
// page is a path below the gams-www root without .xsl; the ingest stylesheets TOTEI and
// TORDF live in gams/ of the data repository.
export function sef(page) {
  const xsl = /^ufbas-TO(TEI|RDF)/.test(page) ? resolve(dataRoot, 'gams', page + '.xsl') : resolve(root, page + '.xsl');
  const file = resolve(sefDir, `${basename(page)}.sef.json`);
  if (!existsSync(file) || statSync(file).mtimeMs < Math.max(newestStylesheet(), statSync(xsl).mtimeMs)) {
    compileSEF(xsl, file);
  }
  return file;
}

// Compiles a stylesheet with xslt3 into the SEF file out, which SaxonJS runs.
export function compileSEF(xsl, out) {
  mkdirSync(dirname(out), { recursive: true });
  const result = spawnSync(process.execPath, [resolve(here, 'node_modules/xslt3/xslt3.js'),
    `-xsl:${xsl}`, `-export:${out}`, '-nogo', '-relocate:on'], { encoding: 'utf8' });
  if (result.status !== 0) { throw new Error(`Compiling ${basename(xsl)}: ${result.stderr || result.stdout}`); }
  return out;
}

// sefFile renders with another compiled stylesheet, used for the 2017 baseline, and
// baseURI as if GAMS had loaded the stylesheet from another place, such as staging
export async function render(page, sourceText, params = {}, sefFile = sef(page), baseURI = `${GAMS}/ufbas/${page}.xsl`) {
  const result = await SaxonJS.transform({
    stylesheetText: readFileSync(sefFile, 'utf8'),
    stylesheetBaseURI: baseURI,
    sourceNode: await parse(sourceText),
    stylesheetParams: params,
    documentPool: await documentPool(),
    destination: 'serialized'
  }, 'async');
  return result.principalResult;
}

// GAMS answers an invalid query with an XML declaration and the endpoint address as
// text, and the stylesheet then sees a result document without a results element.
// An empty params value is such an invalid query.
const noResults = '<sparql xmlns="http://www.w3.org/2001/sw/DataAccess/rf1/result"/>';
export async function queryResult(pid, rawParams) {
  if (!rawParams) { return { xml: noResults, invalid: true }; }
  const url = `${GAMS}/archive/objects/${pid}/methods/sdef:Query/getXML?params=${rawParams}`;
  const { body } = await fetchCached(url);
  if (!/<sparql[\s>]/.test(body)) {
    return { xml: noResults, invalid: true };
  }
  return { xml: body, invalid: false };
}

export function paramsFromQuery(search) {
  // GAMS hands the stylesheet the decoded parameter values.
  const out = {};
  for (const [key, value] of new URLSearchParams(search)) { out[key] = value; }
  return out;
}
