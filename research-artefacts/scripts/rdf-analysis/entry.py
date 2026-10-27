# Copy the triples of Eintrag-0 from ufbas-1563.ttl (written by analyse.py into the folder of argument 1)
# into entry0-current.ttl there, and print multi-typed subjects, the Kleinbasel node and the oa:hasTarget
# pattern. No table.
import rdflib, collections, sys, re
from rdflib import RDF, URIRef
S=sys.argv[1]
g=rdflib.Graph(); g.parse(S+'/ufbas-1563.ttl', format='turtle')
UF='http://gams.uni-graz.at/ufbas/#'; D='http://gams.uni-graz.at/o:ufbas.1563#'
# ids inside entry 0 from TEI
ids=['Eintrag-0','Eingangsnotiz-0','SchlagwortRatsknecht-0','PersonTäter-0','male-0','Beruf-0','Status-0','OrtWohnort-0','PersonMittäter-0','male-1','Beruf-1','PersonOpfer-0','male-2','Beruf-2','OrtWohnort-1','SchlagwortGeldleihe-0','TatBetrug-0','TatUngehorsam-0','Untersuchungshaft-0','DatumUrfehde-0','Urfehdeeid-0','StrafeErmahnung-0','DatumFrist-0','NotarialSubscription-0','PersonNotar-0','male-3','Beruf-3','Kleinbasel']
subs=set()
for s in g.subjects():
    frag=str(s).split('#',1)[-1]
    for i in ids:
        if frag==i or frag.endswith('-'+i):
            subs.add(s)
out=rdflib.Graph()
for pfx,ns in [('uf',UF),('g2o','http://gams.uni-graz.at/ontology/#'),('oa','http://www.w3.org/ns/oa#'),('skos','http://www.w3.org/2004/02/skos/core#'),('tei','http://www.tei-c.org/ns/1.0'),('d',D)]:
    out.bind(pfx,ns)
for s in subs:
    for p,o in g.predicate_objects(s):
        out.add((s,p,o))
print(len(subs),'subjects', len(out),'triples')
out.serialize(S+'/entry0-current.ttl', format='turtle')
# multi-typed subjects
mt=[s for s in set(g.subjects(RDF.type,None)) if len(list(g.objects(s,RDF.type)))>1]
c=collections.Counter(tuple(sorted(str(o).replace(UF,'') for o in g.objects(s,RDF.type))) for s in mt)
print('multi-type combos', c.most_common(15))
print('multi-typed samples', [str(s).replace(D,'d:') for s in mt[:10]])
# Kleinbasel node
kb=URIRef(D+'Kleinbasel')
for p,o in g.predicate_objects(kb): print('Kleinbasel', p.n3(g.namespace_manager), str(o)[:80])
# hasTarget of annotation vs element URI
print('hasTarget objects that are described elements', sum(1 for o in g.objects(None,URIRef('http://www.w3.org/ns/oa#hasTarget')) if (o,URIRef('http://gams.uni-graz.at/ontology/#inhalt'),None) in g), 'of', len(list(g.objects(None,URIRef('http://www.w3.org/ns/oa#hasTarget')))))
