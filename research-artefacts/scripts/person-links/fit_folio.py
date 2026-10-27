# Fit the facsimile-number -> folio mapping from the cross-references that resolve uniquely by text:
# offset = facs N of the target's first page - (2*folio + (1 if verso)). A constant offset per stretch of
# the book confirms a page-by-page count; jumps mark unnumbered pages, inserted leaves and missing images.
import json, sys
from collections import Counter, defaultdict
from common import load
sys.stdout.reconfigure(encoding="utf-8")
doc, body, entries = load(); by = {e["id"]: e for e in entries}
d = json.load(open("refs.json", encoding="utf-8"))
off = defaultdict(Counter)
for r in d["refs"]:
    if r["text_best"] and not r["text_ambiguous"] and r["text_score"] >= 95 and len(r["fol"]) == 1 and r["fol"][0][0].isdigit():
        k, s = int(r["fol"][0][0]), r["fol"][0][1]
        pos = 2 * k + (1 if s == "v" else 0)
        pages = by[r["text_best"]]["pages"]
        o = next((p - pos for p in pages if p - pos in (17, 19, 21, 23)), pages[0] - pos)
        band = "19-44" if pages[0] <= 44 else "47-84" if pages[0] <= 84 else "87-218" if pages[0] <= 218 else "221-246"
        off[band][o] += 1
        if o not in (17, 19, 21, 23) or (band, o) not in {("19-44", 17), ("47-84", 19), ("87-218", 21), ("221-246", 23)}:
            print("outlier", band, o, r["src"], "->", r["text_best"], r["fol_raw"], pages)
for b in ("19-44", "47-84", "87-218", "221-246"):
    print(b, dict(off[b]))
