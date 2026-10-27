# Dump every editorial note with its entry id, for reading the phrasing variants of cross-references.
import re, sys
from lxml import etree
from pathlib import Path
REPO = Path(__file__).resolve().parents[3]  # repository root
sys.stdout.reconfigure(encoding="utf-8")
T = "{http://www.tei-c.org/ns/1.0}"
doc = etree.parse(str(REPO / "tei/ufbas.1563.xml"))
body = doc.find(T + "text/" + T + "body")
for n in body.iter(T + "note"):
    if n.get("resp") != "#editor": continue
    t = " ".join(n.xpath("string()").split())
    e = n.xpath("ancestor::*[@ana='#uf_Eintrag'][1]/@xml:id")
    print(e[0] if e else "-", "|", t)
