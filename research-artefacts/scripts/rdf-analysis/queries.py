# Coverage queries and the research queries Q1-Q8 on ufbas-ufo.ttl, the output of derive_ufo.py in the
# folder of argument 1. Superseded together with derive_ufo.py by ufbas-TORDF-ontology.xsl.
import rdflib, sys
g=rdflib.Graph(); g.parse(sys.argv[1]+'/ufbas-ufo.ttl', format='turtle')
P="""PREFIX ufo:<https://gams.uni-graz.at/o:ufbas.ontology#> PREFIX uf:<http://gams.uni-graz.at/ufbas/#>
PREFIX skos:<http://www.w3.org/2004/02/skos/core#> PREFIX xsd:<http://www.w3.org/2001/XMLSchema#> PREFIX prov:<http://www.w3.org/ns/prov#> PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>
"""
def q(title, s, n=12):
    print('==',title)
    for r in list(g.query(P+s))[:n]: print('  ', ' | '.join(str(x).replace('http://gams.uni-graz.at/ufbas/#','uf:').replace('https://gams.uni-graz.at/o:ufbas.ontology#','ufo:') for x in r))
q('coverage: offences total / with offender by single-offender rule', """SELECT (COUNT(DISTINCT ?o) AS ?all) (COUNT(DISTINCT ?w) AS ?withOffender) WHERE { ?o a ufo:Offence . OPTIONAL { ?o ufo:carriedOutBy ?p . BIND(?o AS ?w) } }""")
q('coverage: offence place on offence vs only on proceeding', """SELECT (COUNT(DISTINCT ?a) AS ?onOffence) (COUNT(DISTINCT ?b) AS ?onProceeding) WHERE { { ?a ufo:tookPlaceAt ?x } UNION { ?b ufo:offencePlace ?y } }""")
q('coverage: offence dates attached / left on proceeding', """SELECT (COUNT(DISTINCT ?a) AS ?offenceWithDate) (COUNT(DISTINCT ?b) AS ?procWithUnattachedDate) WHERE { { ?a a ufo:Offence ; ufo:timeSpan/ufo:date ?d } UNION { ?b ufo:offenceDateText ?t } }""")
q('coverage: detentions with duration', """SELECT (COUNT(DISTINCT ?d) AS ?all) (COUNT(DISTINCT ?w) AS ?withDuration) WHERE { ?d a ufo:Detention . OPTIONAL { ?d ufo:timeSpan/ufo:duration ?x . BIND(?d AS ?w) } }""")
q('coverage: deadlines with duration or date, attached to a sanction', """SELECT (COUNT(DISTINCT ?f) AS ?all) (COUNT(DISTINCT ?s) AS ?onSanction) (COUNT(DISTINCT ?u) AS ?withDur) WHERE { ?f a ufo:Deadline . OPTIONAL { ?x ufo:hasDeadline ?f . ?x a ufo:Sanction . BIND(?f AS ?s) } OPTIONAL { ?f ufo:timeSpan/ufo:duration ?d . BIND(?f AS ?u) } }""")
q('coverage: kinship statements, with relative resolved', """SELECT (COUNT(DISTINCT ?k) AS ?all) (COUNT(DISTINCT ?r) AS ?withRelative) WHERE { ?k a ufo:KinshipStatement . OPTIONAL { ?k ufo:relative ?x . BIND(?k AS ?r) } }""")
q('coverage: persons with origin normalised / local', """SELECT (COUNT(DISTINCT ?p) AS ?norm) (COUNT(DISTINCT ?q) AS ?local) WHERE { { ?p ufo:origin ?o . ?o skos:prefLabel ?l } UNION { ?q ufo:origin ?o2 . ?o2 ufo:normalised false } }""")
q('Q1 offence types per year (top)', """SELECT ?year ?type (COUNT(DISTINCT ?pr) AS ?n) WHERE { ?e ufo:documents ?pr ; ufo:urfehdeDate ?d . ?pr ufo:hasPart ?o . ?o a ufo:Offence ; ufo:type ?type . BIND(SUBSTR(STR(?d),1,4) AS ?year) } GROUP BY ?year ?type ORDER BY DESC(?n)""", 8)
q('Q2 sanction type by offender gender (top)', """SELECT ?gender ?type (COUNT(DISTINCT ?pr) AS ?n) WHERE { ?pr ufo:offender ?p ; ufo:hasPart ?s . ?p ufo:gender ?gender . ?s a ufo:Sanction ; ufo:type ?type } GROUP BY ?gender ?type ORDER BY DESC(?n)""", 10)
q('Q3 offender origins (top normalised places)', """SELECT ?place (COUNT(DISTINCT ?p) AS ?n) WHERE { ?pr ufo:offender ?p . ?p ufo:origin ?pl . ?pl skos:prefLabel ?place } GROUP BY ?place ORDER BY DESC(?n)""", 8)
q('Q4 detention durations', """SELECT ?dur (COUNT(*) AS ?n) WHERE { ?d a ufo:Detention ; ufo:timeSpan/ufo:duration ?dur } GROUP BY ?dur ORDER BY DESC(?n)""", 8)
q('Q5 fines by currency code', """SELECT ?cur (COUNT(*) AS ?n) (SUM(?q) AS ?sum) WHERE { ?s a ufo:Sanction ; ufo:type uf:StrafeGeldstrafe ; ufo:amount ?m . ?m ufo:quantity ?q ; ufo:currency ?cur } GROUP BY ?cur ORDER BY DESC(?n)""", 6)
q('Q6 banishment deadlines', """SELECT ?dur (COUNT(*) AS ?n) WHERE { ?s ufo:type uf:StrafeAusweisung ; ufo:hasDeadline/ufo:timeSpan/ufo:duration ?dur } GROUP BY ?dur ORDER BY DESC(?n)""", 6)
q('Q7 victims of offences by gender and offence type (top)', """SELECT ?type ?gender (COUNT(DISTINCT ?v) AS ?n) WHERE { ?o a ufo:Offence ; ufo:type ?type ; ufo:victim ?v . OPTIONAL { ?v ufo:gender ?g } BIND(COALESCE(?g, "unknown") AS ?gender) } GROUP BY ?type ?gender ORDER BY DESC(?n)""", 8)
q('Q8 recidivism pointers: entries with earlier-proceeding reference', """SELECT (COUNT(DISTINCT ?pr) AS ?n) WHERE { ?pr ufo:hasPart ?r . ?r a ufo:ProceedingReference }""")
