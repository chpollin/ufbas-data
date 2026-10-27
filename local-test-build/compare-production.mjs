// Renders pages locally and compares them with the production pages (fetched once,
// then cached). A match shows that the harness reproduces GAMS for that page.
// Serializer details and generate-id() values differ between Saxon on GAMS and
// SaxonJS and are normalised before comparing.
import { GAMS, datastream, fetchCached, queryResult, render } from './gams.mjs';

const pages = [
  ['home', '/archive/objects/context:ufbas/methods/sdef:Context/get?mode=', 'ufbas-context', 'context', { mode: '' }],
  ['about', '/archive/objects/context:ufbas/methods/sdef:Context/get?mode=about', 'ufbas-context', 'context', { mode: 'about' }],
  ['imprint', '/archive/objects/context:ufbas/methods/sdef:Context/get?mode=imprint', 'ufbas-context', 'context', { mode: 'imprint' }],
  ['datenkorb', '/archive/objects/context:ufbas/methods/sdef:Context/get?mode=datenkorb', 'ufbas-context', 'context', { mode: 'datenkorb' }],
  ['kategorien', '/o:ufbas.kategorien', 'ufbas-category', 'o:ufbas.kategorien', {}],
  ['edition', '/o:ufbas.1563', 'ufbas-object', 'o:ufbas.1563', {}],
  ['volltext', '/archive/objects/query:ufbas.volltext/methods/sdef:Query/get?params=%241%7CDieb', 'ufbas-search', 'query:ufbas.volltext', {}],
  ['search-form', '/archive/objects/query:ufbas.search/methods/sdef:Query/get?params=', 'ufbas-search', 'query:ufbas.search', {}],
  // The category query has no ORDER BY, so every run returns rows in another order
  // and this page can only match in structure, not byte for byte.
  ['category-browse', '/archive/objects/query:ufbas.kategorien/methods/sdef:Query/get?params=%241%7C%253Chttp%3A%2F%2Fgams.uni-graz.at%2Fufbas%2F%2523TatDiebstahl%253E', 'ufbas-search', 'query:ufbas.kategorien', {}]
];

function normalise(html) {
  const ids = new Map();
  return html
    .replace(/<!DOCTYPE[^>]*>|<\?xml[^>]*\?>/g, '')
    .replace(/\s*\/>/g, '/>')
    .replace(/\s+/g, ' ')
    .replace(/> </g, '><')
    // generate-id() differs by processor, so ids are renumbered in order of appearance
    .replace(/(?<=collapse\d{1,2}|[#"' -])(d\d+e\d+|d\d+[a-zA-Z]{2,}[a-zA-Z0-9]*)(?![0-9A-Za-z])/g, (id) => {
      if (!ids.has(id)) { ids.set(id, `gid${ids.size}`); }
      return ids.get(id);
    })
    .trim();
}

const only = process.argv.slice(2);
let failed = 0;
for (const [name, path, sheet, source, params] of pages) {
  if (only.length && !only.includes(name)) { continue; }
  const prod = (await fetchCached(GAMS + path)).body;
  let input;
  const raw = path.match(/[?&]params=([^&]*)/)?.[1];
  if (source.startsWith('query:')) {
    input = (await queryResult(source, raw || '')).xml;
    params.params = raw ? decodeURIComponent(raw) : '';
  } else {
    input = source === 'context' ? await datastream('context:ufbas', 'METADATA') : await datastream(source, 'TEI_SOURCE');
  }
  const local = await render(sheet, input, params);
  const a = normalise(local);
  const b = normalise(prod);
  if (a === b) { console.log(`same      ${name}`); continue; }
  failed++;
  const at = [...a].findIndex((c, i) => c !== b[i]);
  console.log(`different ${name} at ${at}\n  local: ${a.slice(Math.max(0, at - 80), at + 120)}\n  prod:  ${b.slice(Math.max(0, at - 80), at + 120)}`);
}
process.exit(failed ? 1 : 0);
