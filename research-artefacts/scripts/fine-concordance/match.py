# First matching attempt for fine-concordance-srbas.tsv: exact normalised surnames of offenders and
# accomplices against the entries of three SRBAS accounts. Prints candidate pairs. Superseded by match3.py.
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
    s=s.replace('y','i').replace('th','t').replace('ck','k').replace('ff','f').replace('sz','s').replace('ss','s').replace('uo','u').replace('ou','u').replace('dt','t')
    s=re.sub(r'(en|in|j|lj|li|n)$','',s)
    return s
uf=etree.parse(str(REPO/'tei/ufbas.1563.xml'))
ufp=[]
for d in uf.iterfind('.//t:div[@ana="#uf_Eintrag"]',ns):
    eid=d.get(X); dates=[x.get('when') for x in d.iterfind('.//t:date[@ana="#uf_DatumUrfehde"]',ns)]
    fines=[txt(m) for m in d.iterfind('.//t:seg[@ana="#uf_StrafeGeldstrafe"]',ns)]
    for p in d.iterfind('.//t:persName',ns):
        if p.get('ana') not in ('#uf_PersonTäter','#uf_PersonMittäter'): continue
        sn=p.find('t:surname',ns)
        if sn is None: continue
        s=txt(sn)
        if len(s)<4: continue
        ufp.append((norm(s),s,txt(p)[:60],eid,dates,fines))
for y in ['1562_1563','1563_1564','1564_1565','1565_1566','1566_1567','1567_1568','1568_1569','1569_1570']:
    d=etree.parse(SRBAS_TEI+f'depcha.srbas{y}.xml')
    for div in d.iterfind('.//t:div[@ana="bk:account"]',ns):
        acc=div.get('corresp') or ''
        if acc not in ('#bs_Strafen','#bs_Ehebruch','#bs_AllgemeinEmpfangen'): continue
        for p in div.findall('t:p[@ana="bk:entry"]',ns):
            s=txt(p)
            words=re.findall(r'[A-ZÄÖÜ][\wäöüßÿ]+',s)
            for w in words:
                nw=norm(w)
                if len(nw)<4: continue
                for u in ufp:
                    if u[0]==nw:
                        print(f"{y}\t{acc}\t{p.get(X)}\t{s[:120]}\t<->\t{u[3]}\t{u[4]}\t{u[2]}\t{'; '.join(u[5])[:120]}")
