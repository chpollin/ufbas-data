// Writes the page images of the volume into tei/ufbas.1563.xml (ADR-34): a facsimile
// with one surface per image a page break names, pb/@facs pointing to its surface, and
// a statement of the images in the msDesc. The images come from the IIIF manifest of the
// Digitaler Lesesaal kept in source-material/. The Lesesaal blocks non-interactive
// requests, so the manifest is saved from a browser, and when the archive moves its
// storage this script is run again on the newly saved manifest. On a TEI that has the
// facsimile already it finds each surface again by the canvas id in surface/@corresp
// and rebuilds the block from the manifest.
//
// The TEI is edited as text, so that every byte outside the facsimile block, the
// statement in the msDesc and the values of pb/@facs stays as it is. The text carries
// xml:space="preserve", and a serializer would change it.
//
//   node make-facsimile-tei.mjs [--manifest=FILE] [--retrieved=YYYY-MM-DD]
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { dataRoot } from './gams.mjs';

export const manifestFile = resolve(dataRoot, 'source-material/dls-manifest-245856.json');
export const teiFile = resolve(dataRoot, 'tei/ufbas.1563.xml');
// the day the manifest in source-material/ was saved from the browser
export const RETRIEVED = '2026-09-24';
const CREDIT = 'Staatsarchiv Basel-Stadt, Ratsbücher O 10';

const pad = (n) => String(n).padStart(4, '0');
export const surfaceId = (n) => `img${pad(n)}`;
const escape = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

// image number -> canvas, image service and size. The number is the position of the
// canvas and also part of the file name of its image.
export function manifestImages(manifestText = readFileSync(manifestFile, 'utf8')) {
  const manifest = JSON.parse(manifestText);
  const images = new Map();
  manifest.items.forEach((canvas, i) => {
    const body = canvas.items[0].items[0].body;
    const service = body.service[0].id;
    // the file name carries the image number; a manifest whose order or naming departs
    // from it must fail here instead of shifting every link by a page
    const number = Number(/Ratsbuecher_O_10_(\d{4})$/.exec(service)?.[1]);
    if (number !== i + 1) { throw new Error(`canvas ${i + 1} holds ${service}`); }
    images.set(number, { canvas: canvas.id, canvasWidth: canvas.width, canvasHeight: canvas.height, service, width: body.width, height: body.height });
  });
  return { id: manifest.id, rights: manifest.items[0].rights, images };
}

const FACSIMILE = /  <facsimile\b[\s\S]*?<\/facsimile>\n/;
const SURROGATES = /          <additional>\n            <surrogates>[\s\S]*?<\/additional>\n/;
const PB_FACS = /(<pb\b[^>]*?\bfacs=")([^"]*)(")/g;

// The image number a pb/@facs names: the number after # of the former viewer URL, or
// the surface it points to, found again in the manifest by its canvas id.
function imageNumberOf(value, surfaces, canvasNumbers) {
  const old = /#(\d+)$/.exec(value.trim());
  if (old) { return Number(old[1]); }
  const id = /^#(img\d{4})$/.exec(value)?.[1];
  const canvas = id && surfaces.get(id);
  if (!canvas) { throw new Error(`pb/@facs="${value}" names no surface of the facsimile`); }
  const number = canvasNumbers.get(canvas);
  if (!number) { throw new Error(`the canvas ${canvas} of surface ${id} is not in the manifest`); }
  return number;
}

export function facsimileTei(teiText, manifestText = readFileSync(manifestFile, 'utf8'), { retrieved } = {}) {
  const { id: manifestId, rights, images } = manifestImages(manifestText);
  const canvasNumbers = new Map([...images].map(([n, image]) => [image.canvas, n]));
  const block = FACSIMILE.exec(teiText)?.[0] ?? '';
  const surfaces = new Map([...block.matchAll(/<surface\b[^>]*\bxml:id="([^"]+)"[^>]*\bcorresp="([^"]+)"/g)].map((m) => [m[1], m[2]]));
  const date = retrieved ?? /<surrogates>[\s\S]*?<date when="([^"]+)"/.exec(teiText)?.[1] ?? RETRIEVED;

  const numbers = [];
  const text = teiText.replace(PB_FACS, (all, start, value, end) => {
    const n = imageNumberOf(value, surfaces, canvasNumbers);
    if (!images.has(n)) { throw new Error(`pb/@facs="${value}" names image ${n}, which the manifest lacks`); }
    if (!numbers.includes(n)) { numbers.push(n); }
    return `${start}#${surfaceId(n)}${end}`;
  });
  if (!numbers.length) { throw new Error('no pb/@facs in the TEI'); }

  const facsimile = [`  <facsimile source="${escape(manifestId)}">\n`];
  for (const n of numbers) {
    const image = images.get(n);
    facsimile.push(`    <surface xml:id="${surfaceId(n)}" n="${n}" lrx="${image.canvasWidth}" lry="${image.canvasHeight}" corresp="${escape(image.canvas)}">\n`,
      `      <graphic url="${escape(image.service)}" width="${image.width}px" height="${image.height}px"></graphic>\n`,
      '    </surface>\n');
  }
  facsimile.push('  </facsimile>\n');

  const statement = '          <additional>\n            <surrogates>\n' +
    `              <p>Seitenbilder: ${CREDIT}, verknüpft aus dem IIIF-Manifest des Digitalen Lesesaals <ref target="${escape(manifestId)}">${escape(manifestId)}</ref>, abgerufen am <date when="${date}">${date}</date>. Rechte: <ref target="${escape(rights)}">StABS gemeinfrei</ref>.</p>\n` +
    '            </surrogates>\n          </additional>\n';

  let out = block ? text.replace(FACSIMILE, facsimile.join('')) : text.replace('  </teiHeader>\n', `  </teiHeader>\n${facsimile.join('')}`);
  if (SURROGATES.test(out)) {
    out = out.replace(SURROGATES, statement);
  } else {
    if (!out.includes('          </msContents>\n')) { throw new Error('no msContents in the msDesc to put the statement after'); }
    out = out.replace('          </msContents>\n', `          </msContents>\n${statement}`);
  }
  if (!FACSIMILE.test(out)) { throw new Error('the facsimile block was not placed'); }
  return out;
}

// The published datastream before ADR-34, which GAMS serves until the operator's
// re-ingest: no facsimile, no statement, and pb/@facs as URL of the former viewer.
// One of those values carried leading whitespace inside the attribute. The tests compare
// the result with the hash of the published datastream, and the harness renders the
// edition page from it to check the page without page images.
const FORMER_VIEWER = 'http://dokumente.stabs.ch/view/2010/Ratsbuecher_O_10/#';
const FORMER_PADDING = { 73: ' '.repeat(25) };
export function publishedForm(teiText) {
  const numbers = new Map([...(FACSIMILE.exec(teiText)?.[0] ?? '').matchAll(/<surface\b[^>]*\bxml:id="([^"]+)"[^>]*\bn="(\d+)"/g)].map((m) => [m[1], Number(m[2])]));
  return teiText.replace(FACSIMILE, '').replace(SURROGATES, '').replace(PB_FACS, (all, start, value, end) => {
    const n = numbers.get(value.slice(1));
    if (!n) { return all; }
    return `${start}${FORMER_PADDING[n] ?? ''}${FORMER_VIEWER}${n}${end}`;
  });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
  const manifest = readFileSync(arg('manifest') ?? manifestFile, 'utf8');
  const before = readFileSync(teiFile, 'utf8');
  const after = facsimileTei(before, manifest, { retrieved: arg('retrieved') });
  writeFileSync(teiFile, after);
  console.log(`${after === before ? 'unchanged' : 'wrote'} ${teiFile}`);
}
