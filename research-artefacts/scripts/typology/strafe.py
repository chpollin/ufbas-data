# All Strafe segments with entry id and source line (read-only on the repository).
import sys
from collections import defaultdict
from lxml import etree
from features import text
from pathlib import Path
REPO = Path(__file__).resolve().parents[3]  # repository root

sys.stdout.reconfigure(encoding="utf-8")
T = "{http://www.tei-c.org/ns/1.0}"
XID = "{http://www.w3.org/XML/1998/namespace}id"
doc = etree.parse(str(REPO / "tei/ufbas.1563.xml"))
kat = etree.parse(str(REPO / "tei/ufbas.kategorien.xml"))
gloss = {}
for c in kat.iter(T + "category"):
    if c.get(XID, "").startswith("uf_Strafe"):
        gloss[c.get(XID)] = (" ".join(c.findtext(T + "catDesc/" + T + "term").split()), " ".join((c.findtext(T + "catDesc/" + T + "gloss") or "").split()))

segs = defaultdict(list)
for el in doc.iter():
    if not isinstance(el.tag, str):
        continue
    for t in (el.get("ana") or "").split():
        t = t.lstrip("#")
        if t.startswith("uf_Strafe"):
            ent = next((a for a in el.iterancestors(T + "div") if a.get("ana") == "#uf_Eintrag"), None)
            segs[t].append((ent.get(XID) if ent is not None else "(outside entry)", el.sourceline, text(el)))

only = sys.argv[1:] or None
for cid, (term, gl) in gloss.items():
    s = segs.get(cid, [])
    ents = {x[0] for x in s}
    print(f"\n## {cid} | {term} | gloss: {gl} | elements={len(s)} entries={len(ents - {'(outside entry)'})} outside={sum(1 for x in s if x[0] == '(outside entry)')}")
    if only and cid not in only:
        continue
    for e, line, t in s:
        print(f"   {e:14s} l.{line:<6d} {t[:230]}")
