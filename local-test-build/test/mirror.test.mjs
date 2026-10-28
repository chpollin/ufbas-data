// The copies of GAMS in the repository (GAMS.md, Rules): every file of gams/datastreams/ and
// the ingest transformations gams/ufbas-TOTEI.xsl and gams/ufbas-TORDF.xsl equal what production
// serves, read once into cache/. A prepared target value that the operator has yet to set
// differs on purpose and is listed here with its decision; once set, it leaves the list.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { GAMS, fetchCached, root, dataRoot } from '../gams.mjs';
import { runner } from './lib.mjs';

const { test, done } = runner('mirror', 'checks');

const TARGET_VALUES = { 'context-ufbas.IMPRINT.xml': 'ADR-20, revised for the current institution' };

const copies = readdirSync(resolve(dataRoot, 'gams', 'datastreams')).map((file) => {
  const [, prefix, name, ds] = file.match(/^(context|o)-(.+?)\.([A-Z-]+)\.(xml|sparql)$/);
  return { file: `gams/datastreams/${file}`, pid: `${prefix}:${name}`, ds, target: TARGET_VALUES[file] };
});
copies.push({ file: 'gams/ufbas-TOTEI.xsl', pid: 'cirilo:TEI.ufbas', ds: 'TOTEI' }, { file: 'gams/ufbas-TORDF.xsl', pid: 'cirilo:ufbas', ds: 'TORDF' });
// copies of the data package that duplicate a published datastream
copies.push({ file: 'rdf/ufbas.schema.owl', pid: 'o:ufbas.schema', ds: 'ONTOLOGY' }, { file: 'tei/ufbas.kategorien.xml', pid: 'o:ufbas.kategorien', ds: 'TEI_SOURCE' });

const norm = (text) => text.replace(/\r\n/g, '\n').trim();

for (const { file, pid, ds, target } of copies) {
  await test(`${file} ${target ? 'differs from' : 'equals'} ${pid}/${ds} on production`, async () => {
    const published = (await fetchCached(`${GAMS}/archive/objects/${pid}/datastreams/${ds}/content`)).body;
    const same = norm(published) === norm(readFileSync(resolve(dataRoot, file), 'utf8'));
    if (target) {
      assert.ok(!same, `${file} equals production, so the target value (${target}) is set and leaves TARGET_VALUES`);
    } else {
      assert.ok(same, `${file} differs from production: refresh it from GAMS, or name it as prepared target value in TARGET_VALUES and the commit`);
    }
  });
}

assert.ok(Object.keys(TARGET_VALUES).every((file) => copies.some((c) => c.file === `gams/datastreams/${file}`)), 'a target value without its file');

done();
