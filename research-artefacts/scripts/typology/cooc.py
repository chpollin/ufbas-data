# Co-occurrence of each Strafe category with sanctions proper, per entry (read-only).
import sys
from collections import Counter
from features import rows, T, XID, body
sys.stdout.reconfigure(encoding="utf-8")
PROPER = {"Ausweisung", "Geldstrafe", "Gefängnis", "Körperstrafe", "Amtsentlassung"}
ent = {}
for d in body.iter(T + "div"):
    if d.get("ana") != "#uf_Eintrag":
        continue
    cats = set()
    for el in d.iter():
        if isinstance(el.tag, str):
            for t in (el.get("ana") or "").split():
                if t.startswith("#uf_Strafe"):
                    cats.add(t[10:])
    ent[d.get(XID)] = cats
types = {r["id"]: r.get("type") for r in rows}
allc = sorted({c for s in ent.values() for c in s})
print(f"{'category':28s} entries  with_proper  share")
for c in allc:
    es = [e for e, s in ent.items() if c in s]
    wp = [e for e in es if ent[e] & (PROPER - {c})]
    print(f"{c:28s} {len(es):5d}  {len(wp):5d}  {len(wp)/len(es):.2f}")
noproper = [e for e, s in ent.items() if s and not s & PROPER]
print("\nentries with Strafe annotations but no sanction proper:", len(noproper))
print("their category combinations:", Counter(tuple(sorted(ent[e])) for e in noproper).most_common(12))
print("entries with no Strafe annotation at all:", [e for e, s in ent.items() if not s])
