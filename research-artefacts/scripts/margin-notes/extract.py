# Extract every marginal entry note (uf_Eingangsnotiz) and every guard/prison keyword of UFBAS
# into flat JSON rows, so the later counts rest on one extraction. Writes rows.json for analyse.py,
# the first step towards margin-note-normalisation.csv.
import json
import re
import sys
from pathlib import Path
from lxml import etree

SRC = str(Path(__file__).resolve().parents[3] / "tei/ufbas.1563.xml")
# Output folder for rows.json, the first argument or the working directory.
OUT = (Path(sys.argv[1]) if len(sys.argv) > 1 else Path.cwd()) / "rows.json"
T = "{http://www.tei-c.org/ns/1.0}"
XID = "{http://www.w3.org/XML/1998/namespace}id"
CATS = {"uf_SchlagwortRatsknecht", "uf_SchlagwortStadtknecht", "uf_SchlagwortObersterKnecht",
        "uf_SchlagwortGefängnis", "uf_SchlagwortSpital", "uf_SchlagwortKnecht"}

doc = etree.parse(SRC)
body = doc.find(T + "text/" + T + "body")


def tokens(el):
    return [a.lstrip("#") for a in (el.get("ana") or "").split()]


def norm(s):
    return " ".join(s.split())


# document-order walk to know the current image number (pb/@facs) for each element
img = {}
cur = None
for el in body.iter():
    if el.tag == T + "pb":
        m = re.search(r"#(\d+)$", el.get("facs") or "")
        cur = int(m.group(1)) if m else cur
    img[el] = cur


def entry_of(el):
    for a in el.iterancestors():
        if "uf_Eintrag" in tokens(a):
            return a
    return None


def entry_dates(e):
    if e is None:
        return []
    return [d.get("when") for d in e.iter(T + "date") if "uf_DatumUrfehde" in tokens(d) and d.get("when")]


def is_margin(n):
    # Marginal entry notes: encoded as uf_Eingangsnotiz, or as a plain margin note (no @change, which marks the "+" additions)
    if not isinstance(n.tag, str):
        return False
    if "uf_Eingangsnotiz" in tokens(n):
        return True
    if n.tag != T + "note" or n.get("change") or n.get("resp"):
        return False
    # plain margin notes, and bare <note> elements that carry a guard name at the head of an entry
    return n.get("rend") == "margin" or not n.get("rend")


def in_note(el):
    for a in el.iterancestors():
        if is_margin(a):
            return a
    return None


notes = []
for n in body.iter():
    if not is_margin(n):
        continue
    e = entry_of(n)
    if e is None:  # margin note placed just before its entry
        nxt = n.xpath("following::*[contains(concat(' ', @ana, ' '), ' #uf_Eintrag ')][1]")
        e = nxt[0] if nxt else None
    kids = []
    for k in n.iter():
        if k is n:
            continue
        cats = [t for t in tokens(k) if t in CATS]
        if cats:
            kids.append({"cats": cats, "text": norm(k.xpath("string()")), "tag": etree.QName(k).localname})
    notes.append({
        "id": n.get(XID) or f"margin@{n.sourceline}", "encoded": "Eingangsnotiz" if "uf_Eingangsnotiz" in tokens(n) else ("plain margin note" if n.get("rend") else "bare note"), "line": n.sourceline, "tag": etree.QName(n).localname, "ana": n.get("ana"),
        "entry": e.get(XID) if e is not None else None, "dates": entry_dates(e), "img": img.get(n),
        "text": norm(n.xpath("string()")),
        "nums": [norm(x.xpath("string()")) for x in n.iter(T + "num")],
        "kids": kids,
    })

mentions = []
for k in body.iter():
    if not isinstance(k.tag, str):
        continue
    cats = [t for t in tokens(k) if t in CATS]
    if not cats:
        continue
    e = entry_of(k)
    host = in_note(k)
    mentions.append({
        "cats": cats, "text": norm(k.xpath("string()")), "tag": etree.QName(k).localname, "line": k.sourceline,
        "where": ("note" if "uf_Eingangsnotiz" in tokens(host) else "margin-other") if host is not None else "text",
        "entry": e.get(XID) if e is not None else None, "dates": entry_dates(e), "img": img.get(k),
    })

blumen = []
for m in body.iter(T + "metamark"):
    if (m.get("rend") or "").lower() == "blume":
        e = entry_of(m)
        # nearest following entry if the flower sits between entries
        if e is None:
            nxt = m.xpath("following::*[contains(concat(' ', @ana, ' '), ' #uf_Eintrag ')][1]")
            e = nxt[0] if nxt else None
        blumen.append({"line": m.sourceline, "img": img.get(m), "entry": e.get(XID) if e is not None else None,
                       "dates": entry_dates(e)})

entries = []
for e in body.iter():
    if isinstance(e.tag, str) and "uf_Eintrag" in tokens(e):
        entries.append({"id": e.get(XID), "line": e.sourceline, "dates": entry_dates(e), "img": img.get(e)})

json.dump({"notes": notes, "mentions": mentions, "blumen": blumen, "entries": entries},
          open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
print(len(notes), len(mentions), len(blumen), len(entries))
