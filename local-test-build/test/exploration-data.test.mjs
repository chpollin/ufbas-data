// exploration-data.xsl, the reference for the RDF of the Exploration view, derives one
// record per entry of the edition, in the order of the edition, with the folio of the
// entry heading on the edition page. The two fragments of research-artefacts/entry-types.tsv
// have no record of their own and add their annotations to the entry they continue (ADR-12).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { JSDOM } from 'jsdom';
import { here, root, dataRoot } from '../gams.mjs';
import { explorationData } from '../make-exploration-data.mjs';
import { fragmentHosts, runner, tsv } from './lib.mjs';

const data = JSON.parse(await explorationData({ generated: 'test' }));
const types = new Map(tsv('entry-types.tsv').map((r) => [r.entry, r.type]));
const fragments = fragmentHosts();

const { test, done } = runner('exploration-data', 'checks');

await test('one record per entry of the edition except the fragments, in the order of the edition', () => {
  const edition = new JSDOM(readFileSync(resolve(dataRoot, 'tei/ufbas.1563.xml'), 'utf8'), { contentType: 'application/xml' }).window.document;
  // a p inside Eintrag-132 also carries #uf_Eintrag (Eintrag-133); entries are the divs,
  // as on the edition page
  const ids = [...edition.querySelectorAll('text > body div[ana="#uf_Eintrag"]')].map((div) => div.getAttribute('xml:id'));
  assert.equal(fragments.size, 2);
  assert.deepEqual(data.entries.map((e) => e.id), ids.filter((id) => !fragments.has(id)));
});

await test('a fragment adds itself to the entry it continues, and every record has the type of the curated table', () => {
  assert.deepEqual(data.entries.filter((e) => e.fragments).map((e) => `${e.id} ${e.fragments.join(' ')}`).sort(),
    [...fragments].map(([f, host]) => `${host} ${f}`).sort());
  const expected = (id) => {
    const t = types.get(id);
    return !t || t.startsWith('Urfehde') ? 'urfehde' : t.toLowerCase();
  };
  assert.deepEqual(data.entries.filter((e) => e.type !== expected(e.id)).map((e) => `${e.id} ${e.type}`), []);
});

// uf:folio exists in exploration-data.xsl and in ufbas-object.xsl, so the folio of
// every record has to be where the entry heading of the built edition starts.
await test('every folio equals the start of the folio in the entry heading of the edition', () => {
  const page = new JSDOM(readFileSync(resolve(here, 'build/edition.html'), 'utf8')).window.document;
  const headings = new Map([...page.querySelectorAll('[id^="Eintrag-"]')].map((entry) => [entry.id,
    entry.querySelector('.entry-folio')?.textContent.split(/\s*–\s*/)[0].replace(/^fol\. /, '') ?? null]));
  const differ = data.entries.filter((e) => headings.get(e.id) !== e.folio).map((e) => `${e.id} ${e.folio} / ${headings.get(e.id)}`);
  assert.equal(headings.size, data.entries.length + fragments.size);
  assert.deepEqual(differ, []);
});

done();
