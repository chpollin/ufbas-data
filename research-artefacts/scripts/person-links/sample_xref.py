# Draw a fixed random sample of person links from the editorial cross-references and print both sides
# with context, for reading by hand. Judgements are recorded in judgements_xref.tsv.
import json, random, sys
from common import load, text_of
sys.stdout.reconfigure(encoding="utf-8")
doc, body, entries = load(); by = {e["id"]: e for e in entries}
links = [l for l in json.load(open("links.json", encoding="utf-8")) if not l["group"]]
random.seed(20260924)
sample = random.sample(range(len(links)), 36)


def ctx(entry, ptext, width=260):
    full = entry["full"]
    i = full.find(ptext[:25]) if ptext else -1
    if i < 0:
        return full[:2 * width]
    return full[max(0, i - width): i + len(ptext) + width]


for k, i in enumerate(sample, 1):
    l = links[i]
    s, t = by[l["src_entry"]], by[l["tgt_entry"]]
    print(f"### S{k:02d} link#{i} {l['src_entry']} -> {l['tgt_entry']} ({l['method']}, {l['direction']})")
    print(f"subject: {l['subject']} | cited: {l['cited_head']} ({l['fol_raw']})")
    print(f"SRC {s['date']} head: {s['head'][:120]}")
    print(f"  person [{l['src_person_role']}]: {l['src_person_text']}")
    print(f"  ctx: {ctx(s, l['src_person_text'])}")
    print(f"TGT {t['date']} head: {t['head'][:120]}")
    print(f"  person [{l['tgt_person_role']}] ({l['tgt_name_score']}): {l['tgt_person_text']}")
    print(f"  ctx: {ctx(t, l['tgt_person_text'])}")
    print()
