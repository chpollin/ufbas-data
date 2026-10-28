# Urfehdebücher der Stadt Basel – data

The data of the digital edition *Die Urfehdebücher der Stadt Basel – digitale Edition*, Urfehdebuch X (Staatsarchiv Basel-Stadt, Ratsbücher O 10, 1563–1569), as one package, together with the project knowledge, the local test harness and the GAMS ingest files of the edition's presentation layer. The edition is published in GAMS, the repository of the University of Graz, at https://gams.uni-graz.at/ufbas (handle [hdl:11471/1010.2](https://hdl.handle.net/11471/1010.2)).

## Data package

GAMS stays the source of truth. The files in `tei/` and `rdf/` are the published datastreams, retrieved from GAMS on 2026-09-24 and stored byte for byte, with one prepared change. Since 2026-10-28 `tei/ufbas.1563.xml` carries the page images of the volume as `facsimile`, which GAMS serves once the edition is ingested again (ADR-34). The files in `derived/` are derived from them and add structure without changing a published value.

### Files

| File | Content | Source |
|---|---|---|
| `tei/ufbas.1563.xml` | The edition, the whole book as one TEI document with the annotated entries, and the IIIF image service and canvas of every page image | [`o:ufbas.1563` TEI_SOURCE](https://gams.uni-graz.at/archive/objects/o:ufbas.1563/datastreams/TEI_SOURCE/content) |
| `tei/ufbas.kategorien.xml` | The category taxonomy (persons and roles, offences, sanctions, places, keywords) as TEI | [`o:ufbas.kategorien` TEI_SOURCE](https://gams.uni-graz.at/archive/objects/o:ufbas.kategorien/datastreams/TEI_SOURCE/content) |
| `rdf/ufbas.1563.rdf` | The RDF of the edition, derived at ingest from the TEI, which the search of the edition queries | [`o:ufbas.1563` RDF](https://gams.uni-graz.at/archive/objects/o:ufbas.1563/datastreams/RDF/content) |
| `rdf/ufbas.kategorien.rdf` | The RDF of the taxonomy | [`o:ufbas.kategorien` RDF](https://gams.uni-graz.at/archive/objects/o:ufbas.kategorien/datastreams/RDF/content) |
| `rdf/ufbas.schema.owl` | The OWL and RDFS declaration of the `uf:` vocabulary from 2017 | [`o:ufbas.schema` ONTOLOGY](https://gams.uni-graz.at/archive/objects/o:ufbas.schema/datastreams/ONTOLOGY/content) |
| `derived/ufbas-exploration.json` | One record per entry with date, folio, parts of the entry and its categories, kept equal to its derivation from the TEI by the tests, and the independent reference the RDF of the Exploration view is compared with | derived from the TEI |
| `ontology/ufbas.ontology.ttl`, `ontology/ufbas.ontology.rdf`, `ontology/ufbas.ontology.jsonld` | The domain ontology of the refactored RDF in Turtle, the edited source, and in RDF/XML and JSON-LD. The RDF/XML is the ingest source of the `ONTOLOGY` datastream of `o:ufbas.ontology` | written in 2026, the RDF/XML and JSON-LD derived from the Turtle |
| `ontology/ufbas.shapes.ttl`, `ontology/ufbas.shapes.rdf` | The SHACL shapes that hold the refactored RDF to the ontology, in Turtle and RDF/XML | written in 2026, the RDF/XML derived from the Turtle |
| `ontology/ufbas.example.rdf` | `Eintrag-0` as the refactored RDF derives it | derived from the TEI |

The line endings of the published datastreams are kept as GAMS serves them, so `.gitattributes` excludes every file from line ending conversion.

### Local analysis

The source retrieved again on 2026-10-27 was byte-identical to `tei/ufbas.1563.xml` before the page images of ADR-34 entered it, and the commit `7624833` keeps that published state. [The TEI analysis](knowledge/tei-analysis.md) records the verified structure, annotation examples, open questions and proposed test strategy. Run `git show 7624833:tei/ufbas.1563.xml > generated/ufbas.1563.published.xml` and then `uv run scripts/analyze_tei.py generated/ufbas.1563.published.xml --self-check --output generated/tei-analysis.json` in a POSIX shell such as Git Bash, whose redirection keeps the bytes, to reproduce the inventory and its bounded checks. The self-check requires the published file. `generated/` is excluded from Git.

### Provenance

The transcription goes back to a course at the Department of History of the University of Basel in spring 2012, the TEI encoding to a course in spring 2016. The presentation layer, the RDF transformation and the search were built in 2016 and 2017 at the Zentrum für Informationsmodellierung of the University of Graz, today the Institut für Digitale Geisteswissenschaften, and revised in 2026. The project description in `gams/datastreams/context-ufbas.ABOUT.xml`, the `ABOUT` of `context:ufbas`, names everyone involved.

The derived dataset is produced by the harness in `local-test-build/`, where `make-exploration-data.mjs` writes `derived/ufbas-exploration.json`, and its tests check it against the TEI and fail when the committed file is stale. `make-facsimile-tei.mjs` writes the page images into `tei/ufbas.1563.xml` from the IIIF manifest of the Digitaler Lesesaal in `source-material/`, and after a storage move of the archive one run on a newly saved manifest renews them. The knowledge base documents the data model, the known data findings and the decisions of the revision ([data.md](knowledge/data.md), [domain.md](knowledge/domain.md)). A new release of this package copies the current datastreams from GAMS into `tei/` and `rdf/`.

The repository [Overhaul-UFBAS](https://github.com/chpollin/Overhaul-UFBAS) holds an experiment of 2023 on revising the edition with an LLM. Its TEI and RDF are transformed copies and differ from the published data here.

## Development

### Two repositories

Since 2026-10-27 the project follows the ZimLab template for `gams-www` and is split in two repositories, which are checked out side by side.

| Repository | Holds |
|---|---|
| gams-www, https://zimlab.uni-graz.at/gams/projects/ufbas/gams-www | Only what GAMS serves from `/ufbas/`, the page stylesheets `ufbas-*.xsl`, `css/`, `js/` and `img/`. Its root is the served folder |
| ufbas-data, this repository | The data package above, the knowledge, the harness, the ingest stylesheets, the queries and the datastream mirrors |

The development folders of ufbas-data:

| Path | Content |
|---|---|
| `gams/ufbas-TOTEI.xsl`, `gams/ufbas-TORDF.xsl`, `gams/ufbas-TORDF-ontology.xsl` | The ingest transformations that Cirilo runs, the last replacing `ufbas-TORDF.xsl` with the GAMS update |
| `gams/query/` | The texts of the `QUERY` datastreams, one file per query object |
| `gams/datastreams/` | Mirrors of further production datastreams, such as `ABOUT`, `IMPRINT` and the member query of `context:ufbas` |
| `local-test-build/` | The local harness, which renders the gams-www checkout, serves a preview and runs the checks |
| `knowledge/` | The project knowledge, starting at [knowledge/INDEX.md](knowledge/INDEX.md) |
| `research-artefacts/` | Curated tables from the research on the book, with their provenance |
| `source-material/` | Older taxonomy files, the TEI part files of the 2016 course and the IIIF manifest of the Digitaler Lesesaal |
| `snapshots/` | Dated audit and research reports |
| `scripts/` | The TEI analysis of the data package |
| `AGENTS.md`, `GAMS.md`, `CLAUDE.md` | Working rules for agents in both repositories |

`tei/ufbas.1563.xml` and `tei/ufbas.kategorien.xml` are the ingest source of `o:ufbas.1563` and `o:ufbas.kategorien`. `ontology/ufbas.ontology.rdf` is the ingest source of the `ONTOLOGY` datastream of `o:ufbas.ontology`, which is not yet ingested (ADR-33).

### Local harness

The harness finds gams-www as `ZIMLAB/ufbas` beside this repository's folder, or at the path in the environment variable `UFBAS_WWW`. It passes before every push of gams-www, judged by the exit status of `npm test`.

```
cd local-test-build
npm install
npm test                         # build every page type, then all checks
UFBAS_OFFLINE=1 npm test         # the same on the answers saved in cache/, failing where one is missing
npm run serve                    # local preview on http://127.0.0.1:8771/context:ufbas
```

The further commands are in [local-test-build/README.md](local-test-build/README.md), what the checks guarantee in [knowledge/testing.md](knowledge/testing.md).

### Delivery

A change of the served files is committed in gams-www and pushed to ZimLab `main` once the harness passes. The gamsdev mirror follows `main` and staging, https://gams-staging.uni-graz.at/context:ufbas, renders from it after the sync. Production changes with the operator's GAMS update, and every ingest and Cirilo setting is the operator's ([knowledge/architecture.md](knowledge/architecture.md#environments-and-delivery)). ufbas-data is pushed to GitHub and is read by no GAMS instance.

## Licence

The data is licensed under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) ([LICENSE](LICENSE)), the licence of the edition. This covers `tei/`, `rdf/`, `derived/ufbas-exploration.json`, the example entry `ontology/ufbas.example.rdf`, the mirrored `ABOUT`, `IMPRINT`, `RELS-EXT` and `ONTOLOGY` datastreams in `gams/datastreams/`, the tables of `research-artefacts/`, the TEI files of `source-material/`, the SKOS/RDF taxonomy `source-material/kategorien.skos.xml` and the test fixtures derived from the TEI, `local-test-build/test/fixtures/eintrag-0.ttl` and `local-test-build/test/fixtures/eintrag-0.skos.ttl`.

The code is licensed under the MIT License ([LICENSE-CODE](LICENSE-CODE)), as decided for the code of the edition on 2026-09-24. This covers `local-test-build/` apart from the fixtures named above, `scripts/`, the scripts in `research-artefacts/scripts/`, `gams/ufbas-TORDF-ontology.xsl`, the queries in `gams/query/` and the mirrored member query `gams/datastreams/context-ufbas.QUERY.sparql`. The packages that `npm install` fetches keep their own licences.

`gams/ufbas-TOTEI.xsl` and `gams/ufbas-TORDF.xsl` are copies of the production transformations of `cirilo:TEI.ufbas` and `cirilo:ufbas`, which carry no statement of authorship or licence. No licence is asserted for them.

The ontology and the SHACL shapes in `ontology/`, in every serialisation, are licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), as their headers state.

The documentation and knowledge text, meaning `knowledge/`, `snapshots/`, `workshop/`, `README.md`, `AGENTS.md`, `CLAUDE.md` and `GAMS.md`, is licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

The page images that the `facsimile` of `tei/ufbas.1563.xml` points to are not part of this package. They belong to the Staatsarchiv Basel-Stadt, which marks them as free of rights ([Rechtsgrundlagen](https://dls.staatsarchiv.bs.ch/de/orientierung/rechtsgrundlagen-und-datenschutz/#StABS-gemeinfrei)). Their image services and canvas ids come from the IIIF manifest the Staatsarchiv publishes for the volume and follow its terms, and `source-material/dls-manifest-245856.json` is a copy of that manifest. The terms of the files that gams-www serves, among them OpenSeadragon, stand in its README. The web fonts come from GAMS.

## Citation

Urfehdenbuch X der Stadt Basel (1563–1569), in: Die Urfehdebücher der Stadt Basel – digitale Edition, hg. v. Susanna Burghartz, Sonia Calvi und Georg Vogeler, Basel/Graz 2016 (zuletzt verändert am 31.1.2017), [hdl:11471/1010.2.1](https://hdl.handle.net/11471/1010.2.1).

Machine-readable citation metadata is in [CITATION.cff](CITATION.cff).
