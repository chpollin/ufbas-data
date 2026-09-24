# Urfehdebücher der Stadt Basel – data

The data of the digital edition *Die Urfehdebücher der Stadt Basel – digitale Edition*, Urfehdebuch X (Staatsarchiv Basel-Stadt, Ratsbücher O 10, 1563–1569), as one package. The edition is published in GAMS, the repository of the University of Graz, at https://gams.uni-graz.at/ufbas (handle [hdl:11471/1010.2](https://hdl.handle.net/11471/1010.2)).

GAMS stays the source of truth. The files in `tei/` and `rdf/` are the published datastreams, retrieved from GAMS on 2026-09-24 and stored byte for byte. The files in `derived/` are derived from them and add structure without changing a published value.

## Files

| File | Content | Source |
|---|---|---|
| `tei/ufbas.1563.xml` | The edition, the whole book as one TEI document with the annotated entries | [`o:ufbas.1563` TEI_SOURCE](https://gams.uni-graz.at/archive/objects/o:ufbas.1563/datastreams/TEI_SOURCE/content) |
| `tei/ufbas.kategorien.xml` | The category taxonomy (persons and roles, offences, sanctions, places, keywords) as TEI | [`o:ufbas.kategorien` TEI_SOURCE](https://gams.uni-graz.at/archive/objects/o:ufbas.kategorien/datastreams/TEI_SOURCE/content) |
| `tei/ufbas.about.xml` | The project description with the transcription guidelines and the data model | [`context:ufbas` ABOUT](https://gams.uni-graz.at/archive/objects/context:ufbas/datastreams/ABOUT/content) |
| `rdf/ufbas.1563.rdf` | The RDF of the edition, derived at ingest from the TEI, which the search of the edition queries | [`o:ufbas.1563` RDF](https://gams.uni-graz.at/archive/objects/o:ufbas.1563/datastreams/RDF/content) |
| `rdf/ufbas.kategorien.rdf` | The RDF of the taxonomy | [`o:ufbas.kategorien` RDF](https://gams.uni-graz.at/archive/objects/o:ufbas.kategorien/datastreams/RDF/content) |
| `rdf/ufbas.schema.owl` | The OWL and RDFS declaration of the `uf:` vocabulary from 2017 | [`o:ufbas.schema` ONTOLOGY](https://gams.uni-graz.at/archive/objects/o:ufbas.schema/datastreams/ONTOLOGY/content) |
| `derived/ufbas-exploration.json` | One record per entry with date, folio, parts of the entry and its categories, for the Exploration view | derived from the TEI |
| `derived/ufbas-facsimile.json` | The IIIF image service, width and height of every page image, keyed by the image number that `pb/@facs` of the TEI names | derived from the IIIF manifest of the Digitaler Lesesaal |

The line endings of the published datastreams are kept as GAMS serves them, so `.gitattributes` excludes every file from line ending conversion.

## Provenance

The transcription goes back to a course at the Department of History of the University of Basel in spring 2012, the TEI encoding to a course in spring 2016. The presentation layer, the RDF transformation and the search were built in 2016 and 2017 at the Zentrum für Informationsmodellierung of the University of Graz, today the Institut für Digitale Geisteswissenschaften, and revised in 2026. The project description in `tei/ufbas.about.xml` names everyone involved.

The derived datasets are produced by the scripts of the presentation layer repository, https://zimlab.uni-graz.at/gams/projects/ufbas/gams-www (`local-test-build/make-exploration-data.mjs` and `local-test-build/make-facsimile-data.mjs`), whose tests check them against the TEI. Its knowledge base documents the data model, the known data findings and the decisions of the revision (`knowledge/data.md`, `knowledge/domain.md`). A new release of this package copies the current datastreams from GAMS and the current derived datasets from that repository.

The repository [Overhaul-UFBAS](https://github.com/chpollin/Overhaul-UFBAS) holds an experiment of 2023 on revising the edition with an LLM. Its TEI and RDF are transformed copies and differ from the published data here.

## Licence

The data is licensed under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) ([LICENSE](LICENSE)), the licence of the edition. The page images that `derived/ufbas-facsimile.json` points to are not part of this package. They belong to the Staatsarchiv Basel-Stadt, which marks them as free of rights ([Rechtsgrundlagen](https://dls.staatsarchiv.bs.ch/de/orientierung/rechtsgrundlagen-und-datenschutz/#StABS-gemeinfrei)).

## Citation

Urfehdenbuch X der Stadt Basel (1563–1569), in: Die Urfehdebücher der Stadt Basel – digitale Edition, hg. v. Susanna Burghartz, Sonia Calvi und Georg Vogeler, Basel/Graz 2016 (zuletzt verändert am 31.1.2017), [hdl:11471/1010.2.1](https://hdl.handle.net/11471/1010.2.1).

Machine-readable citation metadata is in [CITATION.cff](CITATION.cff).
