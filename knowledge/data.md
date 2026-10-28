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
updated: 2026-10-28
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

The whole book is one TEI document, the `TEI_SOURCE` of `o:ufbas.1563`, kept as `tei/ufbas.1563.xml`, with the category taxonomy as a second TEI document, `o:ufbas.kategorien` in `tei/ufbas.kategorien.xml`. Both are the ingest source of their objects and carry their PID in `idno[@type='PID']`. `gams/ufbas-TORDF.xsl` turned every annotated span into the RDF published in 2017, and `gams/ufbas-TORDF-ontology.xsl` derives the refactored RDF of the domain ontology from the same TEI, which search and Exploration read once the operator's re-ingest has published it. What entries, categories and marginal notes mean is in [domain.md](domain.md).

## Sources

- The edition TEI goes back to a Basel course of 2012 (transcription) and one of 2016 (encoding), whose TEI part files are kept in `source-material/course-2016/`. The edition combined them into one document and inherited their slips ([Data quality](#data-quality)). Content licence CC BY-NC-SA 4.0.
- `o:ufbas.kategorien` is the canonical taxonomy. `source-material/kategorien.xml` and `kategorien.skos.xml` are older SVN states. Compared by category id, `kategorien.xml` lacks `uf_SchlagwortAndrohungTodesstrafe`, `uf_SchlagwortMeerwunder` and `uf_TatWiedertaeuferei`, and `kategorien.skos.xml` lacks `uf_TatWiedertaeuferei` and has two group concepts of its own, `Personeneigenschaften` and `Verfahrensseigenschaften`.
- The `RDF` datastream of `o:ufbas.1563` was produced at ingest by `ufbas-TORDF.xsl` in 2017. With the update `ufbas-TORDF-ontology.xsl` becomes the `TORDF` of `cirilo:ufbas`, and the re-ingest replaces the RDF of both TEI objects ([architecture.md](architecture.md#ingest)).
- The `ONTOLOGY` datastream of `o:ufbas.schema` is an OWL and RDFS declaration of the `uf:` vocabulary from 2017, which no transformation references.

ufbas-data packages these datastreams byte for byte as GAMS served them on 2026-09-24 in `tei/` and `rdf/`, with the derived exploration dataset in `derived/` ([README.md](../README.md#files)). A new release copies the current datastreams there. Since ADR-34 `tei/ufbas.1563.xml` carries the page images and differs from the published datastream by that change alone until the re-ingest. The repository https://github.com/chpollin/Overhaul-UFBAS holds an LLM experiment of 2023 with transformed copies and an earlier ontology draft.

## Edition TEI

The root is `TEI` in the TEI namespace, with a header for title, publication, manuscript and encoding, `text/body` with entries, year headings, page breaks and marginal material, and `text/back/listPlace`, whose places carry a modern name and editorial notes only. The manuscript description gives the period 1563-01-03 to 1569-12-04. The text is transcribed diplomatically with `lb` (also `lb[@break="no"]`), `ex`, marginal notes (`note[@rend='margin']`), additions, deletions and hand shifts.

Each entry is `div[@ana='#uf_Eintrag']` with `xml:id="Eintrag-N"`, a heading naming the accused, narrative paragraphs and often a notarial subscription. Inside it `@ana` on `persName`, `placeName`, `roleName`, `forename`, `seg`, `term`, `date`, `note` and `p` points to categories, and each annotated element carries an `xml:id` of the form `<Category>-N`. All `xml:id` values are unique. `@ana` is a whitespace-separated token set (`Eintrag-2` has a term marked `#uf_SchlagwortFrauenarbeit #uf_SchlagwortSpinnen`), so exact-string matching misses categories. The `#uf_…` tokens are defined in the taxonomy TEI, whose contents the inventory of 2026-10-27 did not validate, so a token without a definition in the edition alone is no broken reference. Dates carry `@when` and `@calendar="Julian"`, as the oath date of `Eintrag-2` with `when="1563-01-19"`, so a record can retain both the encoded date and its source wording, while calendar conversion requires an explicit rule. Durations carry `@dur`, amounts are `measure` with `@quantity`, `@unit` and `@type="currency"`, and `placeName/@ref` points into `listPlace`. Origin, residence and offence place are distinct place roles (`#uf_OrtHerkunft`, `#uf_OrtWohnort` in `Eintrag-2`). A `persName/@xml:id` anchors one mention and gives no identity across entries. Person mentions nest, as the spouse inside the description of the accused in `Eintrag-3`, so descendant text and gender tokens cannot be attributed wholesale to the outer person.

Page breaks carried `pb/@facs` with a URL of the former image viewer, `http://dokumente.stabs.ch/view/2010/Ratsbuecher_O_10/#N`, and since ADR-34 point to the surface of that image in the `facsimile`, `#imgNNNN` with the four-digit image number. A page break may precede an entry as a sibling in the body, so the first page of an entry comes from document order. The image number `N` is no folio, since the images include two unfoliated pages (`@n="kA"`), the inserted leaf 32a (`@n="32ar"`, `"32av"`) and a gap of two images after fol. 99v. The edition page counts the page breaks without `@n` from fol. 1r and shows `@n` where it exists (ADR-09). This count agrees with every folio the editors cite in their cross-reference notes and with fol. 69r and fol. 3r of the About page. The label `N - 18` shown until 2026-09-24 was wrong on every page.

The former viewer no longer answers. The Digitaler Lesesaal of the Staatsarchiv holds the volume as record 315538 and answers every non-interactive request with a proof-of-work block. Its IIIF manifest, saved from a browser on 2026-09-24, is `source-material/dls-manifest-245856.json`. Canvas `N` shows the image `Ratsbuecher_O_10_NNNN` for every `N`, continuing the former image numbers (checked at images 19 and 30, the first text page and a blank page). The images are served outside the block from a public object store as IIIF Image API 2 level 0, under hash-prefixed paths only the manifest gives and with the content type `application/binary`. The rights statement is StABS gemeinfrei. The Lesesaal permalinks address the volume only, so no persistent URL per page exists.

Since ADR-34 `facsimile/@source` names the manifest, and one `surface` per image a page break names, in page-break order, carries `xml:id="imgNNNN"`, the image number in `@n`, the canvas size in `@lrx` and `@lry` and the canvas id in `@corresp`. Its `graphic/@url` is the IIIF image service without `/info.json`, with `@width` and `@height` and without `xml:id` and `mimeType`, so Cirilo references the image and uploads nothing ([architecture.md](architecture.md#ingest)). `msDesc/additional/surrogates` states the source, the retrieval day and the rights. `@corresp` links the canvas because the TEI Guidelines reserve `@sameAs` for an element identical to the current one. The canvas id survives a storage move of the archive, and `make-facsimile-tei.mjs` finds each surface again by it ([testing.md](testing.md#how-to-run)). An older copy of the images without images 23 to 50 is the HTR ground truth set on Zenodo (doi:10.5281/zenodo.5153263).

The TEI does not encode the type of an entry. Five rules reproduce the special types the About page counts (Urfehdbrief, Aussage, Entwurf, abgebrochen, and two fragments that continue another entry), listed in `research-artefacts/entry-types.tsv` and derived as `ufbas-ont:entryType`. The About page counts 597 regular Urfehden where the TEI holds 604, and no criterion reproducing 597 was found.

## Category taxonomy

`teiHeader/encodingDesc/classDecl/taxonomy[@xml:id='Urfehdekodierung']` holds nested `category` elements with `catDesc/term` and `catDesc/gloss`. The groups Person, Ort, Tat, Strafe, Datum and Schlagwort have subcategories, flat categories cover person attributes, procedure and the parts of a record, and the group nodes are never used as annotations. Several glosses carry coding rules, for example Ungehorsam against a concrete order versus Widerstand gegen Obrigkeit in general.

## RDF

The RDF published in 2017 uses `uf: http://gams.uni-graz.at/ufbas/#`, `g2o: http://gams.uni-graz.at/ontology/#`, `oa:`, `skos:` and `tei:`.

- Every annotated element becomes a span resource `o:ufbas.1563#<xml:id>` with `g2o:inhalt` (text), `g2o:appears-on` (page, a generated identifier) and `g2o:isPartOf`.
- Every annotation becomes a resource typed `uf:<Category>` with the URI `#<Category>-<xml:id>` and `oa:hasTarget` to its span. Nested annotations are linked with `uf:has<Category>` from the nearest annotated ancestor, and every entry is `uf:Eintrag` with one such link per annotation.
- Persons carry `uf:forename`, `uf:surname` and `uf:gender`, dates `tei:when` as plain literals. Normalised places are `uf:Ort` nodes with `skos:prefLabel`, shared by all their occurrences.

The model conflates annotation and entity, encodes the category a second time in the property name, creates a second `uf:Person` node for every person, and drops durations, amounts, the Julian calendar, folio and facsimile, hand shifts and additions. Editorial notes survive only inside the entry text. Its SKOS carries the misspelled `skos:defintion` and no concept scheme, and `source-material/kategorien.skos.xml` uses the nonexistent `skos:Schema`. `g2o:` is an undocumented predecessor of the GAMS ontology `o:gams-ontology` (namespace `http://gams.uni-graz.at/o:gams-ontology#`, version 0.2 of 2021-07-06), whose `textualContent` and `isPartOf` replace `g2o:inhalt` and `g2o:isPartOf`. It has no term for `g2o:appears-on`.

The refactored RDF of `ufbas-TORDF-ontology.xsl` replaces this model with the domain ontology of [domain.md](domain.md#domain-ontology). Its data use only terms of `ontology/ufbas.ontology.ttl` and the GAMS ontology, and its concept scheme has a `skos:ConceptScheme` and a correct `skos:definition` ([testing.md](testing.md#guarantees)).

## RDF as source of the Exploration view

The view reads the refactored RDF through `query:ufbas.exploration` (ADR-21), text in `gams/query/ufbas.exploration.sparql`. It answers one row per entry with the entry IRI, the earliest coded Urfehde date, the category ids of every span of the entries of its proceeding, the offenders as gender and name text, and the places of origin of the offenders in the place list. A fragment has no row of its own, and its categories count for the entry it continues (ADR-12). The query needs no chains, since every span carries its categories through `ufbas-ont:category` and belongs to its entry through `gams:isPartOf`. `test/exploration-rdf.test.mjs` compares every value the view shows with the TEI reference and accepts no difference, so a change of query, derivation or TEI fails and is documented here before the view shows it.

From 2026-09-29 to 2026-10-21 the view read the RDF of 2017. Its nested links, shared place nodes and gender rule lost some keywords, one offender with the mixed gender composition of the entry, and victim and other person roles, and gave two offenders a gender from another person's forename. The query of that time and the losses are recorded in [exploration-rdf-2017-2026-09-29.md](../snapshots/exploration-rdf-2017-2026-09-29.md), and `test/rdf-ontology.test.mjs` checks that none recurs. The published RDF keeps them until the re-ingest.

The TEI reference is built by `local-test-build/exploration-data.xsl`, run by `make-exploration-data.mjs` on the two TEI documents into `derived/ufbas-exploration.json`. It holds `categories` (id, term, gloss and the `group` of the top-level ancestor or `Weitere`) and `entries` (id, Urfehde date, folio, offenders with label and gender, annotations with category and text), with a fragment merged into the entry it continues. Labels follow `uf:label` of `ufbas-object.xsl` and leave out deleted text.

Its gender rule differs from the derivation. `exploration-data.xsl` reads the tokens of the person and its forenames together, and `#uf_male` among them wins. `ufbas-TORDF-ontology.xsl` takes the token on the person and the tokens of its forenames only where the person has none. Both agree on the gender composition of every entry, so the difference shows in no current value (inference from the passing tests). It would show for a person coded `#uf_female` with a forename coded `#uf_male`.

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

`ufbas-TORDF-ontology.xsl` writes the contradictions it can decide by rule as `ufbas-ont:dateConflict` with a `ufbas-ont:dateSuggested` beside the coded value, and `test/rdf-ontology.test.mjs` holds the list to this section. Its weekday rule found `Eintrag-513` on 2026-10-21. The nine entries of the sixth item, found in the same session, carry no conflict in the derived data. Oath dates also run backwards in document order, which shows that book order is not chronological without establishing an error in each reversal.

Markup:

- The Urfehde of a gatekeeper after `Eintrag-188` stands in a `div` without `ana` and `xml:id`, so every count by entry leaves it out. A `p` inside `Eintrag-132` carries `ana="#uf_Eintrag"` and `xml:id="Eintrag-133"`, although it narrates the proceeding of `Eintrag-132`, so the number of entry markers is not the number of proceedings. Both slips are already in the 2016 course files.
- Twenty marginal notes are encoded without `#uf_Eingangsnotiz`, twelve of them with guard names, and the category of a guard is sometimes wrong (Köferlj as Stadtknecht, Rorer as Oberster Knecht).
- `placeName-564` carries `#Ormalingen` in `@ana` for the reading "Normalingen", where place links use `@ref`, so its role needs interpretation. One `@ref` reads `" #Liestal"`, and references to Modon, Dietisberg, Rapperwil, Intzlingen, Bülach, Laufen, Sursee, Oberderdingen, Appenzell, Stuttgart and Birmenstorf point to ids missing from the place list.
- The group node Person is used as a category four times (`Person-499`, `Person-1484`, `Person-1488`, `Person-1491`), the other group nodes never. `uf_Eintrag` and `uf_Eingangsnotiz` have no `catDesc`.
- Some annotated elements are empty, among them `Urfehdeeid-228`, `TatUnrechtmässigesEheversprechen-7` and several gender-coded forenames, so their spans carry no text. Presence of an annotation and recoverable annotated text are separate observations.
- Some `measure` elements lack `@quantity` ("hundert gulden, oder ettlich mehr", "ettliche müntz", "5 lb") or `@unit` ("zwentzig toppell fierer"), one reads `type="curreny"`, and the one without a type, "zwen sester kernen", is a grain quantity, so no currency type is missing there. Calendar values are `Julian`, once `#Julian`, and absent on other dates, and absence stays distinguishable from an explicit Julian value.
- Currency amounts also occur in loans and in the narrative of an allegation, as in `Eintrag-0`, so a sum over every currency measure would conflate loans, disputed values and sanctions. Conversion across historical units remains outside the inventory, and its measure review candidates require the semantic distinction between currency and other quantities.
- Some annotated elements stand outside any entry, the Urfehde after `Eintrag-188` and some subscriptions, so every derivation by entry leaves them out, and an entry-only pipeline needs an explicit coverage report for them. Some marginal notes write the count as plain text ("-1") or as "c".
- `Eintrag-439` breaks off, so its proceeding has no part.
- For `Eintrag-176` and `Eintrag-376` the reading of the RDF of 2017 ([exploration-rdf-2017-2026-09-29.md](../snapshots/exploration-rdf-2017-2026-09-29.md)) that a forename of another person gives the offender a gender is doubtful. In 176 "Peterhans" is coded as surname with `#uf_male` and "Helg" as forename, which looks like a swap, and in 376 the inner `persName` "Hans Anthonj" appears to be the offender's own forenames (open question).
- Currency units. `kr` stands for Kronen, a reading as Kreuzer would be wrong. `d-st` holds pounds in Stebler money, `d` is also used for Dickpfennig, and `lbd` also for gulden ([domain.md](domain.md#money)).
- "Michell" Nollinger in `Eintrag-274` is tagged `#uf_female`. Some offenders carry no gender.
- The edition TEI holds em spaces (U+2003). SaxonJS matches them with `\s` and Saxon for Java does not, so a derivation relying on `\s` gives different texts in the two processors (finding of `local-test-build/saxon-check.mjs` on 2026-10-21). `ufbas-TORDF-ontology.xsl` therefore names the XML whitespace characters.
- `@rend` of marginal notes also reads `nargin` and `marigin`, and the editorial notes write uncertain readings in three spellings ("Lesung unsicher", "unsichere Lesung", "Unsichere Lesung").
- Several Strafe categories are applied inconsistently, above all Urteil ohne Strafe, Wiedergutmachung and Entschädigung ([domain.md](domain.md#sanctions)).

Structure:

- Offence and sanction are annotated per entry, so in entries with several offenders a sanction cannot be assigned to a person. `Eintrag-0` names the accused, an accomplice and a victim beside a fraud allegation, disobedience, detention, oath and admonition, which records their co-occurrence without assigning an offence to a person.
- Persons carry no identifiers. Other proceedings of a person are named only in editorial notes.
- Places carry no coordinates or authority identifiers, and many offence places are not normalised.
- Occupation, status and the names in the marginal notes are not normalised.

## Independent inventory of the published TEI

`TEI_SOURCE` of `o:ufbas.1563` was retrieved on 2026-10-27 without serialisation or line-ending conversion, SHA-256 `8b3aaac90296eae8f347df396ad1d0777ea47a8aa5aada536b8a207aafbee1af`. It was byte-identical to `tei/ufbas.1563.xml` until the page images of ADR-34 entered that file on 2026-10-28, and commit `7624833` keeps the published state. `scripts/analyze_tei.py` inventories it independently of this knowledge base, which only guided the choice of examples. Its assertions concern the downloaded edition, not the historical completeness or accuracy of its testimony. The findings it verified in the XML are folded into [Edition TEI](#edition-tei) and [Data quality](#data-quality). Reproduce it in a POSIX shell such as Git Bash, whose redirection keeps the bytes:

```sh
git show 7624833:tei/ufbas.1563.xml > generated/ufbas.1563.published.xml
uv run scripts/analyze_tei.py generated/ufbas.1563.published.xml --self-check --output generated/tei-analysis.json
```

The generated JSON, excluded from Git, is the source of truth for counts and anomaly lists, with source hash, line numbers, element ids, attributes and example XML. Its whitespace-collapsed snippets are diagnostic previews and no transcription export. Parsing is strict with external entities disabled, a deliberate override of the general recovery default at this validation boundary. No RELAX NG, ODD or Schematron validation has been run. `--self-check` exercises repeatability, unchanged source bytes, the documented anomalies and the rejection of malformed XML, a wrong namespace and DTD declarations against the frozen hash, and requires the published file. It implements no segmentation, text rendering, schema validation or test of historical accuracy.

The source supports exploration of annotated offence and sanction co-occurrence, coded oath dates, origin and residence, and the relation of diplomatic text to page images. Claims about crime prevalence, individual careers, causes or complete populations need further source criticism and identity work. A first derived record could keep source hash, entry anchor, source order, page context, original date attributes, annotation tokens and span anchors, with person and place mentions as separate linked records, pending agreement on the research question.

### Test strategy for discussion

The following checks separate computational contracts from source observations. They are not yet an accepted processing specification.

| Layer | Proposed check | Example and expected treatment |
|---|---|---|
| Ingest | Verify source hash for this fixed fixture, XML well-formedness, TEI namespace and required body | Corrupt XML fails. A changed upstream hash triggers review rather than an assertion of historical error. |
| Inventory | Repeated runs produce identical reports, preserve source bytes and retain anomaly anchors | Missing place targets remain listed, even when strict parsing succeeds. |
| Segmentation | Each source span is covered once or reported as unassigned | The paragraph `Eintrag-133` inside `Eintrag-132` and the unmarked proceeding after `Eintrag-188` form mandatory regression cases. Their extraction policy still needs agreement. |
| Text rendering | Preserve inline text and tails and apply explicit line-break and editorial rules | `ge<lb break="no"/>botten` in `Eintrag-0` should render as “gebotten” in a reading text. Ordinary line breaks, expansions and deletions require separately agreed expectations. |
| Annotation | Split multi-token values, retain empty spans, resolve categories against the category file | The dual category in `Eintrag-2` yields both tokens. `Urfehdeeid-228` remains a recorded empty annotation. |
| Person scope | Keep nested mentions and their attributes distinct | The spouse mention in `Eintrag-3` must not supply attributes to the accused person. |
| Dates and places | Preserve original values and classify unresolved or uncertain data | A backwards date remains recorded. An unresolved place yields a visible unresolved link. |
| Exports | Maintain traceability and reconciliation with source coverage | Every exported assertion points to a source anchor, and no unexplained source span silently disappears. |

For later processing, use a small human-reviewed reference set drawn from these real examples and ordinary entries. Include multi-person entries, page-spanning entries and editorial additions. Expected results should be written independently of the transformation. Regression checks should exercise the actual extractor. Pure utility checks may use synthetic inputs for malformed XML and other boundary failures.

### Open questions

- Which question should determine the first export, offence and sanction patterns, spatial relations, or close reading with page context?
- Should `Eintrag-133` remain a separately addressable fragment within its parent, and how should the unmarked proceeding receive a derived identifier?
- Which reading-text rules should govern line breaks, expansions, additions, deletions and editorial notes?
- Which missing fields and unresolved references should block an export, and which should remain explicit findings alongside it?
- Which category definitions and edition guidelines should be checked before interpreting sanctions, gender or monetary amounts?
- Who will review the expected outputs of the reference set before they become the acceptance basis?
