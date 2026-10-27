// ufbas-static.xsl takes the served folder from the URL GAMS loaded it from, so the same
// commit renders on production under /ufbas and on staging from the gamsdev mirror.
// The fonts GAMS serves for all projects under /assets/ have the same path on both.
// The other checks render with the production URL only.
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { GAMS, STAGING, datastream, render } from '../gams.mjs';
import { runner } from './lib.mjs';

const { test, done } = runner('served-folder', 'checks');

const context = await datastream('context:ufbas', 'METADATA');
const assets = async (base) => {
  const html = await render('ufbas-context', context, { mode: 'imprint' }, undefined, `${base}/ufbas-context.xsl`);
  const doc = new JSDOM(html).window.document;
  return [...doc.querySelectorAll('link[rel="stylesheet"][href], script[src], img[src^="/"]')]
    .map((el) => el.getAttribute('href') || el.getAttribute('src'))
    .filter((url) => !url.startsWith('/templates/') && !url.startsWith('/assets/'));
};

await test('production loads every asset from /ufbas/', async () => {
  const urls = await assets(`${GAMS}/ufbas`);
  assert.ok(urls.length > 0, 'no assets found');
  assert.deepEqual(urls.filter((url) => !url.startsWith('/ufbas/')), []);
});

await test('staging loads every asset from the gamsdev mirror', async () => {
  const urls = await assets(`${STAGING}/gamsdev/pollin/ufbas/gams-www`);
  assert.ok(urls.length > 0, 'no assets found');
  assert.deepEqual(urls.filter((url) => !url.startsWith('/gamsdev/pollin/ufbas/gams-www/')), []);
});

done();
