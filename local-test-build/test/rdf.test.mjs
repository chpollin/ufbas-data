// The TORDF stylesheet ufbas-TORDF.xsl, run on the TEI in tei/, has to give the
// published RDF datastreams triple for triple. This holds the ground for the domain
// ontology, which extends or replaces this RDF, and catches a change of that TEI or
// of the stylesheet that would alter the RDF of a re-ingest. The published RDF is
// fetched once per object into cache/.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { JSDOM } from 'jsdom';
import SaxonJS from 'saxon-js';
import { GAMS, fetchCached, parse, render, root, dataRoot } from '../gams.mjs';
import { runner } from './lib.mjs';

const RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';

// Reads the plain RDF/XML that TORDF writes, node elements with rdf:about and property
// elements with rdf:resource, a nested node or text. Any other RDF/XML construct fails
// the check instead of being misread; extend the reader when TORDF starts to use one.
function triples(xml) {
  const doc = new JSDOM(xml, { contentType: 'application/xml' }).window.document;
  const out = [];
  const iri = (s) => `<${s}>`;
  const node = (el) => {
    for (const attr of el.attributes) {
      if (attr.namespaceURI === RDF && attr.localName !== 'about') { throw new Error(`unsupported rdf:${attr.localName} on ${el.tagName}`); }
    }
    const about = el.getAttributeNS(RDF, 'about');
    if (!about) { throw new Error(`node element ${el.tagName} without rdf:about`); }
    const s = iri(about);
    if (!(el.namespaceURI === RDF && el.localName === 'Description')) { out.push(`${s} <${RDF}type> <${el.namespaceURI}${el.localName}>`); }
    for (const prop of el.children) {
      const p = `<${prop.namespaceURI}${prop.localName}>`;
      for (const attr of prop.attributes) {
        if (attr.namespaceURI === RDF && attr.localName !== 'resource') { throw new Error(`unsupported rdf:${attr.localName} on ${prop.tagName}`); }
      }
      if (prop.hasAttributeNS(RDF, 'resource')) { out.push(`${s} ${p} ${iri(prop.getAttributeNS(RDF, 'resource'))}`); }
      else if (prop.children.length) { for (const child of prop.children) { out.push(`${s} ${p} ${iri(child.getAttributeNS(RDF, 'about'))}`); node(child); } }
      // The TEI in tei/ keeps the line breaks of the source, the ingested copy on GAMS
      // does not, so literals are compared with whitespace collapsed.
      else {
        const lang = prop.getAttribute('xml:lang');
        out.push(`${s} ${p} ${JSON.stringify(prop.textContent.replace(/\s+/g, ' ').trim())}${lang ? '@' + lang : ''}`);
      }
    }
  };
  for (const el of doc.documentElement.children) { node(el); }
  return out;
}

// TORDF names a TEI element without xml:id, mostly the page break an element appears
// on, by generate-id(), sometimes behind a prefix such as RoleName-. Its form differs
// between the Saxon of GAMS (d16e171) and SaxonJS, so both are renamed by their rank in
// document order, which the number of Saxon gives directly and SaxonJS by evaluating
// generate-id() over the TEI.
function renameGenerated(list, orderOf) {
  const pattern = /(<[^>#]*#(?:[^>]*-)?)([^>-]+)>/g;
  const found = new Map();
  for (const t of list) {
    for (const [, , id] of t.matchAll(pattern)) {
      const order = orderOf(id);
      if (order !== undefined) { found.set(id, order); }
    }
  }
  const rank = new Map([...found].sort((a, b) => a[1] - b[1]).map(([id], i) => [id, `generated${i}`]));
  return list.map((t) => t.replace(pattern, (m, base, id) => rank.has(id) ? `${base}${rank.get(id)}>` : m)).sort();
}
// the multiset difference, since TORDF repeats some triples
function difference(a, b) {
  const counts = new Map();
  for (const t of b) { counts.set(t, (counts.get(t) || 0) + 1); }
  const missing = [];
  for (const t of a) { const c = counts.get(t); if (c) { counts.set(t, c - 1); } else { missing.push(t); } }
  const extra = [...counts].flatMap(([t, c]) => Array(c).fill(t));
  return { missing, extra };
}

const { test, done } = runner('rdf', 'checks');

const tordf = 'ufbas-TORDF';
for (const pid of ['o:ufbas.1563', 'o:ufbas.kategorien']) {
  await test(`TORDF on the TEI of ${pid} gives its published RDF`, async () => {
    const tei = readFileSync(resolve(dataRoot, `tei/${pid.slice(2)}.xml`), 'utf8');
    const order = new Map(SaxonJS.XPath.evaluate('//*[not(@xml:id)]/generate-id()', await parse(tei), { resultForm: 'array' })
      .map((id, i) => [id.replace(/^d\d*/, ''), i]));
    const local = renameGenerated(triples(await render(tordf, tei)), (id) => order.get(id.replace(/^d\d*/, '')));
    const published = renameGenerated(triples((await fetchCached(`${GAMS}/archive/objects/${pid}/datastreams/RDF/content`)).body),
      (id) => /^d\d*e(\d+)$/.exec(id)?.[1] * 1 || undefined);
    const { missing, extra } = difference(published, local);
    assert.ok(local.length > 0, 'TORDF produced no triples');
    assert.ok(!missing.length && !extra.length,
      `${missing.length} published triples not derived, ${extra.length} derived triples not published\n  ` +
      [...missing.slice(0, 3).map((t) => `- ${t}`), ...extra.slice(0, 3).map((t) => `+ ${t}`)].join('\n  '));
  });
}

done();
