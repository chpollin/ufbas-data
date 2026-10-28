---
title: Index
project:
  name: Urfehdebücher der Stadt Basel
  repository: https://github.com/chpollin/ufbas-data
method:
  name: Promptotyping
  url: https://dhcraft.org/Promptotyping/
template:
  name: Vorlage Index
  version: 0.4
  url: https://dhcraft.org/Promptotyping/promptotyping-document/index
status: draft
version: 0.1
created: 2026-09-23
updated: 2026-10-28
authors: [Christopher Pollin]
generated-with: Claude Code (Claude Opus 5.5)
---

# Index

Entry point to the project knowledge of the GAMS presentation layer of the digital edition "Urfehdebücher der Stadt Basel" (https://gams.uni-graz.at/context:ufbas). The knowledge lies in the GitHub repository ufbas-data together with the data package, the local harness, the ingest stylesheets, the queries and the datastream mirrors. The ZimLab repository gams-www holds only the files GAMS serves ([architecture.md](architecture.md#repository-structure)). The `version` field above is the shared document schema version for every file in this folder.

## Documents

| File | Question it answers |
|---|---|
| [project.md](project.md) | What the edition is, who carries it, what source it publishes, under which licence |
| [domain.md](domain.md) | What an Urfehde entry records, which research it serves, how institutions, money, marginal notes, sanctions and persons are read, and the ontology with its layers, alignment and derivation |
| [data.md](data.md) | How TEI, taxonomy, RDF and the exploration dataset are built, and which data findings stay unchanged |
| [tei-analysis.md](tei-analysis.md) | What an independent analysis of the published TEI, retrieved on 2026-10-27, shows about its structure, annotation and limits, and which checks could test it |
| [specification.md](specification.md) | What the site has to do, for whom (personas, user stories), what each view does, and which decisions hold or are open |
| [architecture.md](architecture.md) | Which environments, GAMS objects, Cirilo settings, stylesheets, scripts and queries make up the site, and the constraints of the search channel |
| [design.md](design.md) | Principles, colours, type, components and view structure of the adopted design |
| [testing.md](testing.md) | What the local harness guarantees before a change is pushed, and what staging and production checks cover |
| [plan.md](plan.md) | Which steps are open on staging and for exploration, edition page, ontology, delivery, cleanup and improvements |
| [journal.md](journal.md) | How the knowledge base came about |
| [../README.md](../README.md) | Which files the data package holds, where they come from and under which licence, and how both repositories and the harness are laid out |

The proposed shared rules in [../GAMS.md](../GAMS.md) are binding locally through [../AGENTS.md](../AGENTS.md), which adds the UFBAS rules and their mechanisms. Cross-project adoption and the canonical maintenance location remain open. `CLAUDE.md` only imports both for Claude Code. Dated findings with measurements live in [../snapshots/](../snapshots/), the code audit of 2026-09-23, the research report of 2026-09-24 and the Exploration query on the RDF of 2017 of 2026-09-29. Curated tables of that research, with their provenance, are in [../research-artefacts/](../research-artefacts/README.md).

[tei-analysis.md](tei-analysis.md) is updated when the TEI is retrieved again or `scripts/analyze_tei.py` changes, and it complements [data.md](data.md), which remains the reference of the presentation layer. The README of the data package changes with a release of the package or a change of the repository layout.

The German workshop example [tei-pruefung/SKILL.md](../workshop/tei-pruefung/SKILL.md) binds a TEI review to the local edition rules, taxonomy and existing offline RDF/SHACL check. It targets the UFBAS checkouts of ufbas-data and gams-www; a newly created exercise repository needs its own file and command bindings. The example distinguishes XML parsing, TEI schema validation and RDF validation.

## Terms

Urfehde
: An oath by which a released prisoner swore to renounce revenge against the authorities and to keep the conditions of release. The Basel council recorded these oaths in dedicated books.

Urfehdebuch
: A register volume of the Basel council with Urfehde entries. The edition publishes Urfehdebuch X, Staatsarchiv Basel-Stadt, Ratsbücher O 10, covering 1563 to 1569.

Eintrag
: One Urfehde record in the book, encoded as `tei:div[@ana='#uf_Eintrag']` and published as `uf:Eintrag` in RDF. Entry anchors on the edition page have the form `#Eintrag-N`.

Kategorie
: A term of the project taxonomy in `o:ufbas.kategorien` (for example Täter, Opfer, Tat, Strafe, Ort). Text spans in the edition point to categories through `@ana`.

Datenkorb
: The client-side selection list of entries that a reader collects on the edition, search and Exploration pages and exports as CSV with their categories. It is stored in the browser's `localStorage`.

GAMS
: Geisteswissenschaftliches Asset Management System, the Fedora- and Cocoon-based repository of the Institut für Digitale Geisteswissenschaften (formerly Zentrum für Informationsmodellierung, ZIM) at the University of Graz, which hosts and renders the edition.

Cirilo
: The Java client with which GAMS objects are ingested and their datastreams (stylesheet references, queries, relations) are set.

PID
: Persistent identifier of a GAMS object, here `context:ufbas`, `o:ufbas.1563`, `o:ufbas.kategorien`, `o:ufbas.schema`, the query objects `query:ufbas.search`, `query:ufbas.volltext`, `query:ufbas.kategorien`, `query:ufbas.graph`, `query:ufbas.properties` and `query:ufbas.exploration`, the Cirilo configurations `cirilo:ufbas`, `cirilo:TEI.ufbas` and `cirilo:Context.ufbas`, and the planned `o:ufbas.ontology`.

Folio
: A leaf of the book, recto or verso. The edition counts it over the page breaks from fol. 1r, which differs from the image number of the surface `pb/@facs` points to.

Eingangsnotiz
: The marginal note beside an entry with a guard's name or a tower and a number, read as the accounting of the Turmlöse.

Turmlöse
: The fee a tower guard received when a prisoner was released.

Rotstrafe
: A fine paid to the council, booked by name in the Jahrrechnungen der Stadt Basel.

Eintragstyp
: Urfehde, Urfehdbrief, Aussage, Entwurf or abgebrochen, assigned by rule after the introduction of the edition, since the TEI does not encode it.

Ontologie
: The domain model of the edition in `ontology/`, with the prefixes `ufbas:` for data, `ufbas-ont:` for the ontology, `ufbas-kat:` for the categories and `gams:` for the GAMS ontology. The derived RDF is validated by SHACL shapes beside it, and the page Ontologie shows the `ONTOLOGY` datastream of `o:ufbas.ontology`.
