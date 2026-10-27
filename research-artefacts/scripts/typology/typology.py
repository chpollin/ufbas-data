# Rule-based entry typology for Urfehdebuch X, compared with the About counts.
# Rules are applied in order; the first matching rule decides. Read-only on the repository.
# Prints the hits per rule with the entries; entry-types.tsv was assembled from this output.
import re
import sys
from datetime import date
from features import rows

sys.stdout.reconfigure(encoding="utf-8")


def ed(r, pat):
    return any(re.search(pat, n, re.I) for n in r["ed"])


def d(s):
    y, m, dd = (int(x) for x in s.split("-"))
    return date(y, m, dd)


# chronological outliers: Urfehde date more than 180 days away from the median of the 10 dated neighbours
dated = [(i, d(r["date"][0])) for i, r in enumerate(rows) if r["date"]]
outlier = set()
for k, (i, dt) in enumerate(dated):
    neigh = [x[1] for x in dated[max(0, k - 5):k] + dated[k + 1:k + 6]]
    neigh.sort()
    med = neigh[len(neigh) // 2]
    if abs((dt - med).days) > 180:
        outlier.add(rows[i]["id"])

RULES = [
    ("fragment: continuation", lambda r: ed(r, r"^Fortsetzung des Eintrags")),
    ("fragment: notarial closing of a letter", lambda r: not r["head"] and re.search(r"hab ich .{0,120}notari", r["full"], re.I) and not r["date"]),
    ("written confession (Urfehdbrief)", lambda r: re.search(r"verschribne urphet", r["head"], re.I) or re.search(r"^\W*Ich .{0,80}bek?h?enn?", r["full"], re.I)),
    ("statement (Aussage)", lambda r: ed(r, r"^Aussage gehört zu") or (not r["date"] and not r["eid_"] and not r["notar"] and not r["strafe"] and re.search(r"\b(zeigt an|gibt disen bericht|sagt|bescheidt? .{0,20}geben)\b", r["full"][:200], re.I))),
    ("broken off", lambda r: ed(r, r"bricht hier ab")),
    ("draft (inserted leaf fol. 32a)", lambda r: r["page"] in ("85", "86") and not r["kringel"]),
    ("complete Urfehde, undated", lambda r: not r["date"] and (r["eid_"] or r["notar"])),
    ("complete Urfehde", lambda r: True),
]

ABOUT = {
    "complete Urfehde": 597 - 3, "complete Urfehde, undated": 3, "written confession (Urfehdbrief)": 3,
    "draft (inserted leaf fol. 32a)": 7, "broken off": 2, "statement (Aussage)": 7,
    "fragment: continuation": 0, "fragment: notarial closing of a letter": 0,
}

out = {}
for r in rows:
    for name, f in RULES:
        if f(r):
            out.setdefault(name, []).append(r)
            r["type"] = name
            break

print("rule                                   hits  About")
for name, _ in RULES:
    hits = out.get(name, [])
    print(f"{name:38s} {len(hits):4d}  {ABOUT[name]:4d}")
    if name != "complete Urfehde":
        for r in hits:
            print(f"      {r['id']:12s} facs#{r['page']:>4s} date={r['date']} head={r['head'][:70]!r}")
print("\nundated within each type:")
for name, hits in out.items():
    print(f"  {name:38s} undated={sum(1 for r in hits if not r['date'])}")

print("\nchronological outliers (>180 days from neighbour median):")
for r in rows:
    if r["id"] in outlier:
        print(f"  {r['id']:12s} facs#{r['page']:>4s} {r['date']} type={r['type']}")

print("\ncomplete Urfehden lacking a marker (annotation gaps or special cases):")
for r in out["complete Urfehde"]:
    miss = [k for k, v in (("Urfehdeeid", r["eid_"]), ("NotarialSubscription", r["notar"]), ("DatumUrfehde", bool(r["date"]))) if not v]
    if miss:
        m = re.search(r".{0,70}(urph|urfecht).{0,60}", r["full"], re.I)
        print(f"  {r['id']:12s} missing={miss} :: {m.group(0) if m else '-'}")
