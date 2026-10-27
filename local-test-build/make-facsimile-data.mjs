// Writes data/ufbas-facsimile.json, the page images of the volume, from the IIIF
// manifest of the Digitaler Lesesaal kept in source-material/. The Lesesaal blocks
// non-interactive requests, so the manifest is saved from a browser and this file is
// regenerated from it when the archive changes its storage. It is served from the
// project folder. The image number is the one in the pb/@facs URLs
// of the TEI (knowledge/data.md, section Edition TEI).
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { root, dataRoot } from './gams.mjs';

export const manifestFile = resolve(dataRoot, 'source-material/dls-manifest-245856.json');
export const outFile = resolve(root, 'data/ufbas-facsimile.json');

export function facsimileData(manifestText = readFileSync(manifestFile, 'utf8')) {
  const manifest = JSON.parse(manifestText);
  const images = {};
  manifest.items.forEach((canvas, i) => {
    const body = canvas.items[0].items[0].body;
    const service = body.service[0].id;
    // the file name carries the image number; a manifest whose order or naming departs
    // from it must fail here instead of shifting every link by a page
    const number = Number(/Ratsbuecher_O_10_(\d{4})$/.exec(service)?.[1]);
    if (number !== i + 1) { throw new Error(`canvas ${i + 1} holds ${service}`); }
    images[number] = { service, width: body.width, height: body.height };
  });
  const first = manifest.items[0];
  return JSON.stringify({
    source: { manifest: manifest.id, record: 'https://dls.staatsarchiv.bs.ch/records/315538', rights: first.rights, credit: 'Staatsarchiv Basel-Stadt, Ratsbücher O 10' },
    images
  });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const json = facsimileData();
  writeFileSync(outFile, json);
  console.log(`wrote ${outFile} (${Buffer.byteLength(json)} bytes)`);
}
