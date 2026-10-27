---
title: Data
project:
  name: Urfehdebücher der Stadt Basel
  repository: https://github.com/chpollin/ufbas-data
method:
  name: Promptotyping
  url: https://dhcraft.org/Promptotyping/
template:
  name: Vorlage Datengrundlage
  version: 0.3
  url: https://dhcraft.org/Promptotyping/promptotyping-document/data
status: draft
created: 2026-09-23
updated: 2026-10-27
authors: [Christopher Pollin]
generated-with: Claude Code (Claude Opus 5.5)
topics: ["[[TEI XML]]", "[[RDF]]", "[[SKOS]]"]
related: [domain.md, architecture.md, specification.md, ../snapshots/exploration-rdf-2017-2026-09-29.md]
knowledge-sources:
  standards:
    TEI P5: https://tei-c.org/guidelines/p5/
    Web Annotation Vocabulary: https://www.w3.org/ns/oa
    SKOS: https://www.w3.org/2004/02/skos/core
---

# Data

The whole book is one TEI document, the `TEI_SOURCE` of `o:ufbas.1563`, kept as `tei/ufbas.1563.xml`, with the category taxonomy as a second TEI document, `o:ufbas.kategorien` in `tei/ufbas.kategorien.xml`. Both files are identical to the published datastreams and are the ingest source of their objects, which carry their PID in `idno[@type='PID']`. The ingest transformation `gams/ufbas-TORDF.xsl` turned every annotated span into the RDF published in 2017. `gams/ufbas-TORDF-ontology.xsl` derives the refactored RDF of the domain ontology from the same TEI, which the search queries and the Exploration view read once the operator's re-ingest has published it. What the entries, categories and marginal notes mean is in [domain.md](domain.md).

## Sources

- Edition TEI. The transcription comes from a Basel course in 2012, the encoding from a course in 2016 whose TEI part files are kept in `source-material/course-2016/`. The edition combined them into one document and inherited their slips (see [Data quality](#data-quality)). Content licence CC BY-NC-SA 4.0.
- Taxonomy. `o:ufbas.kategorien` is canonical. `source-material/kategorien.xml` and `kategorien.skos.xml` are older SVN states. Compared by category id with `tei/ufbas.kategorien.xml`, `kategorien.xml` lacks `uf_SchlagwortAndrohungTodesstrafe`, `uf_SchlagwortMeerwunder` and `uf_TatWiedertaeuferei`, and `kategorien.skos.xml` lacks `uf_TatWiedertaeuferei` and has two group concepts of its own, `Personeneigenschaften` and `Verfahrensseigenschaften`.
- RDF. The `RDF` datastream of `o:ufbas.1563`, produced at ingest by `ufbas-TORDF.xsl` in 2017. With the update the `TORDF` of `cirilo:ufbas` becomes `ufbas-TORDF-ontology.xsl`, and the re-ingest replaces the datastreams of both TEI objects with the refactored RDF ([architecture.md](architecture.md#ingest)).
- Schema. The `ONTOLOGY` datastream of `o:ufbas.schema`, an OWL and RDFS declaration of the `uf:` vocabulary from 2017, which the transformation does not reference.

This repository, ufbas-data, packages these datastreams byte for byte as GAMS served them on 2026-09-24 in `tei/` and `rdf/`, together with the derived exploration and facsimile datasets in `derived/`, under CC BY-NC-SA 4.0 ([README.md](../README.md#files)). A new release copies the current datastreams and datasets there. The analysis of the TEI retrieved again on 2026-10-27 is [tei-analysis.md](tei-analysis.md). The older repository https://github.com/chpollin/Overhaul-UFBAS holds an LLM experiment of 2023 with transformed copies and an earlier ontology draft.

## Edition TEI

The text is transcribed diplomatically with `lb`, `ex`, marginal notes (`note[@rend='margin']`), additions, deletions and hand shifts. Each entry is `div[@ana='#uf_Eintrag']` with `xml:id="Eintrag-N"`. Inside it `@ana` on `persName`, `placeName`, `roleName`, `forename`, `seg`, `term`, `date`, `note` and `p` points to categories, and each annotated element carries an `xml:id` of the form `<Category>-N`. Dates carry `@when` and `@calendar="Julian"`, durations `@dur`, amounts are `measure` with `@quantity`, `@unit` and `@type="currency"`, and `placeName/@ref` points into the place list `back/listPlace`, whose entries carry a modern name only.

Page breaks carry `pb/@facs` with a URL of the former image viewer, `http://dokumente.stabs.ch/view/2010/Ratsbuecher_O_10/#N`. The image number `N` is no folio number, since the images include two unfoliated pages (`@n="kA"`), the inserted leaf 32a (`@n="32ar"`, `"32av"`) and a gap of two images after fol. 99v. The edition page counts the page breaks without `@n` from the first one, fol. 1r, and shows `@n` where it exists. This count agrees with every folio the editors cite in their cross-reference notes and with fol. 69r and fol. 3r of the About page. Until 2026-09-24 the page showed `N - 18`, which was wrong on every page.

The former viewer no longer answers. The Digitaler Lesesaal of the Staatsarchiv holds the volume as record 315538 and answers every non-interactive request with a proof-of-work block. Its IIIF manifest, saved once from a browser on 2026-09-24, is kept as `source-material/dls-manifest-245856.json`. It has 315 canvases, and canvas `N` shows the image `Ratsbuecher_O_10_NNNN` for every `N`, which continues the former image numbers (checked at images 19 and 30 against the TEI, the first text page and a blank page). The images are served outside the block from a public object store as IIIF Image API 2 level 0, with the full image, 2048px tiles and a 100px thumbnail per page, under paths with random hash prefixes that only the manifest gives, and with the content type `application/binary`. The rights statement is StABS gemeinfrei. The permalinks of the Lesesaal address the volume only. `data/ufbas-facsimile.json` carries the image service per image number, derived from the manifest ([testing.md](testing.md#facsimile-dataset)). An older copy of the images without images 23 to 50 is the HTR ground truth set on Zenodo (doi:10.5281/zenodo.5153263).

The TEI does not encode the type of an entry. Five rules reproduce the special types the About page counts (Urfehdbrief, Aussage, Entwurf, abgebrochen, and two fragments that continue another entry), listed in `research-artefacts/entry-types.tsv`, which `ufbas-TORDF-ontology.xsl` reproduces as `ufbas-ont:entryType`. The About page counts 597 regular Urfehden where the TEI holds 604, and no criterion reproducing 597 was found.

## Category taxonomy

`teiHeader/encodingDesc/classDecl/taxonomy[@xml:id='Urfehdekodierung']` holds nested `category` elements with `catDesc/term` and `catDesc/gloss`. The groups Person, Ort, Tat, Strafe, Datum and Schlagwort have subcategories, and flat categories cover person attributes, procedure and the parts of a record. The group nodes themselves are never used as annotations. Several glosses carry coding rules, for example Ungehorsam against a concrete order versus Widerstand gegen Obrigkeit in general.

## RDF

The RDF published in 2017 uses `uf: http://gams.uni-graz.at/ufbas/#`, `g2o: http://gams.uni-graz.at/ontology/#`, `oa:`, `skos:` and `tei:`.

- Every annotated element becomes a span resource `o:ufbas.1563#<xml:id>` with `g2o:inhalt` (text), `g2o:appears-on` (page, a generated identifier) and `g2o:isPartOf`.
- Every annotation becomes a resource typed `uf:<Category>` with the URI `#<Category>-<xml:id>` and `oa:hasTarget` to its span. Nested annotations are linked with `uf:has<Category>` from the nearest annotated ancestor, and every entry is `uf:Eintrag` with one such link per annotation.
- Persons carry `uf:forename`, `uf:surname` and `uf:gender`, dates `tei:when` as plain literals. Normalised places are `uf:Ort` nodes with `skos:prefLabel`, shared by all their occurrences.

The model conflates annotation and entity, encodes the category a second time in the property name, creates a second `uf:Person` node for every person, and drops durations, amounts, the Julian calendar, folio and facsimile, hand shifts and additions. The editorial notes survive only as part of the entry text. Its SKOS carries the misspelled `skos:defintion` and no concept scheme, and `source-material/kategorien.skos.xml` uses the nonexistent `skos:Schema`. `g2o:` is an undocumented predecessor of the GAMS ontology `o:gams-ontology` (namespace `http://gams.uni-graz.at/o:gams-ontology#`, version 0.2 of 2021-07-06), whose `textualContent` and `isPartOf` take the place of `g2o:inhalt` and `g2o:isPartOf`. For `g2o:appears-on` it has no term.

The refactored RDF of `ufbas-TORDF-ontology.xsl` replaces this model with the domain ontology of [domain.md](domain.md#domain-ontology). Its data use only terms of `data/ontology/ufbas.ontology.ttl` of gams-www and the GAMS ontology, its concept scheme spells `skos:definition` correctly and has a `skos:ConceptScheme`, and `test/rdf-ontology.test.mjs` and `test/skos.test.mjs` hold it to the TEI ([testing.md](testing.md#guarantees)).

## RDF as source of the Exploration view

The Exploration view reads the refactored RDF through `query:ufbas.exploration` (ADR-21), whose text is `gams/query/ufbas.exploration.sparql`. It answers one row per entry with the entry IRI, the earliest coded Urfehde date, the category ids of every span of the entries of its proceeding, the offenders as gender and name text, and the places of origin of the offenders in the place list. A fragment documents the proceeding of the entry it continues and has no row of its own, so its categories count for that entry (ADR-12). The query needs no chains, since every span carries its categories through `ufbas-ont:category` and belongs to its entry through `gams:isPartOf`.

`test/exploration-rdf.test.mjs` runs the query text with Oxigraph on the refactored RDF that `ufbas-TORDF-ontology.xsl` derives from `tei/`, and compares every value the view shows with the TEI reference below. It accepts no difference, so a change of the query, of the derivation or of the TEI shows as a failure and is documented here before the view shows it.

From 2026-09-29 to 2026-10-21 the view read the RDF of 2017. Its nested links, its shared place nodes and its gender rule lost some keywords, one offender with the mixed gender composition of the entry, and victim and other person roles, and gave two offenders a gender from another person's forename. The query of that time and the losses are recorded in [exploration-rdf-2017-2026-09-29.md](../snapshots/exploration-rdf-2017-2026-09-29.md). The published RDF keeps them until the re-ingest.

The TEI reference is built by `local-test-build/exploration-data.xsl` (XSLT 2.0, JSON written as text), run by `local-test-build/make-exploration-data.mjs` on the two TEI documents. It holds `categories` (every category with a term, with `id`, `term`, `gloss` and the `group` of its top-level ancestor or `Weitere`) and `entries` (per entry `id`, Urfehde `date`, `folio`, `offenders` with `label` and `gender`, and `annotations` with `category` and `text`), with a fragment merged into the entry it continues. Labels follow `uf:label` of `ufbas-object.xsl` and leave out deleted text. The tests derive it in memory, and the script writes it to `local-test-build/build/` for the ufbas-data package.

Its gender rule differs from the derivation. `exploration-data.xsl` reads the tokens of the person and of its own forenames together, and `#uf_male` among them wins. `ufbas-TORDF-ontology.xsl` takes the token on the person where there is one and the tokens of its own forenames only otherwise. Both agree on the gender composition of every entry, which `test/rdf-ontology.test.mjs` and `test/exploration-rdf.test.mjs` compare, so the difference shows in no current value (inference from the passing tests). It would show for a person coded `#uf_female` with a forename coded `#uf_male`.

## Data quality

The refactoring changes no content, so every finding below stays as published. Derived layers mark them, and they stay documented here (ADR-16).

Dates whose `@when` contradicts the written date, checked with the Julian weekday of the written form:

- Urfehde dates where the written weekday fits the written date. `Eintrag-155` "Donstag den 24 May ditz 65 jors" coded 1565-04-25, `Eintrag-232` "Mittwoch den 24 Octobris ditz 65 jors" coded 1565-11-24, `Eintrag-257` "Sambstag den 5ten Jenners ditz 66 iors" coded 1566-01-01, `Eintrag-266` "Sambstag den 16 Hornungs ditz 66ten jars" coded 1566-02-14, `Eintrag-270` "Mittwochen den 20 tag Hornungs diss 66 jors" coded 1566-02-22, `Eintrag-476` "Mittwochen den 26 Meygens ditz 68 jars" coded 1568-04-26.
- `Eintrag-505` on fol. 91r among the entries of 1568 has one Urfehde date, "Sambstag den 7 Augustj ditz 68 jars" coded 1563-08-07. The same wording in `Eintrag-506` is coded 1568-08-07. An earlier reading of two dates in `Eintrag-505` was wrong.
- `Eintrag-513` "Donstag den nündten Septembris" coded 1568-09-15, where the Julian weekday confirms the written 1568-09-09.
- `Eintrag-535` "ersten tag Jenners ditz 68 jars" and `Eintrag-536` "Mentag den 17 Jenners ditz 68 jars" write the year 68 among the entries of January 1569 and are coded 1569. `Eintrag-622` writes "den 30ten Novembris" coded 1569-11-28.
- `Eintrag-102` and `Eintrag-490`, where written weekday and date disagree with each other, so the manuscript may be wrong.
- `Eintrag-103`, `Eintrag-111`, `Eintrag-143`, `Eintrag-318`, `Eintrag-328`, `Eintrag-438`, `Eintrag-453`, `Eintrag-563` and `Eintrag-584`, where the written weekday fits neither the written nor the coded date, for example `Eintrag-143` "Mittwochen den 15 May ditz 65 jars" coded 1565-05-15, a Tuesday in the Julian calendar.
- `DatumTat-36` "heyligen Wienacht tag" coded 1656-12-25 for 1565-12-25, digits transposed. `DatumFrist-19` "biss Sambstag nechstkünfftig" coded 1667-10-18 for 1567-10-18. `DatumTat-37` "uff den Nüwen Jors tag" coded 1566-01-10, after the Urfehde of 1566-01-04. `DatumTat-23` "Mentag nach dem Nüwen Jar" coded 1565-01-03 before an Urfehde of 1564-01-26.

`ufbas-TORDF-ontology.xsl` writes the contradictions it can decide by rule as `ufbas-ont:dateConflict` with a `ufbas-ont:dateSuggested` beside the coded value, and `test/rdf-ontology.test.mjs` holds the list to this section. Its weekday rule found `Eintrag-513` on 2026-10-21 and marks it so. The nine entries of the last item, found in the same session, carry no conflict in the derived data.

Markup:

- The Urfehde of a gatekeeper after `Eintrag-188` stands in a `div` without `ana` and `xml:id`, so every count by entry leaves it out. A `p` inside `Eintrag-132` carries `ana="#uf_Eintrag"` and `xml:id="Eintrag-133"`, although it is the text of `Eintrag-132`. Both slips are already in the 2016 course files.
- Twenty marginal notes are encoded without `#uf_Eingangsnotiz`, twelve of them with guard names, and the category of a guard is sometimes wrong (Köferlj as Stadtknecht, Rorer as Oberster Knecht).
- `placeName-564` carries `#Ormalingen` in `@ana`, one `@ref` reads `" #Liestal"`, and references to Modon, Dietisberg, Rapperwil, Intzlingen, Bülach, Laufen, Sursee, Oberderdingen, Appenzell, Stuttgart and Birmenstorf point to ids missing from the place list.
- The group node Person is used as a category four times (`Person-499`, `Person-1484`, `Person-1488`, `Person-1491`), the other group nodes never. `uf_Eintrag` and `uf_Eingangsnotiz` have no `catDesc`.
- Some annotated elements are empty, among them `Urfehdeeid-228`, `TatUnrechtmässigesEheversprechen-7` and several gender-coded forenames, so their spans carry no text.
- Some `measure` elements lack `@quantity` ("hundert gulden, oder ettlich mehr", "ettliche müntz", "5 lb") or `@unit` ("zwentzig toppell fierer"), one reads `type="curreny"` and one has no type. One date reads `calendar="#Julian"`.
- Some annotated elements stand outside any entry, the Urfehde after `Eintrag-188` and some subscriptions, so every derivation by entry leaves them out. Some marginal notes write the count as plain text ("-1") or as "c".
- `Eintrag-439` breaks off, so its proceeding has no part.
- For `Eintrag-176` and `Eintrag-376` the reading of the RDF of 2017 ([exploration-rdf-2017-2026-09-29.md](../snapshots/exploration-rdf-2017-2026-09-29.md)) that a forename of another person gives the offender a gender is doubtful. In 176 "Peterhans" is coded as surname with `#uf_male` and "Helg" as forename, which looks like a swap, and in 376 the inner `persName` "Hans Anthonj" appears to be the offender's own forenames (open question).
- Currency units. `kr` stands for Kronen, a reading as Kreuzer would be wrong. `d-st` holds pounds in Stebler money, `d` is also used for Dickpfennig, and `lbd` also for gulden ([domain.md](domain.md#money)).
- "Michell" Nollinger in `Eintrag-274` is tagged `#uf_female`. Some offenders carry no gender.
- The edition TEI holds em spaces (U+2003). SaxonJS matches them with `\s` in a regular expression and Saxon for Java does not, so a derivation that relies on `\s` gives different texts in the two processors (finding of `local-test-build/saxon-check.mjs` on 2026-10-21). `ufbas-TORDF-ontology.xsl` therefore names the whitespace characters of XML where it would use `\s`.
- `@rend` of marginal notes also reads `nargin` and `marigin`, and the editorial notes write uncertain readings in three spellings ("Lesung unsicher", "unsichere Lesung", "Unsichere Lesung"), which stay as published.
- Several Strafe categories are applied inconsistently, above all Urteil ohne Strafe, Wiedergutmachung and Entschädigung ([domain.md](domain.md#sanctions)).

Structure:

- Offence and sanction are annotated per entry, so in entries with several offenders a sanction cannot be assigned to a person.
- Persons carry no identifiers. Other proceedings of a person are named only in editorial notes.
- Places carry no coordinates or authority identifiers, and many offence places are not normalised.
- Occupation, status and the names in the marginal notes are not normalised.
