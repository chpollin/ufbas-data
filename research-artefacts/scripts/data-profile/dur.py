# Where do @dur durations sit (enclosing category), and where is the stray #Ormalingen token.
from collections import Counter
from lxml import etree
from pathlib import Path
REPO = Path(__file__).resolve().parents[3]  # repository root
T = "{http://www.tei-c.org/ns/1.0}"; XID = "{http://www.w3.org/XML/1998/namespace}id"
doc = etree.parse(str(REPO / "tei/ufbas.1563.xml"))
c = Counter(); ents = set()
for d in doc.iter(T + "date"):
    if not d.get("dur"): continue
    anc = set()
    for a in d.iterancestors():
        for t in (a.get("ana") or "").split():
            if t.startswith(("#uf_Untersuchungshaft", "#uf_Strafe", "#uf_Datum")): anc.add(t[4:])
    for t in (d.get("ana") or "").split(): anc.add("self:" + t[4:])
    c[tuple(sorted(anc))] += 1
    if "Untersuchungshaft" in anc: ents.update(d.xpath("ancestor::*[@ana='#uf_Eintrag'][1]/@xml:id"))
for k, v in c.most_common(): print(v, k)
print("entries with a detention duration inside Untersuchungshaft:", len(ents))
for e in doc.iter():
    if isinstance(e.tag, str) and "#Ormalingen" in (e.get("ana") or ""):
        print("Ormalingen:", e.tag, dict(e.attrib))
