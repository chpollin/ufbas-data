// Checks the measurement of the acceptance sheet (abnahme.mjs) on two synthetic pages in
// headless Chrome or Edge: a page with a too wide block and a 16px button must be flagged,
// a clean page with an inline link in running text must not. Without a browser the check
// fails, like the browser check.
import { findings, launch, measure } from '../abnahme.mjs';

const pages = {
  broken: '<!doctype html><html><head><meta name="viewport" content="width=device-width"></head><body style="margin:0"><div style="width:600px">breit</div><button style="width:16px;height:16px;padding:0"></button></body></html>',
  clean: '<!doctype html><html><head><meta name="viewport" content="width=device-width"></head><body style="margin:0"><p>Text mit <a href="#x">Link</a>.</p><button style="width:40px;height:40px">OK</button></body></html>'
};

const failures = [];
const browser = await launch();
try {
  await browser.send('Page.enable');
  await browser.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 600, deviceScaleFactor: 1, mobile: true });
  const results = {};
  for (const [name, html] of Object.entries(pages)) {
    const loaded = browser.once('Page.loadEventFired', 10000);
    await browser.send('Page.navigate', { url: 'data:text/html;charset=utf-8,' + encodeURIComponent(html) });
    await loaded;
    results[name] = await browser.evaluate(`(${measure})()`);
  }
  if (!(results.broken.overflow > 0)) { failures.push('abnahme: a 600px block at 390px is not flagged as overflow'); }
  if (results.broken.smallCount !== 1) { failures.push(`abnahme: the 16px button is not flagged as small target (${results.broken.smallCount})`); }
  if (results.clean.overflow !== 0) { failures.push(`abnahme: the clean page reports overflow ${results.clean.overflow}`); }
  if (results.clean.smallCount !== 0) { failures.push(`abnahme: the clean page reports small targets: ${results.clean.small.join('; ')}`); }
  if (findings({ measure: results.clean, errors: [] }).length) { failures.push('abnahme: the clean page has findings'); }
} finally {
  await browser.close();
}

if (failures.length) {
  console.log(failures.join('\n'));
  process.exit(1);
}
console.log('abnahme: overflow and target measurement flag the broken page and pass the clean one');
