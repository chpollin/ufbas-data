// The page images in tei/ufbas.1563.xml (ADR-34) are written by make-facsimile-tei.mjs
// from the manifest of the Digitaler Lesesaal. The TEI has to be what the script writes,
// every page break has to point to the surface of its image, every surface has to carry
// the image service of its image number, and the file may differ from the published
// datastream only by the facsimile change until the operator's re-ingest. The images 19
// (fol. 1r) and 30 (a blank page) were compared by eye with the TEI on 2026-09-24
// (knowledge/data.md, section Edition TEI).
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { facsimileTei, manifestFile, manifestImages, publishedForm, surfaceId, teiFile } from '../make-facsimile-tei.mjs';
import { runner } from './lib.mjs';

// sha256 of the TEI_SOURCE of o:ufbas.1563 as GAMS served it on 2026-09-24 and again on
// 2026-10-27; it leaves this file once the re-ingest has replaced that datastream
const PUBLISHED_SHA256 = '8b3aaac90296eae8f347df396ad1d0777ea47a8aa5aada536b8a207aafbee1af';

const tei = readFileSync(teiFile, 'utf8');
const manifestText = readFileSync(manifestFile, 'utf8');
const { id: manifestId, images } = manifestImages(manifestText);
const block = /<facsimile\b[\s\S]*?<\/facsimile>/.exec(tei)?.[0] ?? '';
const attr = (tag, name) => new RegExp(`\\b${name}="([^"]*)"`).exec(tag)?.[1];
const surfaces = [...block.matchAll(/<surface\b[^>]*>\s*(<graphic\b[^>]*>)/g)].map((m) => ({ tag: m[0], graphic: m[1] }));
const pageBreaks = [...tei.matchAll(/<pb\b[^>]*>/g)].map((m) => attr(m[0], 'facs'));

const { test, done } = runner('facsimile-tei', 'checks');

await test('the TEI is what the script writes from the manifest', () => {
  assert.ok(facsimileTei(tei, manifestText) === tei, 'tei/ufbas.1563.xml differs from the output of make-facsimile-tei.mjs, run it and review the difference');
});

await test('every page break points to a surface, and the surfaces follow the page breaks one per image', () => {
  assert.equal(pageBreaks.length, 226);
  const ids = surfaces.map((s) => attr(s.tag, 'xml:id'));
  assert.deepEqual(pageBreaks.filter((f) => !/^#img\d{4}$/.test(f) || !ids.includes(f.slice(1))), []);
  assert.deepEqual(ids, [...new Set(pageBreaks.map((f) => f.slice(1)))]);
});

await test('every surface carries the canvas, size and image service of its image number', () => {
  assert.equal(attr(block, 'source'), manifestId);
  const wrong = surfaces.filter(({ tag, graphic }) => {
    const n = Number(attr(tag, 'n'));
    const image = images.get(n);
    return !image || attr(tag, 'xml:id') !== surfaceId(n) || attr(tag, 'corresp') !== image.canvas
      || attr(tag, 'lrx') !== String(image.canvasWidth) || attr(tag, 'lry') !== String(image.canvasHeight)
      || attr(graphic, 'url') !== image.service || attr(graphic, 'width') !== `${image.width}px` || attr(graphic, 'height') !== `${image.height}px`;
  });
  assert.deepEqual(wrong.map((s) => s.tag), []);
});

// Cirilo uploads a graphic with xml:id and mimeType as datastream (GAMS documentation,
// How to ingest objects); an external URL is only referenced
await test('no graphic invites Cirilo to upload it', () => {
  assert.deepEqual(surfaces.filter(({ graphic }) => /\b(xml:id|mimeType)=/.test(graphic)).map((s) => s.graphic), []);
  assert.ok(surfaces.every(({ graphic }) => attr(graphic, 'url').startsWith('https://')));
});

await test('the text starts on image 19, the first page of the book', () => {
  assert.equal(pageBreaks[0], '#img0019');
  assert.match(attr(surfaces[0].graphic, 'url'), /Ratsbuecher_O_10_0019$/);
});

await test('the TEI differs from the published datastream only by the facsimile change', () => {
  assert.equal(createHash('sha256').update(publishedForm(tei)).digest('hex'), PUBLISHED_SHA256);
});

await test('a storage move is one run of the script, which finds the surfaces again by their canvas', () => {
  const moved = manifestText.replaceAll('https://sos-ch-dk-2.exo.io/hfp-stabs-dls/', 'https://store.example.org/stabs/');
  const rebuilt = facsimileTei(tei, moved);
  const before = tei.split('\n');
  const changed = rebuilt.split('\n').filter((line, i) => line !== before[i]);
  assert.equal(changed.length, surfaces.length, 'one changed line per surface');
  assert.ok(changed.every((line) => line.includes('<graphic url="https://store.example.org/stabs/')));
});

done();
