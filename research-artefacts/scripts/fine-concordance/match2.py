# Second matching attempt for fine-concordance-srbas.tsv: forename prefix and surname in sequence, all
# persons, all SRBAS accounts. Prints candidate pairs. Superseded by match3.py.
import re, sys, unicodedata
from lxml import etree
from pathlib import Path
REPO=Path(__file__).resolve().parents[3]  # repository root
# External data: the SRBAS TEI (Jahrrechnungen der Stadt Basel) of DEPCHA, a local checkout outside
# this repository. Adjust before a rerun.
SRBAS_TEI='C:/Users/Chrisi/Documents/GitHub/Archive/DEPCHA/Collections/SRBAS/TEI/'
sys.stdout.reconfigure(encoding='utf-8')
ns={'t':'http://www.tei-c.org/ns/1.0'}
X='{http://www.w3.org/XML/1998/namespace}id'
def txt(e): return re.sub(r'\s+',' ',''.join(e.itertext())).strip()
def norm(s):
    s=unicodedata.normalize('NFKD',s.lower()); s=''.join(c for c in s if not unicodedata.combining(c))
    for a,b in [('y','i'),('th','t'),('ck','k'),('ff','f'),('sz','s'),('ss','s'),('uo','u'),('ou','u'),('dt','t'),('tt','t'),('ll','l'),('nn','n'),('j','i'),('g','g')]: s=s.replace(a,b)
    s=re.sub(r'(en|in|i|li|n|er|e)$','',s)
    return s
uf=etree.parse(str(REPO/'tei/ufbas.1563.xml'))
ufp=[]
for d in uf.iterfind('.//t:div[@ana="#uf_Eintrag"]',ns):
    eid=d.get(X); dates=[x.get('when') for x in d.iterfind('.//t:date[@ana="#uf_DatumUrfehde"]',ns)]
    fines=[txt(m) for m in d.iterfind('.//t:seg[@ana="#uf_StrafeGeldstrafe"]',ns)]
    for p in d.iterfind('.//t:persName',ns):
        sn=p.find('t:surname',ns); fn=p.find('t:forename',ns)
        if sn is None or fn is None: continue
        ufp.append((norm(txt(fn))[:3],norm(txt(sn)),txt(p)[:60],p.get('ana'),eid,dates,fines))
for y in ['1562_1563','1563_1564','1564_1565','1565_1566','1566_1567','1567_1568','1568_1569','1569_1570']:
    d=etree.parse(SRBAS_TEI+f'depcha.srbas{y}.xml')
    for div in d.iterfind('.//t:div[@ana="bk:account"]',ns):
        acc=div.get('corresp') or ''
        for p in div.findall('t:p[@ana="bk:entry"]',ns):
            s=txt(p)
            ws=[norm(w) for w in re.findall(r'[A-Za-zÄÖÜäöüßÿ]+',s)]
            for i,w in enumerate(ws[:-1]):
                for u in ufp:
                    if len(u[1])>=4 and w[:3]==u[0] and ws[i+1]==u[1]:
                        print(f"{y}\t{acc}\t{p.get(X)}\t{s[:130]}\t<->\t{u[4]}\t{u[5]}\t{u[3]}\t{u[2]}\t{'; '.join(u[6])[:100]}")
