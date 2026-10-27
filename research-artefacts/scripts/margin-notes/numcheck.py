# Does the marginal number equal the number of offenders released in the entry (Schmid 2016, p. 15)?
import json
from collections import Counter
from lxml import etree
from pathlib import Path
REPO = Path(__file__).resolve().parents[3]  # repository root
T = "{http://www.tei-c.org/ns/1.0}"
X = "{http://www.w3.org/XML/1998/namespace}id"
doc = etree.parse(str(REPO / "tei/ufbas.1563.xml"))
items = json.load(open("items.json", encoding="utf-8"))
rows = json.load(open("rows.json", encoding="utf-8"))
ne = {n["id"]: n["entry"] for n in rows["notes"]}
tot = Counter()
for it in items:
    if it["norm"] and it["num"] and it["num"].isdigit():
        tot[ne[it["note"]]] += int(it["num"])
res = Counter(); odd = []
for eid, s in tot.items():
    e = doc.xpath(f"//*[@xml:id='{eid}']")[0]
    # offenders named in the heading; nested offender persNames (wife of ...) counted once
    offs = [p for p in e.iter(T + "persName") if "#uf_PersonTäter" in (p.get("ana") or "").split()
            and not any("#uf_PersonTäter" in (a.get("ana") or "").split() for a in p.iterancestors(T + "persName"))]
    head_offs = [p for p in offs if any(a.tag == T + "head" for a in p.iterancestors())]
    n = len(head_offs) or len(offs)
    res["equal" if n == s else ("num<offenders" if s < n else "num>offenders")] += 1
    if n != s: odd.append((eid, s, n))
print(res); print(odd[:40])
