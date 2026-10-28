"""Prototype: derive a domain RDF model for Urfehde entries from the unchanged UFBAS TEI.

Scratch prototype for an ontology sketch, not production code. A production version
would be XSLT 2.0 so it can run as TORDF on GAMS; Python is used here only to check
that every rule is deterministic over the existing annotation.

Reads the edition TEI (argument 1) and writes Turtle (argument 2), named ufbas-ufo.ttl
for entry_ufo.py, g.py and queries.py. Superseded by ufbas-TORDF-ontology.xsl, which
derives the refactored RDF against ontology/ufbas.ontology.ttl.
"""
import re
import sys
import xml.etree.ElementTree as ET

from rdflib import BNode, Graph, Literal, Namespace, URIRef
from rdflib.namespace import OWL, PROV, RDF, RDFS, SKOS, XSD

TEI = "{http://www.tei-c.org/ns/1.0}"
XMLID = "{http://www.w3.org/XML/1998/namespace}id"
D = Namespace("http://gams.uni-graz.at/o:ufbas.1563#")
UF = Namespace("http://gams.uni-graz.at/ufbas/#")            # existing taxonomy concepts, kept
UFO = Namespace("https://gams.uni-graz.at/o:ufbas.ontology#")  # proposed ontology namespace
CRM = Namespace("http://www.cidoc-crm.org/cidoc-crm/")
OA = Namespace("http://www.w3.org/ns/oa#")

ROLE = {  # person category -> ufo role property on the proceeding (and CRM super-property)
    "PersonTäter": "offender", "PersonMittäter": "accomplice", "PersonOpfer": "victim",
    "PersonKläger": "plaintiff", "PersonZeuge": "witness", "PersonAnwesende": "present",
    "PersonHehler": "receiver", "PersonNotar": "notary", "Person": "mentionedPerson",
}
ATTR = {"Beruf": "occupation", "Status": "status", "Zivilstand": "civilStatus", "Beiname": "byname"}


def tokens(el):
    return [t[4:] for t in (el.get("ana") or "").split() if t.startswith("#uf_")]


def text(el):
    """Reading text: notes and deletions left out, expansions kept, lb/pb as space."""
    parts = []

    def walk(e, top):
        tag = e.tag.replace(TEI, "")
        if not top and tag in ("note", "del"):
            if e.tail: parts.append(e.tail)
            return
        if tag in ("lb", "pb") and e.get("break") != "no":
            parts.append(" ")
        if e.text: parts.append(e.text)
        for c in e: walk(c, False)
        if not top and e.tail: parts.append(e.tail)
    walk(el, True)
    return re.sub(r"\s+", " ", "".join(parts)).strip()


def main(tei_path, out_path):
    root = ET.parse(tei_path).getroot()
    parent = {c: p for p in root.iter() for c in p}

    def ancestors(e):
        p = parent.get(e)
        while p is not None:
            yield p
            p = parent.get(p)

    def nearest(e, pred):
        return next((a for a in ancestors(e) if pred(a)), None)

    g = Graph()
    for p, n in [("d", D), ("uf", UF), ("ufo", UFO), ("crm", CRM), ("oa", OA), ("prov", PROV), ("skos", SKOS)]:
        g.bind(p, n)
    run = D["derivation"]
    g.add((run, RDF.type, PROV.Activity))
    g.add((run, PROV.used, URIRef("http://gams.uni-graz.at/o:ufbas.1563")))
    g.add((run, RDFS.label, Literal("derive_ufo.py prototype over TEI_SOURCE mirror")))

    def span(e):  # the existing element IRI of the TORDF model, reused as evidence target
        return D[e.get(XMLID)] if e.get(XMLID) else None

    def evidence(node, e):
        s = span(e)
        if s is not None:
            g.add((node, PROV.wasDerivedFrom, s))
        g.add((node, PROV.wasGeneratedBy, run))

    # pages: stable IRIs from pb/@facs instead of generate-id()
    page_of = {}
    current = None
    body = root.find(f"{TEI}text/{TEI}body")
    for e in body.iter():
        if e.tag == TEI + "pb":
            n = int(e.get("facs").rsplit("#", 1)[1])
            current = D[f"page-{n}"]
            g.add((current, RDF.type, UFO.Page))
            g.add((current, UFO.folio, Literal(f"{n - 18}{'r' if n % 2 == 0 else 'v'}")))
            g.add((current, UFO.facsimile, URIRef(e.get("facs").strip())))
        elif e.tag == TEI + "div" or (e.get("ana") or "").strip() == "#uf_Eintrag":
            page_of[e] = current

    # normalised places
    for pl in root.iter(TEI + "place"):
        pid = pl.get(XMLID)
        P = D[f"place-{pid}"]
        g.add((P, RDF.type, UFO.Place))
        g.add((P, SKOS.prefLabel, Literal(text(pl.find(TEI + "placeName")))))
        note = pl.find(TEI + "note")
        if note is not None:
            g.add((P, SKOS.editorialNote, Literal(text(note))))

    def place_node(pn):
        ref = (pn.get("ref") or "").strip().lstrip("#")
        if ref:
            return D[f"place-{ref}"]
        P = D[f"place-local-{pn.get(XMLID)}"]
        g.add((P, RDF.type, UFO.Place))
        g.add((P, RDFS.label, Literal(text(pn))))
        g.add((P, UFO.normalised, Literal(False)))
        return P

    def timespan(node, when=None, dur=None, calendar=None):
        ts = URIRef(str(node) + "-time")
        g.add((ts, RDF.type, UFO.TimeSpan))
        if when:
            dt = XSD.date if len(when) == 10 else (XSD.gYearMonth if len(when) == 7 else XSD.gYear)
            g.add((ts, UFO.date, Literal(when, datatype=dt)))
        if dur:
            g.add((ts, UFO.duration, Literal(dur, datatype=XSD.duration)))
        if calendar:
            g.add((ts, UFO.calendar, Literal(calendar.lstrip("#"))))
        g.add((node, UFO.timeSpan, ts))
        return ts

    entries = [e for e in body.iter() if "Eintrag" in tokens(e)]
    for entry in entries:
        eid = entry.get(XMLID)
        E, PR = D[f"entry-{eid}"], D[f"proceeding-{eid}"]
        g.add((E, RDF.type, UFO.Entry))
        g.add((E, UFO.documents, PR))
        g.add((E, UFO.text, Literal(text(entry))))
        g.add((E, UFO.span, D[eid]))
        if page_of.get(entry) is not None:
            g.add((E, UFO.onPage, page_of[entry]))
        g.add((PR, RDF.type, UFO.UrfehdeProceeding))
        evidence(PR, entry)

        def in_entry(e):
            return nearest(e, lambda a: "Eintrag" in tokens(a)) is entry

        # persons: every persName in the entry is one person resource (mention-scoped identity)
        person = {}
        for pn in entry.iter(TEI + "persName"):
            if not in_entry(pn): continue
            P = D[f"person-{pn.get(XMLID)}"]
            person[pn] = P
            g.add((P, RDF.type, UFO.Person))
            g.add((P, UFO.mentionedIn, E))
            evidence(P, pn)
            g.add((P, RDFS.label, Literal(text(pn))))
            own = lambda x: nearest(x, lambda a: a.tag == TEI + "persName") is pn
            for tag, prop in (("forename", UFO.forename), ("surname", UFO.surname)):
                for c in pn.iter(TEI + tag):
                    if own(c): g.add((P, prop, Literal(text(c))))
            gender = [t for t in tokens(pn) if t in ("male", "female")] + \
                     [t for c in pn.iter(TEI + "forename") if own(c) for t in tokens(c) if t in ("male", "female")]
            for t in sorted(set(gender)):
                g.add((P, UFO.gender, UF[t]))
            for c in pn.iter():
                if c is pn or not own(c): continue
                for t in tokens(c):
                    if t in ATTR:
                        g.add((P, UFO[ATTR[t]], Literal(text(c))))
            roles = [t for t in tokens(pn) if t in ROLE]
            if not roles:
                roles = ["Person"]
            for t in roles:
                g.add((PR, UFO[ROLE[t]], P))
                g.add((P, UFO.roleConcept, UF[t])) if t != "Person" else None
            for t in tokens(pn):
                if t.startswith("Schlagwort"):
                    g.add((P, UFO.keyword, UF[t]))
            # kinship: a kin term inside this persName that sits beside a nested persName
            nested = [c for c in pn.iter(TEI + "persName") if c is not pn and nearest(c, lambda a: a.tag == TEI + "persName") is pn]
            for c in pn.iter():
                if c is not pn and own(c) and "Verwandtschaftsgrad" in tokens(c):
                    K = D[f"kinship-{c.get(XMLID)}"]
                    g.add((K, RDF.type, UFO.KinshipStatement))
                    g.add((K, UFO.person, P))
                    g.add((K, UFO.kinTerm, Literal(text(c))))
                    for n in nested:
                        g.add((K, UFO.relative, D[f"person-{n.get(XMLID)}"]))
                    evidence(K, c)
        # nested persons get their own node even though own() excluded them above: already in loop

        # activities from annotated segments
        acts = {}
        for el in entry.iter():
            if el is entry or not in_entry(el): continue
            for t in tokens(el):
                if t.startswith("Tat"): cls, key = UFO.Offence, "offence"
                elif t.startswith("Strafe"): cls, key = UFO.Sanction, "sanction"
                elif t == "Untersuchungshaft": cls, key = UFO.Detention, "detention"
                elif t == "Urfehdeeid": cls, key = UFO.UrfehdeOath, "oath"
                elif t == "Vorinstanz": cls, key = UFO.PriorInstance, "priorInstance"
                elif t in ("FrüheresUrfehdeverfahren", "AnderesUrfehdeverfahren"): cls, key = UFO.ProceedingReference, "proceedingReference"
                else: continue
                A = D[f"{key}-{el.get(XMLID) or t}"] if el.get(XMLID) and len(tokens(el)) == 1 else D[f"{key}-{t}-{el.get(XMLID)}"]
                g.add((A, RDF.type, cls))
                g.add((A, UFO.type, UF[t]))
                g.add((PR, UFO.hasPart, A))
                g.add((A, UFO.label, Literal(text(el))))
                evidence(A, el)
                acts.setdefault(el, []).append((A, key))

        def container(e, keys):
            for a in ancestors(e):
                if a is entry: return None
                for A, k in acts.get(a, []):
                    if k in keys: return A
            return None

        offences = [A for lst in acts.values() for A, k in lst if k == "offence"]
        offenders = [person[p] for p in person if "PersonTäter" in tokens(p)]
        # offence -> offender only when the entry names exactly one offender (rule, flagged)
        if len(offenders) == 1:
            for A in offences:
                g.add((A, UFO.carriedOutBy, offenders[0]))
        # victims nested in an offence segment
        for p, P in person.items():
            A = container(p, {"offence"})
            if A is not None and "PersonOpfer" in tokens(p):
                g.add((A, UFO.victim, P))

        # places
        for pn in entry.iter(TEI + "placeName"):
            if not in_entry(pn): continue
            P = place_node(pn)
            owner = nearest(pn, lambda a: a.tag == TEI + "persName")
            for t in tokens(pn):
                if t == "OrtHerkunft" and owner is not None:
                    g.add((person[owner], UFO.origin, P))
                elif t == "OrtWohnort" and owner is not None:
                    g.add((person[owner], UFO.residence, P))
                elif t == "OrtTatort":
                    A = container(pn, {"offence"})
                    targets = [A] if A is not None else (offences if len(offences) == 1 else [PR])
                    for T in targets:
                        g.add((T, UFO.tookPlaceAt if T != PR else UFO.offencePlace, P))
            if not any(t.startswith("Ort") for t in tokens(pn)):
                g.add((P, UFO.mentionedIn, E))

        # dates and deadlines
        for dt in entry.iter(TEI + "date"):
            if not in_entry(dt): continue
            ts = tokens(dt)
            if "DatumUrfehde" in ts:
                oath = [A for lst in acts.values() for A, k in lst if k == "oath"]
                for A in oath or [PR]:
                    timespan(A, dt.get("when"), None, dt.get("calendar"))
                g.add((E, UFO.urfehdeDate, Literal(dt.get("when"), datatype=XSD.date if len(dt.get("when") or "") == 10 else XSD.gYear)))
            elif "DatumTat" in ts:
                targets = [container(dt, {"offence"})] if container(dt, {"offence"}) is not None else (offences if len(offences) == 1 else [])
                if targets:
                    for A in targets: timespan(A, dt.get("when"), dt.get("dur"), dt.get("calendar"))
                else:
                    g.add((PR, UFO.offenceDateText, Literal(text(dt))))
                    if dt.get("when"): g.add((PR, UFO.offenceDate, Literal(dt.get("when"))))
            elif "DatumFrist" in ts:
                F = D[f"deadline-{dt.get(XMLID)}"]
                g.add((F, RDF.type, UFO.Deadline))
                g.add((F, UFO.label, Literal(text(dt))))
                timespan(F, dt.get("when"), dt.get("dur"), dt.get("calendar"))
                evidence(F, dt)
                g.add((container(dt, {"sanction"}) or PR, UFO.hasDeadline, F))
            elif "DatumBegnadigung" in ts:
                B = D[f"pardon-{dt.get(XMLID)}"]
                g.add((B, RDF.type, UFO.Pardon)); g.add((PR, UFO.hasPart, B))
                timespan(B, dt.get("when"), None, dt.get("calendar")); evidence(B, dt)
            elif not ts and dt.get("dur"):
                A = container(dt, {"detention", "sanction"})
                if A is not None:
                    timespan(A, None, dt.get("dur"))

        # amounts
        for m in entry.iter(TEI + "measure"):
            if not in_entry(m) or m.get("quantity") is None: continue
            M = D[f"amount-{eid}-{list(entry.iter(TEI + 'measure')).index(m)}"]
            g.add((M, RDF.type, UFO.MonetaryAmount))
            g.add((M, UFO.quantity, Literal(m.get("quantity"), datatype=XSD.decimal)))
            g.add((M, UFO.currency, UFO[f"currency-{m.get('unit')}"]))
            g.add((M, UFO.label, Literal(text(m))))
            holder = container(m, {"offence", "sanction", "detention", "oath", "priorInstance", "proceedingReference"}) or PR
            g.add((holder, UFO.amount, M))

        # keywords
        for el in entry.iter():
            if el is entry or not in_entry(el) or el.tag == TEI + "persName": continue
            for t in tokens(el):
                if t.startswith("Schlagwort"):
                    holder = container(el, {"offence", "sanction", "detention", "oath", "priorInstance", "proceedingReference"}) or E
                    g.add((holder, UFO.keyword, UF[t]))

    g.serialize(out_path, format="turtle")
    print(len(entries), "entries,", len(g), "triples ->", out_path)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
