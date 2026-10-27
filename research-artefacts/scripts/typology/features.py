# Per-entry feature table for the UFBAS entry typology (read-only on the repository).
import re
import sys
from lxml import etree
from pathlib import Path
REPO = Path(__file__).resolve().parents[3]  # repository root

sys.stdout.reconfigure(encoding="utf-8")
T = "{http://www.tei-c.org/ns/1.0}"
XID = "{http://www.w3.org/XML/1998/namespace}id"
doc = etree.parse(str(REPO / "tei/ufbas.1563.xml"))
body = doc.find(T + "text/" + T + "body")


def toks(el):
    return [t.lstrip("#") for t in (el.get("ana") or "").split()]


def text(el, skip_notes=True):
    out = []

    def rec(e):
        if e.text:
            out.append(e.text)
        for ch in e:
            n = ch.tag.replace(T, "") if isinstance(ch.tag, str) else None
            if n == "note" and skip_notes:
                pass
            elif n in ("lb", "pb"):
                out.append("" if ch.get("break") == "no" else " ")
            elif n is not None:
                rec(ch)
            if ch.tail:
                out.append(ch.tail)
    rec(el)
    return " ".join("".join(out).split())


# folio page: last pb before the entry
pages = {}
cur = None
for el in body.iter():
    if el.tag == T + "pb":
        cur = (el.get("facs") or "").split("#")[-1]
    elif el.tag == T + "div" and el.get("ana") == "#uf_Eintrag":
        pages[el.get(XID)] = cur

KW = {
    "vergicht": r"vergich|verjich|veriehen|verjehen",
    "bekantnus": r"bekan[dt]*nus|bekandtnus|bekenn",
    "aussag": r"ussag|aussag|anzeigt|bericht|bescheid",
    "concept": r"concept|entwurf",
    "verschriben": r"verschrib|verschreib",
    "sybnen": r"besybn|sybenherren|siebner",
}

entries = [d for d in body.iter(T + "div") if d.get("ana") == "#uf_Eintrag"]
rows = []
for d in entries:
    eid = d.get(XID)
    ana = [t for el in d.iter() for t in toks(el)]
    head = d.find(T + "head")
    headtxt = text(head) if head is not None else ""
    full = text(d)
    notes_ed = [" ".join((n.xpath("string()")).split()) for n in d.iter(T + "note") if n.get("resp") == "#editor"]
    notes_other = [(n.get("rend"), n.get("change"), " ".join((n.xpath("string()")).split())) for n in d.iter(T + "note") if n.get("resp") != "#editor" and n.get("ana") != "#uf_Eingangsnotiz"]
    dels = [" ".join(x.xpath("string()").split()) for x in d.iter(T + "del")]
    dates = [x.get("when") for x in d.iter(T + "date") if "uf_DatumUrfehde" in toks(x)]
    hands = [x.get("scribe") for x in d.iter(T + "handShift")]
    kinit = [x.get("rend") for x in d.iter(T + "metamark")]
    kw = {k: bool(re.search(v, full, re.I)) for k, v in KW.items()}
    strafe = sorted({t for t in ana if t.startswith("uf_Strafe")})
    rows.append(dict(
        id=eid, page=pages.get(eid), line=d.sourceline,
        date=dates, eid_=("uf_Urfehdeeid" in ana), notar=("uf_NotarialSubscription" in ana),
        taeter=ana.count("uf_PersonTäter"), zeuge=ana.count("uf_PersonZeuge"),
        strafe=len(strafe), haft=("uf_Untersuchungshaft" in ana), eingang=("uf_Eingangsnotiz" in ana),
        kringel=("Kringel" in kinit), hands=hands, dels=dels, ed=notes_ed, oth=notes_other,
        kw=[k for k, v in kw.items() if v], head=headtxt[:110], nchar=len(full), full=full,
    ))

if __name__ == "__main__":
    flagged = [r for r in rows if not r["date"] or not r["eid_"] or not r["notar"] or r["dels"] or r["ed"] and any(("Aussage" in x or "bricht" in x or "Entwurf" in x or "Fortsetzung" in x or "gehört" in x) for x in r["ed"]) or r["zeuge"] and not r["taeter"] or {"vergicht", "bekantnus", "concept", "verschriben"} & set(r["kw"])]
    print("entries", len(rows), "flagged", len(flagged))
    for r in flagged:
        print(f"\n### {r['id']} page#{r['page']} line {r['line']} chars={r['nchar']}")
        print(f"  date={r['date']} eid={r['eid_']} notar={r['notar']} taeter={r['taeter']} zeuge={r['zeuge']} strafe={r['strafe']} haft={r['haft']} eingang={r['eingang']} kringel={r['kringel']} hands={r['hands']}")
        print(f"  kw={r['kw']} dels={r['dels']}")
        print(f"  ed={r['ed']}")
        print(f"  oth={r['oth']}")
        print(f"  head: {r['head']}")
        print(f"  text: {r['full'][:260]} ... {r['full'][-200:]}")
