// Checks the built pages in headless Chrome or Edge: no horizontal scrolling from 320px
// (WCAG 1.4.10 reflow, which 200 and 400 percent zoom reduce to) up to desktop width,
// the root font size, keyboard entry through the skip link, and axe-core for the
// automatically testable WCAG 2.2 A and AA rules. Screenshots go to shots/.
// Without an installed browser the check fails and says so, a check that did not run
// must not read as passed.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { findBrowser } from '../abnahme.mjs';
import { GAMS, fetchCached, here, root } from '../gams.mjs';
import { queryJSON } from '../sparql.mjs';
import { teiEntryCount } from './lib.mjs';

const browserPath = findBrowser();
if (typeof WebSocket === 'undefined') { throw new Error('the browser check needs Node 22 or newer (global WebSocket)'); }
if (!browserPath) {
  console.log('browser: not run, no Chrome or Edge found (set CHROME to its path)');
  process.exit(1);
}

const axeSource = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');
const buildDir = resolve(here, 'build');
const shotDir = resolve(here, 'shots');
mkdirSync(shotDir, { recursive: true });
const types = { '.css': 'text/css', '.js': 'application/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' };
// 1200 is the lowest width with a sticky navigation, where it must still be one line,
// also with a three-digit Datenkorb
const widths = [320, 390, 640, 768, 1024, 1200, 1440];
// the edition is audited at one width, axe needs long on its size and the other widths
// only change the layout, which the overflow check covers
const auditWidths = { edition: [1440], 'edition-bild': [390, 1440], 'edition-text': [1440] };
// The edition is checked again in both views with every group marked; the plain page
// shows the default view of each width. The view lives in the fragment; the width in the query makes every visit a
// full load, which a change of the fragment alone would not be.
const variants = {
  'edition-bild': { page: 'edition', hash: '#ansicht=bild&markierung=Person,Tat,Strafe,Ort,Schlagwort', image: true },
  'edition-text': { page: 'edition', hash: '#ansicht=text&markierung=Person,Tat,Strafe,Ort,Schlagwort' },
  // the Exploration view with a matrix cell chosen, a year and the gender split
  'exploration-auswahl': { page: 'exploration', hash: '#tat=TatDiebstahl&strafe=StrafeAusweisung&zeit=1565&ansicht=tat' }
};

// pages from build/ under /page/<name>, the rest the way the GAMS server answers it
const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  try {
    let body, type;
    if (url.pathname.startsWith('/page/')) {
      body = readFileSync(resolve(buildDir, url.pathname.slice(6) + '.html'), 'utf8');
      type = 'text/html;charset=UTF-8';
    } else if (url.pathname.startsWith('/ufbas/')) {
      const file = resolve(root, url.pathname.slice(7));
      if (!file.startsWith(root) || !existsSync(file)) { res.writeHead(404); return res.end(); }
      body = readFileSync(file);
      type = types[extname(file)] || 'application/octet-stream';
    } else if (url.pathname === '/archive/objects/query:ufbas.exploration/methods/sdef:Query/getJSON') {
      body = JSON.stringify(await queryJSON('query:ufbas.exploration'));
      type = 'text/plain;charset=UTF-8';
    } else if (url.pathname.startsWith('/templates/') || url.pathname.startsWith('/assets/')) {
      ({ body, type } = await fetchCached(GAMS + url.pathname, { binary: true }));
    } else {
      res.writeHead(404);
      return res.end();
    }
    res.writeHead(200, { 'Content-Type': type });
    res.end(body);
  } catch (error) {
    res.writeHead(500);
    res.end(String(error));
  }
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const base = `http://127.0.0.1:${server.address().port}`;

const profile = resolve(tmpdir(), `ufbas-browser-${process.pid}`);
const browser = spawn(browserPath, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--disable-extensions', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));
let port;
for (let i = 0; i < 100 && !port; i++) {
  await sleep(100);
  try { port = readFileSync(resolve(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0]; } catch { /* not up yet */ }
}
if (!port) { throw new Error(`${browserPath} did not start within 10 seconds`); }
const target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === 'page');
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((done) => ws.addEventListener('open', done));
let lastId = 0;
const pending = new Map();
const listeners = new Set();
ws.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) { pending.get(message.id)(message); pending.delete(message.id); }
  else if (message.method) { listeners.forEach((listener) => listener(message)); }
});
const send = (method, params = {}) => new Promise((done) => {
  const id = ++lastId;
  pending.set(id, done);
  ws.send(JSON.stringify({ id, method, params }));
});
const once = (method) => new Promise((done) => {
  const listener = (message) => { if (message.method === method) { listeners.delete(listener); done(message); } };
  listeners.add(listener);
});
const evaluate = async (expression) => {
  const { result } = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) { throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text); }
  return result.result.value;
};
const key = (keyName, code, keyCode) => Promise.all(['keyDown', 'keyUp'].map((type) =>
  send('Input.dispatchKeyEvent', { type, key: keyName, code, windowsVirtualKeyCode: keyCode })));

await send('Page.enable');
// the basket page is checked filled, with two entries as the edition page stores them
const edition = readFileSync(resolve(buildDir, 'edition.html'), 'utf8');
const basketItems = ['Eintrag-0', 'Eintrag-12'].map((uri) => {
  const tag = edition.match(new RegExp(`<[a-z]+ [^>]*[ "]id="${uri}"[^>]*>`))[0];
  const attr = (name) => (tag.match(new RegExp(`${name}="([^"]*)"`)) || [])[1] || '';
  return { uri, datum: attr('data-datum'), taeter: attr('data-taeter'), inhalt: 'Text des Eintrags ' + uri };
});
// every other page with every entry in the Datenkorb, a three-digit count and the widest
// label the navigation must fit on one line, as after "Alle Treffer in den Datenkorb" on a
// broad search
const fullBasket = Array.from({ length: teiEntryCount() }, (_, i) => ({ uri: `Eintrag-${i}`, datum: '', taeter: '', inhalt: '' }));
await send('Page.addScriptToEvaluateOnNewDocument', { source:
  `localStorage.setItem('ufbas.datenkorb', location.pathname === '/page/datenkorb' ? ${JSON.stringify(JSON.stringify(basketItems))} : ${JSON.stringify(JSON.stringify(fullBasket))});` });

const failures = [];
// node test/browser.test.mjs [page ...] checks only the named pages of build/
const only = process.argv.slice(2);
// the graph pages only forward to the Exploration view, which the smoke test checks
const built = readdirSync(buildDir).filter((f) => f.endsWith('.html')).map((f) => f.slice(0, -5)).filter((name) => !name.startsWith('graph'));
const pages = built.concat(Object.keys(variants).filter((v) => built.includes(variants[v].page)))
  .filter((name) => !only.length || only.includes(name)).sort();
await send('Network.enable');
const tiles = new Set();
listeners.add((message) => {
  if (message.method === 'Network.responseReceived' && /\/Ratsbuecher_O_10_\d+\/.+\/default\.jpg$/.test(message.params.response.url) && message.params.response.status === 200) {
    tiles.add(message.params.response.url);
  }
});
for (const name of pages) {
  for (const width of widths) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 768 });
    const variant = variants[name];
    const loaded = once('Page.loadEventFired');
    await send('Page.navigate', { url: variant ? `${base}/page/${variant.page}?w=${width}${variant.hash}` : `${base}/page/${name}` });
    await loaded;
    await sleep(150);
    if ((variant ? variant.page : name) === 'exploration') {
      // the view fills itself from the query answer; it has to end in the entry list
      const filled = await evaluate(`new Promise((done) => { const t0 = Date.now(); (function poll() {
        if (document.querySelector('#explore-list tr')) { done(true); } else if (Date.now() - t0 > 8000) { done(false); } else { setTimeout(poll, 100); }
      }()); })`);
      if (!filled) { failures.push(`${name} @${width}: the Exploration view did not fill within eight seconds`); }
    }
    if (variant && variant.image) {
      // the viewer is loaded on demand; the pane has to end in the viewer or in the link to the Lesesaal
      const pane = await evaluate(`new Promise((done) => { const t0 = Date.now(); (function poll() {
        const p = document.querySelector('.facsimile');
        const state = !p || p.hidden ? 'hidden' : p.querySelector('.facsimile-missing:not([hidden])') ? 'link' : p.querySelector('.facsimile-viewer canvas') ? 'viewer' : '';
        if (state || Date.now() - t0 > 8000) { done(state || 'loading'); } else { setTimeout(poll, 100); }
      }()); })`);
      if (pane !== 'viewer' && pane !== 'link') { failures.push(`${name} @${width}: page image ${pane}`); }
      await sleep(300);
    }
    const layout = await evaluate(`({
      scroll: document.documentElement.scrollWidth, view: document.documentElement.clientWidth,
      root: getComputedStyle(document.documentElement).fontSize,
      nav: (() => {
        const n = document.querySelector('.site-nav');
        const rootStyle = getComputedStyle(document.documentElement);
        return { sticky: getComputedStyle(n).position === 'sticky', height: n.offsetHeight,
          limit: parseFloat(rootStyle.getPropertyValue('--nav-height')) * parseFloat(rootStyle.fontSize) };
      })(),
      // a scrolling strip inside the page does not widen the document, so each element is checked too;
      // tables and the navigation of a phone scroll sideways by design
      strips: [...document.querySelectorAll('body *')].filter((e) => e.scrollWidth > e.clientWidth + 1 && /auto|scroll/.test(getComputedStyle(e).overflowX) && !e.closest('.table-scroll, .nav-list')).slice(0, 3).map((e) => e.tagName.toLowerCase() + (e.className ? '.' + String(e.className).split(' ')[0] : '')),
      wide: [...document.querySelectorAll('body *')].filter((e) => e.getBoundingClientRect().right > document.documentElement.clientWidth + 1 && !e.closest('.table-scroll, .nav-list, .visually-hidden, .skip-link')).slice(0, 3).map((e) => e.tagName.toLowerCase() + (e.className ? '.' + String(e.className).split(' ')[0] : ''))
    })`);
    if (layout.scroll > layout.view) { failures.push(`${name} @${width}: horizontal scrolling (${layout.scroll} > ${layout.view}) ${layout.wide.join(' ')}`); }
    if (layout.strips.length) { failures.push(`${name} @${width}: element scrolls sideways: ${layout.strips.join(' ')}`); }
    if (layout.root !== '16px') { failures.push(`${name} @${width}: root font size ${layout.root}`); }
    if (layout.nav.sticky && layout.nav.height > layout.nav.limit + 1) { failures.push(`${name} @${width}: sticky navigation wraps (${layout.nav.height}px, room for ${layout.nav.limit}px)`); }
    if (width === 1440 || width === 390) {
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      writeFileSync(resolve(shotDir, `${name}-${width}.png`), Buffer.from(shot.result.data, 'base64'));
    }
    if (width === 1440) {
      await key('Tab', 'Tab', 9);
      const focus = await evaluate(`({ skip: document.activeElement.classList.contains('skip-link'), outline: getComputedStyle(document.activeElement).outlineStyle })`);
      if (!focus.skip) { failures.push(`${name}: first Tab does not reach the skip link`); }
      if (focus.outline === 'none') { failures.push(`${name}: focused skip link without outline`); }
    }
    if ((auditWidths[name] || [390, 1440]).includes(width)) {
      await evaluate(axeSource + ';0');
      const violations = await evaluate(`axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } })
        .then((r) => r.violations.map((v) => ({ id: v.id, impact: v.impact, count: v.nodes.length, target: v.nodes[0].target.join(' '), summary: v.nodes[0].failureSummary.split('\\n')[1] })))`);
      for (const v of violations) {
        failures.push(`${name} @${width}: axe ${v.id} (${v.impact}, ${v.count}x) at ${v.target}: ${v.summary}`);
      }
    }
  }
}

// print: a category browse prints every year, and the tables keep their column heads and
// the dates of their rows, which are buttons on screen
const printChecks = {
  'category-browse': `[...document.querySelectorAll('.result-list[data-by-year] > li')].filter((li) => getComputedStyle(li).display === 'none').length`,
  datenkorb: `[...document.querySelectorAll('button.table-sort')].filter((b) => getComputedStyle(b).display === 'none').length`,
  exploration: `[...document.querySelectorAll('button.table-sort, button.explore-open')].filter((b) => getComputedStyle(b).display === 'none').length`
};
await send('Emulation.setDeviceMetricsOverride', { width: 1024, height: 900, deviceScaleFactor: 1, mobile: false });
for (const [name, hidden] of Object.entries(printChecks).filter(([n]) => pages.includes(n))) {
  const loaded = once('Page.loadEventFired');
  await send('Page.navigate', { url: `${base}/page/${name}` });
  await loaded;
  await evaluate(`new Promise((done) => { const t0 = Date.now(); (function poll() {
    if (document.querySelector('button.table-sort, .result-list > li') || Date.now() - t0 > 8000) { done(); } else { setTimeout(poll, 100); }
  }()); })`);
  await send('Emulation.setEmulatedMedia', { media: 'print' });
  const count = await evaluate(hidden);
  if (count) { failures.push(`${name} in print: ${count} elements hidden that print has to show`); }
  await send('Emulation.setEmulatedMedia', { media: '' });
}

ws.close();
browser.kill();
server.close();
await sleep(300);
try { rmSync(profile, { recursive: true, force: true }); } catch { /* the browser may still hold files */ }

if (failures.length) {
  console.log(failures.join('\n'));
  process.exit(1);
}
if (pages.includes('edition-bild')) { console.log(`browser: ${tiles.size ? 'tiles of the page images loaded' : 'no tile of the page images loaded, the link to the Lesesaal stood in'}`); }
console.log(`browser: ${pages.length} pages at ${widths.join(', ')}px passed, axe WCAG 2.2 AA clean`);
