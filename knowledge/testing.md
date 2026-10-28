---
title: Testing
project:
  name: Urfehdebücher der Stadt Basel
  repository: https://github.com/chpollin/ufbas-data  # the served files it describes are in https://zimlab.uni-graz.at/gams/projects/ufbas/gams-www
method:
  name: Promptotyping
  url: https://dhcraft.org/Promptotyping/
template:
  name: Vorlage Testing
  version: 0.3
  url: https://dhcraft.org/Promptotyping/promptotyping-document/testing
status: draft
created: 2026-09-23
updated: 2026-10-28
authors: [Christopher Pollin]
generated-with: Claude Code (Claude Opus 5.5)
topics: ["[[GAMS Frontend-Harness]]"]
related: [architecture.md, specification.md, data.md, plan.md]
---

# Testing

Every change of gams-www is checked locally before it is pushed to ZimLab `main`, and on staging after the mirror sync. The harness in `local-test-build/` of ufbas-data renders the page stylesheets of the gams-www checkout with SaxonJS against the TEI in `tei/` and the datastream mirrors in `gams/datastreams/`, derives the refactored RDF from the TEI, runs the query texts of `gams/query/` on it with Oxigraph, serves a local preview and runs the checks below. Production responses are saved in `cache/` and reused as references ([Reads of production](#reads-of-production)). A comparison with a cached response establishes agreement with that saved state. Its principle is to test the output, the rendered pages, the derived data and the RDF, against the sources and against production, and to name what stays unchecked.


## Test strategy

Each layer catches a class of defects the others do not see.

| Layer | Checks | Catches |
|---|---|---|
| Structure | `pages.smoke.mjs` on every built page, `served-folder` test | markup that browsers repair differently, broken anchors, unlabelled controls, assets of other projects, asset paths that miss the served folder of an instance |
| Text fidelity | `edition-text.test.mjs` against the 2017 rendering | lost or reordered edition text |
| Page content | `edition`, `context`, `categories`, `search`, `ontology-page` tests against the TEI, `ABOUT` and the ontology | labels, headings, excerpts and terms that drift from the sources |
| Behaviour | `marking-views`, `datenkorb`, `search-params`, `exploration` tests with the real scripts in jsdom | broken toggles, Datenkorb, search parameters, counts of the Exploration view that do not unfold to their entries, and user stories the view no longer answers |
| Ontology | `ontology`, `rdf-ontology`, `skos` tests | an ontology that does not declare its terms, derived data or a concept scheme that drift from the TEI or violate the shapes, and losses of the RDF of 2017 that recur |
| Queries | `exploration-rdf`, `search-queries` tests | a query text on the refactored RDF whose answer differs from the TEI or, without a documented cause, from production |
| Derived data | `exploration-data`, `facsimile-tei`, `rdf` tests | stale or wrong datasets, page images in the TEI that drift from the manifest or from the published datastream, and a production copy of `TORDF` whose RDF differs from the published one |
| Copies of GAMS | `mirror` test | a file of `gams/datastreams/`, `gams/ufbas-TOTEI.xsl` or `gams/ufbas-TORDF.xsl` edited as if it were the source, and a prepared target value the operator has set meanwhile |
| Browser | `browser.test.mjs` in headless Chrome or Edge, `abnahme` test | reflow, contrast and the automatic WCAG rules, which only a layout engine shows, and a measurement of the acceptance sheet that misses a finding |
| Knowledge base | `knowledge.test.mjs` | broken links and anchors between the project documents |
| Processor | `saxon-check.mjs`, outside `npm test` | a construct that Saxon in XSLT 2.0 rejects, and an ingest whose RDF differs between Saxon for Java and SaxonJS |

## Guarantees

`test/pages.smoke.mjs`
: Structure of every built page. No empty non-void element (browsers parse the XML output as HTML), unique ids, every in-page anchor resolves, one `h1`, no `undefined` or `NaN` in visible text, every image with `alt`, every form control labelled, no `http://` link to a host that serves `https`, no asset of another project, no asset from the GAMS `/lib/` path, and `role="list"` on the unstyled lists. Page-specific checks cover the current navigation item, every entry of the edition reachable from the table of contents, every category toggle bound to a span of its group, every annotation with one of the five groups and a label, no category panel left, the Datenkorb icon per entry, the view switch hidden with no view preset, the index switch hidden on every entry with annotations and only there, the table of contents button, the page image pane with its dataset, viewer and Lesesaal link, OpenSeadragon absent from the page until the view asks for it, `edition-views.js` after `highlighting.js`, the image number on every folio label, the order of the marking switches, the labels of the editorial notes, hit counts and date order of the search pages, highlighted hits, no empty highlight on the `*` term, the report of an invalid query, the empty form, and on the graph pages the heading with the category, the forward and the link to the Exploration view with the category in the fragment and no graph script. `exploration` gets the common checks only, its behaviour is `exploration.test.mjs`.

`test/ontology.test.mjs`
: The ontology in `ontology/` parses, declares every term it uses, labels every class and property in German and English, aligns only to CRM, RiC, PROV, SKOS, GAMS and OWL, and its RDF/XML, its JSON-LD and the RDF/XML of the shapes are the same graphs as their Turtle. The SHACL shapes (`rdf-validate-shacl`, SHACL Core, chosen over a Python validator and over a larger engine) accept the hand-checked fixture of `Eintrag-0`, reject broken fixtures with their message, and find no violation in the derived data and concept scheme together. Facts of the published TEI that the derivation must not change are warnings, counted exactly, so a new one fails the test. A SPARQL query checks that the data use only terms of the ontology and of the GAMS ontology.

`test/ontology-page.test.mjs`
: The Ontologie page. Every class, property and individual of the ontology has its anchor, the diagram draws every class once and every object property between classes as an edge, every in-page link resolves, the one download is the `ONTOLOGY` datastream of `o:ufbas.ontology` with its tip and hidden name, links to data are server-relative, the page shows no shapes and no example, and the page of `o:ufbas.ontology` is the page Ontologie with its navigation item. Until the ingest the harness answers that datastream from `ontology/ufbas.ontology.rdf` under both instances, in the document pool of `gams.mjs` and in both local servers (`localDatastreams`, a deliberate shortcut removed after the ingest).

`test/rdf-ontology.test.mjs`
: The refactored RDF of `ufbas-TORDF-ontology.xsl` against the TEI reference of the Exploration view and the TEI. The four prefixes, every term declared in the ontology, one entry per reference entry and per fragment, the folio of every page, the same offences, sanctions, keywords, procedure categories, Urfehde date, offenders and gender composition per proceeding, none of the losses of the 2017 RDF, every derived node traced to a span, agents of an offence only in entries with one offender, place names, place mentions and a reading text with the marginal notes and without the editors' notes, amounts outside spans, references to other proceedings, the entry types of `research-artefacts/entry-types.tsv`, the fragments and the editors' cross-references of `research-artefacts/editorial-crossrefs.tsv`, the candidate person links, the date conflicts of [data.md](data.md#data-quality), `ontology/ufbas.example.rdf` as the current derivation of `Eintrag-0`, and the story of theft and banishment answered by a flat query.

`test/skos.test.mjs`
: The concept scheme that `ufbas-TORDF-ontology.xsl` derives from the taxonomy. Every category of the taxonomy is one concept at its published IRI, its concepts are those of the published taxonomy RDF, each in the scheme with its term as label and one broader concept below the top, the gloss as `skos:definition` and the coding rule of the nine glosses of [domain.md](domain.md#domain-ontology) as `skos:scopeNote`, no misspelled SKOS terms, collections that equal the sanction groups of `ufbas-context.xsl` and the colour classes of `js/exploration.js`, and every category the edition uses is in the scheme.

`test/marking-views.test.mjs`, `test/datenkorb.test.mjs`, `test/search-params.test.mjs`
: Run the real scripts in jsdom on the built pages, with the shared `open()` of `test/lib.mjs`. The marking switches with several groups at once without any text or line height added, including boxes the browser restored, the tip of a marked annotation on hover (outermost label first, unmarked groups left out) and on tap (closed by a second tap, a tap elsewhere and Escape), the annotation index of an entry (built on first opening after the text, groups in switch order, joined words, one item per annotation, pointing at an item tints its span), the default view by width with a view in the fragment winning, the table of contents behind its button, the view switch with its state in the fragment (a followed entry link keeps the view, no query parameter), a linked view read from the fragment with the entry scrolled to, the page image with a stubbed OpenSeadragon and `fetch` (dataset and viewer loaded once and only for "Text und Bild", canvas drawer, the tile source of the page break at the reading line, folio labels opening their page by click and Enter, the zoom buttons, the labels plain again in the text view), the link to the Lesesaal when the dataset or an image fails, the tip of the editorial notes, the Datenkorb (takeover of the 2017 key, check and uncheck with its confirmation, restore after reload, add all without duplicates, entry text from the edition, the basket page with sort, CSV quoting and order, removal with focus handling, clearing after confirmation, the excerpt of long texts), the search parameters for the documented cases, a pattern without the option of regular expressions reported at the form, error messages at the form, the refill of the form on the result page, and the quick search without a global `form2params`.

`test/categories.test.mjs`
: Recomputes from the two TEI documents which categories no edition element names in `@ana` and fails when the list `withoutEntries` in `ufbas-category.xsl` drifts from it. Checks that the page shows every category once, the groups in the order of the marking switches and the rest in TEI order, with the swatch in each group heading, a list link to the category IRI, no link to the graph page, and the link into the Exploration view for every category the view has a filter for.

`test/context.test.mjs`
: The pages of `context:ufbas`. Headings of home, project, Datenkorb and Exploration skip no level. The quote on the home page stands verbatim in `ABOUT` and stops before the outdated facsimile claim. The home page has its figure link to the first entry, the three ways in, the two example searches with `params` and the five group links. The project page renders the text and footnotes of `ABOUT` completely and in order, and its table of contents reaches every section. Its rail holds only the table of contents, its page head the line of editors and year and the TEI icon. The Datenkorb page has its sort field, hidden tools and the storage note. The imprint renders one block per section of `IMPRINT` and no longer names the Zentrum für Informationsmodellierung, and the footer of home, project and imprint carries the credit of the revision.

`test/edition-text.test.mjs`
: Compares the visible text of every entry and of the book headings outside the entries with the baseline rendering of the 2017 stylesheets. No entry may lose or reorder text. Added text is listed. It comes from marginal notes the 2017 code did not print. Brackets are left out of the comparison, since they only mark expansions, and so are the folio labels on both sides, since they are derived and the 2017 labels were wrong ([data.md](data.md#edition-tei)).

`test/edition.test.mjs`
: The edition page against strings of the edition TEI. Words broken across manuscript lines are joined in every derived label, editorial notes and the Kringel mark stay out of labels, entries are `h3` without skipped levels, the entry heading shows date and folio with the offender for screen readers, the folio labels follow the counting rule at three entries the editors cite by folio and at the inserted leaf 32a, the page head carries date range, the citation suggestion on demand and the source icons, annotations carry group and category label with one nested span per group and the annotated note as its own span, the text keeps a fixed line height and generated labels exist only visually hidden, groups that nest in the TEI never share an underline slot and there are three slots at most, the view switch is a template of its own with no view preset, folio labels name their image including the unfoliated pages and the inserted leaf, the Datenkorb switch is a labelled checkbox shown as an icon, only entries and parts of the book stand in the main column, marginal notes keep their place and name their kind, `content-visibility` stays on the entries, only the table of contents scrolls in the tools column, and the table of contents follows the reading position with a stubbed `IntersectionObserver` and stays as rendered without it. The page has no `title` attribute, marks carry their kind from a fixed set, the scribe change is a labelled note, and the lines after an entry head stand in the wrapper of the hanging indent.

`test/exploration-data.test.mjs`
: The TEI reference of the Exploration view holds one record per entry of the edition except the fragments, in its order, merges a fragment into the entry it continues, gives every record the type of the curated table, and gives every entry the folio its heading on the edition page starts with, since both stylesheets carry their own `uf:folio` ([Exploration view](#exploration-view)).

`test/exploration-rdf.test.mjs`
: `gams/query/ufbas.exploration.sparql` reads only terms of the domain ontology and the GAMS ontology. Run with Oxigraph on the refactored RDF of edition and taxonomy, it answers one row per entry of the TEI reference and agrees with it on every category of the filters, the Urfehde date, the gender composition and the offenders of every entry ([data.md](data.md#rdf-as-source-of-the-exploration-view)). Any difference fails.

`test/exploration.test.mjs`
: The Exploration page with `datenkorb.js` and `exploration.js` in jsdom, the query answered as in `exploration-rdf`. One request for the data, a mark per entry, the view filled. Every count of the legend and the filter menus, clicked from an empty selection, leaves as many rows in the table and as many full marks as it shows. One scenario per user story, with the expected answer taken from the TEI reference ([Exploration view](#exploration-view)). The table sorts both ways, the marks are one tab stop with arrow keys and Enter, Escape closes the entry, an entry already in the Datenkorb shows its switch checked, and an unreadable answer leaves a message instead of a half view.

`test/facsimile-tei.test.mjs`
: `tei/ufbas.1563.xml` equals what `make-facsimile-tei.mjs` writes from the manifest. Every page break points to a surface, the surfaces follow the page breaks one per image, and each carries the canvas id, size and image service of its image number. No graphic has `xml:id` or `mimeType`, and the text starts on image 19. With the facsimile change undone the file hashes to the published datastream, and a manifest with moved storage changes only the graphic URLs ([Facsimile in the TEI](#facsimile-in-the-tei)).

`test/search-queries.test.mjs`
: The search query texts of `gams/query/` read only the domain ontology, the GAMS ontology, SKOS and the full-text search. Every search page of `build.mjs`, run locally on the refactored RDF through `sparql.mjs`, finds the hits of the production answer of 2026-09-23 to the same search, apart from listed differences with a cause in the data, which the test checks in the TEI where it shows them (hits only in an editors' note, the `p` coded as `Eintrag-133`, an Urfehde date the RDF of 2017 linked from an annotation, a second category the RDF of 2017 lost). A new difference fails, and so does a listed one that no longer occurs. A place name finds every spelling of the place, within a date range and without an excluded term, and a query the endpoint cannot parse gives no results element. Oxigraph has no full-text search, so `sparql.mjs` rewrites `bds:search` into a `FILTER` of whole-word and word-beginning matches that ignore case.

`test/served-folder.test.mjs`
: Renders the imprint with the stylesheet URL of production and of staging. Every stylesheet, script and project image has to come from `/ufbas/` on production and from `/gamsdev/pollin/ufbas/gams-www/` on staging, which `ufbas-static.xsl` takes from `static-base-uri()`. The other checks render with the production URL only.


`test/abnahme.test.mjs`
: The measurement of the acceptance sheet flags a synthetic page with a too wide block and a 16px button, and leaves a clean page with an inline link in running text unflagged. It needs the browser of the browser check.

`test/knowledge.test.mjs`
: Every relative link and every `related` entry in the documents of `knowledge/`, `research-artefacts/` and `snapshots/`, in `README.md` and `local-test-build/README.md`, `AGENTS.md` and `GAMS.md` of ufbas-data reaches its file, and every anchor a heading of it, with the heading ids that GitLab generates.

`test/mirror.test.mjs`
: Every file of `gams/datastreams/` and the ingest transformations `gams/ufbas-TOTEI.xsl` and `gams/ufbas-TORDF.xsl` equal the cached production datastreams, line endings aside. A prepared target value differs on purpose and stands with its decision in the list of the test, today `IMPRINT` (ADR-20). After the operator sets such a value and the relevant reference is renewed, the check fails on their equality and the value leaves the list. An unchanged cache cannot establish whether the operator has updated the live datastream.

`test/rdf.test.mjs`
: The `TORDF` stylesheet `ufbas-TORDF.xsl`, run on the TEI of the edition and the taxonomy, gives the published `RDF` datastreams of both objects triple for triple ([architecture.md](architecture.md#rdf-transformation)). The published RDF is fetched once per object into `cache/`. Identifiers from `generate-id()` differ in form between Saxon and SaxonJS and are compared by their rank in document order, literals with whitespace collapsed, since the ingested TEI on GAMS has lost the line breaks of the files in `tei/`. The reader accepts only the plain RDF/XML that `TORDF` writes and fails on any other construct. The check holds the ground for the domain ontology and fails when a change of the TEI or of the stylesheet would alter the RDF that production derives until the update.

`test/search.test.mjs`
: The result pages beyond the smoke test. Every excerpt window is a passage of the full text and holds a hit, date-only excerpts start at the beginning, chips name a category of one of the five groups with the group for screen readers, the page head names the query as typed, the form in the tools column is refilled from `$2`, the category browse has its actions and no form, year links count the hits of their year with undated entries last, and the example buttons are hidden without the script and fill a valid form state with it.

The expected hit counts of the smoke test are the answers of the query texts of `gams/query/` on the refactored RDF, whose differences to production `search-queries.test.mjs` explains. The edition is closed, so they change only with a query text or the derivation.

## Acceptance

| Requirement ([specification.md](specification.md#requirements)) | Check | Level |
|---|---|---|
| FR-01 content unchanged | edition text test, RDF test, the counted warnings of the ontology test | automatic |
| FR-02 every entry reachable | smoke test (table of contents), search and category browse tests, Exploration list with its links into the edition | automatic |
| FR-03 folio labels | edition test at cited folios, folio cross-check of the dataset | automatic |
| FR-04 search forms | search-params, search and search-queries tests, the query texts run locally and compared with the production answers of 2026-09-23 | automatic, answer and time on Blazegraph on staging after the re-ingest |
| FR-05 Datenkorb | datenkorb test, browser check with a filled Datenkorb | automatic |
| FR-06 Exploration view | `exploration.test.mjs` (every count unfolds, level named, undated and cut-out months marked), `exploration-rdf.test.mjs` | automatic, the query on Blazegraph on staging after the re-ingest |
| NFR-01 WCAG and reflow | browser check | automatic, keyboard and screen reader by the operator |
| NFR-02 libraries | smoke test for foreign assets and for scripts of the former graph page | automatic |
| NFR-03 XSLT 2.0, no empty elements | smoke test for empty elements, `saxon-check.mjs` for XSLT 2.0 | automatic, `saxon-check.mjs` by hand where Java and the Saxon jar are installed |
| NFR-04 nothing untested reaches production | `npm test` before every push, the pages on staging after the sync, the production check of [plan.md](plan.md#delivery) | process |
| NFR-05 sparing production reads | the cache of every production response | by construction |

## Exploration view

Verification asks whether the view computes what the sources say, validation whether it serves the personas. The first is automatic, the second needs readers.

### Verification

Three derivations have to agree. The TEI, read by `exploration-data.xsl`, is the reference. The refactored RDF, read by the stored query, is what the view counts, and `exploration-rdf.test.mjs` holds the two together without any difference. The page, driven in jsdom, has to show for each user story the answer the TEI gives, and every count has to open exactly its entries. The browser check adds reflow and the WCAG rules for the plain and a filled view.

### Stories

State of 2026-10-26. A story counts as served when a scenario of `exploration.test.mjs` answers it from the page.

| Story | Scenario | State |
|---|---|---|
| Offence and sanction | offence and sanction | served, the row of an offence with its marks over time and its sanction profile |
| Sanctions and modalities | sanctions and modalities | served, the colour carries the sanctions, entries with admonitions or threats only are hollow, the modalities stand in the sanction filter |
| Gender | gender | partly, women below and men above the axis, mixed entries in a band of their own, the rows of the offence view without split |
| Change over time | change over time | partly, every entry by month on one axis, an offence over time in its row, contradicting dates not marked |
| Origin of the banished | origin of the banished | partly, origins under the banishment filter, the comparison with the other offenders by switching the filter |
| Strangers and residents | none | partly, origin and offence yes, residence has no filter |
| Guards and releases | none | open, the refactored RDF carries the claims of the marginal notes, which query and view do not read yet |
| Detention and deadlines | none | open, the refactored RDF carries durations and deadlines, which query and view do not read yet |
| Prior instance and other proceedings | prior instance | partly, the filter yes, the editors' cross-references of the refactored RDF not yet |
| Reading behind a pattern | every count unfolds, reading behind a pattern | served |
| Gaps in transmission | gaps in transmission | served for the cut-out pages, hatched with their reason, and the undated entries in their own column |
| What a category means | what a category means | partly, the definition as tooltip of a filter value and a row, not on touch and not for screen readers, and some categories have none in the taxonomy |
| Where a figure comes from | where a figure comes from | served at the level of entries, a mark is an entry, the filters name that an entry may have several offences or sanctions |
| A citable state | a citable state | served |
| Taking the selection along | taking the selection along | served, entries added from the view carry no text excerpt in the Datenkorb |

### User test

An independent walkthrough of 2026-09-29 by a reviewing agent along both personas found the pattern-to-entry loop working and led to the and-combination within filters, the common scale of the calendar and the mobile order, and its open points stand in [plan.md](plan.md#exploration). It does not replace readers. The personas are hypotheses ([specification.md](specification.md#personas)), so the view is validated with readers who match them, historians of the Departement Geschichte in Basel or a course working with the edition. Each session gives the tasks below without instruction, with thinking aloud, and records success, time, the path taken and wrong readings. The result is a dated snapshot in `snapshots/` and a new state in the table above.

1. Which sanctions followed theft, and how often banishment? Success when the reader states the count and opens the entries.
2. Were women punished differently from men for Unzucht? Success when the reader compares with numbers and notices the mixed entries.
3. Were there fewer Urfehden in early 1567? Success when the reader explains the low months by the cut-out pages.
4. Find a typical and an unusual case of Gotteslästerung and read both. Success when both entries are opened in the edition from the view.
5. Send the current selection to a colleague. Success when the reader copies the address and it reopens the same selection.
6. What did the annotators count as Leichtfertigkeit? Success when the reader finds the definition, also on a phone.
7. With Diebstahl chosen, what does the number beside Einbruch mean? Success when the reader says it counts the thefts that were also burglaries.
8. Does the sanction profile of a row show how often or how large a share? Success when the reader reads it as the share of the row.

## Gaps

- `npm test` runs SaxonJS only. `saxon-check.mjs` compiles every stylesheet in Saxon-HE 9.6 and runs `ufbas-TOTEI.xsl` and `ufbas-TORDF-ontology.xsl` there as an ingest does, but it needs a Java runtime and the Saxon jar and runs by hand ([How to run](#how-to-run)). The pages on staging run the Saxon of GAMS.
- The search and Exploration query texts run locally on Oxigraph, which follows the SPARQL specification more strictly than Blazegraph in aggregates and the scope of `BIND` and has no full-text search, so `sparql.mjs` emulates `bds:search`. Answer and time on Blazegraph are checked on staging after the re-ingest.
- The facsimile dataset is checked for regeneration, completeness and the first text page, not image by image.
- Whether the Exploration view serves its personas is shown by no automatic check. The scenarios test that the view gives the answer the TEI gives, the user test of [Exploration view](#exploration-view) whether readers find and read it.
- The pages on staging and the state of production after the GAMS update are checked by hand along [plan.md](plan.md#delivery).
- `npm test` does not run `ufbas-TOTEI.xsl`. The RDF test applies `ufbas-TORDF.xsl` to the TEI without it, and the staging ingest of 2026-09-29, which ran both, gave the RDF of production with the same resources ([architecture.md](architecture.md#rdf-transformation)). `saxon-check.mjs` runs it before `ufbas-TORDF-ontology.xsl`.
- The scripts in `research-artefacts/scripts/` are provenance and not run.

### Limits of SaxonJS

The harness runs SaxonJS, which implements XSLT 3.0 and is more tolerant than the Saxon of GAMS in XSLT 2.0. A construct from XSLT 3.0 or a regular expression in `analyze-string` that matches the empty string renders locally but aborts the page on GAMS. The stylesheets are therefore reviewed for XSLT 2.0 and compiled in Saxon-HE 9.6 by `saxon-check.mjs`, and the smoke test checks the visible symptom of an empty-matching highlight pattern, an empty `mark`. SaxonJS also matches the em spaces of the TEI with `\s`, where Saxon for Java does not ([data.md](data.md#data-quality)). It also fails on empty sort keys, where Saxon sorts them first, so sort keys are wrapped in `string()`.

### Left to the reader

The checks see reflow, contrast and the automatic WCAG rules, but no visual quality, no reading order as a person perceives it and no screen reader output. The operator's look at staging at full width and at phone width, with keyboard operation, and the check on production after the GAMS update cover them.

## How to run

`npm test` runs `test/run.mjs`, which executes these steps in order and stops at the first failure:

1. `make-baseline.mjs`, only when `baseline/edition.html` is missing
2. `build.mjs`, which renders every page type into `build/`
3. `test/pages.smoke.mjs`
4. every other `test/*.test.mjs` in alphabetical order
5. `test/browser.test.mjs`, last because it takes longest

The exit status of `npm test` is the verdict. Read through a pipe such as `| tail`, it is the status of the last command of the pipe, and a failed check reads as passed.

The harness finds the gams-www checkout as `ZIMLAB/ufbas` beside the ufbas-data folder, or at the path in `UFBAS_WWW`. With `UFBAS_OFFLINE=1` its helper `fetchCached` sends no request to GAMS and fails on a missing cache entry ([Reads of production](#reads-of-production)).

```
cd local-test-build
npm install
npm test                        # build every page type, then all checks
node test/browser.test.mjs edition home   # the browser check on named pages of the last build
npm run serve                   # local preview on http://127.0.0.1:8771/context:ufbas
node abnahme.mjs abnahme.json   # acceptance sheet from the running preview
SAXON_JAR=… node saxon-check.mjs  # stylesheets and ingest in Saxon-HE for Java, outside npm test
```

The scripts that write derived files are listed in [local-test-build/README.md](../local-test-build/README.md).

### Reads of production

The harness uses `fetchCached` of `gams.mjs` where ufbas-data has no copy. Each process serialises its requests and applies its own request budget. The child processes started by `test/run.mjs` have separate queues and counters. Other processes and agents share no global lock. Existing cache entries are reused without a freshness check. With `UFBAS_OFFLINE=1` this helper sends no requests and fails on a missing fixture. Network access outside the helper is unaffected. A controlled reference renewal is a separate, controlled step, performed sequentially for the relevant URLs and documented with its date and scope. Routine checks preserve the existing references. With an empty `cache/` these steps fetch from production:

- `build.mjs` for the graph pages, which render the answer of `query:ufbas.graph`, and for the pages of `context:ufbas`, whose `METADATA` and `DC` have no mirror
- `test/rdf.test.mjs` and `test/skos.test.mjs` for the published `RDF` datastreams
- `test/search-queries.test.mjs` for the production answers of 2026-09-23
- `test/mirror.test.mjs` for the datastreams that `gams/datastreams/`, `gams/ufbas-TOTEI.xsl` and `gams/ufbas-TORDF.xsl` copy
- `test/served-folder.test.mjs` for `METADATA` of `context:ufbas`
- `test/browser.test.mjs` and `serve.mjs` for `/templates/` and, in the preview, `/lib/` and datastream contents without a mirror
- `compare-production.mjs` for the production pages

The browser check also loads the IIIF tiles of the page images from the object store of the archive, which needs the network. Without it the check passes with the link to the Lesesaal in their place.

## Components

### Build pages

`build.mjs` writes one HTML file per page into `local-test-build/build/`. `node build.mjs <page> ...` builds only the named pages. The search pages use the `params` value that `js/buildquery.js` builds from a form state, and `sparql.mjs` runs the query text of `gams/query/` with it on the refactored RDF, as GAMS will after the update. The graph pages render the answer of `query:ufbas.graph` from production, which the forwarding page does not read.

| Page | Stylesheet | Input |
|---|---|---|
| `home`, `about`, `imprint`, `datenkorb`, `exploration`, `ontologie` | `ufbas-context.xsl` | member list of `context:ufbas`, `mode` by page name (empty for `home`) |
| `ontologie-objekt` | `ufbas-ontology.xsl` | the `ONTOLOGY` datastream of `o:ufbas.ontology`, answered from `ontology/ufbas.ontology.rdf` until the ingest |
| `kategorien` | `ufbas-category.xsl` | `tei/ufbas.kategorien.xml` |
| `edition` | `ufbas-object.xsl` | `tei/ufbas.1563.xml` |
| `edition-ohne-bild` | `ufbas-object.xsl` | `tei/ufbas.1563.xml` with the facsimile change undone, the TEI GAMS serves until the re-ingest of ADR-34 |
| `graph` | `ufbas-graph.xsl` | graph query for the category Diebstahl, forwarding to the offence filter |
| `graph-vorinstanz` | `ufbas-graph.xsl` | graph query for Vorinstanz, forwarding to the procedure filter |
| `search-form` | `ufbas-search.xsl` | empty `params` |
| `search-navbar-dieb` | `ufbas-search.xsl` | quick search `Dieb` |
| `search-regex-or` | `ufbas-search.xsl` | regular expressions `Dieb \|Hans` |
| `search-regex-plus` | `ufbas-search.xsl` | regular expression `zunff+t`, which needs the `+` encoding |
| `search-date-only` | `ufbas-search.xsl` | date range 1565 without terms |
| `search-wyn` | `ufbas-search.xsl` | full text `wyn`, the case with matched categories |
| `search-wyn-or` | `ufbas-search.xsl` | full text `wyn \|win` |
| `search-invalid` | `ufbas-search.xsl` | a SPARQL syntax error in `$2` |
| `search-star-term` | `ufbas-search.xsl` | a bare `*` term, possible only in a hand-built URL |
| `volltext-2017-link` | `ufbas-search.xsl` | `query:ufbas.volltext` with `Dieb`, as a 2017 link sends it |
| `category-browse` | `ufbas-search.xsl` | `query:ufbas.kategorien` for Diebstahl |

### Browser

`test/browser.test.mjs` serves the pages of `build/` to a headless Chrome or Edge and checks each at 320, 390, 640, 768, 1024, 1200 and 1440px. The browser is found at the usual install paths or through the environment variable `CHROME`, and the check needs Node 22 or newer. It fails on any of these findings:

- the page scrolls horizontally (WCAG 1.4.10), or an element scrolls sideways outside a table region and the navigation of a phone, which scrolls in one line by design
- the root font size is not 16px
- the navigation is sticky and wraps to a second line, 1200px being the lowest width with a sticky navigation, checked with a three-digit Datenkorb on every page except the Datenkorb page
- at 1440px the first Tab does not reach the skip link, or the focused skip link has no outline
- axe-core reports a violation of the rules tagged WCAG 2.0 and 2.1 A and AA and WCAG 2.2 AA, audited at 390 and 1440px, the edition and `edition-ohne-bild` at 1440px only because axe needs long on their size
- the Exploration page does not fill its table within eight seconds, checked plain and as `exploration-auswahl` in the offence view with an offence, a sanction and a year chosen. The graph pages are left out, since they only forward.
- the edition in both views with every group marked, checked as the pages `edition-bild` and `edition-text` at all widths and audited at 390 and 1440px (`edition-text` at 1440px), where `edition-bild` ends neither in the viewer nor in the link to the Lesesaal within eight seconds. The plain `edition` shows the default view of each width.

In print media a category browse has to show every year, and the Datenkorb and Exploration tables their column heads and the dates of their rows, which are buttons on screen.

The check reports whether tiles of the page images loaded ([Reads of production](#reads-of-production)).

The Datenkorb page is checked filled with two entries of the edition. Screenshots at 390 and 1440px go to `local-test-build/shots/` for review, the views with all groups marked as `edition-bild-*.png` and `edition-text-*.png`. `node test/browser.test.mjs <page> ...` checks only the named pages of `build/`, and `npm run browser` runs the check on the last build. Without an installed browser the check fails with a message naming the `CHROME` variable, so `npm test` never reads as passed without it.

### Preview server

`npm run serve` or `node serve.mjs [port]` answers the GAMS URLs of the site on `127.0.0.1`, by default on port 8771, starting at `/context:ufbas`. Pages are rendered from the stylesheets of the gams-www checkout and kept in memory until a stylesheet changes, since the edition page is large. `/ufbas/` is answered from the root of the gams-www checkout, `/templates/`, `/lib/` and datastream contents from the production cache. A search sent in the preview runs the query text of `gams/query/` through `sparql.mjs` on the refactored RDF, as GAMS will after the update, and renders the result locally. `query:ufbas.graph` is answered from production, since the forwarding page does not read its answer. The JSON of `query:ufbas.exploration` comes from `sparql.mjs` as well, and the other spreadsheet, XML and JSON exports redirect to production. The `ONTOLOGY` datastream of `o:ufbas.ontology` is answered from `ontology/ufbas.ontology.rdf` until the ingest. The preview has no route for the page of `o:ufbas.ontology`, which is the page Ontologie of `context:ufbas`.

### Acceptance sheet

`node abnahme.mjs abnahme.json` in `local-test-build/`, with `node serve.mjs` running, builds the visual acceptance sheet for one operator question. The configuration names the question, the preview and production bases, the pages, the widths and the numbered items with their state, recommendation and the selector or text of the region to show. Each page is rendered at each width as a full-page screenshot, cut at 8000px, and measured for horizontal overflow, controls below 24px outside running text, console errors and axe WCAG 2.2 A and AA violations. The run writes `abnahme/<date>/index.html` with `shots/` and `befund.json`, which open from the file system and are not committed. The sheet has no form, since the operator decides the items in the chat. It stops with a message when the preview does not answer. `test/abnahme.test.mjs` checks the measurement on a synthetic overflowing page and a clean one.

### Exploration dataset

`node make-exploration-data.mjs` in `local-test-build/` compiles `exploration-data.xsl`, runs it on the TEI of edition and taxonomy and writes `build/ufbas-exploration.json`, the TEI reference of the Exploration view ([data.md](data.md#rdf-as-source-of-the-exploration-view)), for the ufbas-data package. The tests derive it in memory.

### Ontology and refactored RDF

`node make-ontology.mjs` writes the RDF/XML and JSON-LD of `ontology/` from its Turtle, which `test/ontology.test.mjs` compares graph by graph. `node derive-rdf.mjs` runs `gams/ufbas-TORDF-ontology.xsl` on the two TEI documents, writes `ontology/ufbas.example.rdf`, the example of `Eintrag-0` in the data package, and writes `build/ufbas.1563.ontology.rdf` and `build/ufbas.kategorien.skos.rdf`. The tests derive the RDF in memory and keep it in `build/derived/` under a hash of stylesheet and input, where a new derivation replaces the older copies of its name, and `test/rdf-ontology.test.mjs` fails when the example differs from a fresh derivation. `saxon-check.mjs` compares the RDF of the same derivation in Saxon-HE triple for triple ([Gaps](#gaps)).

### Facsimile in the TEI

`node make-facsimile-tei.mjs` in `local-test-build/` reads the IIIF manifest of the Digitaler Lesesaal from `source-material/` and writes the page images into `tei/ufbas.1563.xml`, a `facsimile` with one `surface` per image a page break names, `pb/@facs` pointing to it and a statement in the `msDesc` (ADR-34, [data.md](data.md#edition-tei)). It edits the file as text, so every byte outside these spots stays. It stops when a canvas does not hold the image of its own number, so a reordered manifest cannot shift the pages. The manifest is saved from a browser, since the Lesesaal blocks other requests. When the archive moves its storage, `node make-facsimile-tei.mjs --manifest=<file> --retrieved=<date>` on the newly saved manifest finds each surface again by its canvas id and rewrites the block. `publishedForm` in the same script undoes the change, which the test compares with the hash of the published datastream and `build.mjs` renders as the page `edition-ohne-bild`, the edition page as GAMS shows it until the re-ingest.

### Baseline

`local-test-build/baseline/` holds renderings of the 2017 stylesheets, produced by the harness before the refactoring and compared with production by `compare-production.mjs`, where all page types matched except the category browse, whose query has no `ORDER BY`. The baseline is not committed. `make-baseline.mjs` renders it from the stylesheets of gams-www commit `3a2584f`, and `npm test` does so when it is missing.
