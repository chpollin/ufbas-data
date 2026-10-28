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

Every change of gams-www is checked locally before it is pushed to ZimLab `main`, and on staging after the mirror sync. The harness in `local-test-build/` renders the page stylesheets of the gams-www checkout with SaxonJS against `tei/` and the mirrors in `gams/datastreams/`, derives the refactored RDF from the TEI, runs the query texts of `gams/query/` on it with Oxigraph, serves a local preview and runs the checks below. It tests the output, the rendered pages, the derived data and the RDF, against the sources and against saved production responses, and names what stays unchecked. A comparison with a cached response establishes agreement with that saved state only ([Reads of production](#reads-of-production)).

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
| Copies of GAMS | `mirror` test | a mirrored datastream or ingest transformation edited as if it were the source, and a prepared target value the operator has set meanwhile |
| Browser | `browser.test.mjs` in headless Chrome or Edge, `abnahme` test | reflow, contrast and the automatic WCAG rules, which only a layout engine shows, and a measurement of the acceptance sheet that misses a finding |
| Knowledge base | `knowledge.test.mjs` | broken links and anchors between the project documents |
| Processor | `saxon-check.mjs`, outside `npm test` | a construct that Saxon in XSLT 2.0 rejects, and an ingest whose RDF differs between Saxon for Java and SaxonJS |

## Guarantees

Each file of `local-test-build/test/` states in its header comment what it checks. The table names the guarantee each one carries, the file holds the detail.

| File | Guarantees |
|---|---|
| `pages.smoke.mjs` | Every built page is well formed for HTML parsing (no empty non-void element, unique ids, resolving anchors, one `h1`, labelled controls, images with `alt`, no foreign or `/lib/` assets), and the page-specific structure of edition, search and graph pages holds. Expected hit counts are the answers of `gams/query/` on the refactored RDF, which change only with a query text or the derivation. |
| `edition-text.test.mjs` | No entry or book heading loses or reorders text against the 2017 rendering. Added text, from marginal notes the 2017 code did not print, is listed, and brackets and folio labels are left out of the comparison. |
| `edition.test.mjs` | Labels, heading hierarchy, folio labels at cited folios and leaf 32a, annotation markup with one span per group and at most three underline slots, marginal notes, view switch template and table of contents of the edition page match the TEI. |
| `context.test.mjs` | The pages of `context:ufbas` skip no heading level, the home quote stands verbatim in `ABOUT`, the project page renders `ABOUT` completely and in order, the imprint renders the sections of `IMPRINT` without naming the Zentrum für Informationsmodellierung, and the footer credit of the revision stands on home and project and not on the imprint (ADR-20). |
| `categories.test.mjs` | The list `withoutEntries` in `ufbas-category.xsl` equals the categories no edition element names, and the page shows every category once in the group order with the right links. |
| `search.test.mjs` | Result pages show excerpts that are passages of the text with a hit, chips with their group, the query read back, year links and example buttons. |
| `search-params.test.mjs` | `js/buildquery.js` builds the documented `params` without `|` or backslash sequences and reports invalid input at the form ([architecture.md](architecture.md#parameter-channel)). |
| `search-queries.test.mjs` | The search query texts read only the ontology, GAMS ontology, SKOS and full-text search, and on the refactored RDF find the hits of the production answers of 2026-09-23 apart from listed differences with a cause in the data. A new or vanished difference fails. `sparql.mjs` emulates `bds:search` for Oxigraph. |
| `marking-views.test.mjs`, `datenkorb.test.mjs` | The real scripts work on the built pages, marking switches, tips, annotation index, views and page image with a stubbed viewer, the Lesesaal fallback, and the Datenkorb with takeover of the 2017 key, persistence, CSV and removal. |
| `exploration-data.test.mjs` | The TEI reference holds one record per entry except the fragments, in book order, with the curated entry type and the folio of the edition page. |
| `exploration-rdf.test.mjs` | `gams/query/ufbas.exploration.sparql` on the refactored RDF agrees with the TEI reference on every value the view shows, without any accepted difference ([data.md](data.md#rdf-as-source-of-the-exploration-view)). |
| `exploration.test.mjs` | Every count of the view, clicked, leaves as many rows and full marks as it shows, one scenario per user story gives the answer of the TEI reference, and table, keyboard and failure handling work. |
| `ontology.test.mjs` | The ontology declares and labels every term, aligns only to CRM, RiC, PROV, SKOS, GAMS and OWL, its serialisations are the same graphs, and the SHACL shapes (SHACL Core with `rdf-validate-shacl`, the choice argued in the header) accept the derived data with the facts of the published TEI as exactly counted warnings. |
| `ontology-page.test.mjs` | The page Ontologie anchors every term, draws every class and object property, and renders from the `ONTOLOGY` datastream alone (ADR-33). |
| `rdf-ontology.test.mjs` | The refactored RDF carries per proceeding what the TEI reference reads, none of the losses of the RDF of 2017, the curated entry types and cross-references of `research-artefacts/`, the date conflicts of [data.md](data.md#data-quality), and `ontology/ufbas.example.rdf` as the current derivation of `Eintrag-0`. |
| `skos.test.mjs` | The concept scheme keeps every category at its published IRI with the taxonomy's nesting, German and English labels, gloss and coding rule split as [domain.md](domain.md#domain-ontology) states, and collections equal to the sanction groups and colour classes the pages use. |
| `rdf.test.mjs` | `gams/ufbas-TORDF.xsl` on `tei/` gives the published `RDF` datastreams triple for triple ([architecture.md](architecture.md#rdf-transformation)). |
| `facsimile-tei.test.mjs` | `tei/ufbas.1563.xml` is what `make-facsimile-tei.mjs` writes from the manifest, and with the change undone it hashes to the published datastream. |
| `mirror.test.mjs` | `gams/datastreams/`, the two production transformations, `rdf/ufbas.schema.owl` and `tei/ufbas.kategorien.xml` equal the cached production datastreams, except the prepared target values it lists, today `IMPRINT` (ADR-20). An unchanged cache cannot show whether the operator has updated a live datastream. |
| `served-folder.test.mjs` | One commit renders with all assets from `/ufbas/` on production and from the gamsdev mirror on staging. |
| `browser.test.mjs` | No page scrolls horizontally from 320px, the root font size is 16px, the skip link takes the first Tab, axe-core finds no WCAG 2.2 A or AA violation, and the Exploration view and the page image load within their time limits ([Browser check](#browser-check)). |
| `abnahme.test.mjs` | The measurement of the acceptance sheet flags an overflowing page and leaves a clean one unflagged. |
| `knowledge.test.mjs` | Every relative link and `related` entry of the documentation reaches its file and heading, with GitLab heading ids. |

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

Three derivations have to agree. The TEI, read by `exploration-data.xsl`, is the reference. The refactored RDF, read by the stored query, is what the view counts, and `exploration-rdf.test.mjs` holds the two together. The page, driven in jsdom, shows for each user story the answer the TEI gives, and every count opens exactly its entries.

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

An independent walkthrough of 2026-09-29 by a reviewing agent along both personas found the pattern-to-entry loop working and led to the and-combination within filters, the common scale of the calendar and the mobile order. Its open points are in [plan.md](plan.md#exploration). It does not replace readers. The personas are hypotheses ([specification.md](specification.md#personas)), so the view is validated with readers who match them, historians of the Departement Geschichte in Basel or a course working with the edition. Each session gives the tasks below without instruction, with thinking aloud, and records success, time, the path taken and wrong readings. The result is a dated snapshot in `snapshots/` and a new state in the table above.

1. Which sanctions followed theft, and how often banishment? Success when the reader states the count and opens the entries.
2. Were women punished differently from men for Unzucht? Success when the reader compares with numbers and notices the mixed entries.
3. Were there fewer Urfehden in early 1567? Success when the reader explains the low months by the cut-out pages.
4. Find a typical and an unusual case of Gotteslästerung and read both. Success when both entries are opened in the edition from the view.
5. Send the current selection to a colleague. Success when the reader copies the address and it reopens the same selection.
6. What did the annotators count as Leichtfertigkeit? Success when the reader finds the definition, also on a phone.
7. With Diebstahl chosen, what does the number beside Einbruch mean? Success when the reader says it counts the thefts that were also burglaries.
8. Does the sanction profile of a row show how often or how large a share? Success when the reader reads it as the share of the row.

## Gaps

- `npm test` runs SaxonJS only. `saxon-check.mjs` compiles every stylesheet in Saxon-HE 9.6 and runs `ufbas-TOTEI.xsl` and then `ufbas-TORDF-ontology.xsl` as an ingest does, but needs a Java runtime and the Saxon jar and runs by hand. The pages on staging run the Saxon of GAMS.
- `npm test` does not run `ufbas-TOTEI.xsl`. The RDF test applies `ufbas-TORDF.xsl` to the TEI without it, and the staging ingest of 2026-09-29, which ran both, gave the RDF of production with the same resources ([architecture.md](architecture.md#rdf-transformation)).
- The query texts run locally on Oxigraph, which follows the SPARQL specification more strictly than Blazegraph in aggregates and the scope of `BIND` and has no full-text search. Answer and time on Blazegraph are checked on staging after the re-ingest.
- The page images in the TEI are checked for regeneration, completeness and the first text page, not image by image.
- Whether the Exploration view serves its personas is shown by no automatic check, only by the [user test](#user-test).
- Staging and the state of production after the GAMS update are checked by hand along [plan.md](plan.md#delivery).
- The scripts in `research-artefacts/scripts/` are provenance and not run.

### Limits of SaxonJS

SaxonJS implements XSLT 3.0 and is more tolerant than the Saxon of GAMS in XSLT 2.0. A 3.0 construct or a regular expression in `analyze-string` that matches the empty string renders locally but aborts the page on GAMS. The stylesheets are therefore compiled in Saxon-HE 9.6 by `saxon-check.mjs`, and the smoke test checks the visible symptom of an empty-matching highlight pattern, an empty `mark`. SaxonJS also matches the em spaces of the TEI with `\s`, where Saxon for Java does not ([data.md](data.md#data-quality)), and fails on empty sort keys, which Saxon sorts first, so sort keys are wrapped in `string()`.

### Left to the reader

The checks see reflow, contrast and the automatic WCAG rules, but no visual quality, no reading order as a person perceives it and no screen reader output. The operator's look at staging at full width and at phone width, with keyboard operation, and the check on production after the GAMS update cover them.

## How to run

`npm test` runs `test/run.mjs`, which renders the baseline when `baseline/edition.html` is missing, builds every page type with `build.mjs`, runs `pages.smoke.mjs`, every other `test/*.test.mjs` in alphabetical order and `browser.test.mjs` last, and stops at the first failure. The exit status is the verdict. Read through a pipe such as `| tail`, it is the status of the last command of the pipe, and a failed check reads as passed.

The harness finds the gams-www checkout as `ZIMLAB/ufbas` beside ufbas-data or at the path in `UFBAS_WWW`.

```
cd local-test-build
npm install
npm test                        # build every page type, then all checks
UFBAS_OFFLINE=1 npm test        # the same on cache/ only, failing on a missing entry
node test/browser.test.mjs edition home   # the browser check on named pages of the last build
npm run serve                   # local preview on http://127.0.0.1:8771/context:ufbas
node abnahme.mjs abnahme.json   # acceptance sheet from the running preview
SAXON_JAR=… node saxon-check.mjs  # stylesheets and ingest in Saxon-HE for Java, outside npm test
```

The scripts that write derived files, the preview server and the comparison with production are described in [local-test-build/README.md](../local-test-build/README.md) and in their header comments. The pages `build.mjs` renders, with their inputs, stand in its page table. `edition-ohne-bild` renders the TEI with the facsimile change undone, the edition as GAMS shows it until the re-ingest. The baseline in `baseline/` is not committed and is rendered from the stylesheets of gams-www commit `3a2584f`. Derived RDF is kept in `build/derived/` under a hash of stylesheet and input, where a new derivation replaces the older copies of its name. `make-facsimile-tei.mjs` stops when a canvas does not hold the image of its own number, so a reordered manifest cannot shift the pages. The acceptance sheet writes `abnahme/<date>/`, which is not committed, and the operator decides its items in the chat.

### Reads of production

The harness uses `fetchCached` of `gams.mjs` where ufbas-data has no copy. Each process serialises its requests and applies its own request budget, and the child processes of `test/run.mjs` have separate queues and counters, so other processes and agents share no lock. Existing cache entries are reused without a freshness check. With `UFBAS_OFFLINE=1` the helper sends no requests and fails on a missing fixture, and network access outside the helper is unaffected. A reference renewal is a separate, controlled step, performed sequentially for the relevant URLs and documented with its date and scope. Routine checks preserve the existing references. With an empty `cache/` these steps fetch from production:

- `build.mjs` for the graph pages, which render the answer of `query:ufbas.graph`, and for `METADATA` and `DC` of `context:ufbas`, which have no mirror
- `test/rdf.test.mjs` and `test/skos.test.mjs` for the published `RDF` datastreams
- `test/search-queries.test.mjs` for the production answers of 2026-09-23
- `test/mirror.test.mjs` for the datastreams the mirrors copy
- `test/served-folder.test.mjs` for `METADATA` of `context:ufbas`
- `test/browser.test.mjs` and `serve.mjs` for `/templates/`, `/assets/` and, in the preview, `/lib/` and datastream contents without a mirror
- `compare-production.mjs` for the production pages

Until the ingest of `o:ufbas.ontology` the harness answers its `ONTOLOGY` datastream from `ontology/ufbas.ontology.rdf` (`localDatastreams` in `gams.mjs`, a deliberate shortcut removed after the ingest).

### Browser check

`browser.test.mjs` needs Node 22 or newer and Chrome or Edge at the usual install paths or in `CHROME`, and fails with a message naming that variable when none is found, so `npm test` never reads as passed without it. It checks each page at seven widths from 320 to 1440px and audits with axe at 390 and 1440px. Beyond the guarantees above it fails on a sticky navigation that wraps (sticky from 1200px, checked with a three-digit Datenkorb), on a missing skip-link outline, and on print styles that drop the years of a category browse or the column heads and dates of the Datenkorb and Exploration tables. The edition is checked in both views with every group marked. The IIIF tiles come from the archive's object store, and without network the check passes with the Lesesaal link in their place and reports whether tiles loaded. Screenshots at 390 and 1440px go to `shots/`.
