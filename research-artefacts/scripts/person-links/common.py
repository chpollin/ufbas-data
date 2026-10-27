# Shared parsing of the UFBAS edition TEI: entries with page spans, head texts and persons.
import re
import unicodedata
from lxml import etree
from pathlib import Path
REPO = Path(__file__).resolve().parents[3]  # repository root

SRC = str(REPO / "tei/ufbas.1563.xml")
TEI = "http://www.tei-c.org/ns/1.0"
T = "{%s}" % TEI
XID = "{http://www.w3.org/XML/1998/namespace}id"
NS = {"t": TEI}


def text_of(el, skip=("note", "metamark", "del")):
    """Reading text of an element: notes, metamarks and deletions left out, lb/pb as space unless break=no."""
    out = []

    def walk(node):
        tag = etree.QName(node).localname if isinstance(node.tag, str) else None
        if tag in skip:
            if node.tail:
                out.append(node.tail)
            return
        if tag in ("lb", "pb", "cb"):
            if node.get("break") != "no":
                out.append(" ")
        elif node.text and tag is not None:
            out.append(node.text)
        for c in node:
            walk(c)
        if node is not el and node.tail:
            out.append(node.tail)

    if el.text:
        out.append(el.text)
    for c in el:
        walk(c)
    return " ".join("".join(out).split())


def norm(s):
    """Lowercase, fold diacritics (ë -> e, ö -> o), drop punctuation, collapse spaces."""
    s = unicodedata.normalize("NFKD", s.lower())
    s = "".join(ch for ch in s if not unicodedata.combining(ch))
    s = re.sub(r"[^\w\s]", " ", s)
    return " ".join(s.split())


def facs_no(pb):
    m = re.search(r"#(\d+)$", pb.get("facs", ""))
    return int(m.group(1)) if m else None


def load():
    doc = etree.parse(SRC)
    body = doc.find(T + "text/" + T + "body")
    entries = []
    for i, d in enumerate(body.xpath(".//t:div[@ana='#uf_Eintrag']", namespaces=NS)):
        start = d.xpath("preceding::t:pb[1]", namespaces=NS)
        pages = [facs_no(start[0])] if start else []
        pages += [facs_no(p) for p in d.iter(T + "pb")]
        head = d.find(T + "head")
        head_text = text_of(head) if head is not None else ""
        full = text_of(d)
        persons = []
        for p in d.iter(T + "persName"):
            fn = [text_of(f) for f in p.findall(T + "forename")]
            sn = [text_of(s) for s in p.findall(T + "surname")]
            persons.append({
                "id": p.get(XID), "ana": p.get("ana", ""), "text": text_of(p),
                "forename": " ".join(fn), "surname": " ".join(sn),
                "in_head": bool(p.xpath("ancestor::t:head", namespaces=NS)),
                "gender": "f" if p.xpath("./t:forename[contains(@ana,'uf_female')]", namespaces=NS)
                          else ("m" if p.xpath("./t:forename[contains(@ana,'uf_male')]", namespaces=NS) else None),
                "el": p,
            })
        date = d.xpath(".//t:date[contains(@ana,'uf_DatumUrfehde')]/@when", namespaces=NS)
        entries.append({
            "id": d.get(XID), "idx": i, "pages": pages, "head": head_text,
            "has_head": head is not None, "full": full, "persons": persons,
            "date": date[0] if date else None, "el": d,
        })
    return doc, body, entries
