# Print the count and up to four occurrences in context of each category given as argument (e.g.
# uf_StrafeGeldstrafe), with entry id and Urfehde date. Exploratory, prints only, no table.
import re, sys
from lxml import etree
from pathlib import Path
REPO=Path(__file__).resolve().parents[3]  # repository root
sys.stdout.reconfigure(encoding='utf-8')
ns={'t':'http://www.tei-c.org/ns/1.0'}
X='{http://www.w3.org/XML/1998/namespace}id'
doc=etree.parse(str(REPO/'tei/ufbas.1563.xml'))
def txt(e): return re.sub(r'\s+',' ',''.join(e.itertext())).strip()
for cat in sys.argv[1:]:
    els=doc.xpath(f'//*[contains(concat(" ",@ana," ")," #{cat} ")]',namespaces=ns)
    print('#####',cat,len(els))
    for e in els[:4]:
        div=e.xpath('ancestor::t:div[@ana="#uf_Eintrag"][1]',namespaces=ns)
        eid=div[0].get(X) if div else '?'
        dt=[x.get('when') for x in div[0].iterfind('.//t:date[@ana="#uf_DatumUrfehde"]',ns)] if div else []
        par=e.getparent()
        # context: parent's text around element
        t=txt(par); s=txt(e); i=t.find(s)
        print(f'  {eid} {dt} [{s[:60]}] ... {t[max(0,i-150):i+len(s)+150]}')
