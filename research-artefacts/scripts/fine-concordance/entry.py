# Print the Urfehde dates and the start of the reading text of the entries given as arguments (xml:ids),
# for reading a candidate pair of the fine concordance by hand. Prints only, no table.
import re, sys
from lxml import etree
from pathlib import Path
REPO=Path(__file__).resolve().parents[3]  # repository root
sys.stdout.reconfigure(encoding='utf-8')
ns={'t':'http://www.tei-c.org/ns/1.0'}
doc=etree.parse(str(REPO/'tei/ufbas.1563.xml'))
for eid in sys.argv[1:]:
    d=doc.xpath(f'//t:div[@xml:id="{eid}"]',namespaces=ns)[0]
    dates=[x.get('when') for x in d.iterfind('.//t:date[@ana="#uf_DatumUrfehde"]',ns)]
    print('###',eid,dates)
    print(re.sub(r'\s+',' ',''.join(d.itertext())).strip()[:1500]); print()
