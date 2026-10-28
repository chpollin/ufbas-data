---
title: Journal
project:
  name: Urfehdebücher der Stadt Basel
  repository: https://github.com/chpollin/ufbas-data
method:
  name: Promptotyping
  url: https://dhcraft.org/Promptotyping/
template:
  name: Vorlage Journal
  version: 0.4
  url: https://dhcraft.org/Promptotyping/promptotyping-document/journal
status: active
created: 2026-09-23
updated: 2026-10-28
authors: [Christopher Pollin]
generated-with: Claude Code (Claude Opus 5.5)
related: [project.md, specification.md, plan.md]
---

# Journal

Curated index of the transitions that shaped the current knowledge base, each with its source, target and result. Current content lives in the documents the entries point to, open work in [plan.md](plan.md), decisions in [specification.md](specification.md#decisions).

## 2026-09-23 integriert, repository baseline and audit

From the developer folder `Z:\gamsdev\ufbas`, an SVN working copy of `https://gedra.uni-graz.at/svn/ufbas` at revision 618, and the files served on production into the first two commits, the mirrors in `gams-datastreams/`, this knowledge base and the code audit report. The working copy had one modified file and one unversioned folder, both committed as found, and `trunk/ufbas-object.xsl` was brought to its production state. Knowledge documents are English, and since UFBAS then had no staging instance, every change went through local simulation first ([testing.md](testing.md)).

## 2026-09-23 korrigiert, served layout and delivery route

From the operator's delivery route, the GAMS update tool that brings ZimLab `main` to `/ufbas/`, into the repository layout. The served files moved from `trunk/` to the root, the course part files and taxonomy files to `source-material/`, the rest of the SVN tree left the tree (kept in gams-www commit `e0d27f9`), and the mirror became a clone in `gamsdev/ufbas/gams-www`. The work is a refactoring without content change and without partner approval (ADR-01).

## 2026-09-23 integriert, refactoring of the presentation layer

From a local harness proven against production, where every page type was identical after normalising generated ids except the unordered category browse, into rewritten stylesheets, scripts and styles with the identity of 2017 kept. Search, edition, Datenkorb and page shell were repaired ([architecture.md](architecture.md#search)). An independent review found three defects the harness could not show, an empty-matching highlight pattern, lost brackets in the headings of the book and all twelve month names in SaxonJS, which were fixed and covered by checks ([testing.md](testing.md#limits-of-saxonjs)).

## 2026-09-23 korrigiert, root font size and browser analysis

From the first look in headless Chrome into `css/template.css`. Bootstrap 3 had set the root font size to 10px, which no check without a browser could see, and the load analysis placed the cost of the edition in the layout of the whole book in the browser, above all on phones.

## 2026-09-23 integriert, vanilla interface, accessibility and reflow

From the operator's decision to keep the edition one page and drop Bootstrap and jQuery (ADR-02) into an own page shell, `content-visibility` on the edition, the switches "Im Text markieren" and the browser check with axe-core at seven widths in `npm test` ([testing.md](testing.md#browser)). An independent review confirmed XSLT 2.0 and the unchanged edition text, and its findings became fixes and checks that were shown to fail before the fix.

## 2026-09-23 integriert, page types, exploration groundwork and design proposal

From the operator's decisions on frameworks, sources as icons and an Exploration tab (ADR-03) into one stylesheet per page type, a critique of the force graph and a design proposal answering the operator's finding that the result was cold and blocky ([design.md](design.md#principles)). The proposal was a style layer seen beside the current pages, and a second review led to fixes of the graph page, the chips and the breakpoint of the sticky navigation.

## 2026-09-24 integriert, licence, research basis and ontology plan

From operator decisions, literature on Urfehden and early modern criminal justice, the About page and a data profile of the whole book into [specification.md](specification.md), [domain.md](domain.md) and [data.md](data.md#data-quality). The result is the licence decision (ADR-04), the decisions on the Exploration view, dates, places and the ontology (ADR-05 to ADR-08), two research personas with five epics, the analysis of the RDF of 2017 and the data findings.

## 2026-09-24 korrigiert, folio labels

From the editors' citations by heading and folio, which the labels of the edition page did not resolve, into `uf:folio` in `ufbas-object.xsl` and `exploration-data.xsl` and [data.md](data.md#edition-tei). The label `N - 18` of 2017 counted images instead of leaves and was wrong on every page. It gave way to a count over the page breaks that respects the unfoliated pages and the inserted leaf 32a (ADR-09).

## 2026-09-24 integriert, knowledge base structure

From the Promptotyping templates into `knowledge/`, `research-artefacts/` and `snapshots/`. The documents carry `template:` fields, `specification.md` and `domain.md` are new, the search architecture stands in `architecture.md`, the research tables with their scripts in `research-artefacts/` and the measurements in `snapshots/research-report-2026-09-24.md`.

## 2026-09-24 integriert, checks against production and the knowledge base

From one-off comparisons of the research into `npm test` ([testing.md](testing.md#guarantees)). The RDF that `TORDF` derives from the mirrors equals the published RDF of edition and taxonomy triple for triple, the dataset folios equal those of the edition page, and every link and anchor of the project documents resolves.

## 2026-09-24 integriert, adopted design

From the design proposal and the operator's decision (ADR-15) into `css/`, `fonts/` and [design.md](design.md). The rules of the proposal moved into the stylesheets and the comparison layer went.

## 2026-09-24 integriert, scope and delivery

From operator decisions into [specification.md](specification.md#decisions) and [plan.md](plan.md). The editors are not consulted (ADR-16), which makes their cross-references a derived link layer (ADR-10), the ontology becomes a GAMS object under which the RDF of the edition is derived anew (ADR-17), libraries are vendored (ADR-18), and layer, Exploration, facsimile synopsis and ontology reach production in one update (ADR-19).

## 2026-09-24 integriert, facsimiles

From the IIIF manifest of the Digitaler Lesesaal, saved by the operator from a browser, and the HTR ground truth set on Zenodo into `source-material/dls-manifest-245856.json`, `data/ufbas-facsimile.json`, `js/openseadragon-6.1.1/` and [data.md](data.md#edition-tei). Every page break has its page image again, publicly served as IIIF level 0 and free of rights.

## 2026-09-24 verdichtet, open lists and the entry of 2026-09-24

From the "Open." paragraphs of all entries, whose items live in [plan.md](plan.md) and ACTIVE-WORK, and the single entry of 2026-09-24 into one entry per transition. Git base gams-www `365a6ad`.

## 2026-09-24 integriert, imprint and credit

From the operator's request and the current websites of the institute and the university into `gams-datastreams/context-ufbas.IMPRINT.xml`, the imprint rendering and the footer (ADR-20). The imprint names the Institut für Digitale Geisteswissenschaften with its current address and contact, credits the revision of 2026 and fits one screen.

## 2026-09-24 integriert, project page

From the operator's review of the project page into the `about` template, `css/context.css`, `css/template.css` and [design.md](design.md#type). The facts of the edition stand in the page head, the rail holds only the table of contents, and project texts hyphenate only below 48rem.

## 2026-09-24 integriert, source downloads and page head

From the operator's review of the edition page into the page heads, `img/icon-tei.svg`, `img/icon-rdf.svg` and [design.md](design.md#components). TEI and RDF are downloads shown as the TEI emblem and the RDF icon, credited in the imprint.

## 2026-09-24 integriert, text and image, annotation in the text

From the operator's reviews of three states of the edition page into `ufbas-object.xsl`, `css/edition.css`, `js/highlighting.js`, `js/edition-views.js` and [design.md](design.md#views). The category panel gave way to marks in the text at a fixed line height and an index per entry, and "Text und Bild" shows the page image in the vendored OpenSeadragon beside the text. The view state lives in the URL fragment, since GAMS answers query parameters on the object with an error.

## 2026-09-24 integriert, data package

From the published datastreams of GAMS and the derived datasets into the public repository https://github.com/chpollin/ufbas-data and [data.md](data.md#sources). TEI, RDF and schema are kept byte for byte with a README of their sources, CC BY-NC-SA 4.0 and a citation file.

## 2026-09-29 integriert, staging instance

From the operator's setup of UFBAS on `gams-staging.uni-graz.at` into [architecture.md](architecture.md#gams-objects) and `CLAUDE.md`. `ufbas-static.xsl` takes the served folder from its own URL, so one commit serves staging and production, the TEI moved to `data/tei/` for one ingest, and the ingest transformations became `ufbas-TOTEI.xsl` and `ufbas-TORDF.xsl`. The staging ingest gave the RDF of production with the same resources.

## 2026-09-29 verdichtet, knowledge and code after the staging setup

From a review of the knowledge base and an independent code audit into [architecture.md](architecture.md#cirilo-configuration), [plan.md](plan.md#staging), [testing.md](testing.md), `CLAUDE.md` and the code. The architecture holds the target value of every Cirilo datastream with the references in which production deviates, dated test counts left `testing.md`, dead templates and rules went, and a new check renders the imprint with the staging URL.

## 2026-09-29 integriert, calmer edition page and search hints

From the operator's reviews of the edition on staging into [design.md](design.md#principles), `CLAUDE.md` and the stylesheets. The page head holds only the title with view switch, source icons and citation beside it, no middle dot separates anything, the Datenkorb switch became one bookmark with a confirmation, and a pattern without the option of regular expressions is reported at the form.

## 2026-09-29 integriert, Exploration view on the RDF

From the operator's decision that the RDF is the data source (ADR-21) and a walkthrough along both personas into `query/ufbas.exploration.sparql`, `js/exploration.js`, `css/exploration.css`, the Exploration page and [data.md](data.md#rdf-as-source-of-the-exploration-view). The force graph gave way to aggregates that each open their entries, read from one query object as JSON and counted in the browser, the graph page forwards, and d3 is gone. The query on the RDF of 2017 agreed with the TEI on every offence, sanction and date and lost some keywords and gender readings ([exploration-rdf-2017-2026-09-29.md](../snapshots/exploration-rdf-2017-2026-09-29.md)).

## 2026-09-29 integriert, Exploration view as unit visualisation

From the operator's critique that calendar and matrix were tables to be read as numbers, a survey of visualisation catalogues and two rounds in the local preview into `js/exploration.js`, `css/exploration.css`, `exploration.test.mjs` and ADR-22. Every entry is a mark, by month with men above and women below the axis or in rows by offence with a sanction profile, coloured by five sanction classes, and a filter fades marks instead of removing them.

## 2026-09-29 entschieden, layers of the refactored RDF

From the operator's questions on an example of Eintrag-0 in the old and the target model into [domain.md](domain.md#domain-ontology) and ADR-23. Data, ontology and categories get the prefixes `ufbas:`, `ufbas-ont:` and `ufbas-kat:`, the data use only ontology terms, and CRM, RiC and PROV stand as alignment in the ontology.

## 2026-09-29 integriert, ontology, derivations and shapes

From the operator's decision to build the ontology with its validation, done by three delegated agents, into `data/ontology/`, `ufbas-TORDF-ontology.xsl`, a derivation of the concept scheme that was folded into it on 2026-10-21, three new tests and [domain.md](domain.md#domain-ontology). The shapes found errors of the first derivation and gaps of the ontology, which were fixed, and keep the facts of the published TEI as counted warnings. The derivation corrected [data.md](data.md#data-quality) on `Eintrag-505` and raised doubt on the gender reading of `Eintrag-176` and `Eintrag-376`.

## 2026-09-29 integriert, review of every page

From a review of every page in the local preview at full and phone width, done by delegated agents per page group, into the stylesheets, scripts and [design.md](design.md#components). Header, navigation and footer keep one width on every page, the edition lost its `title` attributes, the Datenkorb and the Exploration view share the entry table, and search results offer a CSV in the common columns instead of the GAMS XLS.

## 2026-09-29 integriert, page Ontologie

From the operator's wish to make the semantic data visible and reusable into the mode `ontologie` of `ufbas-context.xsl`, `css/ontology.css`, the navigation and [design.md](design.md#views). The page is rendered from the ontology and the shapes, with the model as a tree, the terms with anchors and alignment, and downloads in Turtle, RDF/XML and JSON-LD.

## 2026-09-29 entschieden, operator decisions after the page review

From the operator's decisions on the open points of the page review into the stylesheets, `js/exploration.js`, the tests and [specification.md](specification.md#decisions). The imprint page leaves the footer credit out (ADR-20), the home page gains the Exploration view as a fourth way in, the edition page is titled like the home page, and the Exploration table shows the first 50 rows of its selection.

## 2026-10-21 integriert, ontology complete for the update

From the operator's decision to finish the ontology before the update into `ufbas-TORDF-ontology.xsl`, `data/ontology/`, `query/`, `js/buildquery.js`, the page Ontologie, `ufbas-ontology.xsl` and the harness. The one derivation gives entry types, the editors' cross-references, candidate person links, date conflicts and place mentions and writes the concept scheme, Exploration and search read the refactored RDF, and Saxon-HE 9.6 runs the ingest with the result of SaxonJS ([domain.md](domain.md#domain-ontology)).

## 2026-10-26 verdichtet, plan reduced to open steps with the cleanup

From a read-only audit of stylesheets, scripts, styles, harness, research scripts and knowledge into [plan.md](plan.md#cleanup). The plan keeps only open steps, takes the staging settings and the operator's update order from the handoff of 2026-10-21, and gains the cleanup in eight packages.

## 2026-10-26 integriert, knowledge on the state of 2026-10-21

From the handoff of 2026-10-21, the code of the commits of that day and the operator's decisions of 2026-10-26 into [architecture.md](architecture.md#cirilo-configuration), [data.md](data.md#data-quality), [domain.md](domain.md#domain-ontology), [testing.md](testing.md), [specification.md](specification.md#decisions), the READMEs and [exploration-rdf-2017-2026-09-29.md](../snapshots/exploration-rdf-2017-2026-09-29.md). The documents describe the one derivation, the queries on the refactored RDF and every test, ADR-11 to ADR-14 are decided and ADR-24 to ADR-30 recorded, licence and citation stand once in the README, and the handoff is removed.

## 2026-10-26 integriert, cleanup of code, styles and tests

From the audit packages of [plan.md](plan.md#cleanup) into the stylesheets, `css/`, `js/`, `query/`, `local-test-build/` and `research-artefacts/`. Dead code and stale comments are gone without a changed page, the taxonomy helpers live once in `ufbas-static.xsl`, the three CSV exports share the Datenkorb columns (ADR-29), printing shows every year and the table heads, the search queries order entries and offenders by the book, the tests share `test/lib.mjs`, the phone layout shrinks navigation and edition tools to one line each, and the placeholders of `ABOUT` link to their groups (ADR-26).

## 2026-10-26 integriert, GAMS rules apart from the project rules

From the operator's request for a GAMS-wide rule document into [../GAMS.md](../GAMS.md), `CLAUDE.md` and `.gitignore`. GAMS.md holds the rules of every GAMS project with the mechanism enforcing each, the criteria left to judgement, the traps met so far and the knowledge of a full reading of the GAMS and Cirilo documentation of 2022 with a pointer to its sections, while `AGENTS.md` holds the rules of UFBAS for any agent tool and `CLAUDE.md` only imports both for Claude Code. `test/mirror.test.mjs` compares the mirrored datastreams and the ingest transformations with production, and `fetchCached` reads GAMS one request at a time with a limit and an offline switch. Agent-local files are ignored, since the repository root is the served folder.

## 2026-10-26 integriert, imprint in sections and marks that keep their colour

From the operator's review of the local preview into `gams-datastreams/context-ufbas.IMPRINT.xml`, `ufbas-context.xsl`, `css/` and [design.md](design.md#views). The prepared `IMPRINT` has three sections with a licence row and the contact as the institute's site gives it, and is rendered in one column. The SHACL shapes are licensed CC BY 4.0 like the ontology. The marks are at least 1.5px, Orte 3px, with whole-pixel offsets, after Orte showed grey at single density. The phone layout of the edition is a draft on the branch `entwurf-oberflaeche` until the operator accepts it.

## 2026-10-26 korrigiert, scope of GAMS rules and cached references

From the documentation audit checked against local gams.mjs, test/run.mjs, mirror.test.mjs and the Claude configuration into [../GAMS.md](../GAMS.md), [../AGENTS.md](../AGENTS.md), the README, [INDEX.md](INDEX.md), [architecture.md](architecture.md) and [testing.md](testing.md). Shared rules remain a proposal binding locally in UFBAS. Queue, request budget and offline mode have the helper's process-local scope. Cached comparisons establish the saved reference state, with renewal a separate controlled step. Content protection and the approved derived-layer and IMPRINT exceptions are stated explicitly.
## 2026-10-26 Bind the workshop TEI review to its actual sources

The workshop skill now names the published edition rules in the local ABOUT copy, the edition and taxonomy TEI, and the data findings. The historical `ufbas.schema` file is an RDF ontology; the current SHACL shapes validate RDF. No local project-specific TEI XML schema with a bound validator call was found. Historical course files point to the external general `tei_all.rng`, which does not establish a current local validation. The German example is kept under `workshop/tei-pruefung/SKILL.md` and linked from this knowledge base. Both TEI files parsed locally and the existing ontology/SHACL check passed with `UFBAS_OFFLINE=1`. This is not a completed run of the workshop exercise or TEI schema validation.

## 2026-10-27 integriert, analysis of the published TEI

From the commissioned retrieval of `TEI_SOURCE` of `o:ufbas.1563` into `data/ufbas.1563.xml`, `scripts/analyze_tei.py` and [tei-analysis.md](tei-analysis.md), which was the data repository's own `knowledge/data.md` before the split below. The retrieved file is byte-identical to `tei/ufbas.1563.xml`. A standalone namespace-aware inventory checks the source anomalies against the XML, and the document holds the verified findings and a test strategy for discussion that is not accepted. The knowledge of the presentation repository guided the choice of examples and was not treated as independently verified evidence.

## 2026-10-27 integriert, repositories split along the ZimLab template

From the operator's decision of 2026-10-27 to align gams-www with the ZimLab template for `gams-www` (ADR-31) into both repositories. gams-www keeps only what GAMS serves, the page stylesheets, `css/` with the fonts now in `css/fonts/`, `js/`, `img/`, `data/ufbas-facsimile.json` and `data/ontology/`, with README and MIT licence, while the unused `img/tabellensymbol.png` and `data/tei/`, byte-identical to `tei/` of ufbas-data, are gone. ufbas-data takes `AGENTS.md`, `CLAUDE.md`, `GAMS.md`, the knowledge documents, `local-test-build/`, `research-artefacts/`, `source-material/`, `snapshots/`, the workshop skill and, under `gams/`, the three ingest stylesheets, the query texts in `gams/query/` and the datastream mirrors in `gams/datastreams/`, and its `tei/` is now the ingest source of `o:ufbas.1563` and `o:ufbas.kategorien`. The harness has two roots in `gams.mjs`, ufbas-data and the gams-www checkout beside it or in `UFBAS_WWW`, and `npm test` with `UFBAS_OFFLINE=1` passed every test file and the browser check. The documents, both READMEs and a `LICENSE-CODE` for the MIT-licensed code of ufbas-data describe the new layout ([architecture.md](architecture.md#repository-structure)). Earlier entries and `snapshots/` keep their dated paths. The retrieved copy `data/ufbas.1563.xml` was removed, since it is byte-identical to `tei/ufbas.1563.xml`.

## 2026-10-27 entschieden, fonts from GAMS

The operator decided to use the best font GAMS serves instead of fonts of the project's own (ADR-32). Probing the files the ZimLab template references and a set of common names found Open Sans, Droid Serif, Junicode and Cardo under `/assets/fonts/` on production and staging. A coverage check of `tei/ufbas.1563.xml` against their TrueType files showed all four covering the edition text except ✤ and ⊕, Cardo except ✤ only. Droid Serif with Open Sans was chosen as the pairing of the template, drawn for screens. `ufbas-static.xsl` links both from `$gamsAssetsRootPath`, `css/fonts/` is gone, and both local servers read `/assets/` once from production like `/lib/`. GAMS.md gained the shared assets.

## 2026-10-28 entschieden, ontology as GAMS object only

From the operator's decision of 2026-10-28 (ADR-33) into both repositories. The domain ontology is a finished static product, published as `o:ufbas.ontology` with only its `ONTOLOGY` datastream and the `STYLESHEET` redirect. The six files of `data/ontology/` moved byte for byte from gams-www to `ontology/` of ufbas-data, whose `ufbas.ontology.rdf` is the ingest source. The page Ontologie reads the datastream from its host-relative path and lost the shapes, the example of `Eintrag-0`, the Turtle, JSON-LD and shapes downloads and their styles, keeping the RDF/XML of the datastream as its one download. The harness answers the datastream from `ontology/` until the ingest, and the SHACL validation of the derived RDF stays in the harness ([architecture.md](architecture.md#repository-structure), [testing.md](testing.md#guarantees)).

## 2026-10-28 entschieden, page images in the TEI

From the operator's decision of 2026-10-28 after reviewer feedback (ADR-34) into both repositories. `tei/ufbas.1563.xml` carries a `facsimile` with one `surface` per image a page break names, holding the IIIF image service of the archive and the canvas id of the Lesesaal, and `pb/@facs` points to it. `local-test-build/make-facsimile-tei.mjs` writes the change as text from the saved manifest and replaces `make-facsimile-data.mjs`, and `data/ufbas-facsimile.json` of gams-www and `derived/ufbas-facsimile.json` are gone. `ufbas-object.xsl` writes the image service onto each folio label, `edition-views.js` reads it from there, and a TEI without facsimile, as GAMS serves it until the re-ingest, gives the text alone with a note. `test/facsimile-tei.test.mjs` checks the TEI against the manifest and, with the change undone, against the hash of the published datastream. The refactored RDF of `gams/ufbas-TORDF-ontology.xsl` reads the image number from `pb/@facs` and loses it with the new pointers, which an adjustment of that stylesheet by the operator's decision restores ([data.md](data.md#edition-tei), [plan.md](plan.md#delivery)).

## 2026-10-28 entschieden, English category labels and the derived dataset

The operator curated the drafted English labels of the categories (ADR-30). Source concepts without an English equivalent keep their German term, which applies to the offices and to Leichtfertigkeit, Unzucht, auf den Hals wachsen and Meerwunder. `ufbas-TORDF-ontology.xsl` writes the labels as English `skos:prefLabel`, a shape requires one per concept and `test/skos.test.mjs` keeps them equal to the table. `make-exploration-data.mjs` now writes `derived/ufbas-exploration.json` of the data package directly, and a test fails when the committed file is stale. `test/mirror.test.mjs` also compares `rdf/ufbas.schema.owl` and `tei/ufbas.kategorien.xml` with their published datastreams.
