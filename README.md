# Urfehdebücher der Stadt Basel – data

The data of the digital edition *Die Urfehdebücher der Stadt Basel – digitale Edition*, Urfehdebuch X (Staatsarchiv Basel-Stadt, Ratsbücher O 10, 1563–1569), as one package, together with the project knowledge, the local test harness and the GAMS ingest files of the edition's presentation layer. The edition is published in GAMS, the repository of the University of Graz, at https://gams.uni-graz.at/ufbas (handle [hdl:11471/1010.2](https://hdl.handle.net/11471/1010.2)).

## Data package

GAMS stays the source of truth. The files in `tei/` and `rdf/` are the published datastreams, retrieved from GAMS on 2026-09-24 and stored byte for byte. The files in `derived/` are derived from them and add structure without changing a published value.

### Files

| File | Content | Source |
|---|---|---|
| `tei/ufbas.1563.xml` | The edition, the whole book as one TEI document with the annotated entries | [`o:ufbas.1563` TEI_SOURCE](https://gams.uni-graz.at/archive/objects/o:ufbas.1563/datastreams/TEI_SOURCE/content) |
| `tei/ufbas.kategorien.xml` | The category taxonomy (persons and roles, offences, sanctions, places, keywords) as TEI | [`o:ufbas.kategorien` TEI_SOURCE](https://gams.uni-graz.at/archive/objects/o:ufbas.kategorien/datastreams/TEI_SOURCE/content) |
| `rdf/ufbas.1563.rdf` | The RDF of the edition, derived at ingest from the TEI, which the search of the edition queries | [`o:ufbas.1563` RDF](https://gams.uni-graz.at/archive/objects/o:ufbas.1563/datastreams/RDF/content) |
| `rdf/ufbas.kategorien.rdf` | The RDF of the taxonomy | [`o:ufbas.kategorien` RDF](https://gams.uni-graz.at/archive/objects/o:ufbas.kategorien/datastreams/RDF/content) |
| `rdf/ufbas.schema.owl` | The OWL and RDFS declaration of the `uf:` vocabulary from 2017 | [`o:ufbas.schema` ONTOLOGY](https://gams.uni-graz.at/archive/objects/o:ufbas.schema/datastreams/ONTOLOGY/content) |
| `derived/ufbas-exploration.json` | One record per entry with date, folio, parts of the entry and its categories, for the Exploration view | derived from the TEI |
| `derived/ufbas-facsimile.json` | The IIIF image service, width and height of every page image, keyed by the image number that `pb/@facs` of the TEI names | derived from the IIIF manifest of the Digitaler Lesesaal |

The line endings of the published datastreams are kept as GAMS serves them, so `.gitattributes` excludes every file from line ending conversion.

### Local analysis

The source retrieved again on 2026-10-27 is byte-identical to `tei/ufbas.1563.xml`. [The TEI analysis](knowledge/tei-analysis.md) records the verified structure, annotation examples, open questions and proposed test strategy. Run `uv run scripts/analyze_tei.py tei/ufbas.1563.xml --self-check --output generated/tei-analysis.json` to reproduce the inventory and its bounded checks. `generated/` is excluded from Git.

### Provenance

The transcription goes back to a course at the Department of History of the University of Basel in spring 2012, the TEI encoding to a course in spring 2016. The presentation layer, the RDF transformation and the search were built in 2016 and 2017 at the Zentrum für Informationsmodellierung of the University of Graz, today the Institut für Digitale Geisteswissenschaften, and revised in 2026. The project description in `gams/datastreams/context-ufbas.ABOUT.xml`, the `ABOUT` of `context:ufbas`, names everyone involved.

The derived datasets are produced by the harness in `local-test-build/`, `make-exploration-data.mjs` writing `local-test-build/build/ufbas-exploration.json` and `make-facsimile-data.mjs` writing `data/ufbas-facsimile.json` of gams-www, and its tests check them against the TEI. The knowledge base documents the data model, the known data findings and the decisions of the revision ([data.md](knowledge/data.md), [domain.md](knowledge/domain.md)). A new release of this package copies the current datastreams from GAMS and the current derived datasets from these two places into `tei/`, `rdf/` and `derived/`.

The repository [Overhaul-UFBAS](https://github.com/chpollin/Overhaul-UFBAS) holds an experiment of 2023 on revising the edition with an LLM. Its TEI and RDF are transformed copies and differ from the published data here.

## Development

### Two repositories

Since 2026-10-27 the project follows the ZimLab template for `gams-www` and is split in two repositories, which are checked out side by side.

| Repository | Holds |
|---|---|
| gams-www, https://zimlab.uni-graz.at/gams/projects/ufbas/gams-www | Only what GAMS serves from `/ufbas/`, the page stylesheets `ufbas-*.xsl`, `css/`, `js/`, `img/`, `data/ufbas-facsimile.json` and `data/ontology/`. Its root is the served folder |
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

`tei/ufbas.1563.xml` and `tei/ufbas.kategorien.xml` are the ingest source of `o:ufbas.1563` and `o:ufbas.kategorien`. `data/ontology/ufbas.ontology.rdf` of gams-www is the planned `ONTOLOGY` datastream of `o:ufbas.ontology`, which is not yet ingested.

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

The data is licensed under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) ([LICENSE](LICENSE)), the licence of the edition. This covers `tei/`, `rdf/`, `derived/ufbas-exploration.json`, the mirrored `ABOUT`, `IMPRINT`, `RELS-EXT` and `ONTOLOGY` datastreams in `gams/datastreams/`, the tables of `research-artefacts/`, the TEI files of `source-material/`, the SKOS/RDF taxonomy `source-material/kategorien.skos.xml` and the test fixtures derived from the TEI, `local-test-build/test/fixtures/eintrag-0.ttl` and `local-test-build/test/fixtures/eintrag-0.skos.ttl`.

The code is licensed under the MIT License ([LICENSE-CODE](LICENSE-CODE)), as decided for the code of the edition on 2026-09-24. This covers `local-test-build/` apart from the fixtures named above, `scripts/`, the scripts in `research-artefacts/scripts/`, `gams/ufbas-TORDF-ontology.xsl`, the queries in `gams/query/` and the mirrored member query `gams/datastreams/context-ufbas.QUERY.sparql`. The packages that `npm install` fetches keep their own licences.

`gams/ufbas-TOTEI.xsl` and `gams/ufbas-TORDF.xsl` are copies of the production transformations of `cirilo:TEI.ufbas` and `cirilo:ufbas`, which carry no statement of authorship or licence. No licence is asserted for them.

The documentation and knowledge text, meaning `knowledge/`, `snapshots/`, `workshop/`, `README.md`, `AGENTS.md`, `CLAUDE.md` and `GAMS.md`, is licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

The page images that `derived/ufbas-facsimile.json` points to are not part of this package. They belong to the Staatsarchiv Basel-Stadt, which marks them as free of rights ([Rechtsgrundlagen](https://dls.staatsarchiv.bs.ch/de/orientierung/rechtsgrundlagen-und-datenschutz/#StABS-gemeinfrei)). `derived/ufbas-facsimile.json` is derived from the IIIF manifest the Staatsarchiv publishes for the volume and follows its terms, and `source-material/dls-manifest-245856.json` is a copy of that manifest. The terms of the files that gams-www serves, among them the ontology under CC BY 4.0 and OpenSeadragon, stand in its README. The web fonts come from GAMS.

## Citation

Urfehdenbuch X der Stadt Basel (1563–1569), in: Die Urfehdebücher der Stadt Basel – digitale Edition, hg. v. Susanna Burghartz, Sonia Calvi und Georg Vogeler, Basel/Graz 2016 (zuletzt verändert am 31.1.2017), [hdl:11471/1010.2.1](https://hdl.handle.net/11471/1010.2.1).

Machine-readable citation metadata is in [CITATION.cff](CITATION.cff).
