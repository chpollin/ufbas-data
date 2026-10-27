# Further counts on ufbas-1563.ttl in the folder of argument 1: role links, offenders and dates per entry,
# gender coverage, places and duplicated person resources. Prints only, no table.
import rdflib, collections, sys
from rdflib import RDF, URIRef, Literal
S=sys.argv[1]
g=rdflib.Graph(); g.parse(S+'/ufbas-1563.ttl', format='turtle')
UF='http://gams.uni-graz.at/ufbas/#'; D='http://gams.uni-graz.at/o:ufbas.1563#'
OA=URIRef('http://www.w3.org/ns/oa#hasTarget')
def cls(s):
    return [str(o).replace(UF,'') for o in g.objects(s,RDF.type)]
# which subject classes link to role-typed persons / Tat / Strafe
for role in ['PersonTäter','PersonOpfer','PersonMittäter','PersonZeuge','PersonKläger','DatumTat','DatumFrist','OrtTatort','Vorinstanz']:
    c=collections.Counter()
    for s,p,o in g.triples((None, URIRef(UF+'has'+role), None)):
        c[tuple(cls(s)) or ('untyped',)]+=1
    print(role, c.most_common(6))
# Tat/Strafe resources: parent class
for grp in ['Tat','Strafe']:
    c=collections.Counter()
    for s,p,o in g:
        if str(p).startswith(UF+'has'+grp):
            c[tuple(cls(s))[:1] or ('untyped',)]+=1
    print(grp,'parents', c.most_common(8))
# Entries with 0 or >1 offenders, entries without DatumUrfehde
E=list(g.subjects(RDF.type, URIRef(UF+'Eintrag')))
off=collections.Counter(len(list(g.objects(e,URIRef(UF+'hasPersonTäter')))) for e in E)
print('offenders per entry (direct)', sorted(off.items()))
print('entries without direct hasDatumUrfehde', sum(1 for e in E if not list(g.objects(e,URIRef(UF+'hasDatumUrfehde')))))
# PersonOpfer gender coverage
for role in ['PersonTäter','PersonOpfer']:
    P=list(g.subjects(RDF.type, URIRef(UF+role)))
    print(role, len(P), 'with gender', sum(1 for p in P if list(g.objects(p,URIRef(UF+'gender')))))
# DatumTat/Frist with tei:when
for c in ['DatumUrfehde','DatumTat','DatumFrist','DatumBegnadigung']:
    P=list(g.subjects(RDF.type, URIRef(UF+c)))
    print(c, len(P), 'with tei:when', sum(1 for p in P if list(g.objects(p,URIRef('http://www.tei-c.org/ns/1.0when')))))
# appears-on targets
pages=set(g.objects(None,URIRef('http://gams.uni-graz.at/ontology/#appears-on')))
print('distinct appears-on pages', len(pages), list(pages)[:3])
# gender IRIs typed?
print('uf:male described?', len(list(g.predicate_objects(URIRef(UF+'male')))))
# places: uf:hasOrt* objects: normalized vs local
c=collections.Counter()
for s,p,o in g:
    if str(p).startswith(UF+'hasOrt'):
        c['normalized' if (o, URIRef('http://www.w3.org/2004/02/skos/core#prefLabel'), None) in g else 'local']+=1
print('hasOrt* objects', c)
# properties attached to normalized places (leaks)
leak=collections.Counter()
for s in g.subjects(URIRef('http://www.w3.org/2004/02/skos/core#prefLabel'),None):
    for p in g.predicates(s):
        if str(p).startswith(UF+'has'): leak[str(p).replace(UF,'')]+=1
print('uf:has* on normalized places', leak)
# Person resources duplicated
P=list(g.subjects(RDF.type, URIRef(UF+'Person')))
role_dup=sum(1 for p in P if any(len(cls(s))>0 and cls(s)!=['Person'] for s in g.subjects(OA, list(g.objects(p,OA))[0])) )
print('uf:Person resources sharing target with a role resource', role_dup, 'of', len(P))
# Who links to uf:Person resources?
print('incoming links to uf:Person resources', sum(1 for p in P for _ in g.subjects(None,p)))
