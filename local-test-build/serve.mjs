// Local preview of the UFBAS site. Pages are rendered with the repository
// stylesheets, /ufbas/ assets come from the repository, the queries of query/ run on the
// refactored RDF in sparql.mjs, and everything else GAMS would serve (datastreams, /lib/, /assets/)
// is read once from production.
import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { GAMS, datastream, fetchCached, localDatastreams, newestStylesheet, paramsFromQuery, queryResult, render, root } from './gams.mjs';
import { queryJSON, queryXML } from './sparql.mjs';

const port = Number(process.argv[2] || 8771);
const types = { '.css': 'text/css', '.js': 'application/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json' };

// Rendered pages are kept until a stylesheet changes, the edition page is large.
const pageCache = new Map();

async function page(stylesheet, source, params) {
  const stamp = newestStylesheet();
  const key = JSON.stringify([stylesheet, source.pid, params]);
  const hit = pageCache.get(key);
  if (hit && hit.stamp === stamp) { return hit.html; }
  const html = await render(stylesheet, await source.load(), params);
  pageCache.set(key, { stamp, html });
  return html;
}

const tei = (pid) => ({ pid, load: () => datastream(pid, 'TEI_SOURCE') });
const context = { pid: 'context:ufbas', load: () => datastream('context:ufbas', 'METADATA') };

async function route(url) {
  const path = decodeURIComponent(url.pathname);
  const params = paramsFromQuery(url.search);
  let m;
  if (path === '/' ) { return { redirect: '/context:ufbas' }; }
  if (path === '/context:ufbas' || path === '/archive/objects/context:ufbas/methods/sdef:Context/get') {
    return { html: await page('ufbas-context', context, { mode: params.mode || '', ...params }) };
  }
  if ((m = path.match(/^(?:\/archive\/objects)?\/(o:ufbas\.(?:1563|kategorien))(?:\/methods\/sdef:TEI\/get)?$/))) {
    const sheet = m[1] === 'o:ufbas.1563' ? 'ufbas-object' : 'ufbas-category';
    return { html: await page(sheet, tei(m[1]), { mode: params.mode || '', ...params }) };
  }
  if ((m = path.match(/^\/archive\/objects\/(query:ufbas\.[a-z]+)\/methods\/sdef:Query\/get$/))) {
    const raw = new URLSearchParams(url.search).has('params') ? url.search.match(/[?&]params=([^&]*)/)?.[1] ?? '' : '';
    const sheet = m[1] === 'query:ufbas.graph' ? 'ufbas-graph' : 'ufbas-search';
    const source = { pid: m[1] + raw, load: async () => {
      if (!raw) { return '<sparql xmlns="http://www.w3.org/2001/sw/DataAccess/rf1/result"><results/></sparql>'; }
      // the search queries run on the refactored RDF as after the update, the graph query,
      // whose answer the forwarding page does not read, on production
      const result = m[1] === 'query:ufbas.graph' ? await queryResult(m[1], raw) : await queryXML(m[1], raw);
      if (result.invalid) { console.warn('The query was rejected for', m[1], decodeURIComponent(raw)); }
      return result.xml;
    } };
    return { html: await page(sheet, source, { params: params.params || '', mode: params.mode || '' }) };
  }
  // query:ufbas.exploration exists only as a target value in query/, so its JSON is
  // answered here by running that text on the refactored RDF
  if (path === '/archive/objects/query:ufbas.exploration/methods/sdef:Query/getJSON') {
    return { body: JSON.stringify(await queryJSON('query:ufbas.exploration')), type: 'text/plain;charset=UTF-8' };
  }
  if (/\/methods\/sdef:Query\/get(HSSF|XML|JSON)$/.test(path)) { return { redirect: GAMS + url.pathname + url.search }; }
  if (path.startsWith('/ufbas/')) {
    const file = resolve(root, path.slice('/ufbas/'.length));
    if (!file.startsWith(root) || !existsSync(file)) { return { status: 404 }; }
    return { body: readFileSync(file), type: types[extname(file)] || 'application/octet-stream' };
  }
  // the ONTOLOGY datastream of o:ufbas.ontology from ontology/ until its ingest, the
  // deliberate shortcut of localDatastreams in gams.mjs, removed with it
  if ((m = path.match(/^\/archive\/objects\/([^/]+)\/datastreams\/([^/]+)\/content$/)) && localDatastreams[`${m[1]}/${m[2]}`]) {
    return { body: readFileSync(localDatastreams[`${m[1]}/${m[2]}`]), type: 'application/rdf+xml' };
  }
  if (path.startsWith('/assets/') || path.startsWith('/lib/') || path.startsWith('/templates/') || /^\/archive\/objects\/[^/]+\/datastreams\/[^/]+\/content$/.test(path)) {
    const { body, type } = await fetchCached(GAMS + url.pathname, { binary: true });
    return { body, type };
  }
  return { status: 404 };
}

createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${port}`);
  try {
    const r = await route(url);
    if (r.redirect) { res.writeHead(302, { Location: r.redirect }); return res.end(); }
    if (r.status) { res.writeHead(r.status); return res.end(String(r.status)); }
    if (r.html !== undefined) {
      res.writeHead(200, { 'Content-Type': 'text/html;charset=UTF-8', 'Cache-Control': 'no-store' });
      return res.end(r.html);
    }
    res.writeHead(200, { 'Content-Type': r.type, 'Cache-Control': 'no-store' });
    res.end(r.body);
  } catch (error) {
    console.error(url.pathname + url.search, error);
    res.writeHead(500, { 'Content-Type': 'text/plain;charset=UTF-8' });
    res.end(String(error.stack || error));
  }
}).listen(port, '127.0.0.1', () => console.log(`UFBAS local preview: http://127.0.0.1:${port}/context:ufbas`));
