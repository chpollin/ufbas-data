# Counts for the marginal-note study, built on rows.json from extract.py.
# The normalisation map is the proposal under test; every count below is recomputed from the TEI rows.
# Writes items.json for numcheck.py and prints the counts. margin-note-normalisation.csv was assembled
# from section 1 of this output and items.json, with review against the About page and Schmid 2016.
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

# Folder of rows.json and items.json, the first argument or the working directory.
BASE = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.cwd()
d = json.load(open(BASE / "rows.json", encoding="utf-8"))
N, M, E = d["notes"], d["mentions"], d["entries"]

GUARD = [  # (regex on variant, normalised form)
    (r"^(meister )?heinrich( brucker)?$|^brucker$", "Heinrich Brucker"),
    (r"^(michel )?k[öo]f+erl(j|in|ij)$", "Michel Köferlj"),
    (r"^(hanss? )?rorer$", "Hanss Rorer"),
    (r"^(pauli )?bylg?h?er$", "Pauli Bylger"),
    (r"^(jocob )?yl(i|en)dorffer$", "Jocob Ylidorffer"),
    (r"^steck$", "Ambrosius Steck"),
    (r"^uo(lin|lj|li|ji)( rack)?$", "Uolin Rack"),
    (r"^veldt[bp]ach$", "Heinrich Veldtbach"),
]
PRISON = [
    (r"^t[h]?ou?b(h[uü]s+(l[ij]n?s?|lj|li|j[ij])?)?$|^toübusslij$|^thoubhüsji$", "Taubhäuslein"),
    (r"^(gfenckniss des )?wasser(th?urns?)?$", "Wasserturm"),
    (r"^esel+(th?urns?)?$", "Eselsturm"),
    (r"^varnsperg$", "Farnsburg (Varnsperg)"),
    (r"^rh?yn\s?th?or$", "Rheintor"),
    (r"^spalen( th(urns|or)| inn gfenckniss)?$", "Spalenschwibbogen"),
    (r"^be(re|r)n?\s?hut$|^beren$", "Bärenhut"),
    (r"^sant alb[ae]ns?$|^sant$", "St. Alban (Schwibbogen)"),
    (r"^sant blesins thor$", "St. Blasientor"),
    (r"^kärcker$", "Karzer zu den Augustinern"),
    (r"^eschamer thor$", "Aeschenschwibbogen"),
    (r"^steinen$", "Steinenschwibbogen"),
    (r"^s\. jocob$", "St. Jakob"),
    (r"^spittals?$", "Spital"),
]


def norm(text, table):
    t = " ".join(text.lower().split())
    for rx, out in table:
        if re.search(rx, t):
            return out
    return None


def classify(text):
    return norm(text, GUARD) or norm(text, PRISON)


# ---- items inside marginal notes: tagged children plus untagged tokens (placeName/term without ana, bare text)
items = []  # one per named claimant in a note
for n in N:
    date = n["dates"][0] if n["dates"] else None
    if n["kids"]:
        nums = n["nums"] + [None] * (len(n["kids"]) - len(n["nums"]))
        for k, num in zip(n["kids"], nums):
            items.append({"note": n["id"], "line": n["line"], "variant": k["text"], "cat": k["cats"][0],
                          "norm": classify(k["text"]), "num": num, "date": date, "img": n["img"], "tagged": True})
    else:
        # untagged: split on the dash-number pattern or on known names
        raw = n["text"].replace("✤", "").strip()
        parts = re.findall(r"(Spalen|Sant Alb[ae]n|Steinen|Eschamer thor|S\. Jocob|Veldtbach)", raw)
        for p in parts:
            items.append({"note": n["id"], "line": n["line"], "variant": p, "cat": None, "norm": classify(p),
                          "num": (n["nums"] or [None])[0], "date": date, "img": n["img"], "tagged": False})
        if not parts:
            items.append({"note": n["id"], "line": n["line"], "variant": raw, "cat": None, "norm": None,
                          "num": None, "date": date, "img": n["img"], "tagged": False})

json.dump(items, open(BASE / "items.json", "w", encoding="utf-8"), ensure_ascii=False, indent=0)

print("# 1. Variants per normalised form inside the marginal notes")
by = defaultdict(list)
for it in items:
    by[it["norm"]].append(it)
for k in sorted(by, key=lambda x: -len(by[x])):
    its = by[k]
    dates = sorted(i["date"] for i in its if i["date"])
    var = Counter((i["variant"], (i["cat"] or "untagged").replace("uf_Schlagwort", "")) for i in its)
    s = sum(int(i["num"]) for i in its if i["num"] and i["num"].isdigit())
    print(f"\n{k}: items={len(its)} notes={len({i['note'] for i in its})} sum(num)={s} "
          f"first={dates[0] if dates else None} last={dates[-1] if dates else None} undated={sum(1 for i in its if not i['date'])}")
    for (v, c), cnt in var.most_common():
        vd = sorted(i["date"] for i in its if i["variant"] == v and (i["cat"] or "untagged").replace("uf_Schlagwort", "") == c and i["date"])
        print(f"   {v!r:28} [{c}] {cnt}  {vd[0] if vd else ''}..{vd[-1] if vd else ''}")

print("\n# 2. Category tags inside notes vs running text")
cat_where = Counter()
cat_texts = defaultdict(Counter)
for m in M:
    for c in m["cats"]:
        cat_where[(c, m["where"])] += 1
        cat_texts[(c, m["where"])][m["text"].lower()] += 1
for c in sorted({c for c, _ in cat_where}):
    print(f"{c}: note={cat_where[(c, 'note')]} text={cat_where[(c, 'text')]}")
for key in sorted(cat_texts):
    if key[1] == "text":
        print("\n", key, sum(cat_texts[key].values()), cat_texts[key].most_common())

print("\n# 3. Running-text prisons in the same entry as a guard-named marginal note")
ent_text_prison = defaultdict(list)
for m in M:
    if m["where"] == "text" and "uf_SchlagwortGefängnis" in m["cats"] and m["entry"]:
        ent_text_prison[m["entry"]].append(norm(m["text"], PRISON) or "?" + m["text"])
note_entry = {n["id"]: n["entry"] for n in N}
co = defaultdict(Counter)
guards_in_entry = defaultdict(set)
for it in items:
    e = note_entry[it["note"]]
    if it["norm"] and e:
        guards_in_entry[e].add(it["norm"])
for e, gs in guards_in_entry.items():
    for g in gs:
        for p in ent_text_prison.get(e, ["(no prison in text)"]):
            co[g][p] += 1
for g in sorted(co):
    print(g, co[g].most_common())

print("\n# 4. Running-text guard mentions: entry, text, and the claimant named in that entry's margin")
for m in M:
    roles = [c for c in m["cats"] if c in ("uf_SchlagwortRatsknecht", "uf_SchlagwortStadtknecht", "uf_SchlagwortObersterKnecht", "uf_SchlagwortKnecht")]
    if m["where"] == "text" and roles:
        print(m["line"], m["entry"], (m["dates"] or [""])[0], [r[13:] for r in roles], repr(m["text"][:70]),
              "| margin:", sorted(guards_in_entry.get(m["entry"], [])))

print("\n# 5. Blumen")
for b in d["blumen"]:
    print(b)

print("\n# 6. Half-year counts per claimant (date of entry, sum of num)")
def half(dt):
    y, mo = int(dt[:4]), int(dt[5:7])
    day = int(dt[8:10])
    return f"{y}-H{1 if (mo, day) < (6, 24) else 2}"
hy = defaultdict(Counter)
for it in items:
    if it["norm"] and it["date"]:
        hy[it["norm"]][half(it["date"])] += int(it["num"]) if it["num"] and it["num"].isdigit() else 1
periods = sorted({p for c in hy.values() for p in c})
print("claimant".ljust(26), " ".join(p[2:] for p in periods))
for g in sorted(hy, key=lambda x: -sum(hy[x].values())):
    print(g[:26].ljust(26), " ".join(str(hy[g].get(p, "")).rjust(len(p) - 2) for p in periods))
