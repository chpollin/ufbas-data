# Turn the resolved person cross-references into person-to-person candidate links:
# source person = the persName the note is attached to (parent or nearest preceding persName in the same element),
# target person = the persName in the target entry whose name best matches the note's subject.
# Writes links.json and prints the anchoring figures.
import json
import sys
from collections import Counter
from rapidfuzz import fuzz
from common import load, norm, text_of, T, XID, NS

sys.stdout.reconfigure(encoding="utf-8")
doc, body, entries = load()
by_id = {e["id"]: e for e in entries}
d = json.load(open("refs.json", encoding="utf-8"))

# re-find the note elements in the same order as resolve.py enumerated them
notes_el = [n for n in body.iter(T + "note") if n.get("resp") == "#editor"]
texts = [" ".join(n.xpath("string()").split()) for n in notes_el]
note_el = {}
for rec in d["notes"]:
    note_el[rec["note"]] = notes_el[texts.index(rec["text"])] if texts.count(rec["text"]) == 1 else None
# duplicated note texts: assign by order within the source entry
for rec in d["notes"]:
    if note_el[rec["note"]] is None:
        cands = [n for n, t in zip(notes_el, texts) if t == rec["text"]
                 and n.xpath("ancestor::t:div[@ana='#uf_Eintrag'][1]/@xml:id", namespaces=NS) == [rec["src"]]]
        used = {id(v) for v in note_el.values() if v is not None}
        note_el[rec["note"]] = next(c for c in cands if id(c) not in used)


def name_of(p):
    fn, sn = p["forename"], p["surname"]
    return (fn + " " + sn).strip() or p["text"]


def name_score(subject, p):
    a, b = norm(subject), norm(name_of(p))
    s = max(fuzz.token_sort_ratio(a, b), fuzz.ratio(a, norm(p["text"])[: len(a)]))
    if len(a) >= 8:  # the name inside a longer persName ("müller knecht, genant Niclaus Fry, ...")
        s = max(s, fuzz.partial_ratio(a, norm(p["text"])))
    return s


def pick_key(subject, p):
    """best name match, and among equal matches the innermost (shortest) persName"""
    return (round(name_score(subject, p)), -len(p["text"]))


def anchor_person(n, src, subject):
    """structural anchor of the note, checked against the subject name"""
    cand = []
    par = n.getparent()
    if etree_local(par) == "persName":
        cand.append(par)
    for sib in n.itersiblings(preceding=True):
        if etree_local(sib) == "persName":
            cand.append(sib)
            break
    # nested persNames count too: in "Margret von der Hecken Lienhart Ehingers eefrow" the husband is inner
    cand = cand + [x for c in cand for x in c.iter(T + "persName") if x is not c]
    pmap = {p["id"]: p for p in src["persons"]}
    struct = [pmap[c.get(XID)] for c in cand if c.get(XID) in pmap]
    best_struct = max(struct, key=lambda p: pick_key(subject, p), default=None)
    best_any = max(src["persons"], key=lambda p: pick_key(subject, p), default=None)
    return best_struct, best_any


def etree_local(el):
    return el.tag.split("}")[1] if isinstance(el.tag, str) and "}" in el.tag else None


def role(p):
    return " ".join(a.replace("#uf_", "") for a in p["ana"].split()) or "(no category)"


links = []
for r in d["refs"]:
    if r["kind"] != "person" or not r["final"]:
        continue
    src, tgt = by_id[r["src"]], by_id[r["final"]]
    n = note_el[r["note"]]
    group = r["subject"].lower().startswith("die gesellschaft")
    # a note may name two persons ("Felix Brunschwyler und Barbell Wagnerj kommen ..."): one link each
    subjects = [r["subject"]] if group else [x.strip() for x in r["subject"].split(" und ")]
    for subj in subjects:
        s_struct, s_any = anchor_person(n, src, subj)
        sp = s_struct if s_struct and name_score(subj, s_struct) >= 70 else s_any
        tp = max(tgt["persons"], key=lambda p: pick_key(subj, p), default=None)
        in_text = fuzz.partial_ratio(norm(subj), norm(tgt["full"])) if len(norm(subj)) >= 6 else 0
        links.append({
            "note": r["note"], "src_entry": r["src"], "tgt_entry": r["final"], "method": r["method"],
            "subject": subj, "group": group, "note_subject": r["subject"], "cited_head": r["head"],
            "fol_raw": r["fol_raw"], "direction": r["direction"],
            "src_person": sp["id"] if sp else None, "src_person_text": sp["text"] if sp else None,
            "src_person_role": role(sp) if sp else None,
            "src_anchor": "structural" if sp is s_struct and s_struct else "name-only",
            "src_name_score": round(name_score(subj, sp), 1) if sp else None,
            "tgt_person": tp["id"] if tp else None, "tgt_person_text": tp["text"] if tp else None,
            "tgt_person_role": role(tp) if tp else None,
            "tgt_name_score": round(name_score(subj, tp), 1) if tp else None,
            "tgt_text_score": round(in_text, 1),
            "src_date": src["date"], "tgt_date": tgt["date"],
        })

json.dump(links, open("links.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("person links:", len(links))
print("source anchor:", Counter(l["src_anchor"] for l in links))
print("source name score bands:", sorted(Counter(int(l["src_name_score"] // 10 * 10) for l in links).items()))
print("target name score bands:", sorted(Counter(int(l["tgt_name_score"] // 10 * 10) for l in links).items()))
print("unique entry pairs:", len({tuple(sorted((l["src_entry"], l["tgt_entry"]))) for l in links}))
pairs = {(l["src_entry"], l["tgt_entry"]) for l in links}
print("entry pairs with the reverse note present:", sum(1 for a, b in pairs if (b, a) in pairs), "of", len(pairs))
print("group subjects:", sum(1 for l in links if l["group"]))
print("target: annotated persName >=80:", sum(1 for l in links if not l["group"] and l["tgt_name_score"] >= 80),
      " only in text (persName <80, text >=85):", sum(1 for l in links if not l["group"] and l["tgt_name_score"] < 80 and l["tgt_text_score"] >= 85),
      " neither:", sum(1 for l in links if not l["group"] and l["tgt_name_score"] < 80 and l["tgt_text_score"] < 85))
print("low target name score (<80):")
for l in links:
    if l["tgt_name_score"] < 80:
        print(" ", l["src_entry"], "->", l["tgt_entry"], "|", l["subject"], "| tgt best:", l["tgt_person_text"][:60], l["tgt_name_score"], "| in text:", l["tgt_text_score"])
print("low source name score (<80):")
for l in links:
    if l["src_name_score"] < 80:
        print(" ", l["src_entry"], "|", l["subject"], "| src best:", l["src_person_text"], l["src_name_score"])
