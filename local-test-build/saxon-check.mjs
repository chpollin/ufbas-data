// Runs the stylesheets in Saxon-HE for Java, the processor of GAMS, where the harness
// otherwise runs SaxonJS, which implements XSLT 3.0 and accepts what Saxon in 2.0 rejects
// (knowledge/testing.md#limits-of-saxonjs). Saxon-HE 9.6 is a processor of XSLT 2.0 only,
// so a construct of 3.0 is a static error there. The check
//   1. compiles every stylesheet of the served folder and exploration-data.xsl, and fails
//      on a static error,
//   2. runs ufbas-TOTEI.xsl and then ufbas-TORDF-ontology.xsl on each TEI of tei/, as
//      Cirilo runs them at an ingest, and requires the graph SaxonJS derives from the same
//      TEI, triple for triple.
// It needs a Java runtime and the Saxon-HE jar, which the harness does not install, so it
// is not part of npm test:
//   SAXON_JAR=path/to/Saxon-HE-9.6.0-10.jar [JAVA=path/to/java] node saxon-check.mjs
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { here, root, dataRoot } from './gams.mjs';
import { ontologyRDF, taxonomySKOS } from './derive-rdf.mjs';

const oxigraph = createRequire(import.meta.url)('oxigraph');
const jar = process.env.SAXON_JAR;
const java = process.env.JAVA || 'java';
if (!jar) {
  console.log('saxon-check: set SAXON_JAR to the Saxon-HE 9.x jar, and JAVA to a java executable unless java is on the PATH');
  process.exit(1);
}

const saxon = (args) => spawnSync(java, ['-cp', jar, 'net.sf.saxon.Transform', ...args], { encoding: 'utf8' });
const version = spawnSync(java, ['-cp', jar, 'net.sf.saxon.Transform', '-t', '-it:x'], { encoding: 'utf8' });
const banner = (version.stderr || '').split('\n').find((l) => /Saxon/.test(l));
if (!banner) {
  console.log(`saxon-check: Saxon did not start with ${java} and ${jar}\n${version.error || version.stderr}`);
  process.exit(1);
}
console.log(banner.trim());

let failed = 0;
const fail = (message) => { console.log(`FAIL ${message}`); failed++; };

// 1. Compilation. Without a source document and with an initial template that does not
// exist, Saxon compiles the stylesheet and stops with XTDE0040, while a static error of the
// stylesheet is reported before. ufbas-static.xsl is a module of the page stylesheets and
// compiles only inside them.
const stylesheets = readdirSync(root).filter((f) => f.endsWith('.xsl') && f !== 'ufbas-static.xsl')
  .map((f) => resolve(root, f)).concat(resolve(here, 'exploration-data.xsl'),
    ['ufbas-TOTEI.xsl', 'ufbas-TORDF.xsl', 'ufbas-TORDF-ontology.xsl'].map((f) => resolve(dataRoot, 'gams', f)));
for (const xsl of stylesheets) {
  const out = saxon([`-xsl:${xsl}`, '-it:x-no-such-template']).stderr;
  if (!/XTDE0040/.test(out)) { fail(`${xsl} does not compile in Saxon-HE:\n${out.split('\n').slice(0, 6).join('\n')}`); }
}
console.log(`compiled ${stylesheets.length} stylesheets`);

// 2. Ingest. TOTEI writes the TEI that TORDF reads, both in Saxon, into a temporary folder.
const dir = mkdtempSync(resolve(tmpdir(), 'ufbas-saxon-'));
const graph = (text) => new Set(oxigraph.parse(text, { format: 'application/rdf+xml', base_iri: 'http://gams.uni-graz.at/' }).map(String));
for (const [name, fromSaxonJS] of [['ufbas.1563', ontologyRDF], ['ufbas.kategorien', taxonomySKOS]]) {
  const tei = resolve(dir, `${name}.totei.xml`);
  const rdf = resolve(dir, `${name}.rdf`);
  let run = saxon([`-s:${resolve(dataRoot, 'tei', `${name}.xml`)}`, `-xsl:${resolve(dataRoot, 'gams', 'ufbas-TOTEI.xsl')}`, `-o:${tei}`]);
  if (run.status !== 0) { fail(`TOTEI on ${name}:\n${run.stderr}`); continue; }
  run = saxon([`-s:${tei}`, `-xsl:${resolve(dataRoot, 'gams', 'ufbas-TORDF-ontology.xsl')}`, `-o:${rdf}`]);
  if (run.status !== 0) { fail(`TORDF on ${name}:\n${run.stderr}`); continue; }
  const java = graph(readFileSync(rdf, 'utf8'));
  const js = graph(await fromSaxonJS());
  const onlyJava = [...java].filter((t) => !js.has(t));
  const onlyJs = [...js].filter((t) => !java.has(t));
  if (onlyJava.length || onlyJs.length) {
    fail(`${name}: Saxon gives ${onlyJava.length} triples SaxonJS does not, SaxonJS ${onlyJs.length} Saxon does not\n  ${[...onlyJava.slice(0, 5), ...onlyJs.slice(0, 5)].join('\n  ')}`);
  } else {
    console.log(`${name}: TOTEI and TORDF in Saxon give the ${java.size} triples of SaxonJS`);
  }
}
rmSync(dir, { recursive: true, force: true });

if (failed) { process.exit(1); }
console.log('saxon-check: passed');
