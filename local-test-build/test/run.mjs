// Builds every page and runs all checks in order; exits non-zero on the first failure.
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { here } from '../gams.mjs';

const steps = existsSync(resolve(here, 'baseline/edition.html')) ? [] : ['make-baseline.mjs'];
// every test/*.test.mjs runs, the browser check last because it needs the longest
const tests = readdirSync(resolve(here, 'test')).filter((f) => f.endsWith('.test.mjs') && f !== 'browser.test.mjs').sort()
  .map((f) => `test/${f}`);
for (const step of [...steps, 'build.mjs', 'test/pages.smoke.mjs', ...tests, 'test/browser.test.mjs']) {
  const run = spawnSync(process.execPath, [resolve(here, step)], { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });
  const out = (run.stdout + run.stderr).split('\n').filter((l) => l && !l.startsWith('built ') && !l.includes('Not implemented')).join('\n');
  console.log(`== ${step}${out ? '\n' + out : ''}`);
  if (run.status !== 0) { process.exit(run.status || 1); }
}
