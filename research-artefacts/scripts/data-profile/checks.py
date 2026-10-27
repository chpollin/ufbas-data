# Follow-up checks: annotations outside entries, weekday consistency of Julian @when, selected entries.
import re
from collections import Counter
from lxml import etree
import importlib.util
from pathlib import Path
REPO = Path(__file__).resolve().parents[3]  # repository root
T = "{http://www.tei-c.org/ns/1.0}"; XID = "{http://www.w3.org/XML/1998/namespace}id"
doc = etree.parse(str(REPO / "tei/ufbas.1563.xml"))
body = doc.find(T + "text/" + T + "body")
def label(el):
    s = etree.tostring(el, method="text", encoding="unicode", with_tail=False)
    return " ".join(s.split())
entries = [d for d in body.iter(T + "div") if d.get("ana") == "#uf_Eintrag"]
eset = set(entries)
print("== annotated elements outside entries")
for el in body.iter():
    if isinstance(el.tag, str) and el.get("ana") and el not in eset and not any(a in eset for a in el.iterancestors()):
        if "uf_male" in el.get("ana"): continue
        prev = el.xpath("preceding::*[@ana='#uf_Eintrag'][1]/@xml:id")
        print(el.get(XID), el.get("ana"), "| after", prev, "|", label(el)[:120])
def jdn_julian(y, m, d):
    a = (14 - m) // 12; yy = y + 4800 - a; mm = m + 12 * a - 3
    return d + (153 * mm + 2) // 5 + 365 * yy + yy // 4 - 32083
WD = ["montag", "zinstag", "mittwoch", "donstag", "fritag", "sambstag", "sontag"]  # jdn % 7: 0=Monday
pat = [("montag", r"m[eo]ntag"), ("zinstag", r"zi[n]?stag|dinstag"), ("mittwoch", r"mit+w[uo]?ch"), ("donstag", r"don[n]?[e]?r?stag"),
       ("fritag", r"fr[iy]t[t]?ag"), ("sambstag", r"sam[b]?[p]?stag|sampstag"), ("sontag", r"so[n]+tag")]
print("\n== weekday check of dates with a weekday word and full @when")
res = Counter(); mism = []
for d in body.iter(T + "date"):
    w = d.get("when")
    if not w or len(w) != 10: continue
    txt = label(d).lower()
    found = [n for n, p in pat if re.search(p, txt)]
    if len(found) != 1: continue
    y, m, dd = map(int, w.split("-"))
    actual = WD[jdn_julian(y, m, dd) % 7]
    ok = actual == found[0]
    res[(d.get("ana"), ok)] += 1
    if not ok:
        ent = d.xpath("ancestor::*[@ana='#uf_Eintrag'][1]/@xml:id")
        mism.append((ent, d.get(XID), w, txt, "julian weekday:", actual))
print(res)
for x in mism: print("  ", x)
print("\n== selected entries")
for i in ["Eintrag-18", "Eintrag-505", "Eintrag-146", "Eintrag-612", "Eintrag-613", "Eintrag-624", "Eintrag-150", "Eintrag-14"]:
    e = [x for x in entries if x.get(XID) == i][0]
    print(i, "|", label(e)[:500], "\n")
print("== Strosser mentions")
for el in body.iter():
    if isinstance(el.tag, str) and el.text and "Stros" in el.text:
        print(el.tag.replace(T, ""), el.get("ana"), el.get(XID), el.xpath("ancestor::*[@ana='#uf_Eintrag'][1]/@xml:id"), label(el)[:200])
print("== trailing text after last entry / between entries with annotations: see above")
print("== unresolved/odd refs")
for p in body.iter(T + "placeName"):
    r = p.get("ref")
    if r and (r != r.strip() or not r.startswith("#")):
        print(repr(r), label(p))
