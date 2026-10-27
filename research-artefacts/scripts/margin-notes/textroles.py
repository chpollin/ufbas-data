# Context of guard-role keywords in the running text: which annotated segment they sit in, plus surrounding words.
from lxml import etree
from collections import Counter
from pathlib import Path
REPO = Path(__file__).resolve().parents[3]  # repository root
T = "{http://www.tei-c.org/ns/1.0}"
doc = etree.parse(str(REPO / "tei/ufbas.1563.xml"))
body = doc.find(T + "text/" + T + "body")
ROLES = ("uf_SchlagwortRatsknecht", "uf_SchlagwortStadtknecht", "uf_SchlagwortObersterKnecht")
def toks(e): return [a.lstrip('#') for a in (e.get('ana') or '').split()]
def margin(e):
    return any(("uf_Eingangsnotiz" in toks(a)) or (a.tag == T+"note" and not a.get("change") and not a.get("resp") and a.get("rend") in ("margin", None)) for a in e.iterancestors())
summary = Counter()
for k in body.iter():
    if not isinstance(k.tag, str): continue
    r = [t[13:] for t in toks(k) if t in ROLES]
    if not r or margin(k): continue
    anc = [t for a in k.iterancestors() for t in toks(a) if t.startswith("uf_") and t not in ("uf_Eintrag",)]
    ctx_el = k.getparent()
    ctx = " ".join(ctx_el.xpath("string()").split())
    txt = " ".join(k.xpath("string()").split())
    i = ctx.find(txt)
    snippet = ctx[max(0, i-60): i+len(txt)+40]
    pers = [a for a in anc if a.startswith("uf_Person")]
    key = pers[0] if pers else ("inside other segment" if anc else "plain text")
    summary[(r[0], key)] += 1
    print(k.sourceline, r, anc[:3], "|", snippet)
print()
for k, v in sorted(summary.items()): print(k, v)
