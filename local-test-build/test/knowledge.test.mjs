// The project documents link to each other by relative path and heading anchor. Every
// link and every related entry of a frontmatter has to reach an existing file, and an
// anchor a heading of it, with the heading ids ZimLab (GitLab) generates.
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { dataRoot as root } from '../gams.mjs';

const documents = [
  ...['knowledge', 'research-artefacts', 'snapshots'].flatMap((dir) =>
    readdirSync(resolve(root, dir)).filter((f) => f.endsWith('.md')).map((f) => `${dir}/${f}`)),
  'README.md', 'AGENTS.md', 'GAMS.md', 'local-test-build/README.md'
];

// GitLab: lower case, non-word characters removed, spaces to hyphens, runs of hyphens
// collapsed, repeated headings numbered from 1
function anchors(file) {
  const seen = new Map();
  const ids = new Set();
  for (const [, heading] of withoutCode(readFileSync(file, 'utf8')).matchAll(/^#{1,6}\s+(.+?)\s*#*$/gm)) {
    const id = heading.toLowerCase().replace(/[^\p{L}\p{N}_\s-]/gu, '').trim().replace(/\s/g, '-').replace(/-+/g, '-');
    const n = seen.get(id) ?? 0;
    seen.set(id, n + 1);
    ids.add(n ? `${id}-${n}` : id);
  }
  return ids;
}

function withoutCode(text) {
  return text.replace(/^```[\s\S]*?^```/gm, '').replace(/`[^`\n]*`/g, '');
}

const broken = [];
for (const doc of documents) {
  const text = readFileSync(resolve(root, doc), 'utf8');
  const targets = [...withoutCode(text).matchAll(/\]\(([^)\s]+)\)/g)].map((m) => m[1]);
  const related = /^related:\s*\[(.*)\]$/m.exec(text.split(/^---$/m)[1] ?? '')?.[1];
  if (related) { targets.push(...related.split(',').map((t) => t.trim()).filter(Boolean)); }
  for (const target of targets) {
    if (/^[a-z]+:/i.test(target)) { continue; }
    const [path, anchor] = target.split('#');
    const file = path ? resolve(dirname(resolve(root, doc)), decodeURIComponent(path)) : resolve(root, doc);
    if (!existsSync(file)) { broken.push(`${doc}: ${target} (no file)`); continue; }
    if (anchor && !anchors(file).has(anchor)) { broken.push(`${doc}: ${target} (no heading)`); }
  }
}

try {
  assert.deepEqual(broken, []);
  console.log(`knowledge: links of ${documents.length} documents resolve`);
} catch (error) {
  console.log(`FAIL every link reaches its file and heading\n  ${broken.join('\n  ')}`);
  process.exitCode = 1;
}
