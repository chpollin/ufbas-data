---
title: Architecture
project:
  name: Urfehdebücher der Stadt Basel
  repository: https://github.com/chpollin/ufbas-data  # the served files it describes are in https://zimlab.uni-graz.at/gams/projects/ufbas/gams-www
method:
  name: Promptotyping
  url: https://dhcraft.org/Promptotyping/
template:
  name: Vorlage Architecture
  version: 0.4
  url: https://dhcraft.org/Promptotyping/promptotyping-document/architecture
status: draft
created: 2026-09-23
updated: 2026-10-28
authors: [Christopher Pollin]
generated-with: Claude Code (Claude Opus 5.5)
topics: ["[[GAMS]]", "[[GAMS Entwicklung]]", "[[XSLT]]", "[[SPARQL]]"]
related: [data.md, specification.md, testing.md, plan.md]
---

# Architecture

The site is an XSLT application layer on GAMS. Fedora holds the TEI objects, a context object, query objects and three Cirilo configuration objects, and Cocoon renders every page on request with the stylesheet an object's `STYLESHEET` datastream points to. Stylesheets, scripts, styles and images are plain files in the served folder, whose source is the root of the ZimLab repository gams-www. General GAMS and Cirilo behaviour (content models, datastreams, ingest, parameters, shared assets, environments) is in [GAMS.md](../GAMS.md#knowledge), and this document states only how UFBAS uses it.

## Stack

- XSLT 2.0 on Saxon for Java under Cocoon 2.1.13. The server's Saxon is 9.5 or later (inference from its regex error messages), so the stylesheets use no 3.0 construct, and `local-test-build/saxon-check.mjs` compiles them in Saxon-HE 9.6 ([testing.md](testing.md#gaps)). The output is serialised as XML and parsed as HTML, so no empty non-void element is emitted.
- Blazegraph as triple store, reached as `/sesame/sparqlendpoint`, with full text through `bds:search`.
- Plain JavaScript and CSS without framework. A library a view needs is vendored and loaded only on the pages that use it (ADR-18), OpenSeadragon 6.1.1 in `js/openseadragon-6.1.1/`, identical to the release on npm.

## Environments and delivery

| Place | Role |
|---|---|
| Local working copies | gams-www and ufbas-data side by side, with the checks of `local-test-build/` run on the gams-www checkout ([testing.md](testing.md)) |
| ZimLab `https://zimlab.uni-graz.at/gams/projects/ufbas/gams-www.git`, `main` | Source of truth of the served files. A push requires a passing `npm test` |
| GitHub `https://github.com/chpollin/ufbas-data`, `main` | Knowledge, harness, ingest stylesheets, queries, datastream mirrors and data. GAMS does not read it, the operator ingests from its `tei/` and copies its `gams/` files into Cirilo |
| `gamsdev/ufbas/gams-www` on `\\gedra.uni-graz.at\pollin` | The gamsdev mirror of `origin/main`, served as `https://gams-staging.uni-graz.at/gamsdev/pollin/ufbas/gams-www/` |
| Staging `https://gams-staging.uni-graz.at/context:ufbas` | The test instance since 2026-09-29, whose objects reference the stylesheets of the mirror |
| Production `https://gams.uni-graz.at/context:ufbas` | Served from `https://gams.uni-graz.at/ufbas/`, which the operator fills from ZimLab `main` with the GAMS update |
| `gamsdev/ufbas` outside `gams-www` | The former SVN working copy, revision 618, preserved in the first gams-www commit `e0d27f9`. It stays until production no longer references its `trunk/` ([Cirilo configuration](#cirilo-configuration)) |

`ufbas-static.xsl` takes the folder of the served files from its own URL (`static-base-uri()`), `/ufbas` in production and `/gamsdev/pollin/ufbas/gams-www` on staging, so one commit serves both. Datastreams and object links stay server-relative and resolve on each instance to its own objects.

## GAMS objects

| PID | Model | Role |
|---|---|---|
| `context:ufbas` | Context | Home page and the pages chosen by `mode` (`about`, `imprint`, `datenkorb`, `exploration`, `ontologie`) |
| `o:ufbas.1563` | TEI | The edition |
| `o:ufbas.kategorien` | TEI | The category taxonomy |
| `o:ufbas.schema` | Ontology | RDFS of the `uf:` vocabulary (2017), mirrored in `gams/datastreams/`, read by no page |
| `query:ufbas.search` | Query | Quick search and advanced search |
| `query:ufbas.volltext` | Query | The 2017 full-text search, kept for old links |
| `query:ufbas.kategorien` | Query | Entries of one category |
| `query:ufbas.graph` | Query | Former force graph of one category, its page forwards to the Exploration view |
| `query:ufbas.exploration` | Query | One row per entry for the Exploration view, read as JSON from the refactored RDF. New, its `QUERY` is a target value the operator sets. The text set on staging on 2026-09-29 is the earlier one on the RDF of 2017, which the text of `gams/query/` replaces |
| `query:ufbas.properties` | Query | Further statements about one category, read only by the 2017 graph script `buildgraph.js` |
| `query:ufbas.alkohol` | Query | A 2017 analysis of offences involving alcohol, linked from no page, left on production and carried into neither repository nor staging |
| `o:ufbas.ontology` | Ontology (`cm:Ontology`) | The domain ontology, a finished static product with only its `ONTOLOGY` datastream beside the `STYLESHEET` redirect (ADR-17, ADR-33), not yet ingested |
| `cirilo:ufbas` | Cirilo configuration | Ingest defaults of the project, among them `TORDF` |
| `cirilo:TEI.ufbas` | Cirilo configuration | Defaults for new TEI objects |
| `cirilo:Context.ufbas` | Cirilo configuration | Defaults for new context objects |

Besides `STYLESHEET` and `QUERY`, `context:ufbas` needs `ABOUT` and `IMPRINT`, read by `ufbas-context.xsl` and the footer, and the PDF `SCHMIDtADMINIStRAtIVESHANDELN2016` and the image `NUM_ENTRY`, which `ABOUT` links. Its other datastreams (`STARTBILD`, `TABELLENSYMBOL`, `TEASER`, `StrafeStrafandrohung`, a stale `DATENKORB` copy of the script) are read by no page.

### Cirilo configuration

Target values. A redirect names a file of the served folder, whose base is `https://gams.uni-graz.at/ufbas/` in production and `https://gams-staging.uni-graz.at/gamsdev/pollin/ufbas/gams-www/` on staging. A reference is read without login through the redirect of `/archive/objects/<PID>/datastreams/<DSID>/content`.

| Object | Datastream | Kind | Value |
|---|---|---|---|
| `cirilo:ufbas` | `TORDF` | Inline XML | content of `gams/ufbas-TORDF-ontology.xsl`, the value after the update. Production carries the content of `gams/ufbas-TORDF.xsl` until then |
| `cirilo:TEI.ufbas` | `TOTEI` | Inline XML | content of `gams/ufbas-TOTEI.xsl` |
| `cirilo:TEI.ufbas` | `TORDF` | Redirect | `/archive/objects/cirilo:ufbas/datastreams/TORDF/content` on the same instance |
| `cirilo:TEI.ufbas` | `STYLESHEET` | Redirect | base + `ufbas-object.xsl` |
| `context:ufbas` | `STYLESHEET` | Redirect | base + `ufbas-context.xsl` |
| `context:ufbas` | `ABOUT`, `IMPRINT`, `QUERY` | Content | `gams/datastreams/context-ufbas.<DSID>.*` |
| `o:ufbas.1563` | `STYLESHEET`, `TORDF` | Redirect | inherited from `cirilo:TEI.ufbas` |
| `o:ufbas.kategorien` | `STYLESHEET` | Redirect | base + `ufbas-category.xsl`, set by hand after the ingest, which gives it `ufbas-object.xsl` |
| `o:ufbas.kategorien` | `TORDF` | Redirect | inherited from `cirilo:TEI.ufbas` |
| `query:ufbas.search`, `query:ufbas.kategorien`, `query:ufbas.volltext` | `STYLESHEET` | Redirect | base + `ufbas-search.xsl` |
| `query:ufbas.graph` | `STYLESHEET` | Redirect | base + `ufbas-graph.xsl` |
| `query:ufbas.properties` | `STYLESHEET` | Redirect | base + `ufbas-search.xsl`, as on production, though no page links it |
| `query:ufbas.search`, `query:ufbas.kategorien`, `query:ufbas.volltext`, `query:ufbas.graph`, `query:ufbas.properties`, `query:ufbas.exploration` | `QUERY` | Content | `gams/query/ufbas.<name>.sparql` |
| `o:ufbas.ontology` | `ONTOLOGY` | Content | `ontology/ufbas.ontology.rdf` |
| `o:ufbas.ontology` | `STYLESHEET` | Redirect | base + `ufbas-ontology.xsl` |

Production deviates from these targets in three references, read on 2026-09-29. `query:ufbas.graph` points to `http://glossa.uni-graz.at/gamsdev/pollin/ufbas/trunk/ufbas-graph.xsl` and `o:ufbas.1563/TORDF` to `http://gams.uni-graz.at/gamsdev/pollin/ufbas/trunk/TORDF.xsl`, both in the SVN working copy, and `cirilo:Context.ufbas/STYLESHEET` to the generic `CONTEXTtoHTML` of `cirilo:ufbas`. They are set with the GAMS update ([plan.md](plan.md#delivery)), after which the SVN working copy can go.

### Ingest

The two TEI files in `tei/`, named after their PID without `o:`, are ingested with the content model `cirilo:TEI.ufbas`, the taxonomy first where both cannot go at once, since the edition page reads it. Because Cirilo ingests every file of the chosen folder, `tei/` holds only these two files and is the ingest folder as it is. `.gitignore` excludes the `ingest.log` Cirilo writes there and `mets.xml`.

Since ADR-34 `tei/ufbas.1563.xml` carries the page images and differs from its published datastream by that change alone, a prepared target value until the re-ingest ([plan.md](plan.md#delivery)). Its `graphic/@url` are external IIIF image services without `xml:id` and `mimeType`, so Cirilo references them and uploads nothing. The first `graphic` may become the `THUMBNAIL` of `o:ufbas.1563`, the image of fol. 1r, and whether Cirilo fetches an external image for that is undocumented and checked on staging after the ingest.

At ingest `ufbas-TOTEI.xsl` gives every element with an `@ana` pointer and every `persName` and `placeName` an `xml:id` where it has none and sets `xml:space="preserve"` on `text`, and the `TORDF` of `cirilo:ufbas` derives the `RDF` datastream. `ufbas-TOTEI.xsl` and `ufbas-TORDF.xsl` are taken over unchanged from production. A change of either changes published data and takes effect only after the file is copied into its Cirilo datastream and the objects are re-ingested.

With the update `ufbas-TORDF-ontology.xsl` takes the place of `ufbas-TORDF.xsl` in `cirilo:ufbas`, one stylesheet that both TEI objects inherit. It derives the refactored RDF of the edition from `o:ufbas.1563` and the SKOS concept scheme from `o:ufbas.kategorien`, reads nothing but its input document, and writes only terms of `ontology/ufbas.ontology.ttl` and the GAMS ontology ([domain.md](domain.md#domain-ontology)). The re-ingest of both objects then replaces the RDF of 2017.

### RDF transformation

`ufbas-TORDF.xsl`, the production copy, writes the `gams.uni-graz.at` namespaces on every instance, since they are identifiers and not addresses. The SVN version in gams-www commit `e0d27f9` binds them to the former glossa server. Run locally on `tei/`, it gives the published `RDF` datastreams exactly, apart from the form of generated identifiers, which `test/rdf.test.mjs` checks. The staging ingest of 2026-09-29 gave the RDF of the taxonomy byte for byte and that of the edition with the same resources. The RDF model is described in [data.md](data.md#rdf).

### Switching the graph page

The `STYLESHEET` reference of `query:ufbas.graph` is set to the new stylesheet in the same step as the GAMS update. Until then the page renders with the 2017 shell, which loads Bootstrap and jQuery from `/lib/` and files from `/ufbas/` that the refactoring deleted, and its quick search sends a field `$1`, which the new `buildquery.js` treats as an empty search. An update without the switch therefore leaves the graph page unstyled and its search broken. The query object stays so that its addresses keep working, and `ufbas-graph.xsl` forwards to the Exploration page with the category in the fragment, since GAMS answers unknown query parameters with 404. No external link to the graph query is known. The 2017 paper cites a graph under `context:ufbas/StrafeStrafandrohung`, a different URL whose target was not checked and stays untouched.

## Presentation layer

Every page stylesheet includes `ufbas-static.xsl`, declares `$pageCss` and supplies a template named `content`, except `ufbas-ontology.xsl`, which imports `ufbas-context.xsl` with the mode `ontologie`.

| File | Object | `$pageCss` | Renders |
|---|---|---|---|
| `ufbas-static.xsl` | all | | Shell, navigation, quick search, footer, imprint text, `uf:date`, `uf:facet` |
| `ufbas-context.xsl` | `context:ufbas` | `context`, `exploration`, `ontology` by mode | Home page, project text from `ABOUT`, imprint, Datenkorb page, Exploration page, page Ontologie |
| `ufbas-object.xsl` | `o:ufbas.1563` | `edition` | Edition with view switch, marking switches, table of contents, entries with marked annotations and Datenkorb switches, page image pane, folio labels from `uf:folio` |
| `ufbas-category.xsl` | `o:ufbas.kategorien` | `categories` | Category page with links to the entry list and, where the view has a filter, to the Exploration view |
| `ufbas-search.xsl` | the three search queries | `search` | Empty advanced form, result pages, category browse |
| `ufbas-graph.xsl` | `query:ufbas.graph` | `search` | Forward to the Exploration view |
| `ufbas-ontology.xsl` | `o:ufbas.ontology` | `ontology` | The page Ontologie, which on both objects reads the `ONTOLOGY` datastream with `document()` from the host-relative path `/archive/objects/o:ufbas.ontology/datastreams/ONTOLOGY/content` and renders from it alone (ADR-33) |

The shell links the shared and the page-type stylesheet (`css/template.css` with tokens, shell and shared components, plus `css/{$pageCss}.css`), the print styles and the three shared scripts with `defer`, then a skip link, the header, the navigation with the quick search and the Datenkorb count, `main#main` and the footer. It derives the current page from the input document and marks it with `aria-current="page"` and the body class `page-<name>`. Fonts come from GAMS under `/assets/fonts/` (ADR-32). Visual decisions are in [design.md](design.md).

| Script | Loaded by | Does |
|---|---|---|
| `js/datenkorb.js` | every page | Datenkorb in `localStorage` under `ufbas.datenkorb`, one-time takeover of the 2017 key `itemsArray`, count in the navigation, the switches, the Datenkorb page with sorting, removal, CSV and clearing, sync across tabs |
| `js/buildquery.js` | every page | Builds `params` from both search forms, reports errors at the form, fills the example searches, restores the form state on the result page |
| `js/highlighting.js` | every page, effective on the edition | Marking switches, tips of marked annotations and editorial notes, the annotation index built on demand, table of contents following the reading position |
| `js/edition-views.js` | edition page, after `highlighting.js` | The views "Text" and "Text und Bild" with default by width and state in the fragment, the table of contents behind a button, the page image pane following the reading line, folio labels as buttons |
| `js/openseadragon-6.1.1/openseadragon.min.js` | `edition-views.js`, when "Text und Bild" is first chosen | Viewer of the page images, whose image services the folio labels carry |
| `js/results.js` | result pages of search and category browse | Collapsed form on narrow screens, CSV of the hits, one year at a time on a category browse |
| `js/exploration.js` | Exploration page | Reads `query:ufbas.exploration` once, keeps the selection in the fragment, draws the marks in SVG, the filter menus, the legend and the entry table, CSV of the selection |

No generated page contains inline JavaScript. Script data travels as `<script type="application/json">`.

### Edition page

Every annotated element of the groups Person, Tat, Strafe, Ort and Schlagwort becomes `span.ann` with its group in `data-group` and its category terms in `data-label`. An element in several groups nests one span per group, since a span carries one mark, and an annotated note is itself the span, because a float takes no underline from its parent. The marking switches set a class `mark-<group>` on `.edition-body`, and `edition.css` draws the marks in fixed slots and gives the labels to screen readers as visually hidden generated content. Page breaks carry the image number in `data-facs` and the image service and size in `data-image`, `data-width` and `data-height` (ADR-34). A TEI without `facsimile`, as GAMS serves it until the re-ingest, gives a page without image pane and view switch, with a short note in its place. View and marked groups travel in the fragment as `#Eintrag-12&ansicht=bild&markierung=Person,Strafe`, since GAMS answered a query parameter on the edition URL with 404 (short form) or 500 (`sdef:TEI/get`) on 2026-09-24 (ADR-24). The object store of the images sends CORS headers for `gams.uni-graz.at` only, so the viewer uses the canvas drawer, which shows tiles as plain images on every host.

### Graph page

`ufbas-graph.xsl` reads the category from `params` and the taxonomy, and forwards by a refresh without delay, with a link beside it, to the Exploration view with the category selected, or to its entry list where the view has no filter for it. The result of `query:ufbas.graph` is not read.

### Exploration page

`context:ufbas` with `mode=exploration` renders the page head with a status line, the containers of the view and a data island `#explore-data` with the address of `query:ufbas.exploration`, the categories that have a filter (id, term, gloss, filter, sanction group), the four sanction groups and the months of the cut-out pages. `uf:facet` of `ufbas-static.xsl` assigns each category to its filter and is shared with the category page and the category browse, whose links open the view with the category selected. `js/exploration.js` fetches `sdef:Query/getJSON` once, which GAMS sends as `text/plain`, parses one entry per row ([data.md](data.md#rdf-as-source-of-the-exploration-view)) and counts everything in the browser. The selection travels in the fragment as `#tat=TatDiebstahl&strafe=StrafeAusweisung&klasse=ausweisung&zeit=1565-09&geschlecht=f&ansicht=tat&sortierung=ausweisung&eintrag=Eintrag-12`. Values of gender, sanction class and time combine by or, those of the other filters by and, and filters combine by and. A filter that combines by or counts over the selection without its own filter, and the sanction profile of a row counts over the selection without the class filter. Marks keep their element between redraws, and a redraw returns the focus to the control with the same `data-key`. `datenkorb.js` exposes `sync` so that the view can set the state of the Datenkorb switches it drew. Without script a `noscript` pointer to the category page stands in, and an unreadable answer leaves a message in the status line. On GAMS the page shows entries only after the re-ingest, and locally `sparql.mjs` answers the query with Oxigraph ([testing.md](testing.md#exploration-view)).

## Search

Two forms and a category browse are answered by query objects whose SPARQL contains the placeholders `$1` and `$2`. `js/buildquery.js` fills them and calls `sdef:Query/get`, the category page links its query directly, and `ufbas-search.xsl` renders every result list. The query texts are kept in `gams/query/`, one file per query object named after its PID without `query:`.

### Queries

The search queries read the refactored RDF, the text of entries and spans as `gams:textualContent` and the categories as `ufbas-ont:category`. That text keeps the marginal notes and leaves the editors' notes out, so a term that stands only in an editors' note no longer finds its entry. On GAMS they answer only after the re-ingest.

- `query:ufbas.search` serves both forms. A subquery finds the entries whose text matches the fragment in `$2`, bound with their Urfehde date as `?datum`. Only for these hits are the offenders and the categories whose span text contains `$1` added, and `ufbas-search.xsl` groups the rows by entry, since every combination of offender and matching category is a row. `$1` is compared as one literal string.
- `query:ufbas.volltext` runs a full-text match on `$1`, or finds the entries that name a place of that name, for old bookmarks.
- `query:ufbas.kategorien` takes a category IRI in angle brackets as `$1` and answers one row per span. A gender token is a person attribute in the refactored RDF, so the query also finds the persons whose gender the concept names by `skos:exactMatch`.
- `query:ufbas.graph` keeps its text of 2017 on the RDF of 2017 ([Graph page](#graph-page)).

### Forms

The quick search `form#volltextsuche` and the advanced search `form#SucheErweitert` both send `query:ufbas.search`, with the fields `Stichwort`, `regex`, `von` and `bis`. Terms are separated by spaces. A plain term must occur, a term with `|` is an alternative, a term with `-` is excluded.

- In full-text mode `$2` combines `?inhalt bds:search "…"` with `bds:matchAllTerms "true"` for the required terms, one `UNION` branch per alternative, a branch for the entries that name a place of the place list with that name (`ufbas-ont:mentionsPlace`, so a place name finds every spelling), and one `MINUS` per excluded term. Blazegraph matches whole tokens case-insensitively, a trailing `*` matches word beginnings, and the quick search appends it to every required term.
- In regular-expression mode `$2` is a `FILTER` of `regex()` calls combined with `&&` and `!`, each term bounded by a class of non-letters on a copy of the text padded with spaces, disjunction written as `!(!A && !B)`. The place branch joins it as `!(!(…) && NOT EXISTS { … })`.
- `von` and `bis` take a year, month or day and include the boundary, compared as strings on `?datum` (`?datum <= "1566~"`, where `~` sorts after every digit). A range without terms sets `$1` to `~`.

Excluded terms and the date range follow the positive branches in `$2`, so they hold for the place branch as well. `buildquery.js` rejects input that cannot work (only excluded terms, nothing to search, an invalid regular expression, a malformed date, `|` or backslash inside a term) and strips quotes, semicolons, braces and angle brackets. `$2` is SPARQL written by the client, and the endpoint only reads, so the exposure is limited to query load. Four example buttons fill the advanced form with `wyn |win`, `w[yi]n`, `Dieb*` and the year 1565 without sending it.

### Parameter channel

The value of `params` is `$1|…;$2|…`, tested on 2026-09-23 and 2026-09-24 ([code-audit-report-2026-09-23.md](../snapshots/code-audit-report-2026-09-23.md#search)).

- A `|` inside a value invalidates the query, probably because GAMS splits at it. This rules out `||` and regex alternation in parameters. Stored `QUERY` texts accept `|` and property paths such as `skos:broader*`, shown on DEPCHA queries on production.
- A backslash does not reach Blazegraph intact, so `\b` cannot be used.
- GAMS decodes the value twice. `buildquery.js` encodes `%` and `+` once before encoding the whole value, and the stylesheet turns `%2B` and `%25` back.
- A single quote in `$1` would close the literal `'$1'`, so the form removes it.

### Result page

`ufbas-search.xsl` reads terms, mode and dates back from `$params`, and an empty value gives the advanced form. The CSV of a result list is built in the browser with the columns of the Datenkorb export (ADR-29), where offences, sanctions and keywords hold only the categories the page shows for a hit. The XLS table through `getHSSF` is gone. Full-text terms are highlighted as word beginnings. A regular expression is highlighted only when it consists of letters, digits, `.`, `-`, classes of letters and quantifiers and cannot match the empty string, because `analyze-string` aborts the page otherwise. GAMS answers an invalid query with the endpoint address as text, and the page then reports that the query could not be run.

## Repository structure

The project has two repositories since 2026-10-27, following the ZimLab template for `gams-www` (ADR-31). gams-www holds only what GAMS serves, ufbas-data everything that describes, checks or feeds it. Paths in the knowledge documents are relative to ufbas-data, except the page stylesheets `ufbas-*.xsl`, `css/`, `js/` and `img/`, which lie in gams-www.

gams-www, https://zimlab.uni-graz.at/gams/projects/ufbas/gams-www, whose root is the served folder `/ufbas/`:

| Path | Content |
|---|---|
| `ufbas-static.xsl`, `ufbas-context.xsl`, `ufbas-object.xsl`, `ufbas-search.xsl`, `ufbas-category.xsl`, `ufbas-graph.xsl`, `ufbas-ontology.xsl` | The page stylesheets, referenced by the `STYLESHEET` datastreams, whose names stay stable |
| `css/`, `js/`, `img/` | Styles, scripts with the vendored OpenSeadragon, images |
| `README.md`, `LICENSE` | Project description after the ZimLab template, MIT licence of the code |

ufbas-data, https://github.com/chpollin/ufbas-data:

| Path | Content |
|---|---|
| `tei/` | The TEI of `o:ufbas.1563` and `o:ufbas.kategorien`, ingest source of its object and byte for byte the published datastreams except the page images of ADR-34 until the re-ingest ([Ingest](#ingest)) |
| `ontology/` | The domain ontology in Turtle, its RDF/XML as ingest source of `o:ufbas.ontology` and its JSON-LD, the SHACL shapes in Turtle and RDF/XML, and `ufbas.example.rdf`, the derivation of `Eintrag-0` (ADR-33). `local-test-build/make-ontology.mjs` writes the RDF/XML and JSON-LD from the Turtle, `local-test-build/derive-rdf.mjs` the example |
| `rdf/`, `derived/`, `generated/` | The published RDF of 2017, the derived dataset and the untracked output of the TEI inventory ([README.md](../README.md#files)) |
| `gams/ufbas-TOTEI.xsl`, `gams/ufbas-TORDF.xsl` | The ingest transformations of `cirilo:TEI.ufbas` and `cirilo:ufbas` as production runs them |
| `gams/ufbas-TORDF-ontology.xsl` | The `TORDF` of `cirilo:ufbas` after the update ([Ingest](#ingest)) |
| `gams/query/` | The `QUERY` texts of the objects the project maintains, one file per object |
| `gams/datastreams/` | Mirrors of further GAMS datastreams, named `<pid>.<DSID>` with `:` replaced by `-`, and explicitly listed prepared target values ([testing.md](testing.md#guarantees)) |
| `source-material/` | Older taxonomy files, the TEI part files of the 2016 course and the IIIF manifest of the Digitaler Lesesaal ([data.md](data.md#sources)) |
| `local-test-build/` | Local rendering of the gams-www checkout, preview, checks and the generators of derived files ([testing.md](testing.md)) |
| `research-artefacts/` | Curated tables from the research of 2026-09-24, with provenance in their README |
| `scripts/` | The standalone TEI inventory `analyze_tei.py` ([data.md](data.md#independent-inventory-of-the-published-tei)) |
| `knowledge/`, `snapshots/` | Project knowledge and dated reports |
| `AGENTS.md`, `GAMS.md`, `CLAUDE.md` | Working rules for agents in both repositories |
