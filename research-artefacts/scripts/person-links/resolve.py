# Parse the editorial cross-reference notes of UFBAS and resolve each cited heading to a target entry,
# by text alone and constrained by folio under two page mappings. Writes refs.json and prints the figures.
# editorial-crossrefs.tsv was assembled from the refs of refs.json (src, kind, subject, head, fol_raw, final, method).
import json
import re
import sys
from collections import Counter, defaultdict
from rapidfuzz import fuzz
from common import load, norm, text_of, T, XID, NS, facs_no

sys.stdout.reconfigure(encoding="utf-8")
doc, body, entries = load()
by_id = {e["id"]: e for e in entries}

# Page mappings. XSL: the formula of ufbas-object.xsl (facs N -> fol. N-18, v for odd N).
# LEAF: walk the page breaks in document order, first page = 1r, alternate r/v, take @n where present
# (32ar, 32av), skip @n='kA'. The start at 1r is fitted from the text-unique matches (see fit_folio.py).
pbs = [(facs_no(p), p.get("n")) for p in body.iter(T + "pb")]


def xsl_label(n):
    return (str(n - 18), "v" if n % 2 else "r")


leaf = {}
last_numbered = None
for n, lab in pbs:
    if lab == "kA":
        leaf[n] = None
        continue
    if lab and re.match(r"\d+a[rv]", lab):
        leaf[n] = (lab[:-1], lab[-1])
        continue
    if last_numbered is None:
        cur = (1, "r")
    else:
        k, s = last_numbered
        cur = (k, "v") if s == "r" else (k + 1, "r")
    leaf[n] = (str(cur[0]), cur[1])
    last_numbered = cur

# LEAF_GAP: like LEAF, but the missing images 219-220 count as one leaf (two pages). Alternative hypothesis.
leaf_gap = {}
shift = False
for n, _ in pbs:
    v = leaf[n]
    if n >= 221 and v and v[0].isdigit():
        k, s = int(v[0]), v[1]
        v = (str(k + 1), s)
    leaf_gap[n] = v

MAPS = {"xsl": {n: xsl_label(n) for n, _ in pbs}, "leaf": leaf, "leaf_gap": leaf_gap}


def entry_folios(e, m):
    return {MAPS[m][n] for n in e["pages"] if MAPS[m].get(n)}


def parse_folio(s):
    """'fol. 43 verso/ 44 recto' -> [('43','v'),('44','r')]; 'fol. 60 recto/ verso' -> [('60','r'),('60','v')]"""
    out, num = [], None
    for tok in re.findall(r"\d+a?|recto|verso", s):
        if tok[0].isdigit():
            num = tok
        elif num:
            out.append((num, tok[0]))
    return out


XREF = re.compile(r"^(?P<subj>.*?)\s+komm(?:t|en)\s+in\s+(?P<kind>.*?)\s*Urfe\w*\s+(?:schon\s+)?(?:vor)?\s*,?\s*(?:siehe)?\s*(?:die\s+)?(?:Urfehdeeintr(?:ag|äge|age)\b|Urfehdeeintr(?:ag|äge|age)(?=[A-ZÄÖÜ]))?\s*(?P<rest>.*)$")
STMT1 = re.compile(r"^Aussage gehört zu Urfehdeeintrag\s*(?P<rest>.*)$")
STMT2 = re.compile(r"^Zu diesem Urfehdeeintrag gehört die Aussage\s*(?P<rest>.*)$")
CONT = re.compile(r"^Fortsetzung des Eintrags über\s*(?P<rest>.*)$")
ITEM = re.compile(r"\s*(?:,|und\b)?\s*(?P<head>[^()]+?)\s*\((?P<fol>fol\.?[^)]*)\)")


def scores(h, e):
    hn = norm(h)
    cands = [norm(e["head"])] if e["head"] else []
    full = norm(e["full"])
    s_head = fuzz.ratio(hn, cands[0]) if cands else 0
    s_pref = fuzz.ratio(hn, full[: len(hn)])
    return max(s_head, s_pref)


refs = []
notes = []
for n in body.iter(T + "note"):
    if n.get("resp") != "#editor":
        continue
    t = " ".join(n.xpath("string()").split())
    src = n.xpath("ancestor::t:div[@ana='#uf_Eintrag'][1]/@xml:id", namespaces=NS)
    src = src[0] if src else None
    m = XREF.match(t)
    if m:
        kind, subj, rest = "person", m.group("subj"), m.group("rest")
        direction = ("earlier" if "früher" in m.group("kind") else "later" if "später" in m.group("kind") else "other")
    elif STMT1.match(t) or STMT2.match(t) or CONT.match(t):
        mm = STMT1.match(t) or STMT2.match(t) or CONT.match(t)
        kind = "statement" if mm.re is not CONT else "continuation"
        subj, rest, direction = None, mm.group("rest"), None
    else:
        continue
    rest = re.sub(r"\s*für\s+\w+\s+Urfehdeverfahren\s*\.?$", "", rest)
    items = [(re.sub(r"^(?:[:,;]\s*)?(?:siehe\s+)?(?:Urfehdeeintr(?:ag|äge)\s*)?", "", i.group("head").strip()), i.group("fol"))
             for i in ITEM.finditer(rest)]
    note_id = len(notes)
    notes.append({"note": note_id, "src": src, "kind": kind, "subject": subj, "direction": direction,
                  "text": t, "n_items": len(items)})
    for head, fol in items:
        refs.append({"note": note_id, "src": src, "kind": kind, "subject": subj, "direction": direction,
                     "head": head, "fol_raw": fol, "fol": parse_folio(fol)})

# resolution
TH = 85  # text score threshold; checked against the score distribution printed below
FOL_TH = 80  # text score required for the best entry on the cited folio
order = {n: i for i, (n, _) in enumerate(pbs)}
pos_of = {}  # leaf label -> page position in document order, for the one-page tolerance
for n, _ in pbs:
    if leaf.get(n):
        pos_of[leaf[n]] = order[n]


def near(e, want, tol):
    """entry lies on one of the cited pages (leaf mapping), or within tol pages of it"""
    wp = {pos_of[w] for w in want if w in pos_of}
    ep = {order[n] for n in e["pages"] if n in order}
    return any(abs(a - b) <= tol for a in wp for b in ep)


for r in refs:
    ranked = sorted(((scores(r["head"], e), e["id"]) for e in entries if e["id"] != r["src"]), reverse=True)
    r["top"] = ranked[:3]
    best, second = ranked[0], ranked[1]
    r["text_best"] = best[1] if best[0] >= TH else None
    r["text_score"] = best[0]
    r["text_ambiguous"] = best[0] >= TH and second[0] >= best[0] - 3
    r["self_score"] = scores(r["head"], by_id[r["src"]]) if r["src"] else None
    r["cited_page_known"] = all(w in pos_of for w in r["fol"])
    for mname in MAPS:
        want = set(r["fol"])
        cands = [e for e in entries if e["id"] != r["src"] and entry_folios(e, mname) & want]
        rk = sorted(((scores(r["head"], e), len(entry_folios(e, mname) ^ want) * -1, e["id"]) for e in cands), reverse=True)
        rk = [(a, c) for a, b, c in rk]
        r["fol_" + mname] = rk[0][1] if rk and rk[0][0] >= FOL_TH else None
        r["fol_" + mname + "_score"] = rk[0][0] if rk else None
        r["fol_" + mname + "_ncand"] = len(cands)
        r["fol_" + mname + "_tie"] = len(rk) > 1 and rk[0][0] >= FOL_TH and rk[1][0] >= rk[0][0] - 3
    cands = [e for e in entries if e["id"] != r["src"] and near(e, set(r["fol"]), 1)]
    rk = sorted(((scores(r["head"], e), e["id"]) for e in cands), reverse=True)
    r["fol_near"] = rk[0][1] if rk and rk[0][0] >= FOL_TH else None
    r["fol_near_score"] = rk[0][0] if rk else None

# final: the best-matching entry on the cited folio (leaf mapping); failing that, within one page;
# failing that, a unique text match anywhere in the book, flagged as folio-inconsistent.
for r in refs:
    if r["fol_leaf"] and not r["fol_leaf_tie"]:
        r["final"], r["method"] = r["fol_leaf"], "folio-exact"
    elif r["fol_leaf"]:
        r["final"], r["method"] = r["fol_leaf"], "folio-exact-tie"
    elif r["fol_near"]:
        r["final"], r["method"] = r["fol_near"], "folio-adjacent"
    elif r["text_best"] and not r["text_ambiguous"]:
        r["final"], r["method"] = r["text_best"], "text-only-folio-mismatch"
    else:
        r["final"], r["method"] = None, "unresolved"
    r["target_is_self_better"] = r["self_score"] is not None and r["self_score"] >= max(r["text_score"], 85)

json.dump({"notes": notes, "refs": refs}, open("refs.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)

# report
print("editorial notes parsed:", Counter(n["kind"] for n in notes))
print("notes with zero items:", [(n["src"], n["text"][:90]) for n in notes if n["n_items"] == 0])
print("refs:", Counter(r["kind"] for r in refs))
print("folio unparsed:", [(r["src"], r["fol_raw"]) for r in refs if not r["fol"]])
print("text score histogram:", sorted(Counter((r["text_score"] // 5) * 5 for r in refs).items()))
for k in ("person", "statement", "continuation"):
    rr = [r for r in refs if r["kind"] == k]
    print(f"\n== {k}: {len(rr)} refs")
    print(" text unique >=%d:" % TH, sum(1 for r in rr if r["text_best"] and not r["text_ambiguous"]),
          " text ambiguous:", sum(1 for r in rr if r["text_ambiguous"]),
          " text below threshold:", sum(1 for r in rr if not r["text_best"]))
    for mname in MAPS:
        res = [r for r in rr if r["fol_" + mname]]
        agree = sum(1 for r in res if r["text_best"] and not r["text_ambiguous"] and r["fol_" + mname] == r["text_best"])
        disagree = sum(1 for r in res if r["text_best"] and not r["text_ambiguous"] and r["fol_" + mname] != r["text_best"])
        nocand = sum(1 for r in rr if r["fol_" + mname + "_ncand"] == 0)
        print(f" folio[{mname}] resolved: {len(res)}  agree with text-unique: {agree}  disagree: {disagree}  no entry on cited folio: {nocand}")
    print(" folio-near resolved:", sum(1 for r in rr if r["fol_near"]))
    print(" final methods:", Counter(r["method"] for r in rr))
    tu = [r for r in rr if r["text_best"] and not r["text_ambiguous"] and r["final"]]
    print(" text-unique vs final agree:", sum(1 for r in tu if r["final"] == r["text_best"]), "of", len(tu))
    print(" source entry itself matches the cited heading (>=85):", sum(1 for r in rr if r["target_is_self_better"]))
