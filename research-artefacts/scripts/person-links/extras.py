# Side checks: the untargeted procedure categories, the date order of "earlier"/"later" notes,
# reciprocity of the editorial links, and failure categories of the resolution.
import json, sys
from collections import Counter
from common import load, text_of, T, NS
sys.stdout.reconfigure(encoding="utf-8")
doc, body, entries = load(); by = {e["id"]: e for e in entries}
for cat in ("uf_FrüheresUrfehdeverfahren", "uf_AnderesUrfehdeverfahren"):
    els = body.xpath(f".//*[contains(concat(' ', @ana, ' '), ' #{cat} ')]")
    ents = {e.xpath("ancestor::t:div[@ana='#uf_Eintrag'][1]/@xml:id", namespaces=NS)[0] for e in els}
    print(cat, "elements:", len(els), "entries:", len(ents), "tags:", Counter(etree_tag.tag.split('}')[1] for etree_tag in els))
    for e in els[:4]:
        print("   ", e.xpath("ancestor::t:div[@ana='#uf_Eintrag'][1]/@xml:id", namespaces=NS)[0], "|", text_of(e)[:120])
    # does an editorial cross-reference note exist in the same entry?
    d = json.load(open("refs.json", encoding="utf-8"))
    with_note = {r["src"] for r in d["refs"] if r["kind"] == "person"}
    print("    of these entries, with an editorial person cross-reference:", len(ents & with_note))

d = json.load(open("refs.json", encoding="utf-8"))
dirc = Counter()
for r in d["refs"]:
    if r["kind"] != "person" or r["direction"] == "other" or not r["final"]:
        continue
    sd, td = by[r["src"]]["date"], by[r["final"]]["date"]
    if not sd or not td:
        dirc[(r["direction"], "date missing")] += 1
        continue
    ok = td < sd if r["direction"] == "earlier" else td > sd
    dirc[(r["direction"], "consistent" if ok else "inconsistent")] += 1
    if not ok:
        print("direction vs date:", r["src"], sd, r["direction"], r["final"], td)
print("direction check:", dict(dirc))
print("resolution methods (all kinds):", Counter(r["method"] for r in d["refs"]))
print("notes with >1 cited entry:", sum(1 for n in d["notes"] if n["n_items"] > 1), "of", len(d["notes"]))
