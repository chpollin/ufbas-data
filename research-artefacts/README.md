# Research artefacts

Curated tables from the research of 2026-09-24 on Urfehdebuch X, derived from the TEI of `o:ufbas.1563` of that day, then at `gams-datastreams/o-ufbas.1563.TEI_SOURCE.xml` and now at `tei/ufbas.1563.xml`. Subagents ran the Python scripts under `scripts/`, and no script writes a table directly. The scripts print their findings or write intermediate JSON, and each table was assembled from that output with review, the main agent re-checking samples against the TEI. The tables carry no editorial authority. The measurements are in [research-report-2026-09-24.md](../snapshots/research-report-2026-09-24.md). Licence of the tables CC BY-NC-SA 4.0, as the data they derive from.

| File | Content | Method | Scripts |
|---|---|---|---|
| `entry-types.tsv` | The entries that are no regular Urfehde, with their type | Five rules on editorial notes, wording and the inserted leaf 32a, checked against the counts and descriptions of the About page | `typology/typology.py` on the feature table of `typology/features.py` |
| `editorial-crossrefs.tsv` | Every citation of another entry in the editors' notes, with cited heading, cited folio, resolved target and resolution method | Heading similarity on the cited folio, counted over the page breaks, then on the adjacent page, then heading alone. A sample of 36 links was read in both entries. | `person-links/resolve.py`, which writes `refs.json`. The sample comes from `person-links/sample_xref.py` with the judgements of `person-links/judgements.py`. |
| `margin-note-normalisation.csv` | Variants of guard and place names in the marginal notes with the normalised form, counts, first and last date and note ids | Clustering by spelling, the guard table of the About page, Schmid 2016 and co-occurrence. Clusters marked in [domain.md](../knowledge/domain.md#open-questions) need an expert decision. | `margin-notes/extract.py`, which writes `rows.json`, and `margin-notes/analyse.py`, which writes `items.json` and prints the variants per normalised form |
| `fine-concordance-srbas.tsv` | Fines of the Urfehden paired with bookings in the Rotstrafen account of the Jahrrechnungen der Stadt Basel | Surname match within the same fiscal year, then manual review of name, amount and date. The assessment column says match or name only. | `fine-concordance/match3.py`, which prints the candidate pairs, read with `fine-concordance/entry.py` |
| `category-labels-en.tsv` | One row per category of `tei/ufbas.kategorien.xml` with id, group, German term, a draft English label and a note on doubts | Id and term taken from the TEI, the group as the top-level category the category is nested in. The labels were drafted on 2026-10-26 by an LLM (Large Language Model) agent (Claude Opus 5.5) without curation, after the glosses of the taxonomy, the labels of `data/ontology/ufbas.ontology.ttl` and the institutions of [domain.md](../knowledge/domain.md#institutions). The operator curated them on 2026-10-28 and kept source concepts without an English equivalent in German. `gams/ufbas-TORDF-ontology.xsl` writes them as English `skos:prefLabel`, and `test/skos.test.mjs` keeps both equal. | None, written from the TEI with the drafted labels |

## Use of the tables

The tables `entry-types.tsv` and `editorial-crossrefs.tsv` are oracles of the tests. `ufbas-TORDF-ontology.xsl` derives the entry types and the editors' cross-references from the TEI by its own rules, and `local-test-build/test/rdf-ontology.test.mjs` checks that the derived RDF gives every entry the type of `entry-types.tsv` and resolves exactly the citations of `editorial-crossrefs.tsv`. `local-test-build/test/exploration-data.test.mjs` reads both tables for the two fragments. A change of either table therefore changes what the tests expect.

`margin-note-normalisation.csv` is the normalisation of names and places that [domain.md](../knowledge/domain.md#marginal-notes) points to, and the planned input of the guard and release view of Epic 3 ([specification.md](../knowledge/specification.md#epic-3-procedure-and-custody-g4-g5), [plan.md](../knowledge/plan.md#exploration)). No derivation reads it yet.

`fine-concordance-srbas.tsv` is the evidence for the fines in the sister edition cited in [domain.md](../knowledge/domain.md#related-editions). No test or derivation reads it.

`category-labels-en.tsv` holds the English labels the operator curated on 2026-10-28. `ufbas-TORDF-ontology.xsl` writes them as English `skos:prefLabel`, and `test/skos.test.mjs` keeps both equal.

## Scripts

`scripts/` keeps the Python scripts of the research for provenance. Their logic is as it ran on 2026-09-24, and they are not maintained and not part of `npm test`. The research report says the scripts stayed in a session scratchpad that was not kept. The scripts were in fact copied here on the same day, in gams-www commit `9939099`, and the snapshot stays as dated.

On 2026-10-26 their paths were made relative. Each script finds the repository root from its own location, reads the TEI from `tei/`, and writes its intermediate JSON into the working directory or, for `margin-notes/`, into a folder given as first argument. The exploration JSON that `data-profile/profile.py` and `data-profile/gender_tat.py` read was `data/ufbas-exploration.json` on 2026-09-24. It is now written by `local-test-build/make-exploration-data.mjs` to `local-test-build/build/ufbas-exploration.json` and may differ from that day's file. The SRBAS TEI of DEPCHA lies outside the repository, and its path is the constant `SRBAS_TEI` at the top of each script that reads it. The scripts of `rdf-analysis/` and `facsimile/` take their folders and files as arguments, except `facsimile/zipget.py`, which reads `tail.bin` from the working directory. The scripts in `person-links/` and `typology/` import a sibling module (`common.py`, `features.py`), so the Python interpreter must have the script's folder on its path. Some use `lxml`, `rdflib` and `rapidfuzz`.

| Folder | Produced | Status |
|---|---|---|
| `data-profile/` | The measurements of the data profile, the date and weekday checks and the durations in [research-report-2026-09-24.md](../snapshots/research-report-2026-09-24.md) | Exploratory, no table |
| `typology/` | `entry-types.tsv` from `typology.py` and `features.py` | `cooc.py`, `course.py`, `multi.py`, `probe.py` and `strafe.py` are exploratory |
| `person-links/` | `editorial-crossrefs.tsv` from `resolve.py`, the folio fit of the cross-references (`fit_folio.py`) and the samples of the person links (`links.py`, `namematch.py`, `sample_xref.py`, `sample_names.py`, `judgements.py`) | `dump_notes.py` and `extras.py` are exploratory |
| `margin-notes/` | `margin-note-normalisation.csv` from `extract.py` and `analyse.py`, and the check of the numbered claims (`numcheck.py`) | `textroles.py` is exploratory |
| `fine-concordance/` | `fine-concordance-srbas.tsv` from `match3.py`, against the SRBAS TEI of DEPCHA | `match.py` and `match2.py` are superseded by `match3.py`. `entry.py`, `kw.py`, `measures.py` and `srbas.py` are exploratory. |
| `rdf-analysis/` | The analysis of the published RDF (`analyse.py`, `entry.py`, `stats2.py`) and a first derivation of the target ontology for one entry | `derive_ufo.py` and the scripts reading its output (`entry_ufo.py`, `g.py`, `queries.py`) are superseded by `ufbas-TORDF-ontology.xsl` |
| `facsimile/` | The reading of the Zenodo zip by range requests and of the archived Lesesaal page | Exploratory, no table |

The comparison of the local `TORDF` output with the published RDF became `local-test-build/test/rdf.test.mjs`.
