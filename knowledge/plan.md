---
title: Plan
project:
  name: Urfehdebücher der Stadt Basel
  repository: https://github.com/chpollin/ufbas-data
method:
  name: Promptotyping
  url: https://dhcraft.org/Promptotyping/
template:
  name: Vorlage Plan
  version: 0.3
  url: https://dhcraft.org/Promptotyping/promptotyping-document/plan
status: active
created: 2026-09-23
updated: 2026-10-27
authors: [Christopher Pollin]
generated-with: Claude Code (Claude Opus 5.5)
related: [specification.md, domain.md, architecture.md, testing.md]
---

# Plan

Open steps of the 2026 refactoring. Requirements and decisions are in [specification.md](specification.md), where ADR-13 is deferred until after the update. What is done is in [journal.md](journal.md). Every step passes the local simulation, push and look on staging that [AGENTS.md](../AGENTS.md) prescribes, and reaches readers only with the operator's GAMS update.

## Staging

A read-only check of staging on 2026-10-21 found these Cirilo settings missing against the target values of [architecture.md](architecture.md#cirilo-configuration). Each is an action of the operator. The base is `https://gams-staging.uni-graz.at/gamsdev/pollin/ufbas/gams-www/`.

1. `STYLESHEET` of `query:ufbas.kategorien` and `query:ufbas.volltext` points to the generic `cirilo:Backbone/QUERYtoHTML`. Target is a redirect to base + `ufbas-search.xsl`.
2. `STYLESHEET` of `cirilo:TEI.ufbas` points to `gams-datastreams/cirilo-ufbas.TORDF.xsl`, which answers 404. Target is a redirect to base + `ufbas-object.xsl`.
3. `TORDF` of `cirilo:ufbas` is an empty XSLT stub, and `TORDF` of `cirilo:TEI.ufbas`, `o:ufbas.1563` and `o:ufbas.kategorien` point to the same 404 file. Target is `cirilo:ufbas/TORDF` inline with the content of `gams/ufbas-TORDF-ontology.xsl` of ufbas-data for the test of the update, and the other three as redirects to `/archive/objects/cirilo:ufbas/datastreams/TORDF/content`.
4. `context:ufbas` lacks the attachments `SCHMIDtADMINIStRAtIVESHANDELN2016` and `NUM_ENTRY`, which production has.
5. `query:ufbas.properties` is missing. No new page reads it, so it is needed only if the old graph addresses are to answer on staging.

## Exploration

The view reads the refactored RDF since 2026-10-21 (ADR-21, [testing.md](testing.md#exploration-view)). Open:

1. Look at the page on staging once `query:ufbas.exploration` is set, whether Blazegraph gives the answer of `exploration-rdf.test.mjs` for Diebstahl and Ausweisung and within what time.
2. User test with readers of both personas along [testing.md](testing.md#user-test), recorded as a snapshot.
3. The stories of Epic 3 ([specification.md](specification.md#epic-3-procedure-and-custody-g4-g5)). Query and view read marginal notes, durations, deadlines, amounts, place mentions, residence, cross-references and entry types, which the refactored RDF carries.
4. From the reviews of 2026-09-29, the split by gender in the rows of the offence view, and the definition of a category on touch screens and for screen readers, which the tooltip in `data-tip` does not reach. Both change the view and go to the operator as a draft in the local preview first.

## Edition page

1. A look at the facsimile viewer on staging, where the tiles come from the object store of the archive as on production ([design.md](design.md#views), [architecture.md](architecture.md#edition-page)).
2. The header and navigation CSS read `--page-max` through the shared `.container` rule of `template.css`, which a rebuild of the page head may take over.
3. The phone layout of the edition, drafted on the branch `entwurf-oberflaeche` of gams-www (worktree `ZIMLAB/ufbas-entwurf`), which predates the repository split, so its changes to `gams-datastreams/` and `local-test-build/test/` must be carried to ufbas-data by hand. The draft has the tools in a bar at the bottom of the window, the quick search behind a magnifier and the citation closed, and a browser check that requires the edition text on the first screen. A second round moves the view switch into the bar and the source icons to the citation, then the operator accepts it in the local preview before it is merged.
4. Operator look on staging at the layout below 62rem, at the marks (1.5px, Orte 3px), at page head, entry heading, bookmark and tooltips, and confirmation of the acceptance sheet `op-ufbas-oberflaeche`.

## Ontology

What is built is in [domain.md](domain.md#domain-ontology). Open:

1. Curation of the English labels drafted in `research-artefacts/category-labels-en.tsv` by the operator, after which they enter the ontology and the concept scheme (ADR-30).
2. Publication as `o:ufbas.ontology` of model `cm:Ontology` and the refactored RDF of the edition derived under it (ADR-17), by ingest and re-ingest of the operator ([Delivery](#delivery)). Whether the default view of `cm:Ontology` hands `ONTOLOGY` to the stylesheet is unverified. The page renders without it, but then the navigation item is not marked.
3. After the re-ingest, the downloads of the refactored data and concept scheme on the page "Ontologie", and a look whether Saxon on GAMS gives the triples that `local-test-build/saxon-check.mjs` gives locally.

## Delivery

Production still renders the 2017 site. The update waits until the Exploration view, the facsimile synopsis and the ontology with its RDF and search queries are built (ADR-19). Staging goes first, so that Blazegraph runs the new queries before production does. Every step is the operator's.

1. Push of gams-www to ZimLab `main`, after a passing `npm test` in ufbas-data, and sync of the gamsdev mirror.
2. The settings of [Staging](#staging).
3. `cirilo:ufbas/TORDF` on staging inline with the content of `gams/ufbas-TORDF-ontology.xsl` of ufbas-data, which derives the data of the edition and the concept scheme of the taxonomy.
4. Re-ingest of `o:ufbas.kategorien` and `o:ufbas.1563` on staging from `tei/ufbas.kategorien.xml` and `tei/ufbas.1563.xml` of ufbas-data ([architecture.md](architecture.md#ingest)), then `STYLESHEET` of `o:ufbas.kategorien` by hand to base + `ufbas-category.xsl`.
5. Ingest of `o:ufbas.ontology` on staging with `ONTOLOGY` from `data/ontology/ufbas.ontology.rdf` of gams-www and `STYLESHEET` as redirect to base + `ufbas-ontology.xsl`.
6. `QUERY` of `query:ufbas.search`, `query:ufbas.volltext`, `query:ufbas.kategorien` and `query:ufbas.exploration` with the texts of `gams/query/` of ufbas-data, `query:ufbas.exploration` created where it does not exist.
7. Look at staging on a quick search (Dieb), a place name with a date range (Riehen, 1566), a category browse (Diebstahl), the Exploration view, the page "Ontologie" with its example, `/o:ufbas.ontology#Offence`, and the downloads of `/o:ufbas.1563/RDF` and `/o:ufbas.kategorien/RDF`.
8. Operator acceptance on staging at full width and at phone width.
9. On production in one step, the GAMS update of `/ufbas/` from ZimLab `main`, steps 3 to 6, the Cirilo settings of [architecture.md](architecture.md#cirilo-configuration) including `STYLESHEET` of `query:ufbas.graph` and `cirilo:Context.ufbas`, and the revised `IMPRINT` ([architecture.md](architecture.md#switching-the-graph-page)).
10. Check of production on the home page, the project page, the imprint, the edition (an entry with categories, a marking switch, an editorial note, the table of contents, folio labels), the category page, a category browse, the Exploration page, the view "Text und Bild" with the tiles of a page image loading and a folio label opening its page, a quick search, an advanced search with a regular expression and with a date range only, the Datenkorb with an entry from before the update, the TEI and RDF icons, and whether the pages load Droid Serif and Open Sans from `/assets/fonts/`.
11. Removal of the SVN working copy `gamsdev/ufbas` outside `gams-www`, which stays unmodified until production no longer references its `trunk/`, and of the stale `DATENKORB` datastream of `context:ufbas`.

## Cleanup

What remains of the audit of 2026-10-26.

1. Where work continues on these files, the ontology page of `ufbas-context.xsl` as a module of its own, included without loading `ufbas-static.xsl` twice through `ufbas-ontology.xsl`, and the pure part of `js/exploration.js` (parsing, selection, profile, frame) apart from drawing and interaction, with `placeDetail` marking its fallback by a flag.
2. After the GAMS update, `compare-production.mjs` and `npm run compare` after one last run against the updated production, `local-test-build/abnahme.json` once `op-ufbas-oberflaeche` is closed, and `gams/query/ufbas.properties.sparql` once the 2017 shell of the graph page no longer answers on production.

## Open improvements

- Logo files of the institute and of the University of Graz in the forms the green band and the footer need, placed in `img/` of gams-www.
