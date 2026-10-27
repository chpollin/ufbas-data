// Renders the edition page with the stylesheets of the commit before the 2026
// refactoring into baseline/edition.html, the reference of test/edition-text.test.mjs.
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { compileSEF, datastream, here, render, root } from './gams.mjs';

const rev = process.argv[2] || '3a2584f';
const dir = resolve(here, 'baseline', 'xsl');
mkdirSync(dir, { recursive: true });
for (const file of ['ufbas-object.xsl', 'ufbas-static.xsl']) {
  writeFileSync(resolve(dir, file), execFileSync('git', ['show', `${rev}:${file}`], { cwd: root }));
}
const sefFile = compileSEF(resolve(dir, 'ufbas-object.xsl'), resolve(dir, 'ufbas-object.sef.json'));
// the 2017 edition stylesheet is slow in SaxonJS, about a minute
const html = await render('ufbas-object', await datastream('o:ufbas.1563', 'TEI_SOURCE'), { mode: '' }, sefFile);
writeFileSync(resolve(here, 'baseline', 'edition.html'), html);
console.log(`baseline of ${rev} written`);
