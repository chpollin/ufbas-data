# Compare numeric day, month word and two-digit year written in each date text with its @when.
import re
from collections import Counter
from lxml import etree
from pathlib import Path
REPO = Path(__file__).resolve().parents[3]  # repository root
T = "{http://www.tei-c.org/ns/1.0}"; XID = "{http://www.w3.org/XML/1998/namespace}id"
doc = etree.parse(str(REPO / "tei/ufbas.1563.xml"))
body = doc.find(T + "text/" + T + "body")
def label(el):
    return " ".join(etree.tostring(el, method="text", encoding="unicode", with_tail=False).split())
MONTHS = {1: r"jen+er|januar", 2: r"h?ornung|februar", 3: r"mert[z]?en|merz|mart", 4: r"aprel|april", 5: r"mey|may|mai|meig",
          6: r"brach|broch|juni", 7: r"höw|juli", 8: r"augst|augu|ougst", 9: r"herb|herp|septemb", 10: r"octob|wyn", 11: r"novemb|winter", 12: r"decemb|christ"}
res = Counter(); out = []
for d in body.iter(T + "date"):
    w = d.get("when"); ana = (d.get("ana") or "-").replace("#uf_", "")
    if not w or len(w) != 10: continue
    txt = label(d).lower()
    y, m, dd = int(w[:4]), int(w[5:7]), int(w[8:10])
    day = re.search(r"\b(\d{1,2})\s*(?:ten|t|\.|:)?\s*(?:tag\s+)?(?:de[sn]?\s+)?(?:" + "|".join(MONTHS.values()) + ")", txt)
    mon = [k for k, p in MONTHS.items() if re.search(r"\b(?:" + p + ")", txt)]
    yr = re.search(r"\b(\d{2})\s*(?:ten|t|\.)?\s*(?:jar|jor|iar|ior)", txt)
    checks = {
        "day": None if not day else int(day.group(1)) == dd,
        "month": None if len(mon) != 1 else mon[0] == m,
        "year": None if not yr else int(yr.group(1)) == y % 100,
    }
    for k, v in checks.items():
        res[(ana, k, v)] += 1
    if False in checks.values():
        out.append((d.xpath("ancestor::*[@ana='#uf_Eintrag'][1]/@xml:id"), d.get(XID), w, txt, {k: v for k, v in checks.items() if v is False}))
for k, v in sorted(res.items(), key=str): print(k, v)
for o in out: print("  ", o)
