# Candidate pairs for fine-concordance-srbas.tsv: surname similarity between fined offenders and
# accomplices of a dated entry and the entries of the SRBAS account bs_Strafen of the same fiscal year.
# Prints the pairs as tab-separated lines and the coverage to stderr. The table was assembled from this
# output by manual review of name, amount and date.
import re, sys, unicodedata, difflib
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
    for a,b in [('y','i'),('th','t'),('ck','k'),('ff','f'),('sz','s'),('ss','s'),('uo','u'),('ou','u'),('dt','t'),('tt','t'),('ll','l'),('nn','n'),('j','i'),('e','')]: s=s.replace(a,b)
    s=re.sub(r'(n|in|i|li|r)$','',s)
    return s
uf=etree.parse(str(REPO/'tei/ufbas.1563.xml'))
ufp=[]
for d in uf.iterfind('.//t:div[@ana="#uf_Eintrag"]',ns):
    eid=d.get(X); dates=[x.get('when') for x in d.iterfind('.//t:date[@ana="#uf_DatumUrfehde"]',ns)]
    fines=[txt(m) for m in d.iterfind('.//t:seg[@ana="#uf_StrafeGeldstrafe"]',ns)]
    if not fines or not dates: continue
    for p in d.iterfind('.//t:persName',ns):
        if p.get('ana') not in ('#uf_PersonTäter','#uf_PersonMittäter'): continue
        sn=p.find('t:surname',ns)
        if sn is None: continue
        ufp.append((norm(txt(sn)),txt(p)[:50],eid,dates[0],fines))
fy={}
hits=set()
for y in ['1562_1563','1563_1564','1564_1565','1565_1566','1566_1567','1567_1568','1568_1569','1569_1570','1570_1571']:
    d=etree.parse(SRBAS_TEI+f'depcha.srbas{y}.xml')
    o=d.find('.//t:origDate',ns); f,t=o.get('from'),o.get('to')
    for div in d.iterfind('.//t:div[@corresp="#bs_Strafen"]',ns):
        for p in div.findall('t:p[@ana="bk:entry"]',ns):
            s=txt(p); ws=[norm(w) for w in re.findall(r'[A-ZÄÖÜ][a-zäöüßÿA-Z]+',s)]
            for u in ufp:
                if len(u[0])<4: continue
                if not (f <= u[3] <= t): continue
                for w in ws:
                    if len(w)>=4 and difflib.SequenceMatcher(None,w,u[0]).ratio()>=0.8:
                        hits.add(u[2])
                        print(f"{y}\t{p.get(X)}\t{s[:90]}\t<->\t{u[2]}\t{u[3]}\t{u[1]}\t{'; '.join(u[4])[:90]}")
                        break
ents={u[2] for u in ufp if '1563-01-01'<=u[3]<='1569-06-25'}
print('UFBAS fined entries with perp surname, dated within SRBAS range to 1569-06-25:',len(ents),' matched:',len(hits&ents), file=sys.stderr)
