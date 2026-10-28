---
title: Project
project:
  name: Urfehdebücher der Stadt Basel
  repository: https://github.com/chpollin/ufbas-data
method:
  name: Promptotyping
  url: https://dhcraft.org/Promptotyping/
template:
  name: Vorlage Projekt-Wissensdokument
  version: 0.3
  url: https://dhcraft.org/Promptotyping/promptotyping-document/project
status: draft
created: 2026-09-23
updated: 2026-10-28
authors: [Christopher Pollin]
generated-with: Claude Code (Claude Opus 5.5)
related: [domain.md, specification.md, data.md, ../README.md]
knowledge-sources:
  institutions:
    Staatsarchiv Basel-Stadt: https://www.staatsarchiv.bs.ch
    Universität Basel, Departement Geschichte: https://dg.philhist.unibas.ch
    Zentrum für Informationsmodellierung, Universität Graz: https://informationsmodellierung.uni-graz.at
  standards:
    TEI P5: https://tei-c.org/guidelines/p5/
    Web Annotation Vocabulary: https://www.w3.org/ns/oa
    SKOS: https://www.w3.org/2004/02/skos/core
---

# Project

The edition publishes Urfehdebuch X of the city of Basel (Staatsarchiv Basel-Stadt, Ratsbücher O 10) with its entries from January 1563 to December 1569 as a TEI-encoded digital edition in GAMS. Each entry is transcribed close to the layout of the book, linked to the archive's digitised page, and tagged with project categories for persons, places, offences, penalties and keywords, so that readers can search the text, filter by category and collect entries in the Datenkorb for their own analysis.

## Origin and responsibility

The transcription goes back to a course at the Department of History of the University of Basel in spring 2012, the TEI encoding to a course in spring 2016. The project lead at the Basel department is the academic responsible and the contact named on the site. The Zentrum für Informationsmodellierung (ZIM) at the University of Graz built the GAMS presentation layer, the RDF transformation and the search in 2016 and 2017, with Christopher Pollin as developer. The site states 31 January 2017 as publication date, the TEI header names 2016 as edition year. The citation the edition suggests stands in [README.md](../README.md#citation).

## Source

The Urfehdebücher are held by the Staatsarchiv Basel-Stadt under the signatures Ratsbücher O 1 to O 42 and are digitised there. The edition covers only volume O 10. Its `pb/@facs` links pointed to the archive's former image viewer at `dokumente.stabs.ch`, which no longer answers. Since ADR-34 the TEI carries the page images of the Digitaler Lesesaal of the archive, which the edition page shows ([data.md](data.md#edition-tei)).

## Licence

Content under CC BY-NC-SA 4.0, code under MIT since 2026-09-24 (ADR-04) in both repositories, the ontology and its SHACL shapes under CC BY 4.0. Which licence covers which folder of ufbas-data is stated in [README.md](../README.md#licence), the terms of the third-party files served from `/ufbas/` (fonts, OpenSeadragon, icons, logos) in the README of gams-www.

## Refactoring 2026

The edition was one of Christopher Pollin's first GAMS projects, and he refactors its presentation layer in 2026. Defects are repaired and the interface improved, while text, data and page content stay as published. The edition stays one page, keeps its 2017 identity and works without Bootstrap and jQuery. The refactoring added an Exploration view over the whole book and a domain ontology from which the RDF of the edition is derived anew ([specification.md](specification.md), [domain.md](domain.md)), and both reach readers with the GAMS update (ADR-19). The open steps are in [plan.md](plan.md). The ZimLab repository got its baseline on 2026-09-23 from the SVN trunk and the production state of the served files, and since 2026-10-27 it holds only the served files, with knowledge, harness and data in ufbas-data (ADR-31).
