---
title: Domain
project:
  name: Urfehdebücher der Stadt Basel
  repository: https://github.com/chpollin/ufbas-data
method:
  name: Promptotyping
  url: https://dhcraft.org/Promptotyping/
template:
  name: Vorlage Domänenwissen
  version: 0.3
  url: https://dhcraft.org/Promptotyping/promptotyping-document/domain-knowledge
status: draft
created: 2026-09-24
updated: 2026-10-27
authors: [Christopher Pollin]
generated-with: Claude Code (Claude Opus 5.5)
topics: ["[[Historische Kriminalitätsforschung]]", "[[CIDOC CRM]]", "[[SKOS]]"]
related: [data.md, specification.md, project.md]
knowledge-sources:
  vocabularies:
    CIDOC CRM 7.1.3: https://www.cidoc-crm.org/cidoc-crm/
    RiC-O 1.1: https://www.ica.org/standards/RiC/ontology
    PROV-O: https://www.w3.org/ns/prov
    Historisches Lexikon der Schweiz: https://hls-dhs-dss.ch
---

# Domain

What an Urfehde entry records, which research it serves, and the rules by which the Exploration view and the domain ontology read the annotation. The research of 2026-09-24 behind it is summarised in [research-report-2026-09-24.md](../snapshots/research-report-2026-09-24.md), its tables are in `research-artefacts/`. Statements marked as inference are ours, the rest carries its source.

## Research context

An Urfehde is the oath by which a prisoner, on release, renounced revenge against the authorities and accepted the conditions of release. In the sixteenth century it had turned from a mutual peace into an asymmetric oath and was on its way to becoming a synonym of banishment (Blauert 2000). The Basel council had the oaths written into books. Urfehdebuch X is a later fair copy, bound after December 1569, with eight scribal hands and a change of notary in 1569.

The literature asks of such books:

1. Whether urban courts disciplined or served the settlement of conflicts that inhabitants brought to them (Burghartz 1989, Schwerhoff 2011).
2. Whether women and men were sanctioned differently for the same offences, which the edition itself names as its example question (Pollin and Vogeler 2017, Kamp 2020).
3. How Reformation moral policy was enforced, through Unzucht, übles Haushalten and the Ehegericht (Burghartz 1999).
4. Which notions of space and border banishment sentences carry, and whom the city expelled (Marchal 1996, Schwerhoff 2006).
5. How custody, release and the fees of the guards were organised (Schmid 2016).
6. How grace, mitigation and conversion of sanctions worked (Ludwig 2008).

The About page of the edition warns that changes in the number of Urfehden may reflect behaviour, the notary's recording or the breakdown of administration in the plague of 1563/64. Five pages were cut out after fol. 69r, covering late 1566 to mid-1567. Counts are therefore no crime rates.

Comparable projects are the Old Bailey Online (statistics across offence, verdict, punishment and gender), the Digital Panopticon (linked life courses), and the Viennese death sentences of the eighteenth century encoded in TEI (Resch et al. 2019). The About page names the last two as partners for a shared ontology, which it calls a research desideratum. Urfehdebuch X also served as ground truth for handwritten text recognition (Hodel, Schoch and Dängeli 2021).

## Entries

The book holds regular Urfehden and special entries the TEI does not type: written oaths (Urfehdbrief), statements of accused persons (Aussage), drafts on the inserted leaf 32a (Entwurf), entries broken off, and two fragments continuing another entry. The mapping is in `research-artefacts/entry-types.tsv` and is treated as a curated value "Eintragstyp (nach Einleitung der Edition)". The derivation reproduces it by five rules as `ufbas-ont:entryType`, and a fragment documents the proceeding of the entry it continues (ADR-12). The 1567 block on fol. 8–9 and fol. 13 consists of later copies, and entries in book order are not in date order.

The unit of analysis is the entry. Offence and sanction are annotated per entry, and in entries with several offenders the text can give them different offences or sanctions, or acquit some of them. Person attributes such as gender and origin belong to persons, and an entry has a gender composition (men only, women only, mixed).

## Institutions

| Office | Function around 1565 | Source |
|---|---|---|
| Siebnerherren | Preliminary investigation in criminal cases ("besybnet und verhört"). Their earlier role as finance office is medieval. | HLS "Basel-Stadt", Jahrrechnungen edition |
| Unzüchter | Council court for breaches of the peace and minor offences. In the source "unzucht" also means such breaches, while the taxonomy's Unzucht means sexual misconduct only. | Wackernagel 1911, entries 162 and 168 |
| Ehegericht | Marriage court since 1529, imposing prison and fines in gulden | HLS "Sittengerichte" |
| Bannherren | Parish officials of the church discipline | HLS "Sittengerichte", Deutsches Rechtswörterbuch |
| Ladenherren | Keepers of the city chest, also public accusers in criminal cases | Deutsches Rechtswörterbuch |
| Heimliche Herren | Probably the Dreizehnerrat (inference) | HLS "Basel-Stadt" |
| Oberstknecht, Ratsknechte, Stadtknechte | Council servants. Ratsknechte lived on the towers and guarded prisoners, Stadtknechte were subordinate to them. | Schmid 2016, Wackernagel 1911 |

## Money

The money of account is 1 lb = 20 ß = 240 d. Rates in the Jahrrechnungen of the same years give 1 gulden = 1 lb 5 ß (confirmed by fines booked in both editions), 1 Sonnenkrone = 2 lb, 1 Taler about 30 to 32 ß, 1 Dicken 9 to 10 ß, 1 Batzen 20 d (inference). "lb stebler" is the ordinary Basel pound. The TEI units `kr` (Kronen), `d-st` (pounds stebler), `fl`, `tlr`, `bz`, `dck`, `plp` (Plappart), `rss` (Rössler), `pao` (Mönchskopf), `sna` (Schnapphahn) and `tol` occur. No 1560s rate was found for the last five. Sums are compared within one unit only, unless a documented rate converts them. `1 lb 1 d` is the Einung and `61 lb 1 d` the great Frevel, fixed sums of account.

## Marginal notes

The names, numbers and flowers beside the entries account for the Turmlöse, the fee a tower guard received when a prisoner was released (Schmid 2016, argued by elimination, since no written rule survives). The name is the guard entitled to the fee, a place name stands for a tower complex, and the number counts the released prisoners, which in almost every entry equals the number of offenders. The flowers mark the half-yearly settlement at Christmas and St John's Day. The Ratsknechte follow each other without overlap, while the Oberstknecht Heinrich Brucker and the Stadtknecht Uolin Rack appear throughout. From 1569 the notary's successor wrote places only.

The categories Ratsknecht, Stadtknecht, Oberster Knecht and Gefängnis mean the fee claimant in a marginal note, but in the text an official, a witness, an arresting agent or an offender's occupation. Derived data keeps these relations apart. The normalisation of names and places is in `research-artefacts/margin-note-normalisation.csv`. A view may show claims per claimant and half-year under the label "Turmlöse nach Schmid 2016". It shows no prison occupancy, no workload and no terms of office, since the margin mostly names persons rather than places and counts only the releases recorded in this book.

## Sanctions

The Strafe group mixes sanctions with other parts of the judgement. The derived grouping below becomes SKOS collections that leave the taxonomy unchanged.

| Group | Categories |
|---|---|
| Sanction | Ausweisung, Geldstrafe, Körperstrafe, Gefängnisstrafe, Amtsentlassung, Hausarrest, Wirtshausverbot, Waffenverbot, Spielverbot, Verbot |
| Modality | Strafandrohung, Ermahnung, Strafausnahme, Strafmilderung, Strafumwandlung |
| Procedural outcome | Urteil ohne Strafe, Weisung an anderes Gericht |
| Obligation and reparation | Entschuldigung, Wiedergutmachung, Entschädigung/Rückzahlung |

Ermahnung and Strafandrohung appear in most entries, so views show sanctions and modalities apart. The last group and Urteil ohne Strafe are coded inconsistently. Entschädigung holds fines, custody costs, damages and debt repayment, and Urteil ohne Strafe often marks only the release formula.

## Persons

Persons are identified per mention. The editors name other proceedings of a person in their notes ("kommt in einem anderen Urfehdeverfahren vor, siehe …, fol. …"). With the folio count of [data.md](data.md#edition-tei) every such citation resolves to one entry, and a sample read in both entries found the same person every time (`research-artefacts/editorial-crossrefs.tsv`). These links are shown as the editors' reference, resolved by us, and the derivation writes them as `ufbas-ont:refersToProceeding` between the proceedings and `ufbas-ont:relatedEntry` between entries, reproducing every row of the table. A match of names alone finds further repeat proceedings but also different persons, so it is offered at most as a hint "gleicher Name".

## Related editions

The Jahrrechnungen der Stadt Basel 1535–1610 (`context:srbas`) are the sister edition for the same city and years. Fines of the Urfehden reappear by name, and mostly with the same amount, in its account "Empfangen in rotstroffen" (`research-artefacts/fine-concordance-srbas.tsv`). An example is the fine of 100 lb stebler of Mathys Gütinger (Eintrag-584), booked in 1568/69 as "jc lb empfangen von Mathis Guttinger, dem lepkucher". Turmlöse and board are not booked there, which suggests they bypassed the city chest (inference). The DEPCHA bookkeeping ontology already models the Jahrrechnungen.

## Domain ontology

A domain ontology derived deterministically from the unchanged TEI, following the DEPCHA bookkeeping ontology as a small model under CIDOC CRM.

- Namespaces. Three layers, each with its own IRI space and prefix, recorded in the head of every file that uses them.

  | Prefix | IRI | Layer |
  |---|---|---|
  | `ufbas:` | `http://gams.uni-graz.at/o:ufbas.1563#` | Data, the entries, proceedings, persons and amounts of the edition object, whose entry anchors the edition page already uses |
  | `ufbas-ont:` | `https://gams.uni-graz.at/o:ufbas.ontology#` | Ontology, the classes and properties |
  | `ufbas-kat:` | `http://gams.uni-graz.at/ufbas/#` | Categories of the taxonomy Urfehdekodierung as SKOS concepts, kept at their IRIs since site parameters, `o:ufbas.schema` and external references use them |
  | `gams:` | `http://gams.uni-graz.at/o:gams-ontology#` | The GAMS ontology `o:gams-ontology`, shared by all GAMS projects |

  A node carries its category as a `ufbas-kat:` concept through `ufbas-ont:category`, not as a class. The text of an entry and of every annotated span is `gams:textualContent`, which the full-text search reads, and a node belongs to its object through `gams:isPartOf`. Both replace the undocumented `g2o:inhalt` and `g2o:isPartOf` of 2017. The page of a node has no GAMS term and becomes `ufbas-ont:onPage` with the counted folio.
- Alignment. The data use only `ufbas-ont:` terms, and the ontology states once how they relate to CIDOC CRM, RiC and PROV, through `rdfs:subClassOf` and `rdfs:subPropertyOf` where the meaning is really contained, and through `skos:closeMatch` or no link where it is not, as for status or the Turmlöse. CRM carries the event structure of the proceeding, RiC the entry as a record of the volume, PROV the derivation of every node from its TEI span. GAMS runs its queries without inference, so the pages query `ufbas-ont:` alone, and CRM types in the data come only from an export that draws the inferences once.

  ```turtle
  ufbas-ont:Offence     rdfs:subClassOf    crm:E7_Activity .
  ufbas-ont:hasOffender rdfs:subPropertyOf crm:P11_had_participant .
  ufbas-ont:derivedFrom rdfs:subPropertyOf prov:wasDerivedFrom .

  ufbas:Tat-Betrug-0 a ufbas-ont:Offence ;
      ufbas-ont:category    ufbas-kat:TatBetrug ;
      ufbas-ont:committedBy ufbas:Person-Täter-0 ;
      ufbas-ont:derivedFrom ufbas:TatBetrug-0 .
  ```
- Model. An entry (`rico:Record`, part of the volume as `rico:RecordSet`) documents an Urfehde proceeding (⊑ `crm:E7_Activity`). The proceeding has parts, offence, detention, sanction, oath, pardon, prior instance and reference to another proceeding, each ⊑ `crm:E7_Activity`. Roles are subproperties of `crm:P11_had_participant` (offender, accomplice, victim, plaintiff, witness, present, receiver, notary). Persons ⊑ `crm:E21_Person` per mention. Places ⊑ `crm:E53_Place`. Time-spans carry a typed date or duration and the calendar. Amounts ⊑ `crm:E97_Monetary_Amount` with quantity and the unit as written. Pages carry the counted folio and the facsimile. Every derived node points to its TEI span with `prov:wasDerivedFrom`.
- Rules with interpretive weight, stated in the derivation. An offence is linked to an offender only where the entry names one. Offence place and date attach to the enclosing offence, else to the single offence of the entry, else to the proceeding. An unannotated duration inside a detention or sanction becomes its duration.
- Derived statements. Resolved cross-references of the editors are candidate person links `ufbas-ont:possiblySameAs` between mentions whose names match the name of the note, symmetric and not transitive, never `owl:sameAs`. Marked date contradictions are `ufbas-ont:dateConflict` with a `ufbas-ont:dateSuggested` beside the published value ([data.md](data.md#data-quality)). An entry mentions every place of the place list it names through `ufbas-ont:mentionsPlace`, which lets the search find every spelling of a place.
- SKOS. A concept scheme with top concepts, `skos:definition` spelled correctly, the sanction groups and the five colour classes of the Exploration view as collections, and the categories that are model rather than vocabulary (the gender tokens, Beruf, Status, Zivilstand, Beiname, Verwandtschaftsgrad, Eingangsnotiz) linked to their ontology term by `skos:exactMatch` or `skos:closeMatch`. Nine glosses carry a coding rule in parentheses beside the definition (Ungehorsam, Widerstand gegen Obrigkeit, Beihilfe, Unzucht, Leichtfertigkeit, Androhung Todesstrafe, Verbot, Wiedergutmachung, Schlagwort Schulden). Their rule stands in `skos:scopeNote` and the rest of the gloss in `skos:definition`, so no word of the gloss is lost, and every other gloss stands whole in `skos:definition`. English labels need a curated source, since those of `o:ufbas.schema` are identifiers and partly wrong (Beiname as "Surname"). An LLM agent drafts them into `research-artefacts/` for the operator's curation, and they enter the ontology only after it (ADR-30).
- Derivation. `ufbas-TORDF-ontology.xsl` is one XSLT 2.0 stylesheet for the `TORDF` of `cirilo:ufbas`, which both TEI objects inherit. It derives the data from the TEI of `o:ufbas.1563` and the concept scheme from the TEI of `o:ufbas.kategorien`, and reads nothing but its input document. Saxon-HE 9.6 gives the triples of SaxonJS (`local-test-build/saxon-check.mjs`). Every element with `@xml:id` and a category or a `persName` becomes a span with its reading text, which keeps the marginal notes of the manuscript and leaves the editors' notes and deleted text out. A derived node carries one category, so an element with two categories of one kind gives two nodes. Keywords, person attributes and place roles stay on the span. `committedBy` and `appliesTo` link a person only where the entry has one offender and no accomplice. An entry lies on the page it starts on. Gender comes from the token on the person, else from its own forenames. A marginal note gives one claim per annotated element with the number after it. Validation is in [testing.md](testing.md#guarantees).
- Publication. GAMS publishes ontologies as objects of model `cm:Ontology` with an `ONTOLOGY` datastream in RDF/XML and a stylesheet that anchors every term, as `o:depcha.bookkeeping` does. Its namespace IRI redirects to the HTML view, and machine clients read `/<pid>/ONTOLOGY`.

The TEI cannot supply person identities, the offender of an offence in multi-offender entries, most dates of deed or arrest, the function of an amount, or coordinates. Linking a fine to its booking in the Jahrrechnungen needs a shared person layer and an amount model with the written unit, the normalised value, the rate and its source.

## Open questions

Open for a check against the facsimile or the literature:

- Whether each date contradiction lies in the coding or the manuscript ([data.md](data.md#data-quality)).
- The source of the About page's 597 regular Urfehden.
- The normalisation of "Meister Heinrich", Spalen, St. Alban, Steinen, the Farnsburg, the Karzer of the Augustinians and the Spital in the marginal notes, and surplus counts of Köferlj and Ylidorffer against Schmid 2016.
- The borderline sanction categories and the double meaning of Unzucht.
- Who the Blutvogt of the 1560s was, and whether the Heimliche Herren were the Dreizehnerrat.

## Sources

- Blauert, Andreas: Das Urfehdewesen im deutschen Südwesten im Spätmittelalter und in der frühen Neuzeit. Tübingen 2000.
- Burghartz, Susanna: Disziplinierung oder Konfliktregelung? In: Zeitschrift für Historische Forschung 16 (1989), 385–407.
- Burghartz, Susanna: Zeiten der Reinheit – Orte der Unzucht. Ehe und Sexualität in Basel während der Frühen Neuzeit. Paderborn 1999.
- Hodel, Tobias / Schoch, David / Dängeli, Peter: Handwritten Text Recognition Ground Truth Set: StABS Ratsbücher O10, Urfehdenbuch X. Zenodo 2021. https://doi.org/10.5281/zenodo.5153263
- Kamp, Jeannette: Crime, Gender and Social Control in Early Modern Frankfurt am Main. Leiden 2020.
- Ludwig, Ulrike: Das Herz der Justitia. Konstanz 2008.
- Marchal, Guy P.: "Von der Stadt" und bis ins "Pfefferland". In: Grenzen und Raumvorstellungen (11.–20. Jh.). Zürich 1996, 225–263.
- Pollin, Christopher / Vogeler, Georg: Semantically Enriched Historical Data. In: Proceedings of WHiSe II, CEUR-WS Vol-2014 (2017), 27–32.
- Resch, Claudia et al.: Encoding Crime and Punishment in TEI. In: Journal of the TEI 11 (2019). https://doi.org/10.4000/jtei.1925
- Schmid, Beat: Blumen und andere Zeugnisse von administrativem Handeln im Basler Urfehdebuch X. Seminar paper, Basel 2016, datastream of `context:ufbas`.
- Schwerhoff, Gerd: Vertreibung als Strafe. In: Ausweisung – Abschiebung – Vertreibung in Europa. Innsbruck 2006, 48–72.
- Schwerhoff, Gerd: Historische Kriminalitätsforschung. Frankfurt am Main 2011.
- Vogeler, Georg: The 'assertive edition'. In: International Journal of Digital Humanities 1 (2019), 309–322.
- Wackernagel, Rudolf: Geschichte der Stadt Basel II/1. Basel 1911.
