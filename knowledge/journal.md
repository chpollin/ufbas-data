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

From the SVN working copy `Z:\gamsdev\ufbas` at revision 618 and the files served on production into the first commits, the mirrors, this knowledge base and the code audit report. The working copy was committed as found, with `trunk/ufbas-object.xsl` brought to its production state. Without staging, every change went through local simulation ([testing.md](testing.md)).

## 2026-09-23 korrigiert, served layout and delivery route

From the operator's delivery route, the GAMS update tool that brings ZimLab `main` to `/ufbas/`, into the repository layout. The served files moved to the root, course and taxonomy files to `source-material/`, the rest of the SVN tree is kept in gams-www commit `e0d27f9`, and the mirror became a clone. Refactoring without content change and without partner approval (ADR-01).

## 2026-09-23 integriert, refactoring of the presentation layer

From a local harness proven against production, identical on every page type after normalising generated ids except the unordered category browse, into rewritten stylesheets, scripts and styles keeping the 2017 identity, with search, edition, Datenkorb and shell repaired ([architecture.md](architecture.md#search)). An independent review found an empty-matching highlight pattern, lost brackets in the book headings and the month names in SaxonJS, all fixed and covered ([testing.md](testing.md#limits-of-saxonjs)).

## 2026-09-23 korrigiert, root font size and browser analysis

From the first look in headless Chrome into `css/template.css`. Bootstrap 3 had set the root font size to 10px, invisible to every check without a browser, and the cost of the edition lay in laying out the whole book in the browser, above all on phones.

## 2026-09-23 integriert, vanilla interface, accessibility and reflow

From the decision to keep the edition one page and drop Bootstrap and jQuery (ADR-02) into an own shell, `content-visibility`, the marking switches and the axe-core browser check at seven widths ([testing.md](testing.md#browser-check)). An independent review confirmed XSLT 2.0 and the unchanged edition text, and its findings became fixes with checks shown to fail first.

## 2026-09-23 integriert, page types, exploration groundwork and design proposal

From the decisions on frameworks, sources as icons and an Exploration tab (ADR-03) into one stylesheet per page type, a critique of the force graph and a design proposal answering the operator's finding that the result was cold and blocky ([design.md](design.md#principles)), and a second review led to fixes of the graph page, the chips and the breakpoint of the sticky navigation.

## 2026-09-24 integriert, licence, research basis and ontology plan

From operator decisions, the literature, the About page and a data profile into [specification.md](specification.md), [domain.md](domain.md) and [data.md](data.md#data-quality). Result ADR-04 to ADR-08, two personas with five epics, the analysis of the RDF of 2017 and the data findings.

## 2026-09-24 korrigiert, folio labels

From the editors' citations by heading and folio into `uf:folio` and [data.md](data.md#edition-tei). The label `N - 18` counted images and was wrong on every page, and the count over page breaks with the unfoliated pages and leaf 32a replaced it (ADR-09).

## 2026-09-24 integriert, knowledge base structure

From the Promptotyping templates into `knowledge/`, `research-artefacts/` and `snapshots/`, with `template:` fields, the new `specification.md` and `domain.md`, and the measurements in `snapshots/research-report-2026-09-24.md`.

## 2026-09-24 integriert, checks against production and the knowledge base

From one-off research comparisons into `npm test` ([testing.md](testing.md#guarantees)). `TORDF` reproduces the published RDF triple for triple, dataset folios equal those of the edition page, and every knowledge link resolves.

## 2026-09-24 integriert, adopted design

From the design proposal and the operator's decision (ADR-15) into `css/` and [design.md](design.md), with the comparison layer removed.

## 2026-09-24 integriert, scope and delivery

From operator decisions into [specification.md](specification.md#decisions) and [plan.md](plan.md). The editors are not consulted (ADR-16), their cross-references become a derived layer (ADR-10), the ontology becomes a GAMS object (ADR-17), libraries are vendored (ADR-18), and layer, Exploration, facsimile synopsis and ontology reach production in one update (ADR-19).

## 2026-09-24 integriert, facsimiles

From the IIIF manifest of the Digitaler Lesesaal, saved from a browser, and the HTR ground truth on Zenodo into `source-material/dls-manifest-245856.json`, a facsimile dataset, the vendored OpenSeadragon and [data.md](data.md#edition-tei). Every page break had its public, rights-free page image again.

## 2026-09-24 verdichtet, open lists and the entry of 2026-09-24

From the "Open." paragraphs of all entries, moved to [plan.md](plan.md), and the single entry of 2026-09-24 into one entry per transition. Git base gams-www `365a6ad`.

## 2026-09-24 integriert, imprint and credit

From the operator's request and the current websites of the institute and the university into the prepared `IMPRINT`, its rendering and the footer (ADR-20). The imprint credits the revision of 2026 and fits one screen.

## 2026-09-24 integriert, project page

From the operator's review into the `about` template and [design.md](design.md#type). Facts in the page head, only the table of contents in the rail, hyphenation only below 48rem.

## 2026-09-24 integriert, source downloads and page head

From the operator's review into the page heads and [design.md](design.md#components). TEI and RDF are downloads shown as their emblems, credited in the imprint.

## 2026-09-24 integriert, text and image, annotation in the text

From reviews of three states of the edition into `ufbas-object.xsl`, `edition.css`, `highlighting.js`, `edition-views.js` and [design.md](design.md#views). Marks in the text at a fixed line height and an index per entry replaced the category panel, "Text und Bild" shows the page image beside the text, and the view state lives in the fragment because GAMS rejects query parameters on the object.

## 2026-09-24 integriert, data package

From the published datastreams and derived datasets into https://github.com/chpollin/ufbas-data and [data.md](data.md#sources), byte for byte with a README, CC BY-NC-SA 4.0 and a citation file.

## 2026-09-29 integriert, staging instance

From the operator's setup on `gams-staging.uni-graz.at` into [architecture.md](architecture.md#gams-objects). `ufbas-static.xsl` takes the served folder from its own URL, the TEI moved to `data/tei/` for one ingest, the ingest transformations got their current names, and the staging ingest gave the RDF of production with the same resources.

## 2026-09-29 verdichtet, knowledge and code after the staging setup

From a knowledge review and an independent code audit into [architecture.md](architecture.md#cirilo-configuration), [plan.md](plan.md#staging), [testing.md](testing.md) and the code. Every Cirilo target value with production's deviations, dated test counts out of `testing.md`, dead templates removed, and a check rendering the imprint with the staging URL.

## 2026-09-29 integriert, calmer edition page and search hints

From reviews on staging into [design.md](design.md#principles) and the stylesheets. A lean page head, no middle dot, one bookmark switch with confirmation, and a pattern without the regex option reported at the form.

## 2026-09-29 integriert, Exploration view on the RDF

From the decision that the RDF is the data source (ADR-21) and a walkthrough along both personas into the Exploration query, script, styles and page and [data.md](data.md#rdf-as-source-of-the-exploration-view). Aggregates that open their entries replaced the force graph, the graph page forwards, and d3 is gone. On the RDF of 2017 the query agreed with the TEI on every offence, sanction and date and lost some keywords and gender readings ([exploration-rdf-2017-2026-09-29.md](../snapshots/exploration-rdf-2017-2026-09-29.md)).

## 2026-09-29 integriert, Exploration view as unit visualisation

From the operator's critique that calendar and matrix had to be read as numbers, a survey of visualisation catalogues and two preview rounds into the view and ADR-22. Every entry is a mark by month or by offence row, coloured by sanction class, and filters fade marks.

## 2026-09-29 entschieden, layers of the refactored RDF

From the operator's questions on `Eintrag-0` in the old and target model into [domain.md](domain.md#domain-ontology) and ADR-23. Prefixes `ufbas:`, `ufbas-ont:` and `ufbas-kat:`, data only in ontology terms, CRM, RiC and PROV as alignment.

## 2026-09-29 integriert, ontology, derivations and shapes

From the decision to build the ontology with its validation, by three delegated agents, into the ontology, `ufbas-TORDF-ontology.xsl`, new tests and [domain.md](domain.md#domain-ontology). The shapes found errors of the first derivation and gaps of the ontology and keep the facts of the published TEI as counted warnings. The derivation corrected `Eintrag-505` in [data.md](data.md#data-quality) and raised doubt on the gender of `Eintrag-176` and `Eintrag-376`.

## 2026-09-29 integriert, review of every page

From a review of every page at full and phone width by delegated agents into the stylesheets, scripts and [design.md](design.md#components). One shell width, no `title` attributes on the edition, a shared entry table, and a CSV in the common columns instead of the GAMS XLS.

## 2026-09-29 integriert, page Ontologie

From the wish to make the semantic data visible into the mode `ontologie` and [design.md](design.md#views), with the model as a tree and the terms with anchors and alignment.

## 2026-09-29 entschieden, operator decisions after the page review

From the operator's decisions into [specification.md](specification.md#decisions). No footer credit on the imprint page (ADR-20), Exploration as fourth way in, the edition titled like the home page, and 50 rows in the Exploration table.

## 2026-10-21 integriert, ontology complete for the update

From the decision to finish the ontology before the update into the derivation, ontology, queries, `buildquery.js`, the page Ontologie and the harness. One derivation gives entry types, cross-references, candidate person links, date conflicts, place mentions and the concept scheme, Exploration and search read the refactored RDF, and Saxon-HE 9.6 reproduces SaxonJS ([domain.md](domain.md#domain-ontology)).

## 2026-10-26 verdichtet, plan reduced to open steps with the cleanup

From a read-only audit of code, harness, research scripts and knowledge into [plan.md](plan.md#cleanup), keeping only open steps with the staging settings and update order of the handoff of 2026-10-21.

## 2026-10-26 integriert, knowledge on the state of 2026-10-21

From the handoff of 2026-10-21, that day's commits and the decisions of 2026-10-26 into [architecture.md](architecture.md#cirilo-configuration), [data.md](data.md#data-quality), [domain.md](domain.md#domain-ontology), [testing.md](testing.md), [specification.md](specification.md#decisions) and the READMEs. ADR-11 to ADR-14 decided, ADR-24 to ADR-30 recorded, licence and citation once in the README, handoff removed.

## 2026-10-26 integriert, cleanup of code, styles and tests

From the audit packages into code, harness and `research-artefacts/`. Dead code removed without a changed page, shared taxonomy helpers in `ufbas-static.xsl`, common CSV columns (ADR-29), print shows every year and table heads, search orders by the book, shared `test/lib.mjs`, a one-line phone layout of navigation and edition tools, and `ABOUT` placeholders linked to their groups (ADR-26).

## 2026-10-26 integriert, GAMS rules apart from the project rules

From the request for a GAMS-wide rule document into [../GAMS.md](../GAMS.md), `CLAUDE.md` and `.gitignore`. GAMS.md holds shared rules with their mechanisms, judgement criteria, traps and the knowledge of a full reading of the GAMS and Cirilo documentation of 2022, `AGENTS.md` the UFBAS rules, and `CLAUDE.md` imports both. `test/mirror.test.mjs` compares mirrors and transformations with production, and `fetchCached` reads GAMS serially with a limit and an offline switch.

## 2026-10-26 integriert, imprint in sections and marks that keep their colour

From the operator's review into the prepared `IMPRINT`, `ufbas-context.xsl`, `css/` and [design.md](design.md#views). Three imprint sections with a licence row, the SHACL shapes under CC BY 4.0, marks of at least 1.5px (Orte 3px) at whole-pixel offsets, and the phone layout of the edition as a draft on `entwurf-oberflaeche`.

## 2026-10-26 korrigiert, scope of GAMS rules and cached references

From a documentation audit against `gams.mjs`, `test/run.mjs`, `mirror.test.mjs` and the Claude configuration into [../GAMS.md](../GAMS.md), [../AGENTS.md](../AGENTS.md), the README, [INDEX.md](INDEX.md), [architecture.md](architecture.md) and [testing.md](testing.md). Shared rules stay a proposal binding locally, queue, budget and offline mode are process-local, cached comparisons establish the saved state only, and the content protection with its exceptions is explicit.

## 2026-10-26 Bind the workshop TEI review to its actual sources

The workshop skill `workshop/tei-pruefung/SKILL.md` names the edition rules in the local `ABOUT` copy, the edition and taxonomy TEI and the data findings. `ufbas.schema` is an RDF ontology, and the SHACL shapes validate RDF. No project-specific TEI schema with a bound validator was found, and the course files point to the external `tei_all.rng`, which establishes no current validation. Both TEI files parsed and the ontology and SHACL check passed offline, which is no completed workshop run or TEI schema validation.

## 2026-10-27 integriert, analysis of the published TEI

From the commissioned retrieval of `TEI_SOURCE` of `o:ufbas.1563` into `data/ufbas.1563.xml`, `scripts/analyze_tei.py` and `tei-analysis.md` (merged into [data.md](data.md#independent-inventory-of-the-published-tei) on 2026-10-28), which was the data repository's own `knowledge/data.md` before the split below. The retrieved file is byte-identical to `tei/ufbas.1563.xml`. A standalone namespace-aware inventory checks the source anomalies against the XML, and the document holds the verified findings and a test strategy for discussion that is not accepted. The knowledge of the presentation repository guided the choice of examples and was not treated as independently verified evidence.

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

## 2026-10-28 integriert, TEI analysis merged into the data document

From `tei-analysis.md` into [data.md](data.md#independent-inventory-of-the-published-tei). Its verified structure and annotation findings joined the sections Edition TEI and Data quality, and its reproduction command, inventory limits, research possibilities, test strategy for discussion, still not accepted, and open questions stand in the new section. The file is removed with every link re-pointed.

## 2026-10-28 verdichtet, knowledge base for the project close

From the knowledge folder at Git base `7631330` into a compact form. `testing.md` names the guarantee of each test file and points to its header comment, `architecture.md` leaves general GAMS behaviour to [../GAMS.md](../GAMS.md#knowledge), `design.md` keeps principles, decisions with reasons and accessibility rules and leaves values to the CSS, `specification.md` condenses the served stories, and the entries above up to 2026-10-26 are cut to their decisions and results. ADRs, requirements, personas, data findings and the dated reports in `snapshots/` are unchanged in substance, and earlier wording is kept in Git.
