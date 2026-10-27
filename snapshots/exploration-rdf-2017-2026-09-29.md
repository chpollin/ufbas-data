---
title: Exploration query on the RDF of 2017, 2026-09-29
project:
  name: Urfehdebücher der Stadt Basel
  repository: https://zimlab.uni-graz.at/gams/projects/ufbas/gams-www
method:
  name: Promptotyping
  url: https://dhcraft.org/Promptotyping/
status: snapshot
created: 2026-09-29
updated: 2026-10-26
authors: [Christopher Pollin]
generated-with: Claude Code (Claude Opus 5.5)
related: [../knowledge/data.md, ../knowledge/testing.md]
---

# Exploration query on the RDF of 2017, 2026-09-29

From 2026-09-29 to 2026-10-21 the Exploration view read the RDF that `ufbas-TORDF.xsl` published in 2017. `test/exploration-rdf.test.mjs` ran the query text of that time with Oxigraph on the published RDF and compared it with the TEI reference of `local-test-build/exploration-data.xsl`. The list of differences it accepted stands in the test as of commit `ced7a16`. Since commit `3441907` the query reads the refactored RDF and the test accepts no difference ([data.md](../knowledge/data.md#rdf-as-source-of-the-exploration-view)).

## Shape of the query

- A nested annotation is linked from its nearest annotated ancestor only, so the categories of an entry were collected along every chain of `uf:has<Category>` links.
- A place with `@ref` is one node for all its occurrences and carries the links of every entry it occurs in. In a first draft a chain through such a node gave 18 entries the keyword Wirtshaus of other entries, so no chain passed through a node with `skos:prefLabel`.
- An element with two categories gets a node per category on the same span, of which only the first is linked, so every node on the span of a reached node counted.

## Differences to the TEI

The answer agreed with the TEI on every offence, sanction, procedure category and Urfehde date. It differed in these values of the published RDF itself.

- Ten keywords of nine entries were missing, namely Welsche in `Eintrag-25`, Knecht in `Eintrag-161` and `Eintrag-620`, Juden in `Eintrag-239`, Wirtshaus in `Eintrag-243` and `Eintrag-620`, Oberster Knecht in `Eintrag-273`, Dienstmagd in `Eintrag-354`, Armut in `Eintrag-535` and Spital in `Eintrag-571`. Some sit inside a place with `@ref`, whose node the query did not pass, others on an element whose `@ana` holds a gender token besides the category, where `ufbas-TORDF.xsl` applies its gender rule instead of the category link.
- The same gender rule dropped the second offender of `Eintrag-124` ("einer frowen") and with it the mixed gender composition of that entry.
- `Eintrag-176` and `Eintrag-376` had a male offender in the RDF and no gender in the TEI reference, taken from a forename inside the name that belongs to another person (inference from the RDF of both entries).
- Beyond the view, the gender rule also dropped 31 victim roles and several further person roles, which is why the view offered no filter by role.
