# Fixed random samples of the name-route candidates that no editorial note covers: 20 from the exact-key
# tier, 10 from the fuzzy-surname tier. Judgements are recorded in judgements_names.tsv.
import json, random, sys
from common import load
sys.stdout.reconfigure(encoding="utf-8")
doc, body, entries = load(); by = {e["id"]: e for e in entries}
pairs = json.load(open("namepairs.json", encoding="utf-8"))


def ctx(entry, ptext, width=230):
    full = entry["full"]; i = full.find(ptext[:20])
    return full[:2 * width] if i < 0 else full[max(0, i - width): i + len(ptext) + width]


random.seed(20260924)
drawn = set()
# v1 tiers first (their draw is unchanged by the v2 addition), then a fresh v2 sample without v1's pairs
for tier, n in (("exact-key", 20), ("fuzzy-surname", 10), ("v2-exact", 20)):
    # one candidate per entry pair: a person named twice in one entry would otherwise be drawn twice
    seen, pool = set(), []
    for p in pairs:
        k = frozenset((p["a"]["entry"], p["b"]["entry"]))
        if p["tier"] == tier and p["status"] == "new" and k not in seen and (tier != "v2-exact" or k not in drawn):
            seen.add(k); pool.append(p)
    print(f"# {tier}: {len(pool)} new entry pairs")
    for k, p in enumerate(random.sample(pool, min(n, len(pool))), 1):
        a, b = p["a"], p["b"]
        drawn.add(frozenset((a["entry"], b["entry"])))
        print(f"### {'V' if tier == 'v2-exact' else tier[0].upper()}{k:02d} {a['entry']} ({a['date']}) <-> {b['entry']} ({b['date']})")
        for x in (a, b):
            e = by[x["entry"]]
            print(f"  [{x['ana'] or '-'}] {x['raw']} | head: {e['head'][:100]}")
            print(f"     ctx: {ctx(e, x['text'])}")
        print()
