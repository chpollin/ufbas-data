---
title: Specification
project:
  name: Urfehdebücher der Stadt Basel
  repository: https://github.com/chpollin/ufbas-data
method:
  name: Promptotyping
  url: https://dhcraft.org/Promptotyping/
template:
  name: Vorlage Specification
  version: 0.3
  url: https://dhcraft.org/Promptotyping/promptotyping-document/specification
status: draft
created: 2026-09-24
updated: 2026-10-28
authors: [Christopher Pollin]
generated-with: Claude Code (Claude Opus 5.5)
topics: ["[[Scholar-Centered Design]]", "[[Research Persona im Scholar-Centered Design]]", "[[User Stories]]", "[[Decision Records]]"]
related: [domain.md, data.md, architecture.md, design.md, plan.md]
---

# Specification

What the presentation layer has to do and why. Requirements and decisions hold for the whole site, personas and user stories serve the Exploration view, and the functional scope describes each view as it stands. Decisions only grow.

## Requirements

### Functional

- FR-01 Edition text, TEI, RDF and the `ABOUT` datastream stay as published. Derived layers may add structure, each with its provenance, and never change a published value. Accepted when the edition text test finds no changed entry.
- FR-02 Every entry is reachable from the table of contents, a search hit, a category browse and the Exploration view, each linking to its anchor `#Eintrag-N`.
- FR-03 Folio labels follow the foliation of the book ([data.md](data.md#edition-tei)). Accepted when the labels of the editors' citations resolve.
- FR-04 Both search forms reach `query:ufbas.search`, including regular expressions and a date range alone, and report input that cannot work at the form.
- FR-05 The Datenkorb keeps entries across pages and reloads, takes over the 2017 entries once and exports CSV.
- FR-06 The Exploration view filters the whole book by one shared selection, shows every count with the entries it counts, and marks what the data cannot carry. Accepted when every count of the view, clicked, lists as many entries as it shows, and the view names its level of counting, the undated entries and the cut-out pages.

### Non-functional

- NFR-01 WCAG 2.2 A and AA as far as automatically testable, no horizontal scrolling from 320px, keyboard operation throughout. Measured by the browser check of `npm test`.
- NFR-02 No CSS framework. A library a view needs is vendored, served from the project folder and loaded only where it is used (ADR-18).
- NFR-03 XSLT 2.0 and no empty non-void element in the output, since GAMS runs Saxon in 2.0 and browsers parse the output as HTML.
- NFR-04 No change reaches production untested. It passes the local checks and is looked at on staging first ([testing.md](testing.md)).
- NFR-05 Production is read sequentially and sparingly.

## Personas

Two research personas describe the perspectives the Exploration view serves. They follow the research persona of Scholar-Centered Design, with working profiles documented by publications and the edition, no invented names, and the evidence of each statement ([domain.md](domain.md#research-context)). They are hypotheses until the editors at the Departement Geschichte of the University of Basel, or a course using the edition, confirm them.

### Historian of early modern criminal justice

Studies how the Basel council dealt with delinquency in the 1560s, by serial analysis of the book and close reading of entries. Counts and compares offences and sanctions over time and by group, then reads the entries behind a pattern. Needs date, offender, gender, origin, the wording of offence and sanction, the prior instance and the marginal note, and judges whether a pattern reflects practice, recording or gaps in transmission. Reported in Burghartz 1989, Schwerhoff 2011, Kamp 2020 and the About page, the sequence of operations is derived.

Research goals:

- G1 Sanctioning practice, which sanctions followed which offences and how this changed.
- G2 Gender, offences and sanctions of women and men compared.
- G3 Exclusion and mobility, origin and residence related to banishment, Vagieren and Betteln.
- G4 Custody and administration, from the marginal notes, detention remarks and the notary.
- G5 Procedure and grace, prior instances, earlier proceedings, mitigation, conversion, deadlines.
- G6 Evidence, every figure traceable to its entries, and the selection reusable elsewhere.

### Teacher and student of early modern sources

A teacher using the edition in a course and the students working with it, and archival outreach that presents single cases. Moves from an overview to a telling case and back, without SPARQL or XPath and with little time per session. Reported through the Basel courses of 2012 and 2016, the Old Bailey impact case study on teaching, and the blog series "Nie wieder, ich schwöre" of the Staatsarchiv Basel-Stadt (2020).

Research goals:

- G7 Source genre, what an Urfehde records and how the book came about, gaps included.
- G8 Pattern and case, reaching the entries behind a pattern and telling typical from exceptional cases.

## Epics and user stories

Each story is a hypothesis until confirmed. Data states whether the TEI carries it ([data.md](data.md#data-quality)), View names the part of the Exploration view that serves it. Which stories the view serves today is kept in [testing.md](testing.md#stories).

### Epic 1 Sanctioning practice (G1, G2)

- Offence and sanction. As a historian who studies sanctioning practice, I want to see for one offence which sanctions were imposed, so that I can tell typical from exceptional judgements and read them. Data at entry level. View, the row of an offence with its sanction profile.
- Sanctions and modalities. As a historian, I want admonition, threat, exemption and mitigation apart from the sanctions, so that near-universal formulas do not hide the punishments. Data through the derived sanction groups ([domain.md](domain.md#sanctions)). View, a switch in every sanction chart.
- Gender. As a historian who studies gender and crime, I want every selection split by the gender composition of the offenders, so that I can compare what women and men were punished for. Data yes, mixed entries as a class of their own. View, split bars and a gender facet.
- Change over time. As a historian, I want offences and sanctions by month from 1563 to 1569, so that I can recognise changes in practice. Data yes, with marked date contradictions. View, timeline.

### Epic 2 Exclusion and mobility (G3)

- Origin of the banished. As a historian who studies exclusion, I want to compare the origins of banished and other offenders, so that I can see whom the city expelled. Data as normalised place names, a map needs an alignment to an authority. View, ranked list of origins with the banishment filter.
- Strangers and residents. As a historian, I want to filter by origin, residence and offences such as Vagieren and Betteln, so that I can compare how settled inhabitants and strangers were treated. Data in part, residence is rare. View, facets.

### Epic 3 Procedure and custody (G4, G5)

- Guards and releases. As a historian of urban administration, I want to see which guard claimed the Turmlöse for which releases per half-year, so that I can reconstruct how custody was administered. Data after the derived normalisation of the marginal notes ([domain.md](domain.md#marginal-notes)). View, claims per claimant and half-year.
- Detention and deadlines. As a historian, I want the length of detention and the deadlines set in the oath, so that I can judge how long proceedings lasted. Data in part, durations are rare. View, distribution with the share of entries without one.
- Prior instance and other proceedings. As a historian, I want to filter by prior instance and follow the editors' references to other proceedings of a person, so that I can trace procedural routes and repeat cases. Data through the resolved cross-references ([domain.md](domain.md#persons)). View, facets and links in the entry list.

### Epic 4 From pattern to entry (G7, G8)

- Reading behind a pattern. As a student, I want to reach the entries behind a bar or a cell with one click, so that I learn how a figure and its cases belong together. Data yes. View, entry list linking into the edition.
- Gaps in transmission. As a student and as a historian, I want the gaps of the book shown, the cut-out pages and the thin plague months, so that I do not read a gap as a quiet period. Data yes. View, gaps drawn apart in the timeline.
- What a category means. As a student, I want the definition of a category where I use it, so that I understand what the annotators counted. Data from the glosses. View, the label carries its gloss.

### Epic 5 Evidence and reuse (G6)

- Where a figure comes from. As a historian, I want to see which entries and annotations a figure counts and at which level, so that I do not over-interpret it. View, every count unfolds.
- A citable state. As a historian, I want the selection in the page address, so that I can cite and share it. View, selection in the URL.
- Taking the selection along. As a researcher reusing the data, I want to put the selection into the Datenkorb or export it. View, Datenkorb takeover and CSV.

Out of scope are person networks, crime rates and comparisons with other books, and a map before the places are aligned.

## Functional scope

- Home. Introduction, three ways in with example searches and the category groups.
- Project. The `ABOUT` text with its footnotes and a table of contents of its sections.
- Edition. The whole book on one page, entries with date, folio and offender in the heading, categories marked in the text with an annotation index per entry, switches that mark category groups in the whole book, editorial notes as tips, table of contents by date, Datenkorb switches, and the views "Text" and "Text und Bild" with the page images of the Staatsarchiv, without a separate page image dialog (ADR-25). View and marked groups travel in the fragment of the address (ADR-24). The book is laid out as one page, eased by `content-visibility`.
- Categories. The taxonomy with glosses, an entry list per category and, where the Exploration view has a filter for it, a link into the view.
- Search. Quick search and advanced search with full text, regular expressions, date range and examples, on the refactored RDF, where a place name finds every spelling of the place and date range and excluded terms hold for it as well. Result pages with excerpts, chips, year links, the Datenkorb and a CSV of the hits ([architecture.md](architecture.md#search)).
- Datenkorb. List with sorting, removal, CSV and clearing.
- Graph. Forwards to the Exploration view with its category selected, or to the entry list of a category the view has no filter for.
- Exploration. Every entry of the book as one mark coloured by its sanction class, read from the RDF through `query:ufbas.exploration` ([data.md](data.md#rdf-as-source-of-the-exploration-view)) under one selection kept in the fragment of the address. The view "Zeit" sets the marks by month from 1563 to 1569 with men above and women below the axis, mixed and unknown compositions in bands of their own, the cut-out pages hatched and the undated entries apart. The view "Tatbestand" moves the same marks into a row per offence with its sanction profile. Legend and filter menus (gender composition, offence, sanction, origin, procedure, keyword) count in the selection, a drag over the time axis chooses months, and marks outside the selection fade. A mark opens its entry, and a sortable table of the selection links into the edition and the Datenkorb and exports CSV ([design.md](design.md#views)). The refactored RDF also carries the marginal notes, durations and cross-references of Epic 3, which query and view do not read yet.

## Decisions

Decided entries give the date and the decision, open ones the question and the recommendation. Context and effect stand in [journal.md](journal.md) under the same date.

- ADR-01 (2026-09-23) Refactoring without content change and without partner approval.
- ADR-02 (2026-09-23) The edition stays one page, the visual identity of 2017 is kept and improved step by step.
- ADR-03 (2026-09-23) No CSS framework and no JavaScript library, d3 only on the graph page. Text stands on white, sources are icons.
- ADR-04 (2026-09-24) Code under MIT, content stays CC BY-NC-SA 4.0.
- ADR-05 (2026-09-24) The Exploration view is built as coordinated views, without network and, until the places are aligned, without map. d3 leaves with the graph page.
- ADR-06 (2026-09-24) Dates that contradict their written form are shown as published and marked.
- ADR-07 (2026-09-24) The place alignment to an authority is a later step.
- ADR-08 (2026-09-24) A domain ontology under CIDOC CRM with RiC-O, SKOS and PROV-O is derived from the unchanged TEI, with the category IRIs kept as SKOS concepts and a namespace of its own for classes and properties ([domain.md](domain.md#domain-ontology)).
- ADR-09 (2026-09-24) Folio labels are counted over the page breaks.
- ADR-10 (2026-09-24) The editors' cross-references become a derived link layer, since writing them into the TEI would change the content (ADR-16).
- ADR-11 (2026-10-26) The four sanction groups are derived SKOS collections and the grouping of the view. The view uses them since 2026-09-29 as a list in `ufbas-context.xsl`, and `test/skos.test.mjs` holds the collections of the concept scheme to that list.
- ADR-12 (2026-10-26) The entry type is a field of the derived data, assigned by the five rules that reproduce the curated table, and the two fragments document the proceeding of the entry they continue, as built on 2026-10-21.
- ADR-13 (2026-10-26) The link of imposed fines to their bookings in the Jahrrechnungen is deferred until after the GAMS update.
- ADR-14 (2026-10-26) `query:ufbas.graph` is kept and forwards to the Exploration view. `ufbas-graph.xsl` forwards since 2026-09-29, and the operator sets its `STYLESHEET` with the GAMS update ([architecture.md](architecture.md#switching-the-graph-page)).
- ADR-15 (2026-09-24) The design proposal is adopted as a whole and built into the stylesheets, with Source Serif 4 and Source Sans 3 served from the repository and the white navigation bar ([design.md](design.md)).
- ADR-16 (2026-09-24) The editors are not consulted, since the content of the edition does not change. Data findings and open questions stay documented in this knowledge base, and the refactoring is published as it is.
- ADR-17 (2026-09-24) The domain ontology is published as a new GAMS object of model `cm:Ontology`. The RDF derived under it becomes the refactored RDF of the edition, which the search and further visualisations query.
- ADR-18 (2026-09-24) Libraries a view needs, OpenSeadragon for the facsimile and d3 where a chart needs it, are vendored in the repository and served by GAMS from the project folder, never from a CDN, and loaded only on the pages that use them. This replaces the library rule of ADR-03 and the removal of d3 in ADR-05.
- ADR-19 (2026-09-24) The refactored presentation layer, the Exploration view, the facsimile synopsis and the new ontology with the RDF derived under it and the search queries rewritten against that RDF reach production together, in one GAMS update with the re-ingest and the Cirilo settings it needs.
- ADR-20 (2026-09-24) The `IMPRINT` datastream is revised. The Zentrum für Informationsmodellierung is named by its current name, Institut für Digitale Geisteswissenschaften, with its current address and contact as its site gives them (https://digital-humanities.uni-graz.at/de/, accessed 2026-10-26), the revision of 2026 is credited to Christopher Pollin, the layout of 2017 stays credited as history, and the citation suggestion equals the one of the edition page. The footer of every page carries the same credit in one line. On the imprint page the footer line is left out, since the imprint names the credit there, so it stands once per page.
- ADR-21 (2026-09-29) The RDF is the data source of the Exploration view. The view reads one new query object, `query:ufbas.exploration`, through `sdef:Query/getJSON` once per page view, one row per entry, and counts every chart in the browser. Recommended against were a query per click, since coordinated views recount every filter on each change and the parameter channel carries no multi-valued filter, an aggregation in Python, which would add a second toolchain for a static file the XSLT already gives, and a JSON-LD serialisation of the 2017 RDF, which would carry its model defects into the client. The TEI-derived dataset remains as the independent reference of the tests.
- ADR-22 (2026-09-29) The Exploration view is a unit visualisation, one mark per entry, which fills the width of the window, following "overview first, zoom and filter, details on demand". The data allow it, since the book is small, an entry has one date and one gender composition, and it carries in most cases one sanction class, which can take the colour, while the many offences arrange the rows. Position on a common time axis and spatial bands for the genders are the strongest channels for the tasks of the personas. Recommended against were tables with tinted cells, whose luminance the eye reads worse than position and length, and Sankey diagrams or parallel sets, which count an entry with several offences several times. The operator chose the direction in the local preview on 2026-09-29, and the calendar and the matrix of ADR-05 gave way to it.
- ADR-23 (2026-09-29) The refactored RDF has three layers with the prefixes `ufbas:` for the data, `ufbas-ont:` for the ontology and `ufbas-kat:` for the categories, and its data use only terms of the ontology, which carries the alignment to CIDOC CRM, RiC and PROV ([domain.md](domain.md#domain-ontology)). One family of prefixes keeps the layers apart, `-kat` names the content rather than the format, and specific classes fit the source better than the general ones of the standards, whose link stands in one place. Text and membership in the object use the GAMS ontology, `gams:textualContent` and `gams:isPartOf`, instead of the undocumented `g2o:` of 2017, so the full-text search reads the term every GAMS project uses. Recommended against were CRM and RiC classes directly in the data, which queries without inference would have to spell out every time.
- ADR-24 (2026-10-26) The view and the marked groups of the edition page travel in the fragment of the address, as `#Eintrag-12&ansicht=bild&markierung=Person,Strafe`, since GAMS answers a query parameter on the edition URL with 404 or 500 ([architecture.md](architecture.md#edition-page)).
- ADR-25 (2026-10-26) The edition page gets no page image dialog after the pattern of DEPCHA. The view "Text und Bild" shows the page image beside the text.
- ADR-26 (2026-10-26) The placeholders "(link Tatbestände)", "(link Strafen)" and "(link Schlagworte)" of `ABOUT` are rendered as links to their category groups with their wording unchanged. Like the cross-references of ADR-10 the links are a derived layer, and the datastream stays as published.
- ADR-27 (2026-10-26) "(Beta-Version)" at the top of `ABOUT` stays as published (ADR-16).
- ADR-28 (2026-10-26) The introduction sentence of the category page stays as content of the TEI of `o:ufbas.kategorien`.
- ADR-29 (2026-10-26) The CSV exports of the Datenkorb, the result list and the Exploration view share the column set of the Datenkorb export, with `eintrag`.
- ADR-30 (2026-10-26) English labels of the categories are drafted by an LLM agent into `research-artefacts/` for the operator's curation, and they enter the ontology only after it ([domain.md](domain.md#domain-ontology)). The operator curated them on 2026-10-28, keeping source concepts without an English equivalent in German, and they enter the concept scheme as English `skos:prefLabel`.
- ADR-31 (2026-10-27) gams-www follows the ZimLab template for `gams-www` and holds only what GAMS serves from `/ufbas/`. Knowledge, local harness, ingest stylesheets, queries, datastream mirrors and TEI live in the GitHub repository ufbas-data, its code under MIT and its data under CC BY-NC-SA 4.0 (ADR-04, [architecture.md](architecture.md#repository-structure)).
- ADR-32 (2026-10-27) The pages take their fonts from those GAMS serves for all projects under `/assets/fonts/`, Droid Serif and Open Sans as in the ZimLab template, in place of Source Serif 4 and Source Sans 3 served from the repository (ADR-15). gams-www then carries no fonts of its own ([design.md](design.md#type)).
- ADR-33 (2026-10-28) The domain ontology is a finished static product, published as the GAMS object `o:ufbas.ontology` of model `cm:Ontology` and ingested by the operator. The object has only the `ONTOLOGY` datastream in RDF/XML and its `STYLESHEET` redirect to `ufbas-ontology.xsl`, and how the ontology is produced belongs to ufbas-data. gams-www holds no ontology file, and the page Ontologie renders from the `ONTOLOGY` datastream alone, without SHACL shapes, without the example of `Eintrag-0` and with the RDF/XML of the datastream as its one download. The Turtle, the JSON-LD, the shapes and the example stay in `ontology/` of ufbas-data as part of the data package, where the harness keeps validating the derived RDF against the shapes ([architecture.md](architecture.md#repository-structure)).
- ADR-34 (2026-10-28) The page images go into the TEI of `o:ufbas.1563` itself, and the facsimile dataset `data/ufbas-facsimile.json` of gams-www is retired. The operator decided this from reviewer feedback received on the edition. The Lesesaal gives no persistent URL per page, so one `surface` per image a page break names carries both the IIIF image service of the archive in `graphic/@url` and the canvas id of the Lesesaal in `@corresp`, `facsimile/@source` names the manifest, and `pb/@facs` points to the surface. The `graphic` carries neither `xml:id` nor `mimeType`, so Cirilo references the images and uploads none. `local-test-build/make-facsimile-tei.mjs` writes the change as text and rewrites the image services from a newly saved manifest after a storage move. The changed `tei/ufbas.1563.xml` is a prepared target value until the operator re-ingests it, and until then the edition page shows the text alone with a note ([data.md](data.md#edition-tei), [architecture.md](architecture.md#ingest)).
