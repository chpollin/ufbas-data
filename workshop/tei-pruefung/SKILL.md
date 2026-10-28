---
name: tei-pruefung
description: Prüft UFBAS-TEI anhand der Editionsregeln, kontrolliert XML und Referenzen und dokumentiert Befunde und Prüfgrenzen. Verwenden bei der Prüfung der Urfehdebücher und ihrer RDF-Ableitung.
---

# UFBAS-TEI prüfen

Prüfe in den lokalen UFBAS-Repositories. Die folgenden Pfade sind relativ zum Root von ufbas-data, unabhängig vom Speicherort dieses Skills. Das Beispiel setzt beide Checkouts mit `local-test-build/` in ufbas-data voraus. Im neu angelegten Hands-on-Repository müssen Quellen und Prüfaufrufe zuerst an dessen Struktur gebunden werden.

## Quellen

- `AGENTS.md` und `GAMS.md` regeln den Handlungsspielraum.
- `gams/datastreams/context-ufbas.ABOUT.xml`, Abschnitte „Transkriptionsrichtlinien“ und „Kodierungsstandards“, enthält die veröffentlichten Editionsregeln.
- `tei/ufbas.1563.xml` enthält die Edition; `tei/ufbas.kategorien.xml` die Annotationstaxonomie.
- `knowledge/data.md` dokumentiert Datenstruktur und bekannte Befunde; `knowledge/testing.md` beschreibt die vorhandenen Prüfungen.
- `gams/datastreams/o-ufbas.schema.ONTOLOGY.xml` beschreibt das historische RDF-Vokabular. `ontology/ufbas.ontology.ttl` und `ontology/ufbas.shapes.ttl` gehören zur überarbeiteten RDF-Ableitung. Diese Dateien validieren kein TEI-XML.

## Ablauf

1. Lies die zur Aufgabe gehörenden Quellen. Nenne unlesbare Voraussetzungen und die dadurch offenen Prüfungen. Extern verlinkte Richtlinien gelten erst nach eigener Lektüre als geprüft.
2. Parse die beiden TEI-Dateien als XML. Prüfe Eindeutigkeit der `xml:id`-Werte und löse lokale Referenzen entsprechend ihrer Bedeutung auf. Prüfe insbesondere die UFBAS-Kategorieverweise in `@ana` gegen die Taxonomie. Interpretiere externe IRIs oder andere Referenzarten nicht pauschal als lokale Kategorien.
3. Ermittle für eine TEI-Schemavalidierung das tatsächlich passende XML-Schema und den vorhandenen Validatoraufruf. Halte Pfad, Version und Aufruf fest. Die aktuellen lokalen Quellen liefern dafür noch keine gebundene Projektanpassung. Historische Verweise auf `tei_all.rng` belegen keine aktuelle Validierung. Fehlt die Bindung, berichte „TEI-Schemavalidierung nicht durchgeführt“ und führe die übrigen möglichen Prüfungen fort. Ein erfolgreicher XML-Parse belegt Wohlgeformtheit.
4. Soweit die einschlägigen Editionsregeln gelesen werden konnten, beurteile fachliche Auffälligkeiten anhand dieser Regeln und konkreter TEI-Stellen. Trenne maschinell festgestellte Fehler, bekannte Befunde und offene fachliche Fragen. Ein bestandener Strukturtest belegt keine korrekte Transkription.
5. Falls die Aufgabe die RDF-Ableitung umfasst und der gebundene Harness vorhanden ist, lies die dafür genannten Ontologie- und SHACL-Dateien und führe aus `local-test-build/` mit `UFBAS_OFFLINE=1` den vorhandenen Aufruf `node test/ontology.test.mjs` aus. Kennzeichne ihn als RDF-/SHACL-Prüfung. Fehlt der Harness, melde „RDF-/SHACL-Prüfung nicht durchgeführt“. Fehlende Abhängigkeiten oder Cache-Dateien bleiben offene Voraussetzungen.

## Grenzen

Arbeite offline. Quelldaten und gespiegelte Datastreams bleiben unverändert. Stelle keine GAMS-Anfragen und lade keine Schemas automatisch nach. Ändere Editionsregeln, Schemas oder erwartete Testwerte nicht, um Befunde verschwinden zu lassen. Vorhandene Projektregeln behalten ihren Vorrang.

## Ergebnis

Berichte die geprüften Dateien, Quellen und tatsächlich ausgeführten Aufrufe mit ihrem Ergebnis. Jeder Befund nennt Datei, `xml:id` oder XPath, die betroffene Regel und den Beleg. Führe offene Prüfungen und fachliche Fragen gesondert auf. Schreibe den Bericht nur an einen beauftragten Zielort, andernfalls gib ihn im Chat aus.
