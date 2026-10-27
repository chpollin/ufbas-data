---
title: TEI analysis
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
created: 2026-10-27
updated: 2026-10-27
---

# TEI analysis

The published TEI encodes Urfehdebuch X, archival reference StABS Ratsbücher O 10, as a whole-book diplomatic transcription with inline annotations and a place register. The manuscript description gives the period 1563-01-03 to 1569-12-04. Assertions below concern the downloaded edition, not the historical completeness or accuracy of its testimony.

## Source and reproduction

[TEI_SOURCE](https://gams.uni-graz.at/archive/objects/o:ufbas.1563/datastreams/TEI_SOURCE/content) was retrieved on 2026-10-27 into the package copy, without serialisation or line-ending conversion. Its SHA-256 is `8b3aaac90296eae8f347df396ad1d0777ea47a8aa5aada536b8a207aafbee1af`. It is byte-identical to [tei/ufbas.1563.xml](../tei/ufbas.1563.xml), which remains the only copy in the repository. The repository's CC BY-NC-SA 4.0 licence continues to apply to the data.

Run the standalone inventory with its inline dependency metadata:

```powershell
uv run scripts/analyze_tei.py tei/ufbas.1563.xml --self-check --output generated/tei-analysis.json
```

The generated JSON is the source of truth for counts and anomaly lists. It records the source hash, source line numbers, element IDs, attributes and example XML. It is a reproducible output and is excluded from version control. Strict parsing succeeds with external entity expansion disabled. No RELAX NG, ODD or Schematron validation has been performed. The script deliberately uses strict parsing at this validation boundary, overriding the general recovery default.

The knowledge of the presentation layer, kept in gams-www when this analysis was written and in this folder since the repository split of 2026-10-27, has a broader data description in [data.md](data.md) and domain interpretations in [domain.md](domain.md). They guided example selection. Only findings independently checked in this TEI are asserted here.

## Structure and analytical units

The root is `TEI` in `http://www.tei-c.org/ns/1.0`. The header describes title, publication, manuscript and encoding context. `text/body` carries entries and intervening headings, page breaks and marginal material. `text/back/listPlace` carries normalised place labels.

An ordinary entry is `div[@ana="#uf_Eintrag"]` with an `xml:id`, a heading naming the accused, narrative paragraphs and often a notarial subscription. The body also contains unmarked divisions, including annual headings and a substantive proceeding immediately after `Eintrag-188`. They must be inspected before defining extraction coverage.

`Eintrag-132` contains `p[@ana="#uf_Eintrag"][@xml:id="Eintrag-133"]`. This paragraph narrates the proceeding introduced by its parent's heading. Treating every entry marker as a separate independent record would duplicate its narrative, while selecting only marked divisions would conceal this inconsistency. An entry marker count therefore does not establish the number of historical proceedings.

`pb/@facs` points to page images, including breaks inside entries. A page break may precede an entry as a body sibling, so an entry's initial page must be obtained from document order. The source retains `lb`, `lb[@break="no"]`, `ex`, `add`, `del`, scribal changes and marginal notes. These distinctions matter to a readable text export. The inventory's whitespace-collapsed snippets are diagnostic previews and do not constitute a transcription export.

## Annotation and examples

`@ana` is a whitespace-separated set of tokens. `Eintrag-2` contains a term marked `#uf_SchlagwortFrauenarbeit #uf_SchlagwortSpinnen`. Exact-string matching would miss either category. Most `#uf_…` identifiers have no definition in this document. Their labels and hierarchy belong to the separate [category TEI](../tei/ufbas.kategorien.xml), whose contents have not been validated in this investigation. Absence of a category definition from the edition alone does not establish a broken category reference.

In `Eintrag-0`, separate spans identify the accused, an accomplice and a victim, a fraud allegation, disobedience, detention, the oath and an admonition. This permits a record of co-occurring annotations with their original spans. It does not by itself justify assigning each offence or sanction to a particular named person.

In `Eintrag-2`, `#uf_OrtHerkunft` marks an origin and `#uf_OrtWohnort` marks a residential association. The text also contains `#uf_TatAlkoholmissbrauch`, `#uf_Untersuchungshaft`, `#uf_Urfehdeeid` and `#uf_StrafeAusweisung`. The oath date has `when="1563-01-19"` and `calendar="Julian"`. A record can retain both the encoded date and its source wording. Calendar conversion requires an explicit rule.

A `persName/@xml:id` anchors a textual mention. No cross-entry identity relation is supplied by those identifiers. Nested person mentions occur, for example in `Eintrag-3`, where a spouse is named inside the accused person's description. Descendant text or gender annotations cannot safely be attributed wholesale to the outer person.

`placeName/@ref` can link a historical spelling to `back/listPlace/place/@xml:id`. Roles such as origin, residence and offence location are distinct analytical relations. The place register supplies names and editorial notes, without a general coordinate model.

## Verified irregularities and limitations

- XML IDs are unique in this source. Some local place references nevertheless have no target, including `#Modon`, `#Sursee` and `#Stuttgart`. The generated report enumerates every occurrence.
- `placeName-564` uses `ana="#Ormalingen"` for the reading “Normalingen”, although place links normally use `@ref`. A whitespace tokeniser would accept the token, but its intended role still needs interpretation.
- `Urfehdeeid-228` is an empty annotated `seg`. Empty gender-marked forenames and other empty annotations also occur. Annotation presence and recoverable annotated text are separate observations.
- Annotated elements occur outside marked entries. An entry-only pipeline needs an explicit coverage report for them.
- Oath dates go backwards in document order. This establishes that source order cannot be assumed chronological. It does not establish that each reversal is a dating error.
- Calendar values include `Julian` and `#Julian`. Other dates have no calendar attribute. Absence must remain distinguishable from an explicit Julian value.
- A currency measure spells `type="curreny"`. Other currency measures omit quantity or unit. The untyped “zwen sester kernen” is a grain quantity, so missing currency metadata there is not itself an error. The report's measure review candidates require this semantic distinction.
- Monetary quantities also occur in loans and the narrative of an allegation, as in `Eintrag-0`. Summing every currency measure would conflate loans, disputed values and sanctions. Conversion across historical units remains outside this inventory.

## Research possibilities

The source supports exploration of annotated offence and sanction co-occurrence, coded oath dates, references to origin and residence, and the relation of diplomatic text to page images. These are descriptions of the edition's recorded material. Claims about crime prevalence, individual careers, causal relationships or complete populations require additional source criticism and identity work.

An initial derived record could retain source hash, entry anchor, source order, page context, original date attributes, annotation tokens and span anchors. Person mentions and place mentions would remain separate linked records. This is a proposal pending agreement on the research question.

## Test strategy for discussion

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

The optional `--self-check` exercises repeatability, unchanged source bytes, documented source anomalies and rejection of malformed XML, a wrong namespace and DTD declarations against the frozen source hash. It does not implement segmentation, text rendering, schema validation or a historical accuracy test.

## Open questions

- Which question should determine the first export, offence and sanction patterns, spatial relations, or close reading with page context?
- Should `Eintrag-133` remain a separately addressable fragment within its parent, and how should the unmarked proceeding receive a derived identifier?
- Which reading-text rules should govern line breaks, expansions, additions, deletions and editorial notes?
- Which missing fields and unresolved references should block an export, and which should remain explicit findings alongside it?
- Which category definitions and edition guidelines should be checked before interpreting sanctions, gender or monetary amounts?
- Who will review the expected outputs of the reference set before they become the acceptance basis?

## Related

- [Knowledge index](INDEX.md)
- [Analysis journal](journal.md)
- [Package documentation](../README.md)
