# Classify editorial notes (@resp) by their wording, to see how cross-references between entries are expressed.
import re
from collections import Counter
from lxml import etree
from pathlib import Path
REPO = Path(__file__).resolve().parents[3]  # repository root
T = "{http://www.tei-c.org/ns/1.0}"
doc = etree.parse(str(REPO / "tei/ufbas.1563.xml"))
body = doc.find(T + "text/" + T + "body")
kinds = Counter(); ents = {}
for n in body.iter(T + "note"):
    if not n.get("resp"): continue
    t = " ".join(n.xpath("string()").split())
    if re.search(r"kommt in (einem )?ander", t): k = "person appears in other Urfehde (folio + heading text)"
    elif re.search(r"früher", t, re.I): k = "earlier procedure"
    elif t.startswith("Aussage gehört"): k = "statement belongs to entry"
    elif "Nachfolger Johann Strosser" in t: k = "Strosser note"
    elif re.search(r"fol\.", t): k = "other with folio reference"
    else: k = "other"
    kinds[k] += 1
    ents.setdefault(k, set()).update(n.xpath("ancestor::*[@ana='#uf_Eintrag'][1]/@xml:id"))
for k, v in kinds.most_common(): print(v, k, "entries:", len(ents[k]))
oth = [" ".join(n.xpath("string()").split()) for n in body.iter(T + "note") if n.get("resp")]
print(Counter(x[:60] for x in oth).most_common(25))
