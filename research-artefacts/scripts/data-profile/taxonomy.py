# Dump the category taxonomy of o:ufbas.kategorien as an indented tree with term and gloss.
import sys
from lxml import etree
from pathlib import Path
REPO = Path(__file__).resolve().parents[3]  # repository root
NS = {"t": "http://www.tei-c.org/ns/1.0"}
XML = "{http://www.w3.org/XML/1998/namespace}id"
doc = etree.parse(str(REPO / "tei/ufbas.kategorien.xml"))
tax = doc.find(".//t:taxonomy[@xml:id='Urfehdekodierung']".replace("@xml:id", "@{http://www.w3.org/XML/1998/namespace}id"), NS)
if tax is None:
    tax = [x for x in doc.iter("{http://www.tei-c.org/ns/1.0}taxonomy") if x.get(XML) == "Urfehdekodierung"][0]
def walk(el, depth):
    for c in el.findall("t:category", NS):
        term = c.findtext("t:catDesc/t:term", default="", namespaces=NS).strip()
        gloss = " ".join((c.findtext("t:catDesc/t:gloss", default="", namespaces=NS) or "").split())
        print("  " * depth + f"{c.get(XML)} | {term} | {gloss}")
        walk(c, depth + 1)
walk(tax, 0)
# other taxonomies/content in the file?
print("taxonomies:", [t.get(XML) for t in doc.iter("{http://www.tei-c.org/ns/1.0}taxonomy")])
body = doc.find(".//t:text", NS)
print("text element chars:", len("".join(body.itertext())) if body is not None else None)
