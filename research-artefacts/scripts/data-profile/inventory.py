# Inventory of @ana tokens, element names carrying them, and attributes used in the edition TEI.
from collections import Counter
from lxml import etree
from pathlib import Path
REPO = Path(__file__).resolve().parents[3]  # repository root
T = "{http://www.tei-c.org/ns/1.0}"
doc = etree.parse(str(REPO / "tei/ufbas.1563.xml"))
tok = Counter(); elname = Counter(); attrs = Counter(); elements = Counter()
for el in doc.iter():
    if not isinstance(el.tag, str): continue
    n = el.tag.replace(T, "")
    elements[n] += 1
    for a in el.attrib: attrs[(n, a.split('}')[-1])] += 1
    ana = el.get("ana")
    if ana:
        for t in ana.split():
            tok[t] += 1; elname[(t, n)] += 1
print("ELEMENTS", elements.most_common())
print("ATTRS", sorted(attrs.items()))
print("ANA TOKENS", len(tok))
for t, c in sorted(tok.items()): print(c, t, [k[1] for k in elname if k[0] == t])
# tokens not in taxonomy
kat = etree.parse(str(REPO / "tei/ufbas.kategorien.xml"))
ids = {"#" + c.get("{http://www.w3.org/XML/1998/namespace}id") for c in kat.iter(T + "category")}
print("NOT IN TAXONOMY", [t for t in tok if t not in ids])
print("TAXONOMY UNUSED", sorted(i for i in ids if i not in tok))
