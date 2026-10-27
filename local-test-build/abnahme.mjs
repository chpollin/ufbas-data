// Visual acceptance sheet for an operator question: renders the configured pages of the
// running local preview in headless Chrome or Edge at each width, measures horizontal
// overflow, targets below 24px, console errors and axe WCAG 2.2 A and AA violations, and
// writes abnahme/<date>/index.html with the screenshots and befund.json. The operator
// decides the items in the chat, so the sheet shows evidence and has no form.
//
// Usage: node abnahme.mjs abnahme.json   (with `npm run serve` running)
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { here, root } from './gams.mjs';

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));
// a full-page capture of the edition would be tens of thousands of pixels tall; the sheet
// shows the top of such a page and says so, the measurements cover the whole page
const MAX_SHOT_HEIGHT = 8000;
const MAX_CROP_HEIGHT = 1400;

export function findBrowser() {
  return [
    process.env.CHROME,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  ].filter(Boolean).find((p) => existsSync(p));
}

// A headless browser driven over the raw DevTools protocol, as in test/browser.test.mjs,
// so the harness needs no browser automation package.
export async function launch() {
  const browserPath = findBrowser();
  if (typeof WebSocket === 'undefined') { throw new Error('the acceptance sheet needs Node 22 or newer (global WebSocket)'); }
  if (!browserPath) { throw new Error('no Chrome or Edge found, set CHROME to its path'); }
  const profile = resolve(tmpdir(), `ufbas-abnahme-${process.pid}-${Date.now()}`);
  const browser = spawn(browserPath, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`,
    '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
  let port;
  for (let i = 0; i < 100 && !port; i++) {
    await sleep(100);
    try { port = readFileSync(resolve(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0]; } catch { /* not up yet */ }
  }
  if (!port) { browser.kill(); throw new Error(`${browserPath} did not start within 10 seconds`); }
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
  const send = (method, params = {}) => new Promise((done, fail) => {
    const id = ++lastId;
    pending.set(id, (message) => message.error ? fail(new Error(`${method}: ${message.error.message}`)) : done(message.result));
    ws.send(JSON.stringify({ id, method, params }));
  });
  const once = (method, timeout = 120000) => new Promise((done, fail) => {
    const timer = setTimeout(() => { listeners.delete(listener); fail(new Error(`${method} not within ${timeout / 1000}s`)); }, timeout);
    const listener = (message) => { if (message.method === method) { clearTimeout(timer); listeners.delete(listener); done(message); } };
    listeners.add(listener);
  });
  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) { throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text); }
    return result.result.value;
  };
  const close = async () => {
    ws.close();
    browser.kill();
    await sleep(300);
    try { rmSync(profile, { recursive: true, force: true }); } catch { /* the browser may still hold files */ }
  };
  return { send, once, evaluate, listeners, close };
}

// Runs in the page. Horizontal overflow of the document with the elements that stick out,
// and interactive elements below 24 x 24px. Inline links in running text are exempt under
// WCAG 2.5.8, and 1px controls are the visually hidden inputs behind a larger label.
export function measure() {
  const doc = document.documentElement;
  const overflow = Math.max(0, doc.scrollWidth - doc.clientWidth);
  const name = (el) => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/)[0] : '');
  const wide = overflow
    ? [...document.querySelectorAll('body *')].filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width && r.right > doc.clientWidth + 1 && !el.closest('.table-scroll, .visually-hidden, .skip-link');
    }).slice(0, 5).map((el) => `${name(el)} bis ${Math.round(el.getBoundingClientRect().right)}px`)
    : [];
  const small = [];
  for (const el of document.querySelectorAll('a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="button"], [role="tab"]')) {
    if (el.closest('[hidden], dialog:not([open]), .visually-hidden, .skip-link')) { continue; }
    if (el.checkVisibility && !el.checkVisibility({ contentVisibilityAuto: true, visibilityProperty: true })) { continue; }
    // a control inside or bound to a label is hit through the label as well
    const r = [el, ...(el.labels || [])].map((e) => e.getBoundingClientRect())
      .reduce((a, b) => (b.width * b.height > a.width * a.height ? b : a));
    if (r.width <= 1 || r.height <= 1 || (r.width >= 24 && r.height >= 24)) { continue; }
    if (getComputedStyle(el).display === 'inline') { continue; }
    small.push(`${name(el)} "${(el.textContent || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 30)}" ${Math.round(r.width)}x${Math.round(r.height)}`);
  }
  return { overflow, wide, small: small.slice(0, 8), smallCount: small.length };
}

// Runs in the page. The box in document coordinates of a selector, or of the first
// block that contains a text, with a margin; null when nothing matches.
function region(spec, margin) {
  let el = null;
  if (typeof spec === 'string') { el = document.querySelector(spec); }
  else { el = [...document.querySelectorAll(spec.within || 'p, li, h1, h2, h3, h4')].find((e) => e.textContent.includes(spec.contains)); }
  if (!el) { return null; }
  const r = el.getBoundingClientRect();
  if (!r.width || !r.height) { return null; }
  const x = Math.max(0, r.left + scrollX - margin);
  const y = Math.max(0, r.top + scrollY - margin);
  return { x, y, width: Math.min(document.documentElement.clientWidth - x, r.width + 2 * margin), height: r.height + 2 * margin };
}

const axeSource = () => readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');

function pngSize(file) {
  const b = readFileSync(file);
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

function commit() {
  const git = (...args) => spawnSync('git', args, { cwd: root, encoding: 'utf8' }).stdout.trim();
  const head = git('rev-parse', '--short', 'HEAD');
  return git('status', '--porcelain', '--untracked-files=no') ? `${head} mit lokalen Änderungen` : head;
}

async function run(configFile) {
  const config = JSON.parse(readFileSync(configFile, 'utf8'));
  const base = config.base.replace(/\/$/, '');
  // a sheet from a server that is not running would show error pages as evidence
  try {
    const probe = await fetch(base + config.pages[0].path, { redirect: 'manual' });
    if (probe.status >= 400) { throw new Error(`HTTP ${probe.status}`); }
  } catch (error) {
    console.error(`abnahme: the local preview at ${base} does not answer (${error.cause?.code || error.message}). Start it with \`npm run serve\` in local-test-build/.`);
    process.exit(1);
  }
  // the preview renders a page on its first request, the edition takes long; warming it
  // here keeps the browser's load event within its timeout
  for (const page of config.pages) { await fetch(base + page.path); }

  const started = new Date();
  const day = started.toISOString().slice(0, 10);
  const outDir = resolve(dirname(resolve(configFile)), 'abnahme', day);
  const shotDir = resolve(outDir, 'shots');
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(shotDir, { recursive: true });

  const axe = axeSource();
  const browser = await launch();
  const { send, once, evaluate, listeners } = browser;
  const befund = { question: config.question, title: config.title, project: config.project, base, compare: config.compare || null,
    commit: commit(), started: started.toISOString(), widths: config.widths, items: config.items, pages: [] };
  let errors = [];
  let inflight = new Map();
  let lastNetwork = Date.now();
  listeners.add(({ method, params }) => {
    if (method === 'Runtime.consoleAPICalled' && params.type === 'error') {
      errors.push(params.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 200));
    } else if (method === 'Runtime.exceptionThrown') {
      errors.push((params.exceptionDetails.exception?.description || params.exceptionDetails.text).split('\n')[0].slice(0, 200));
    // the browser asks the preview for /favicon.ico, which the pages do not reference
    } else if (method === 'Log.entryAdded' && params.entry.level === 'error' && !/\/favicon\.ico$/.test(params.entry.url || '')) {
      errors.push(`${params.entry.text}${params.entry.url ? ' ' + params.entry.url : ''}`.slice(0, 200));
    } else if (method === 'Network.requestWillBeSent') {
      inflight.set(params.requestId, true); lastNetwork = Date.now();
    } else if (method === 'Network.loadingFinished' || method === 'Network.loadingFailed') {
      inflight.delete(params.requestId); lastNetwork = Date.now();
    }
  });
  // the network is idle when no request ran for 600ms; tiles of the page image may keep
  // it busy, so the wait ends after 20 seconds and the page is measured as it stands
  const settle = async () => {
    const t0 = Date.now();
    while (Date.now() - t0 < 20000 && (inflight.size || Date.now() - lastNetwork < 600)) { await sleep(100); }
    await sleep(300);
  };
  await Promise.all(['Page.enable', 'Runtime.enable', 'Log.enable', 'Network.enable'].map((m) => send(m)));

  try {
    for (const page of config.pages) {
      const result = { name: page.name, label: page.label, path: page.path, compare: config.compare ? config.compare.replace(/\/$/, '') + page.path : null, widths: {} };
      befund.pages.push(result);
      for (const width of config.widths) {
        console.log(`abnahme: ${page.name} @${width}`);
        await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 768 });
        // about:blank between visits, so every width is a full load of the page
        await send('Page.navigate', { url: 'about:blank' });
        errors = [];
        inflight = new Map();
        const loaded = once('Page.loadEventFired');
        await send('Page.navigate', { url: base + page.path + (page.hash || '') });
        await loaded;
        await settle();
        const state = { measure: await evaluate(`(${measure})()`) };
        if (!page.axeWidths || page.axeWidths.includes(width)) {
          await evaluate(axe + ';0');
          state.axe = await evaluate(`axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } })
            .then((r) => r.violations.map((v) => ({ id: v.id, impact: v.impact, count: v.nodes.length, target: v.nodes[0].target.join(' '), help: v.help })))`);
        }
        state.errors = [...new Set(errors)];
        const height = await evaluate('document.documentElement.scrollHeight');
        state.height = height;
        state.cut = height > MAX_SHOT_HEIGHT;
        await evaluate('window.scrollTo(0, 0)');
        const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true,
          clip: { x: 0, y: 0, width, height: Math.min(height, MAX_SHOT_HEIGHT), scale: 1 } });
        state.shot = `shots/${page.name}-${width}.png`;
        writeFileSync(resolve(outDir, state.shot), Buffer.from(shot.data, 'base64'));
        state.shotSize = pngSize(resolve(outDir, state.shot));
        state.crops = [];
        for (const item of config.items.filter((i) => i.page === page.name && (i.widths || [1440, 390]).includes(width))) {
          const specs = [].concat(item.selector || []);
          for (const [n, spec] of specs.entries()) {
            const box = await evaluate(`(${region})(${JSON.stringify(spec)}, 16)`);
            const file = `shots/item-${item.id}-${width}${specs.length > 1 ? '-' + (n + 1) : ''}.png`;
            if (!box) { state.crops.push({ item: item.id, spec, file: null }); continue; }
            const crop = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true,
              clip: { x: box.x, y: box.y, width: box.width, height: Math.min(box.height, MAX_CROP_HEIGHT), scale: 1 } });
            writeFileSync(resolve(outDir, file), Buffer.from(crop.data, 'base64'));
            state.crops.push({ item: item.id, spec, file, cut: box.height > MAX_CROP_HEIGHT });
          }
        }
        result.widths[width] = state;
      }
    }
  } finally {
    await browser.close();
  }
  befund.finished = new Date().toISOString();
  writeFileSync(resolve(outDir, 'befund.json'), JSON.stringify(befund, null, 2) + '\n');
  writeFileSync(resolve(outDir, 'index.html'), sheet(befund));
  console.log(`abnahme: ${resolve(outDir, 'index.html')}`);
  return outDir;
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const specLabel = (spec) => typeof spec === 'string' ? spec : `${spec.within || 'Block'} mit „${spec.contains}“`;

// the findings of one width as short German states, empty when clean
export function findings(state) {
  const out = [];
  const m = state.measure;
  if (m.overflow) { out.push(`Horizontal scrollbar, ${m.overflow}px breiter als das Fenster${m.wide.length ? ': ' + m.wide.join(', ') : ''}`); }
  if (m.smallCount) { out.push(`${m.smallCount} Bedienelemente unter 24px: ${m.small.join('; ')}${m.smallCount > m.small.length ? ' …' : ''}`); }
  for (const v of state.axe || []) { out.push(`axe ${v.id} (${v.impact}, ${v.count}×) bei ${v.target}: ${v.help}`); }
  for (const e of state.errors) { out.push(`Konsole: ${e}`); }
  return out;
}

function sheet(b) {
  const time = new Date(b.started).toLocaleString('de-AT', { dateStyle: 'medium', timeStyle: 'short' });
  const pageOf = (name) => b.pages.find((p) => p.name === name);
  // numeric keys come out of an object in ascending order, the sheet follows the configured order
  const byWidth = (p) => b.widths.filter((w) => p.widths[w]).map((w) => [w, p.widths[w]]);
  const items = b.items.map((item, i) => {
    const page = pageOf(item.page);
    const crops = page ? byWidth(page).flatMap(([width, s]) => s.crops.filter((c) => c.item === item.id).map((c) => ({ width, ...c }))) : [];
    return `<section class="item" id="punkt-${esc(item.id)}">
  <h2><span class="num">${i + 1}</span> ${esc(item.wording)}</h2>
  <dl>
    <dt>Stand</dt><dd>${esc(item.state)}</dd>
    <dt>Empfehlung</dt><dd>${esc(item.recommendation)}</dd>
    <dt>Seite</dt><dd>${page ? `<a href="#seite-${esc(page.name)}">${esc(page.label)}</a>` : esc(item.page)}</dd>
  </dl>
  ${crops.length ? `<div class="crops">${crops.map((c) => c.file
    ? `<figure><a href="${esc(c.file)}"><img src="${esc(c.file)}" alt="${esc(item.wording)}, ${c.width}px" loading="lazy"></a><figcaption>${c.width}px, ${esc(specLabel(c.spec))}${c.cut ? ', gekürzt' : ''}</figcaption></figure>`
    : `<p class="missing">${c.width}px: ${esc(specLabel(c.spec))} nicht gefunden</p>`).join('')}</div>` : ''}
</section>`;
  }).join('\n');
  const pages = b.pages.map((p) => `<section class="page" id="seite-${esc(p.name)}">
  <h2>${esc(p.label)}</h2>
  <p class="links"><a href="${esc(b.base + p.path)}">Lokale Vorschau</a>${p.compare ? ` <a href="${esc(p.compare)}">Produktion</a>` : ''}</p>
  <div class="shots">${byWidth(p).map(([w, s]) => `<figure><a href="${esc(s.shot)}"><img src="${esc(s.shot)}" alt="${esc(p.label)}, ${w}px" loading="lazy"></a><figcaption>${w}px${s.cut ? `, oberste ${MAX_SHOT_HEIGHT}px von ${s.height}px` : ''}</figcaption></figure>`).join('')}</div>
  <table>
    <thead><tr><th scope="col">Breite</th><th scope="col">Befunde</th></tr></thead>
    <tbody>${byWidth(p).map(([w, s]) => {
      const f = findings(s);
      return `<tr><th scope="row">${w}px</th><td>${f.length ? `<ul>${f.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : 'keine Befunde'}${s.axe ? '' : ' <span class="note">(ohne axe)</span>'}</td></tr>`;
    }).join('')}</tbody>
  </table>
</section>`).join('\n');
  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Abnahme ${esc(b.project)}</title>
<style>
:root { --bg: #fbfaf7; --ink: #1f2321; --muted: #5d625f; --line: #d9d6ce; --panel: #ffffff; --accent: #2f6b4f; color-scheme: light dark; }
@media (prefers-color-scheme: dark) { :root { --bg: #171a18; --ink: #e6e4de; --muted: #a3a8a4; --line: #3a3f3c; --panel: #202421; --accent: #8cc7a6; } }
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--ink); font: 1rem/1.5 system-ui, sans-serif; }
main { max-width: 90rem; margin: 0 auto; padding: 1.5rem 1rem 4rem; }
header { border-bottom: 1px solid var(--line); padding-bottom: 1rem; margin-bottom: 1.5rem; }
h1 { font-size: 1.5rem; margin: 0 0 0.5rem; }
h2 { font-size: 1.125rem; margin: 0 0 0.75rem; }
header dl, .item dl { display: grid; grid-template-columns: max-content 1fr; gap: 0.25rem 1rem; margin: 0; }
dt { color: var(--muted); }
dd { margin: 0; }
a { color: var(--accent); }
.item, .page { background: var(--panel); border: 1px solid var(--line); border-radius: 6px; padding: 1rem; margin: 0 0 1.25rem; }
.num { display: inline-block; min-width: 1.75rem; color: var(--accent); }
.crops, .shots { display: flex; flex-wrap: wrap; gap: 1rem; align-items: flex-start; margin-top: 1rem; }
figure { margin: 0; max-width: 100%; }
.crops figure { flex: 0 1 auto; max-width: min(100%, 48rem); }
.shots figure { flex: 1 1 14rem; max-width: 28rem; }
.shots img { max-height: 36rem; object-fit: cover; object-position: top; width: 100%; }
img { display: block; max-width: 100%; height: auto; border: 1px solid var(--line); }
figcaption, .note, .missing, .links { color: var(--muted); font-size: 0.875rem; margin-top: 0.25rem; }
.links a { margin-right: 1rem; }
table { width: 100%; border-collapse: collapse; margin-top: 1rem; font-size: 0.9375rem; }
th, td { text-align: left; vertical-align: top; padding: 0.5rem; border-top: 1px solid var(--line); }
td ul { margin: 0; padding-left: 1.25rem; overflow-wrap: anywhere; }
</style>
</head>
<body>
<main>
<header>
  <h1>${esc(b.title)}</h1>
  <dl>
    <dt>Projekt</dt><dd>${esc(b.project)}</dd>
    <dt>Frage</dt><dd>${esc(b.question)}</dd>
    <dt>Quellstand</dt><dd>${esc(b.commit)}</dd>
    <dt>Lauf</dt><dd>${esc(time)}</dd>
  </dl>
</header>
${items}
${pages}
</main>
</body>
</html>
`;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(here, 'abnahme.mjs')) {
  if (!process.argv[2]) { console.error('usage: node abnahme.mjs abnahme.json'); process.exit(2); }
  await run(process.argv[2]);
}
