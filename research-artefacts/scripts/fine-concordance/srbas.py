# Survey the SRBAS TEI per fiscal year (argument 2, e.g. 1564_1565,1565_1566). Mode heads (argument 1)
# lists the accounts with their number of entries, any other mode prints the paragraphs of the accounts
# that match the regex in argument 3. Used to find the Rotstrafen account. Prints only, no table.
import re, sys, glob
from lxml import etree
sys.stdout.reconfigure(encoding='utf-8')
ns={'t':'http://www.tei-c.org/ns/1.0'}
X='{http://www.w3.org/XML/1998/namespace}id'
# External data: the SRBAS TEI (Jahrrechnungen der Stadt Basel) of DEPCHA, a local checkout outside
# this repository. Adjust before a rerun.
SRBAS_TEI='C:/Users/Chrisi/Documents/GitHub/Archive/DEPCHA/Collections/SRBAS/TEI/'
def txt(e): return re.sub(r'\s+',' ',''.join(e.itertext())).strip()
mode=sys.argv[1]
years=sys.argv[2].split(',')
for y in years:
    d=etree.parse(SRBAS_TEI+f'depcha.srbas{y}.xml')
    print('=====',y, d.findtext('.//t:idno[@type="PID"]',namespaces=ns), [ (o.get('from'),o.get('to')) for o in d.iterfind('.//t:origDate',ns)], d.findtext('.//t:msIdentifier/t:idno',namespaces=ns))
    if mode=='heads':
        for div in d.iterfind('.//t:div[@ana="bk:account"]',ns):
            h=div.find('t:head',ns)
            n=len(div.findall('t:p[@ana="bk:entry"]',ns))
            print(div.get('corresp'),'|',txt(h) if h is not None else '-', '|',n)
    else:
        pat=re.compile(sys.argv[3],re.I)
        for div in d.iterfind('.//t:div[@ana="bk:account"]',ns):
            h=div.find('t:head',ns); ht=txt(h) if h is not None else '-'
            acc=div.get('corresp')
            for p in div.findall('t:p',ns)+div.findall('t:closer',ns):
                s=txt(p)
                if pat.search(s) or pat.search(acc or '') :
                    ms=[(m.get('quantity'),m.get('unit')) for m in p.iterfind('.//t:measure',ns)]
                    print(acc,'|',ht,'|',p.get(X),'|',p.get('ana'),'|',s[:260],'|',ms)
