// The refactoring must not change the edition text. For every entry, the visible
// text of the new page (build/edition.html) is compared with the baseline rendering of the
// 2017 code (local-test-build/baseline/edition.html, produced by the unchanged stylesheets).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { JSDOM } from 'jsdom';
import { here } from '../gams.mjs';
import { built } from './lib.mjs';

// Brackets only mark expansions. The 2017 code printed one marginal note
// with value-of and lost its brackets, so they are left out of the comparison.
const norm = (s) => s.replace(/[[\]]/g, '').replace(/\s+/g, ' ').trim();
// Folio labels are derived from the page breaks by the stylesheet, not transcribed, and
// the 2017 labels were wrong (knowledge/data.md), so both pages are compared without them.
const text = (el, labels) => { const copy = el.cloneNode(true); copy.querySelectorAll(labels).forEach((l) => l.remove()); return copy.textContent; };
const baseline = new JSDOM(readFileSync(resolve(here, 'baseline/edition.html'), 'utf8')).window.document;
const doc = new JSDOM(built('edition')).window.document;

// Words of the old text that appear in order in the new text, with the new words
// in between returned as additions. The 2017 code dropped some marginal notes, so
// the new page may add text but never lose or reorder it.
function additions(before, after) {
  const a = before.split(' '); const b = after.split(' ');
  const added = []; let i = 0;
  for (const word of b) {
    if (i < a.length && word === a[i]) { i++; } else { added.push(word); }
  }
  return i === a.length ? added.join(' ') : null;
}

let same = 0;
const changed = [];
const added = [];
for (const old of baseline.querySelectorAll('div[id^="Eintrag-"]')) {
  const entry = doc.getElementById(old.id);
  if (!entry) { changed.push([old.id, 'missing in new page']); continue; }
  const before = norm(text(old.querySelector('.col-md-8'), '.folium'));
  const after = norm(text(entry.querySelector('.entry-text'), '.folio'));
  if (before === after) { same++; continue; }
  const extraText = additions(before, after);
  if (extraText !== null) { added.push([old.id, extraText]); continue; }
  changed.push([old.id, before, after]);
}
const extra = [...doc.querySelectorAll('article.entry')].filter((a) => !baseline.getElementById(a.id)).map((a) => a.id);
console.log(`entries with identical text: ${same}`);
console.log(`entries with text only added: ${added.length}`);
for (const [id, text] of added) { console.log(`  ${id}: + ${text.slice(0, 160)}`); }
console.log(`entries with changed text: ${changed.length}`);
for (const [id, before, after] of changed) {
  console.log(`\n${id}`);
  if (after === undefined) { console.log('  ' + before); continue; }
  let i = 0; while (before[i] === after[i]) i++;
  console.log(`  before: …${before.slice(Math.max(0, i - 60), i + 100)}`);
  console.log(`  after:  …${after.slice(Math.max(0, i - 60), i + 100)}`);
}
if (extra.length) { console.log('entries only in new page:', extra.join(', ')); }

// headings of the book outside the entries keep their full text, brackets included
const keep = (s) => s.replace(/\s+/g, ' ').trim();
const oldHeads = [...baseline.querySelectorAll('.col-md-12.panel h3, .col-md-12.panel h4')]
  // the 2017 page head (.hidden-print) held the title and the icon row, both outside the text
  .filter((h) => !h.closest('div[id^="Eintrag-"]') && !h.closest('.row-height') && !h.closest('.hidden-print'))
  .map((h) => keep(h.textContent));
const newHeads = [...doc.querySelectorAll('.edition-body .book-head')].map((h) => keep(h.textContent));
const missingHeads = oldHeads.filter((h) => !newHeads.includes(h));
console.log(`book headings: ${oldHeads.length} before, ${newHeads.length} after, ${missingHeads.length} missing`);
for (const h of missingHeads) { console.log(`  missing heading: ${h}`); }
process.exit(changed.length || extra.length || missingHeads.length ? 1 : 0);
