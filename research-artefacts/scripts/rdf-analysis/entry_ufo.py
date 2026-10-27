# Copy Eintrag-0 from ufbas-ufo.ttl, the output of derive_ufo.py in the folder of argument 1, into
# entry0-ufo.ttl there. Superseded together with derive_ufo.py by ufbas-TORDF-ontology.xsl.
import rdflib, sys
from rdflib import URIRef
S=sys.argv[1]
g=rdflib.Graph(); g.parse(S+'/ufbas-ufo.ttl', format='turtle')
D='http://gams.uni-graz.at/o:ufbas.1563#'
ids=['Eintrag-0','PersonTäter-0','PersonMittäter-0','PersonOpfer-0','PersonNotar-0','SchlagwortRatsknecht-0','TatBetrug-0','TatUngehorsam-0','Untersuchungshaft-0','Urfehdeeid-0','StrafeErmahnung-0','DatumFrist-0','OrtWohnort-1']
seeds=set()
for s in g.subjects():
    f=str(s)[len(D):] if str(s).startswith(D) else ''
    if any(f.endswith(i) or f.endswith(i+'-time') for i in ids) or f.startswith('amount-Eintrag-0-') or f in ('place-Kleinbasel','page-19'):
        seeds.add(s)
out=rdflib.Graph()
for p,n in g.namespaces(): out.bind(p,n)
for s in seeds:
    for p,o in g.predicate_objects(s):
        if s==URIRef(D+'place-Kleinbasel') and str(p).endswith('mentionedIn'): continue
        out.add((s,p,o))
out.serialize(S+'/entry0-ufo.ttl', format='turtle')
print(len(out))
