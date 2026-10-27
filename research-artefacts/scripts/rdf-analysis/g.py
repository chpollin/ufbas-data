# Two coverage queries on ufbas-ufo.ttl, the output of derive_ufo.py in the folder of argument 1.
# Superseded together with derive_ufo.py by ufbas-TORDF-ontology.xsl.
import rdflib,sys
g=rdflib.Graph(); g.parse(sys.argv[1]+'/ufbas-ufo.ttl')
P="PREFIX ufo:<https://gams.uni-graz.at/o:ufbas.ontology#> "
for t,s in [('victims with gender', "SELECT (COUNT(DISTINCT ?v) AS ?all) (COUNT(DISTINCT ?w) AS ?g) WHERE { ?pr ufo:victim ?v . OPTIONAL { ?v ufo:gender ?x . BIND(?v AS ?w) } }"),
            ('rdf:type in edition graph of uf classes','SELECT (COUNT(*) AS ?n) WHERE { ?s ufo:roleConcept ?c }')]:
    print(t, list(g.query(P+s)))
