// data/ufbas-facsimile.json is derived from the manifest of the Digitaler Lesesaal by
// make-facsimile-data.mjs. It has to equal that derivation, and every page break of the
// edition has to find its image. The images 19 (fol. 1r) and 30 (a blank page) were
// compared by eye with the TEI on 2026-09-24 (knowledge/data.md, section Edition TEI).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { root, dataRoot } from '../gams.mjs';
import { facsimileData, outFile } from '../make-facsimile-data.mjs';
import { runner } from './lib.mjs';

const file = readFileSync(outFile, 'utf8');
const data = JSON.parse(file);
const tei = readFileSync(resolve(dataRoot, 'tei/ufbas.1563.xml'), 'utf8');
const pageBreaks = [...tei.matchAll(/<pb\b[^>]*\bfacs="[^"]*#(\d+)"/g)].map((m) => Number(m[1]));

const { test, done } = runner('facsimile-data', 'checks');

await test('the file is what the script derives from the manifest', () => {
  assert.ok(facsimileData() === file, 'data/ufbas-facsimile.json differs from the output of make-facsimile-data.mjs, run it and review the difference');
});

await test('every page break of the edition has its image', () => {
  assert.ok(pageBreaks.length > 0);
  assert.deepEqual(pageBreaks.filter((n) => !data.images[n]), []);
});

await test('the text starts on image 19, the first page of the book', () => {
  assert.equal(pageBreaks[0], 19);
  assert.match(data.images[19].service, /Ratsbuecher_O_10_0019$/);
});

done();
