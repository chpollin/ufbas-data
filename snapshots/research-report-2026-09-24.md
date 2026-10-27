---
title: Research report 2026-09-24
project:
  name: Urfehdebücher der Stadt Basel
  repository: https://zimlab.uni-graz.at/gams/projects/ufbas/gams-www
method:
  name: Promptotyping
  url: https://dhcraft.org/Promptotyping/
status: snapshot
created: 2026-09-24
updated: 2026-09-24
authors: [Christopher Pollin]
generated-with: Claude Code (Claude Opus 5.5)
related: [../knowledge/domain.md, ../knowledge/data.md, ../knowledge/specification.md]
---

# Research report 2026-09-24

Measurements behind the domain knowledge, the data findings and the Exploration specification, taken on 2026-09-24 against the TEI mirrors of that day. Subagents ran the analyses with scripts in a session scratchpad that was not kept. The main agent re-checked the findings named as checked below against the TEI. The durable conclusions are in [domain.md](../knowledge/domain.md) and [data.md](../knowledge/data.md), the curated tables in [research-artefacts/](../research-artefacts/README.md).

## Data profile

- 624 entry `div`s (ids 0 to 624, 133 missing), 1 complete Urfehde outside any entry, 610 day-precise Urfehde dates, 14 entries without one.
- Urfehden per year: 1563 18, 1564 74, 1565 148, 1566 108, 1567 76, 1568 98, 1569 88. Months without entries in 1563/64 and from December 1566 to April 1567.
- Offenders: 779 `persName`s, 602 male, 165 female, 12 without gender. Entries with offenders of one gender only: 462 male, 89 female, 59 mixed.
- Most frequent offences by entries: Diebstahl 81, Ordnungsstörung 78, Alkoholmissbrauch 72, Unzucht 69. Most frequent Strafe categories: Ermahnung 275, Strafandrohung 217, Ausweisung 199, Geldstrafe 167.
- Places: 1089 `placeName`s, 808 with `@ref`, 381 distinct refs, 369 entries in `listPlace`, 50 of them with an uncertain identification, 12 refs that do not resolve.
- Amounts: 304 `measure` elements, most in `lbd` (176) and `fl` (46).

## Dates

The Julian weekday of the written date was computed for every Urfehde date with a written weekday. 20 of 551 checkable dates disagree. In seven cases the written weekday fits the written date and the coded value is wrong (checked: Eintrag-155, 232, 257, 266, 270, 476, 505). The three dates of deed or deadline outside the book's range or after the Urfehde were checked in the text.

## Folio

The editors cite 361 entries by heading and folio. The folio label `N - 18` of 2017 resolved none of them, the count over the page breaks resolves 352 on the cited folio and the rest on an adjacent page or by heading alone (checked: Eintrag-10 fol. 3r, Eintrag-363 fol. 69r).

## Entry types

Five rules reproduce the About page's 3 Urfehdbriefe, 7 Aussagen (6 undated), 7 Entwürfe (1 undated), 2 abgebrochene Einträge and 3 undated complete Urfehden, and find 2 fragments continuing other entries. Regular dated Urfehden: 600 in the TEI against 594 implied by the About page.

## Marginal notes

657 marginal notes, 637 of them tagged `#uf_Eingangsnotiz`. In 554 of 568 entries with numbered claims the numbers sum to the number of offenders. The nine flower marks lie at the half-year boundaries of Schmid 2016 (checked: nine `metamark rend="Blume"`). Counts per guard against the About table: Brucker 148 (150), Steck 6 (6), Köferlj 115 (102), Bylger 25 (24), Rorer 80 (80), Ylidorffer 27 (16), Uolin 152 (152), Veldbach 5 (4).

## Person links

The 361 citations resolve to one entry each. In a random sample of 36 links, both entries name the same person in all 36, 24 of them confirmed by the text itself. Name matching alone yields further pairs, of which 10 of 20 in a first sample and 15 of 20 in a refined second sample were the same person.

## Jahrrechnungen

Of 157 fined entries with a surnamed offender dated within the Jahrrechnungen up to June 1569, 31 had a surname hit in the account of Rotstrafen of the same fiscal year. 24 are plausibly the same case, 18 of them with matching amount (checked: Eintrag-584, 100 lb, `bs_Strafen-15` of 1568/69).

## RDF and GAMS

- The local TORDF output and the published `RDF` datastream of `o:ufbas.1563` hold 96,316 triples each and are identical after renaming 231 generated identifiers.
- Stored `QUERY` datastreams on production accept `skos:broader*` and `|`, shown on two DEPCHA queries. Pages carry `X-Cocoon-Version: 2.1.13`.
- `o:ufbas.schema`, `o:gams-ontology` and `o:depcha.bookkeeping` have the content model `cm:Ontology`.
- GAMS serves SVG from a project folder as `image/svg+xml`.
