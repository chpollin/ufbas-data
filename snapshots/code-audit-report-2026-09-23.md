---
title: Code Audit Report 2026-09-23
project:
  name: Urfehdebücher der Stadt Basel
  repository: https://zimlab.uni-graz.at/gams/projects/ufbas/gams-www
method:
  name: Promptotyping
  url: https://dhcraft.org/Promptotyping/
status: snapshot
created: 2026-09-23
updated: 2026-09-23
authors: [Christopher Pollin]
generated-with: Claude Code (Claude Opus 5.5)
related: [../knowledge/plan.md, ../knowledge/architecture.md]
---

# Code Audit Report 2026-09-23

Findings on the production site https://gams.uni-graz.at/context:ufbas and on the code of `trunk/` as of 2026-09-23. Search findings were measured with sequential requests against production. Datenkorb, edition page and page shell findings come from reading the code and five fetched pages, and the ones marked as checked were confirmed against the file lines named. Repairs are listed in [plan.md](../knowledge/plan.md).

## Search

Full-text search of the navigation bar, `query:ufbas.volltext`, measured through `getJSON`.

| Term | Result rows | Distinct entries | Response | Time |
|---|---|---|---|---|
| Basel | 6187 | 347 | 10.4 MB | 19.3 s |
| Hans | 317 | 158 | 0.41 MB | 0.49 s |
| Liestal | 154 | 12 | 0.23 MB | 0.34 s |
| Dieb | 9 | 7 | 14 kB | 0.15 s |
| Dieb* | | 15 | | |
| gestolen | 11 | 7 | 19 kB | 0.14 s |

Behaviour on the rendered result page `sdef:Query/get`:

- `Hans(` aborts with `net.sf.saxon.trans.XPathException: Syntax error at char 19 in regular expression: Missing close paren` in `ufbas-search.xsl`, https://gams.uni-graz.at/archive/objects/query:ufbas.volltext/methods/sdef:Query/get?params=%241%7CHans(
- `Hans'` returns a page with the heading "Treffer" and no count and no entries, because the query is invalid.

Advanced search, `query:ufbas.search`. URLs were produced by running the deployed `buildquery.js` in Node against simulated form fields, then requested on production.

| Input | Mode | Result |
|---|---|---|
| `Eid.*?` | regex (default) | Keine Treffer |
| `Dieb` | full text | 7 Treffer |
| `Dieb`, Nach 1565, Vor 1567 | regex | Keine Treffer |
| empty keyword, Nach 1565 | regex | HTTP 500, the fragment contains the string `undefined` |
| ` Dieb` (leading space, as after a prefilled field) | regex | Keine Treffer, an empty token produces `\b\b` |
| `-Basel` | regex | 0 Treffer, the fragment is `undefined` |

Isolation of the regex failure through `getJSON` with `$1|Dieb`:

| `$2` | Distinct entries |
|---|---|
| `FILTER(regex(?inhalt,"Dieb","i"))` | 15 |
| `FILTER(regex(?inhalt,"\bDieb\b","i"))` | 0 |
| `FILTER(regex(?inhalt,"\\bDieb\\b","i"))` | 0 |
| `FILTER(CONTAINS(LCASE(str(?inhalt)),"dieb"))` | 15 |
| any value containing `\|`, including `\|\|` and `(ch\|g\|k)` | invalid query |
| padded character-class boundary, `Dieb` | 7 |
| same, `Eid.*?` / `w[yi]n` / `ge?fangen` / `zunff?t.*?` / `eefro[uw]en` | 3 / 84 / 24 / 40 / 50 |
| De Morgan disjunction `Dieb` or `Hans` | 162 |
| boundary `Dieb` with `?datum >= "1566"` | 3 |
| boundary `Dieb` with `"1564" <= ?datum <= "1566"` | 3 |

## Datenkorb

Checked against `trunk/js/datenkorb.js`.

- `keepCheckboxes` (lines 425–446) reads the `id` of the checkbox, which `ufbas-object.xsl` does not set, and throws on `getElementById(null).setAttribute`. Stored entries are not re-checked after reload, and unticking such an entry adds it again.
- "Datenkorb leeren" calls `localStorage.clear()` (line 185), which empties the storage of the whole origin `gams.uni-graz.at`.
- The delete handler is written as `onclick="deletEntryDatabasket(<id>)"` with an unquoted id (line 221) and only works through the browser's global element ids.
- With no stored basket, `JSON.parse(localStorage['itemsArray'])` throws and the page shows an empty heading (review finding, not run).
- `data-taeter` and `data-inhalt` concatenate without separators, visible in the fetched edition page.

## Edition page

- The links of the "Undatiert" menu use `generate-id()` (`trunk/ufbas-object.xsl`, lines 160–166) while entries carry `Eintrag-N`, so none of them resolves. Checked.
- Several dated menu links resolve to `#` where the date is nested deeper than `../parent::t:div` (review finding).
- Category buttons test `contains(..., '#uf_Tat')` after the `#` was removed, and only the first span per category and entry gets a button (review finding).
- The per-page facsimile links point to `dokumente.stabs.ch`, which did not answer on 2026-09-23. Production shows folio labels without link and one link to the volume in the Digitaler Lesesaal, https://dls.staatsarchiv.bs.ch/records/315538/245856/preview?context=%2Frecords%2F315538. The Lesesaal answers automated requests with HTTP 403.
- The edition page is about 4 MB of HTML (review measurement).

## Page shell and objects

- The Uni Graz logo links to `://www.uni-graz.at`, resolved as a relative path. Checked on https://gams.uni-graz.at/context:ufbas
- The meta description starts with "ie hier" instead of "Die hier". Checked.
- `o:ufbas.1563` references `TORDF` at `http://gams.uni-graz.at/gamsdev/pollin/ufbas/trunk/TORDF.xsl`, HTTP 404. Checked on https://gams.uni-graz.at/archive/objects/o:ufbas.1563/datastreams/TORDF/content
- Edition and category pages load icons from `context:srbas`.
- `ufbas-object.xsl` on production differs from `trunk/` in the facsimile handling, all other served files are byte-identical to `trunk/`.
