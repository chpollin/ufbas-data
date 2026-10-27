# Map the 2016 course TEI files onto the edition entries (read-only on the repository).
import glob
import os
import re
import sys
from difflib import SequenceMatcher
from lxml import etree
from pathlib import Path
REPO = Path(__file__).resolve().parents[3]  # repository root

sys.stdout.reconfigure(encoding="utf-8")
T = "{http://www.tei-c.org/ns/1.0}"
XID = "{http://www.w3.org/XML/1998/namespace}id"


def norm(s):
    return " ".join(s.split())


def txt(el):
    out = []

    def rec(e):
        if e.text:
            out.append(e.text)
        for ch in e:
            n = ch.tag.replace(T, "") if isinstance(ch.tag, str) else None
            if n == "note":
                pass
            elif n in ("lb", "pb"):
                out.append("" if ch.get("break") == "no" else " ")
            elif n is not None:
                rec(ch)
            if ch.tail:
                out.append(ch.tail)
    rec(el)
    return norm("".join(out))


def page_of(el, body):
    cur = None
    for x in body.iter():
        if x.tag == T + "pb":
            cur = (x.get("facs") or "").split("#")[-1]
        if x is el:
            return cur


def entries_of(tree):
    body = tree.find(".//" + T + "body")
    res = []
    cur = None
    for x in body.iter():
        if x.tag == T + "pb":
            cur = (x.get("facs") or "").split("#")[-1]
        elif x.tag == T + "div":
            dates = [d.get("when") for d in x.iter(T + "date") if "#uf_DatumUrfehde" in (d.get("ana") or "")]
            res.append(dict(ana=x.get("ana"), id=x.get(XID), page=cur, line=x.sourceline, text=txt(x), dates=dates))
    return res


ed = entries_of(etree.parse(str(REPO / "tei/ufbas.1563.xml")))
ed_entries = [e for e in ed if e["ana"] == "#uf_Eintrag"]
print("edition divs", len(ed), "entry divs", len(ed_entries))
for e in ed:
    if e["ana"] != "#uf_Eintrag":
        print("  edition non-entry div", e["line"], e["page"], e["text"][:80])

course = []
for f in sorted(glob.glob(str(REPO / "source-material/course-2016" / "UF *.xml"))):
    es = entries_of(etree.parse(f))
    for e in es:
        e["file"] = os.path.basename(f)
    course += es
    n = sum(1 for e in es if e["ana"] and "uf_Eintrag" in e["ana"])
    print(os.path.basename(f), "divs", len(es), "entry divs", n, "pages", es[0]["page"] if es else None, es[-1]["page"] if es else None)
ce = [e for e in course if e["ana"] and "uf_Eintrag" in e["ana"]]
print("course entry divs total", len(ce), "all divs", len(course))
for e in course:
    if not (e["ana"] and "uf_Eintrag" in e["ana"]):
        print("  course non-entry div", e["file"], e["line"], e["page"], e["text"][:100])

# match by text similarity of the first 200 characters
used = {}
unmatched = []
for c in ce:
    best, score = None, 0
    for e in ed_entries:
        s = SequenceMatcher(None, c["text"][:200], e["text"][:200]).quick_ratio()
        if s > score:
            best, score = e, s
    if score > 0.8:
        best2 = SequenceMatcher(None, c["text"][:300], best["text"][:300]).ratio()
    else:
        best2 = 0
    c["match"], c["score"] = best["id"], round(best2, 3)
    used.setdefault(best["id"], []).append(c)
print("\n## course entries with weak match (<0.85)")
for c in ce:
    if c["score"] < 0.85:
        print(c["file"], c["line"], c["page"], c["match"], c["score"], "|", c["text"][:150])
print("\n## edition entries matched by several course divs")
for k, v in used.items():
    if len(v) > 1:
        print(k, [(c["file"], c["line"], c["page"], c["score"], c["text"][:90]) for c in v])
print("\n## edition entries with no course match")
for e in ed_entries:
    if e["id"] not in used:
        print(e["id"], e["page"], e["text"][:120])

print("\n## file -> edition id range")
from collections import OrderedDict
rng = OrderedDict()
for c in ce:
    rng.setdefault(c["file"], []).append(int(c["match"].split("-")[1]))
for f, ids in sorted(rng.items(), key=lambda kv: min(kv[1])):
    print(f, min(ids), max(ids), len(ids), "monotone" if ids == sorted(ids) else "NOT monotone")
for c in ce:
    if c["match"] in ("Eintrag-270",):
        e = [x for x in ed_entries if x["id"] == "Eintrag-270"][0]
        print("course", c["text"][:300]); print("edition", e["page"], e["text"][:300])
