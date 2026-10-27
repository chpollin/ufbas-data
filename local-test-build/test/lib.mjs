// Helpers shared by the checks in test/: the runner with its summary line, a built page in
// jsdom with the real scripts of js/, the rows of an Oxigraph answer, the curated tables of
// research-artefacts/, the filters of the Exploration view and the expected hit counts of
// the search pages.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { JSDOM } from 'jsdom';
import { here, root, dataRoot } from '../gams.mjs';

// A failing check is reported and the next one runs, so one run names every failure; the
// summary line comes last and run.mjs prints it. A check that returns a promise counts once
// it settles, a plain one at once, so a file of plain checks needs no await.
export function runner(label, noun = 'checks') {
  let passed = 0;
  const fail = (name, error) => { console.log(`FAIL ${name}\n  ${error.message}`); process.exitCode = 1; };
  return {
    test(name, fn) {
      let result;
      try { result = fn(); } catch (error) { fail(name, error); return undefined; }
      if (result && typeof result.then === 'function') { return result.then(() => { passed++; }, (error) => fail(name, error)); }
      passed++;
      return undefined;
    },
    done() { console.log(`${label}: ${passed} ${noun} passed`); }
  };
}

export const ORIGIN = 'https://gams.uni-graz.at';
export const script = (name) => readFileSync(resolve(root, 'js', name), 'utf8');
// a page written by build.mjs, which run.mjs runs before the checks
export const built = (name) => readFileSync(resolve(here, 'build', `${name}.html`), 'utf8');

// A page in jsdom with the scripts of js/ it names. before(window) installs stubs before the
// scripts run. Storage survives a "reload" by passing the storage of one window to the next.
// The scripts wait for DOMContentLoaded like in a browser, so the window is returned after load.
export async function open(html, { url = ORIGIN + '/o:ufbas.1563', storage = {}, session = {}, scripts = [], before = () => {} } = {}) {
  const { window } = new JSDOM(html, { url, runScripts: 'outside-only', pretendToBeVisual: true });
  before(window);
  for (const [k, v] of Object.entries(storage)) { window.localStorage.setItem(k, v); }
  for (const [k, v] of Object.entries(session)) { window.sessionStorage.setItem(k, v); }
  window.URL.createObjectURL = () => 'blob:csv';
  window.confirm = () => true;
  const loaded = new Promise((done) => window.addEventListener('load', done));
  for (const name of scripts) { window.eval(script(name)); }
  await loaded;
  return window;
}

// A fetch that answers every request with the text and records the URLs asked for.
export const answering = (text, requests = []) => (url) => {
  requests.push(url);
  return Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(text) });
};

export const oxigraph = createRequire(import.meta.url)('oxigraph');
// an Oxigraph SELECT answer as one object per row, every bound value as its string
export const rows = (results) => results.map((row) => Object.fromEntries([...row.entries()].map(([name, term]) => [name, term.value])));

// a curated table of research-artefacts/ as one object per line, keyed by its header
export function tsv(name) {
  const [head, ...lines] = readFileSync(resolve(dataRoot, 'research-artefacts', name), 'utf8').trim().split(/\r?\n/);
  const keys = head.split('\t');
  return lines.map((line) => Object.fromEntries(line.split('\t').map((v, i) => [keys[i], v])));
}

// The fragments of entry-types.tsv, each with the entry it continues by the editors'
// cross-reference. The derivations merge a fragment into that entry (ADR-12).
export function fragmentHosts() {
  const crossrefs = tsv('editorial-crossrefs.tsv');
  return new Map(tsv('entry-types.tsv').filter((r) => r.type.startsWith('fragment')).map((r) => [r.entry,
    crossrefs.find((x) => x.source_entry === r.entry && ['continuation', 'statement'].includes(x.kind)).target_entry]));
}

// the procedure filter of the Exploration view, as uf:facet in ufbas-static.xsl
const PROCEDURE = ['Vorinstanz', 'FrüheresUrfehdeverfahren', 'AnderesUrfehdeverfahren', 'Untersuchungshaft'];
// the ids of the categories the filters of the view offer, from the categories of
// exploration-data.xsl
export const filterCategories = (categories) => new Set(categories.filter((c) => (['Tat', 'Strafe', 'Schlagwort'].includes(c.group) && c.id !== c.group)
  || PROCEDURE.includes(c.id)).map((c) => c.id));
// the gender composition of the offenders of an entry, from their codes m and f
export const genderClass = (genders) => {
  const m = genders.includes('m');
  const f = genders.includes('f');
  return m && f ? 'mf' : m ? 'm' : f ? 'f' : 'x';
};

export const editionTEI = () => readFileSync(resolve(dataRoot, 'tei/ufbas.1563.xml'), 'utf8');
// entries are the divs coded #uf_Eintrag, as on the edition page; a p inside Eintrag-132
// also carries the code (knowledge/data.md)
export const teiEntryCount = () => (editionTEI().match(/<div\b[^>]*\bana="#uf_Eintrag"/g) || []).length;

// The hit counts of the search pages of build.mjs: the answers of the query texts of query/
// on the refactored RDF, run by sparql.mjs. test/search-queries.test.mjs explains each
// difference to the answers of production with the texts of 2017. The edition is closed, so
// a count changes only with a query text or the derivation.
export const HITS = {
  'search-navbar-dieb': 14,
  'search-regex-or': 142,
  'search-regex-plus': 36,
  'search-date-only': 148,
  'search-wyn': 82,
  'search-wyn-or': 84,
  'volltext-2017-link': 7,
  'category-browse': 81
};
