# Second route: candidate person links by normalised forename + surname across entries, compared with the
# editorial cross-references. Writes namepairs.json and prints the figures.
import json
import re
import sys
import unicodedata
from collections import Counter, defaultdict
from itertools import combinations
from rapidfuzz import fuzz
from common import load, text_of, T

sys.stdout.reconfigure(encoding="utf-8")
doc, body, entries = load()
by_id = {e["id"]: e for e in entries}

# Office holders and the notary recur in almost every entry as functionaries, not as parties; they are
# kept out of the candidate route and counted separately.
OFFICE = re.compile(r"#uf_(PersonNotar|Schlagwort\w+)")

# Forename equivalences that are standard short or Latin forms; every other variant must come from the
# spelling normalisation below. A deliberate shortcut: a curated variant list would replace this map.
FN_EQ = {"johann": "hans", "johannes": "hans", "hanns": "hans", "georg": "jerg", "jorg": "jerg",
         "sebastian": "bastean", "bastian": "bastean", "christoffel": "stofel", "claus": "niclaus",
         "niklaus": "niclaus", "mathias": "matis", "mathys": "matis", "matys": "matis"}


def fold(s):
    s = unicodedata.normalize("NFKD", s.lower())
    return "".join(ch for ch in s if not unicodedata.combining(ch) and ch.isalpha())


def spell(s):
    """Early New High German spelling variants: y/i, ck/k, dt/th/t, tz/z, ph/f, doubled consonants."""
    s = s.replace("y", "i").replace("ck", "k").replace("dt", "t").replace("th", "t").replace("tz", "z").replace("ph", "f")
    s = re.sub(r"(.)\1+", r"\1", s)
    return s


def fn_key(s):
    s = fold(s.split()[0]) if s.split() else ""
    s = FN_EQ.get(s, s)
    s = spell(s)
    if len(s) > 5 and s.endswith("en"):  # inflected forms: Heinrichen, Lienharten, Jocoben, Hanssen
        s = s[:-2]
    s = FN_EQ.get(s, s)
    return s.replace("jocob", "jacob")


def sn_key(s):
    s = spell(fold(s))
    for suf in ("en", "in", "s", "j", "i", "e"):  # dative/accusative, feminine -in/-j, genitive -s
        if len(s) > 4 and s.endswith(suf):
            s = s[: -len(suf)]
            break
    return s


mentions = []
office = 0
for e in entries:
    for p in e["persons"]:
        if not (p["forename"] and p["surname"]):
            continue
        if OFFICE.search(p["ana"]):
            office += 1
            continue
        places = set()
        for pl in p["el"].iter(T + "placeName"):
            if re.search(r"uf_Ort(Herkunft|Wohnort)", pl.get("ana", "")):
                places.add(pl.get("ref") or "#" + spell(fold(text_of(pl))))
        mentions.append({"entry": e["id"], "pid": p["id"], "text": p["text"], "ana": p["ana"],
                         "fn": fn_key(p["forename"]), "sn": sn_key(p["surname"]),
                         "fn_full": " ".join(fn_key(t) for t in p["forename"].split()), "places": places,
                         "raw": p["forename"] + " " + p["surname"], "date": e["date"]})

print("persNames with forename and surname:", sum(1 for e in entries for p in e["persons"] if p["forename"] and p["surname"]))
print("  of which office holders / notary (excluded):", office, " party mentions used:", len(mentions))

# editorial links at entry-pair and person level
links = json.load(open("links.json", encoding="utf-8"))
ed_pairs = {frozenset((l["src_entry"], l["tgt_entry"])) for l in links}
ed_person = {frozenset((l["src_person"], l["tgt_person"])) for l in links if l["src_person"] and l["tgt_person"]}

groups = defaultdict(list)
for m in mentions:
    groups[(m["fn"], m["sn"])].append(m)

exact = []
for key, ms in groups.items():
    for a, b in combinations(ms, 2):
        if a["entry"] != b["entry"]:
            exact.append((a, b))

# fuzzy tier: same forename key, surname keys similar (ratio >= 85) but not equal
by_fn = defaultdict(list)
for key in groups:
    by_fn[key[0]].append(key)
fuzzy = []
for fn, keys in by_fn.items():
    for k1, k2 in combinations(keys, 2):
        if fuzz.ratio(k1[1], k2[1]) >= 85:
            for a in groups[k1]:
                for b in groups[k2]:
                    if a["entry"] != b["entry"]:
                        fuzzy.append((a, b))


def classify(pairs, label):
    out = []
    for a, b in pairs:
        ep = frozenset((a["entry"], b["entry"]))
        pp = frozenset((a["pid"], b["pid"]))
        status = "editorial-person" if pp in ed_person else "editorial-entry-pair" if ep in ed_pairs else "new"
        out.append({"tier": label, "status": status, "a": a, "b": b})
    c = Counter(o["status"] for o in out)
    print(f"{label}: mention pairs {len(out)}  entry pairs {len({frozenset((o['a']['entry'], o['b']['entry'])) for o in out})}  status {dict(c)}")
    new_ep = {frozenset((o['a']['entry'], o['b']['entry'])) for o in out if o["status"] == "new"}
    print(f"   new entry pairs (no editorial note between the two entries): {len(new_ep)}")
    return out


ex = classify(exact, "exact-key")
fz = classify(fuzzy, "fuzzy-surname")

# recall of the name route against the editorial person links
name_pp = {frozenset((a["pid"], b["pid"])) for a, b in exact}
name_pp_f = name_pp | {frozenset((a["pid"], b["pid"])) for a, b in fuzzy}
ed_pp_named = {pp for pp in ed_person}
print("editorial person pairs:", len(ed_person), " found by exact key:", len(ed_person & name_pp),
      " by exact+fuzzy:", len(ed_person & name_pp_f))

# cluster size of the exact tier: large clusters mean common names
sizes = Counter(len({m["entry"] for m in ms}) for ms in groups.values())
print("exact-key clusters by number of entries:", sorted(sizes.items()))
big = sorted(((len({m['entry'] for m in ms}), k) for k, ms in groups.items()), reverse=True)[:12]
print("largest clusters:", big)

# v2: the whole forename must agree (Hans Friderich is not Hans), and two mentions whose persNames both
# carry an origin or residence with no place in common are dropped.
def place_conflict(a, b):
    return bool(a["places"]) and bool(b["places"]) and not (a["places"] & b["places"])


groups2 = defaultdict(list)
for m in mentions:
    groups2[(m["fn_full"], m["sn"])].append(m)
exact2 = [(a, b) for ms in groups2.values() for a, b in combinations(ms, 2)
          if a["entry"] != b["entry"] and not place_conflict(a, b)]
by_fn2 = defaultdict(list)
for key in groups2:
    by_fn2[key[0]].append(key)
fuzzy2 = [(a, b) for keys in by_fn2.values() for k1, k2 in combinations(keys, 2) if fuzz.ratio(k1[1], k2[1]) >= 85
          for a in groups2[k1] for b in groups2[k2] if a["entry"] != b["entry"] and not place_conflict(a, b)]
print("v2 dropped by forename: exact pairs v1", len(exact), "-> v2 before place filter",
      sum(1 for ms in groups2.values() for a, b in combinations(ms, 2) if a["entry"] != b["entry"]))
ex2 = classify(exact2, "v2-exact")
fz2 = classify(fuzzy2, "v2-fuzzy")
name_pp2 = {frozenset((a["pid"], b["pid"])) for a, b in exact2}
print("editorial person pairs found by v2 exact:", len(ed_person & name_pp2),
      " by v2 exact+fuzzy:", len(ed_person & (name_pp2 | {frozenset((a["pid"], b["pid"])) for a, b in fuzzy2})))

json.dump([{"tier": o["tier"], "status": o["status"],
            "a": {k: o["a"][k] for k in ("entry", "pid", "text", "ana", "raw", "date")},
            "b": {k: o["b"][k] for k in ("entry", "pid", "text", "ana", "raw", "date")}} for o in ex + fz + ex2 + fz2],
          open("namepairs.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
