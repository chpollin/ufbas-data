# Profile of the published 2017 RDF of o:ufbas.1563 and o:ufbas.kategorien, read as ufbas-1563.rdf.xml and
# ufbas-kategorien.rdf.xml from the folder in argument 1, saved from GAMS. Prints predicates, types,
# literals, places and the taxonomy check, and writes both graphs as Turtle into that folder for entry.py
# and stats2.py. No table.
import rdflib, collections, sys
from rdflib import RDF, URIRef, Literal
S=sys.argv[1]
g=rdflib.Graph(); g.parse(S+'/ufbas-1563.rdf.xml', format='xml')
k=rdflib.Graph(); k.parse(S+'/ufbas-kategorien.rdf.xml', format='xml')
print('edition triples', len(g), 'taxonomy triples', len(k))
UF='http://gams.uni-graz.at/ufbas/#'
def short(u):
    s=str(u)
    for p,n in [(UF,'uf:'),('http://gams.uni-graz.at/ontology/#','g2o:'),('http://www.w3.org/ns/oa#','oa:'),('http://www.w3.org/2004/02/skos/core#','skos:'),('http://www.tei-c.org/ns/1.0','tei:'),(str(RDF),'rdf:'),('http://www.cei.lmu.de/ns/1.0','cei:')]:
        if s.startswith(p): return n+s[len(p):]
    return s
pc=collections.Counter(short(p) for p in g.predicates())
print('distinct predicates', len(pc))
ns=collections.Counter(short(p).split(':')[0] if ':' in short(p) else 'other' for p in g.predicates())
print('predicate namespace usage', ns)
# predicates not uf:hasX
print('non-has predicates', sorted([(p,c) for p,c in pc.items() if not p.startswith('uf:has')], key=lambda x:-x[1]))
print('uf:has* distinct', len([p for p in pc if p.startswith('uf:has')]))
tc=collections.Counter(short(o) for o in g.objects(None, RDF.type))
print('distinct rdf:type objects', len(tc))
# subjects that have rdf:type at all vs described only
subs=set(g.subjects())
typed=set(g.subjects(RDF.type,None))
print('subjects', len(subs), 'typed subjects', len(typed))
# rdf:type from element name (xml element uf:Class): count subjects by number of types
nt=collections.Counter(len(list(g.objects(s,RDF.type))) for s in typed)
print('types per typed subject', nt)
print('top types', tc.most_common(30))
# literal datatypes
dt=collections.Counter((short(p), str(o.datatype) if isinstance(o,Literal) else 'IRI') for s,p,o in g if isinstance(o,Literal))
print('literal predicates/datatypes', dt.most_common(20))
# tei:when values format
whens=[str(o) for o in g.objects(None, URIRef('http://www.tei-c.org/ns/1.0when'))]
print('tei:when count', len(whens), 'sample', whens[:5])
# gender objects
print('gender', collections.Counter(short(o) for o in g.objects(None, URIRef(UF+'gender'))))
# uf:Ort resources from listPlace: do they have hasTarget?
orte=[s for s in g.subjects(RDF.type, URIRef(UF+'Ort')) ]
lp=[s for s in orte if (s, URIRef('http://www.w3.org/2004/02/skos/core#prefLabel'), None) in g]
print('uf:Ort typed', len(orte), 'with prefLabel', len(lp))
withtarget=[s for s in lp if (s, URIRef('http://www.w3.org/ns/oa#hasTarget'), None) in g]
print('normalised places with oa:hasTarget', len(withtarget))
# number of oa:hasTarget per normalized place
cnt=collections.Counter(len(list(g.objects(s, URIRef('http://www.w3.org/ns/oa#hasTarget')))) for s in lp)
print('hasTarget per normalized place distribution', sorted(cnt.items())[:10])
# Eintrag
E=list(g.subjects(RDF.type, URIRef(UF+'Eintrag')))
print('uf:Eintrag', len(E), 'sample', E[:2])
# persons: those typed PersonTäter: have forename literal?
T=list(g.subjects(RDF.type, URIRef(UF+'PersonTäter')))
print('PersonTäter', len(T), 'with forename', sum(1 for s in T if (s,URIRef(UF+'forename'),None) in g), 'with gender', sum(1 for s in T if (s,URIRef(UF+'gender'),None) in g))
# subjects typed uf:Person?
print('typed uf:Person', len(list(g.subjects(RDF.type, URIRef(UF+'Person')))))
# check whether categories are typed as skos:Concept in edition graph
print('skos:Concept in edition graph', len(list(g.subjects(RDF.type, URIRef('http://www.w3.org/2004/02/skos/core#Concept')))))
kp=collections.Counter(short(p) for p in k.predicates())
print('taxonomy predicates', kp)
kt=collections.Counter(short(o) for o in k.objects(None,RDF.type)); print('taxonomy types', kt)
# broader targets that are not concepts
concepts=set(k.subjects(RDF.type, URIRef('http://www.w3.org/2004/02/skos/core#Concept')))
bad=[(s,o) for s,o in k.subject_objects(URIRef('http://www.w3.org/2004/02/skos/core#broader')) if o not in concepts]
print('broader to non-concept', len(bad), bad[:3])
# concept IRIs vs types used in edition
used=set(o for o in g.objects(None,RDF.type))
print('edition types not in taxonomy', sorted(short(u) for u in used - concepts)[:40])
print('taxonomy concepts never used as type', len(concepts-used))
g.serialize(S+'/ufbas-1563.ttl', format='turtle')
k.serialize(S+'/ufbas-kategorien.ttl', format='turtle')
