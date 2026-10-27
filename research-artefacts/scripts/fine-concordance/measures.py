# List every tei:measure of the edition with unit, entry, quantity, text, enclosing categories and
# context, sorted by unit, for the survey of amounts and currency units. Prints only, no table.
import re, sys
from lxml import etree
from pathlib import Path
REPO=Path(__file__).resolve().parents[3]  # repository root
ns={'t':'http://www.tei-c.org/ns/1.0'}
doc=etree.parse(str(REPO/'tei/ufbas.1563.xml'))
out=[]
for m in doc.iterfind('.//t:measure',ns):
    div=m.xpath('ancestor::t:div[@ana="#uf_Eintrag"][1]',namespaces=ns)
    eid=div[0].get('{http://www.w3.org/XML/1998/namespace}id') if div else '?'
    anc=[a.get('ana') for a in m.xpath('ancestor::*[@ana]',namespaces=ns)][-2:]
    txt=re.sub(r'\s+',' ',''.join(m.itertext())).strip()
    par=m.getparent()
    ctx=re.sub(r'\s+',' ',''.join(par.itertext())).strip()
    out.append((m.get('unit'),eid,m.get('quantity'),txt,anc,ctx[:220]))
for u,e,q,t,a,c in sorted(out,key=lambda x:(x[0] or '',)):
    print(f"{u}\t{e}\t{q}\t{t}\t{a}\t|| {c}")
