// Runs the stored query texts of query/ on the refactored RDF of the edition and the SKOS
// of the taxonomy, which ufbas-TORDF-ontology.xsl derives from the TEI in tei/ and the
// re-ingest publishes, with Oxigraph in place of the Blazegraph of GAMS. queryJSON answers
// in the form of sdef:Query/getJSON, an array with one object per row and every bound value
// as a string.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { root, dataRoot } from './gams.mjs';
import { ontologyRDF, taxonomySKOS } from './derive-rdf.mjs';

const oxigraph = createRequire(import.meta.url)('oxigraph');

let store;
export async function refactoredStore() {
  if (store) { return store; }
  store = new oxigraph.Store();
  store.load(await ontologyRDF(), { format: 'application/rdf+xml', base_iri: 'http://gams.uni-graz.at/' });
  store.load(await taxonomySKOS(), { format: 'application/rdf+xml', base_iri: 'http://gams.uni-graz.at/' });
  return store;
}

export function queryText(pid) {
  return readFileSync(resolve(dataRoot, 'gams', 'query', `${pid.replace(/^query:/, '')}.sparql`), 'utf8');
}

const rows = (results) => results.map((row) => Object.fromEntries([...row.entries()].map(([name, term]) => [name, term.value])));

export async function queryJSON(pid) {
  return rows((await refactoredStore()).query(queryText(pid)));
}

// The params value as sdef:Query/get takes it, encoded once in the URL. GAMS decodes it
// twice, which js/buildquery.js anticipates for % and +, splits it into $1, $2 … at the
// semicolon before each name, and puts each value in place of its name in the query text.
export function substitute(text, rawParams) {
  const value = decodeURIComponent(decodeURIComponent(rawParams));
  const params = Object.fromEntries(value.split(/;(?=\$\d\|)/).map((p) => [p.slice(0, p.indexOf('|')), p.slice(p.indexOf('|') + 1)]));
  return text.replace(/\$\d/g, (name) => params[name] ?? name);
}

// Blazegraph's full-text search bds:search has no counterpart in Oxigraph. It is rewritten
// into a FILTER on the text that the same group binds: every whitespace-separated term of
// the search text has to occur as a whole word, ignoring case, a term ending in * as the
// beginning of a word, and with bds:matchAllTerms "true" all terms, else one of them. The
// tests compare the result with the answers of Blazegraph on production.
const word = (term) => {
  const prefix = term.endsWith('*');
  const escaped = term.replace(/\*+$/, '').replace(/[.*+?^${}()|[\]\\]/g, (c) => `\\\\${c}`);
  return `regex(?$V, "(^|[^\\\\p{L}\\\\p{N}])${escaped}${prefix ? '' : '($|[^\\\\p{L}\\\\p{N}])'}", "i")`;
};
export function emulateFullText(text) {
  const search = /\?(\w+)\s+bds:search\s+(["'])(.*?)\2\s*\.?(\s*\?\1\s+bds:matchAllTerms\s+"true"\s*\.?)?/g;
  return text.replace(search, (all, v, quote, terms, matchAll) => {
    const conditions = terms.trim().split(/\s+/).filter(Boolean).map((t) => word(t).replace('$V', v));
    return `[] gams:textualContent ?${v} . FILTER(${conditions.join(matchAll ? ' && ' : ' || ')})`;
  });
}

const escapeXML = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// The answer of sdef:Query/get to a query object, run on the refactored RDF, in the result
// format GAMS hands its stylesheets: an element per bound variable, with the IRI in @uri.
// An invalid query gives no results element, as GAMS answers it.
export async function queryXML(pid, rawParams) {
  let results;
  try {
    results = (await refactoredStore()).query(emulateFullText(substitute(queryText(pid), rawParams)));
  } catch {
    return { xml: '<sparql xmlns="http://www.w3.org/2001/sw/DataAccess/rf1/result"/>', invalid: true };
  }
  const items = results.map((row) => `<result>${[...row.entries()].map(([name, term]) => term.termType === 'NamedNode'
    ? `<${name} uri="${escapeXML(term.value)}"/>`
    : `<${name}${term.language ? ` xml:lang="${term.language}"` : ''}>${escapeXML(term.value)}</${name}>`).join('')}</result>`);
  return { xml: `<?xml version="1.0" encoding="UTF-8"?><sparql xmlns="http://www.w3.org/2001/sw/DataAccess/rf1/result"><results>${items.join('')}</results></sparql>`, invalid: false };
}
