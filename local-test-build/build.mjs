// Renders every page type into build/ for the tests and for inspection. Search pages
// use the params that js/buildquery.js builds from a form state, and sparql.mjs runs the
// query text of query/ with them on the refactored RDF, as GAMS will after the update.
// test/search-queries.test.mjs compares these answers with those of production.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { datastream, here, queryResult, render, root } from './gams.mjs';
import { publishedForm } from './make-facsimile-tei.mjs';
import { queryXML } from './sparql.mjs';

export function buildParams(state) {
  const window = { location: { search: '' }, alert() {} };
  const document = { readyState: 'complete', getElementById: () => null, addEventListener() {} };
  new Function('window', 'document', 'sessionStorage', readFileSync(resolve(root, 'js/buildquery.js'), 'utf8'))(window, document, {});
  return window.ufbasSearch.buildParams(state);
}

const category = (id) => encodeURIComponent(`$1|%3Chttp://gams.uni-graz.at/ufbas/%23${id}%3E`);

export const searchPages = {
  'search-form': ['query:ufbas.search', ''],
  'search-navbar-dieb': ['query:ufbas.search', buildParams({ terms: 'Dieb', prefix: true })],
  'search-regex-or': ['query:ufbas.search', buildParams({ terms: 'Dieb |Hans', regex: true })],
  'search-regex-plus': ['query:ufbas.search', buildParams({ terms: 'zunff+t', regex: true })],
  'search-date-only': ['query:ufbas.search', buildParams({ terms: '', from: '1565', to: '1565' })],
  // 'wyn' is the case with matched categories
  'search-wyn': ['query:ufbas.search', buildParams({ terms: 'wyn' })],
  'search-wyn-or': ['query:ufbas.search', buildParams({ terms: 'wyn |win' })],
  // a SPARQL syntax error, the way a broken bookmark or a hand-edited URL arrives
  'search-invalid': ['query:ufbas.search', encodeURIComponent('$1|Hans;$2|FILTER(')],
  // a bare '*' term reaches the stylesheet only through a hand-built URL
  'search-star-term': ['query:ufbas.search', encodeURIComponent('$1|Dieb *;$2|{ ?inhalt bds:search "Dieb" . }')],
  'volltext-2017-link': ['query:ufbas.volltext', encodeURIComponent('$1|Dieb')],
  'category-browse': ['query:ufbas.kategorien', category('TatDiebstahl')]
};

const empty = '<sparql xmlns="http://www.w3.org/2001/sw/DataAccess/rf1/result"/>';

export async function build(only = []) {
  const out = resolve(here, 'build');
  mkdirSync(out, { recursive: true });
  const context = await datastream('context:ufbas', 'METADATA');
  const pages = {
    home: () => render('ufbas-context', context, { mode: '' }),
    about: () => render('ufbas-context', context, { mode: 'about' }),
    imprint: () => render('ufbas-context', context, { mode: 'imprint' }),
    datenkorb: () => render('ufbas-context', context, { mode: 'datenkorb' }),
    exploration: () => render('ufbas-context', context, { mode: 'exploration' }),
    ontologie: () => render('ufbas-context', context, { mode: 'ontologie' }),
    kategorien: async () => render('ufbas-category', await datastream('o:ufbas.kategorien', 'TEI_SOURCE'), { mode: '' }),
    edition: async () => render('ufbas-object', await datastream('o:ufbas.1563', 'TEI_SOURCE'), { mode: '' }),
    // the TEI GAMS serves until the operator re-ingests it with its page images (ADR-34)
    'edition-ohne-bild': async () => render('ufbas-object', publishedForm(await datastream('o:ufbas.1563', 'TEI_SOURCE')), { mode: '' }),
    // o:ufbas.ontology with its ONTOLOGY datastream, answered from ontology/ until the ingest
    'ontologie-objekt': async () => render('ufbas-ontology', await datastream('o:ufbas.ontology', 'ONTOLOGY'), { mode: '' })
  };
  pages.graph = async () => render('ufbas-graph', (await queryResult('query:ufbas.graph', category('TatDiebstahl'))).xml,
    { params: decodeURIComponent(category('TatDiebstahl')), mode: '' });
  // a category outside Tat and Strafe, so every concept of the graph is a hub
  pages['graph-vorinstanz'] = async () => render('ufbas-graph', (await queryResult('query:ufbas.graph', category('Vorinstanz'))).xml,
    { params: decodeURIComponent(category('Vorinstanz')), mode: '' });
  for (const [name, [pid, raw]] of Object.entries(searchPages)) {
    pages[name] = async () => render('ufbas-search', raw ? (await queryXML(pid, raw)).xml : empty,
      { params: raw ? decodeURIComponent(raw) : '', mode: '' });
  }
  for (const [name, make] of Object.entries(pages)) {
    if (only.length && !only.includes(name)) { continue; }
    writeFileSync(resolve(out, `${name}.html`), await make());
    console.log(`built ${name}`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(here, 'build.mjs')) {
  await build(process.argv.slice(2));
}
