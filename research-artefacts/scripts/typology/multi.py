# Entries with several offenders: count, gender mix, differentiation of sanctions (read-only).
import re
import sys
from collections import Counter
from lxml import etree
from features import text
from pathlib import Path
REPO = Path(__file__).resolve().parents[3]  # repository root

sys.stdout.reconfigure(encoding="utf-8")
T = "{http://www.tei-c.org/ns/1.0}"
XID = "{http://www.w3.org/XML/1998/namespace}id"
doc = etree.parse(str(REPO / "tei/ufbas.1563.xml"))
body = doc.find(T + "text/" + T + "body")
entries = [d for d in body.iter(T + "div") if d.get("ana") == "#uf_Eintrag"]


def has(el, tok):
    return tok in (el.get("ana") or "").split()


def gender(p):
    # own gender token first, else the first forename only: nested persNames name husbands or fathers
    toks = (p.get("ana") or "").split()
    f = next(p.iter(T + "forename"), None)
    if f is not None:
        toks += (f.get("ana") or "").split()
    return "m" if "#uf_male" in toks else "f" if "#uf_female" in toks else "?"


def offenders(d):
    """Top-level PersonTäter persNames; the head is preferred, the body only when the head has none."""
    ps = [p for p in d.iter(T + "persName") if has(p, "#uf_PersonTäter")
          and not any(has(a, "#uf_PersonTäter") for a in p.iterancestors(T + "persName"))]
    head = d.find(T + "head")
    inhead = [p for p in ps if head is not None and head in list(p.iterancestors())]
    return inhead or ps, len(ps), len(inhead)


DIFF = r"\byed(?:es|er|en|em)\b|\bjede[srnm]?\b|\bsampt und sonders\b|\bbeyd(?:e|en)?\b|\bbeid(?:e|en)?\b|\bdie zwen\b|\bsy beyde\b"
rows = []
for d in entries:
    offs, n_all, n_head = offenders(d)
    g = Counter(gender(p) for p in offs)
    strafe = [s for s in d.iter() if isinstance(s.tag, str) and any(t.startswith("#uf_Strafe") for t in (s.get("ana") or "").split())]
    full = text(d)
    rows.append(dict(id=d.get(XID), n=len(offs), n_all=n_all, n_head=n_head, g=dict(g),
                     names=[text(p)[:40] for p in offs], strafe=[(s.get("ana"), text(s)[:90]) for s in strafe],
                     diff=sorted(set(m.group(0).lower() for m in re.finditer(DIFF, full, re.I))),
                     mitt=sum(1 for p in d.iter(T + "persName") if has(p, "#uf_PersonMittäter")), full=full))

multi = [r for r in rows if r["n"] >= 2]
print("entries with >=2 offenders (head-based):", len(multi))
print("distribution:", sorted(Counter(r["n"] for r in rows).items()))
mix = Counter(("mixed" if r["g"].get("m") and r["g"].get("f") else "only m" if r["g"].get("m") and not r["g"].get("f") and not r["g"].get("?") else "only f" if r["g"].get("f") and not r["g"].get("m") and not r["g"].get("?") else "with unknown") for r in multi)
print("gender mix among multi:", dict(mix))
print("head vs body mismatch (n_all != n_head and n_head>0):", [(r["id"], r["n_head"], r["n_all"]) for r in rows if r["n_head"] and r["n_all"] != r["n_head"]][:40])
print("persons if counted by offenders:", sum(r["n"] for r in rows), " entries:", len(rows))
print("entries with PersonMittäter:", sum(1 for r in rows if r["mitt"]))
print()
for r in multi:
    print(f"{r['id']:12s} n={r['n']} g={r['g']} diff={r['diff']} names={r['names']}")


def forenames(r):
    return [n.split()[0] for n in r["names"] if n.split()]


print("\n## sanction attribution in multi-offender entries (wording heuristic)")
cls = Counter()
for r in multi:
    fn = [f for f in forenames(r) if len(f) > 2]
    named = [s for s in r["strafe"] if any(f.lower() in s[1].lower() for f in fn)]
    tags = []
    if named:
        tags.append("person-specific")
    if re.search(r"\byed(?:es|er|en|em)\b|\bjede[srnm]?\b", r["full"], re.I):
        tags.append("distributive")
    if re.search(r"sampt und sonders|\bbeyde?n?\b|\bbeide?n?\b|all dry|all vier|die zwen", r["full"], re.I):
        tags.append("joint")
    k = "+".join(tags) or "unmarked"
    cls[k] += 1
    r["cls"] = k
print(cls.most_common())
print("unmarked:", [r["id"] for r in multi if r["cls"] == "unmarked"])
print("person-specific:", [r["id"] for r in multi if "person-specific" in r["cls"]])
