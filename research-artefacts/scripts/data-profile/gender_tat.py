# Tat and Strafe by offender gender, from the exploration JSON (entry level; entries with offenders of one gender only).
import json
from collections import Counter
from pathlib import Path
REPO = Path(__file__).resolve().parents[3]  # repository root
# data/ufbas-exploration.json on 2026-09-24, now derived/ufbas-exploration.json, written by local-test-build/make-exploration-data.mjs
d = json.load(open(REPO / "derived/ufbas-exploration.json", encoding="utf-8"))
grp = {c["id"]: c["group"] for c in d["categories"]}
tat = {"m": Counter(), "f": Counter()}; strafe = {"m": Counter(), "f": Counter()}; n = Counter()
for e in d["entries"]:
    gs = {o["gender"] for o in e["offenders"]}
    if gs not in ({"m"}, {"f"}): continue
    g = gs.pop(); n[g] += 1
    for c in {a["category"] for a in e["annotations"]}:
        if grp.get(c) == "Tat": tat[g][c] += 1
        if grp.get(c) == "Strafe": strafe[g][c] += 1
print("entries with only male / only female offenders:", dict(n))
for g in ("f", "m"):
    print(g, "Tat top:", tat[g].most_common(12))
    print(g, "Strafe top:", strafe[g].most_common(8))
# Ausweisung share per year
yr = Counter(); aus = Counter()
for e in d["entries"]:
    if not e["date"]: continue
    y = e["date"][:4]; yr[y] += 1
    if any(a["category"] == "StrafeAusweisung" for a in e["annotations"]): aus[y] += 1
print("Ausweisung entries per year / entries:", [(y, aus[y], yr[y]) for y in sorted(yr)])
print("annotations per entry: min/median/max", (lambda s: (s[0], s[len(s)//2], s[-1]))(sorted(len(e["annotations"]) for e in d["entries"])))
print("JSON entry keys:", sorted({k for e in d["entries"] for k in e}), " offender keys:", sorted({k for e in d["entries"] for o in e["offenders"] for k in o}))
print("JSON groups:", Counter(c["group"] for c in d["categories"]))
