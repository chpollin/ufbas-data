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
updated: 2026-10-27
authors: [Christopher Pollin]
generated-with: Claude Code (Claude Opus 5.5)
topics: ["[[GAMS]]", "[[GAMS Entwicklung]]", "[[XSLT]]", "[[SPARQL]]"]
related: [data.md, specification.md, testing.md, plan.md]
---

# Architecture

The site is an XSLT application layer on GAMS. Fedora holds the TEI objects, a context object, query objects and three Cirilo configuration objects, and Cocoon renders every page on request with the stylesheet an object's `STYLESHEET` datastream points to. Stylesheets, scripts, styles, images and derived data are plain files in the served folder, whose source is the root of the ZimLab repository gams-www. Knowledge, harness, ingest stylesheets, queries, datastream mirrors and TEI lie in the GitHub repository ufbas-data ([Repository structure](#repository-structure)). General GAMS mechanics are in [GAMS.md](../GAMS.md#knowledge).

## Stack

- XSLT 2.0 on Saxon for Java under Cocoon 2.1.13. The server's Saxon is 9.5 or later (inference from its regex error messages), and no GAMS stylesheet is known to run 3.0, so the stylesheets use no 3.0 construct. `local-test-build/saxon-check.mjs` compiles every stylesheet in Saxon-HE 9.6, a processor of XSLT 2.0 only ([testing.md](testing.md#gaps)). The output is serialised as XML and parsed as HTML, so no empty non-void element is emitted.
- Blazegraph as triple store, reached as `/sesame/sparqlendpoint`. Full text through `bds:search`.
- Plain JavaScript and CSS without framework. Libraries a view needs are vendored and served from the project folder on the pages that use them (ADR-18), OpenSeadragon 6.1.1 in `js/openseadragon-6.1.1/` for the facsimile, identical to the release on npm.

## Environments and delivery

| Place | Role |
|---|---|
| Local working copies | gams-www and ufbas-data side by side, with the checks of `local-test-build/` in ufbas-data run on the gams-www checkout ([testing.md](testing.md)) |
| ZimLab `https://zimlab.uni-graz.at/gams/projects/ufbas/gams-www.git`, `main` | Source of truth of the served files. A push requires a passing `npm test` |
| GitHub `https://github.com/chpollin/ufbas-data`, `main` | Knowledge, harness, ingest stylesheets, queries, datastream mirrors and data. GAMS does not read it, the operator ingests from its `tei/` and copies its `gams/` files into Cirilo |
| `gamsdev/ufbas/gams-www` on `\\gedra.uni-graz.at\pollin` | Mirror of `origin/main`, synced with `git fetch` and `git reset --hard origin/main`, never edited. Served as `https://gams-staging.uni-graz.at/gamsdev/pollin/ufbas/gams-www/`. |
| Staging `https://gams-staging.uni-graz.at/context:ufbas` | The test instance since 2026-09-29. Its objects reference the stylesheets of the mirror, so a pushed commit shows there after the sync. |
| Production `https://gams.uni-graz.at/context:ufbas` | Served from `https://gams.uni-graz.at/ufbas/`, which the operator fills from ZimLab `main` with the GAMS update. A datastream set in Cirilo there is public at once. |
| `gamsdev/ufbas` outside `gams-www` | The former SVN working copy, revision 618, preserved in the first gams-www commit `e0d27f9`. It stays until production no longer references its `trunk/` ([Cirilo configuration](#cirilo-configuration)). |

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
| `query:ufbas.exploration` | Query | One row per entry for the Exploration view, read as JSON from the refactored RDF. New, its `QUERY` is a target value the operator sets on staging and production. The text set on staging on 2026-09-29 is the earlier one on the RDF of 2017, which the text of `gams/query/` replaces. |
| `query:ufbas.properties` | Query | Further statements about one category, read only by the 2017 graph script `buildgraph.js`, on the RDF of 2017 like the text of `query:ufbas.graph` |
| `query:ufbas.alkohol` | Query | A 2017 analysis of offences involving alcohol, linked from no page. It stays on production and is carried into neither repository nor onto staging. |
| `o:ufbas.ontology` | Ontology (`cm:Ontology`) | The domain ontology with its `ONTOLOGY` datastream (ADR-17), not yet ingested |
| `cirilo:ufbas` | Cirilo configuration | Ingest defaults of the project, among them `TORDF` |
| `cirilo:TEI.ufbas` | Cirilo configuration | Defaults for new TEI objects |
| `cirilo:Context.ufbas` | Cirilo configuration | Defaults for new context objects |

Besides `STYLESHEET` and `QUERY`, `context:ufbas` needs `ABOUT` and `IMPRINT`, read by `ufbas-context.xsl` and by the footer of every page, and the PDF `SCHMIDtADMINIStRAtIVESHANDELN2016` and the image `NUM_ENTRY`, which the text of `ABOUT` links. Its other datastreams (`STARTBILD`, `TABELLENSYMBOL`, `TEASER`, `StrafeStrafandrohung`, a stale `DATENKORB` copy of the script) are read by no page, since scripts and images come from the served folder. Cirilo creates the system datastreams (`DC`, `RELS-EXT`, `METADATA` and others) itself.

### Cirilo configuration

Target values. A redirect names a file of the served folder, whose base is `https://gams.uni-graz.at/ufbas/` in production and `https://gams-staging.uni-graz.at/gamsdev/pollin/ufbas/gams-www/` on staging. A reference is read without login through the redirect of `/archive/objects/<PID>/datastreams/<DSID>/content`.

| Object | Datastream | Kind | Value |
|---|---|---|---|
| `cirilo:ufbas` | `TORDF` | Inline XML | content of `gams/ufbas-TORDF-ontology.xsl`, the value after the update. Production carries the content of `gams/ufbas-TORDF.xsl` until then. |
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
| `o:ufbas.ontology` | `ONTOLOGY` | Content | `data/ontology/ufbas.ontology.rdf` of gams-www |
| `o:ufbas.ontology` | `STYLESHEET` | Redirect | base + `ufbas-ontology.xsl` |

Production deviates from these targets in three references, read on 2026-09-29. `query:ufbas.graph` points to `http://glossa.uni-graz.at/gamsdev/pollin/ufbas/trunk/ufbas-graph.xsl` and `o:ufbas.1563/TORDF` to `http://gams.uni-graz.at/gamsdev/pollin/ufbas/trunk/TORDF.xsl`, both in the SVN working copy, and `cirilo:Context.ufbas/STYLESHEET` to the generic `CONTEXTtoHTML` of `cirilo:ufbas`. They are set with the GAMS update ([plan.md](plan.md#delivery)), after which the SVN working copy can go.

### Ingest

The TEI of the two TEI objects lies in `tei/` of ufbas-data, one file per object named after its PID without `o:`, and Cirilo ingests both with the content model `cirilo:TEI.ufbas`. Each file carries its PID in `idno[@type='PID']`. The taxonomy comes first where both cannot be ingested at once, since the edition page reads it. Since Cirilo ingests every file of the chosen folder ([GAMS.md](../GAMS.md#knowledge)), `tei/` holds only these two files and is the ingest folder as it is. The `ABOUT` of `context:ufbas` is mirrored in `gams/datastreams/context-ufbas.ABOUT.xml`. Cirilo writes `ingest.log` into the folder and `mets.xml` into folders with images, which `.gitignore` excludes.

At ingest `ufbas-TOTEI.xsl` gives every element with an `@ana` pointer and every `persName` and `placeName` an `xml:id` where it has none and sets `xml:space="preserve"` on `text`, and the `TORDF` of `cirilo:ufbas` derives the `RDF` datastream. `ufbas-TOTEI.xsl` and `ufbas-TORDF.xsl` are taken over unchanged from `cirilo:TEI.ufbas` and `cirilo:ufbas` of production. A change of either changes published data and takes effect only after the file is copied into its Cirilo datastream again and the objects are re-ingested.

With the update `ufbas-TORDF-ontology.xsl` takes the place of `ufbas-TORDF.xsl` in `cirilo:ufbas`. It is one stylesheet for both TEI objects, which inherit it through `cirilo:TEI.ufbas`. It derives the refactored RDF of the edition under the domain ontology from `o:ufbas.1563` and the SKOS concept scheme of the taxonomy from `o:ufbas.kategorien`, reads nothing but its input document, and writes only terms of `data/ontology/ufbas.ontology.ttl` of gams-www and the GAMS ontology ([domain.md](domain.md#domain-ontology)). The re-ingest of both objects then replaces the RDF of 2017, which the search queries and the Exploration view of the refactored site no longer read.

### RDF transformation

`ufbas-TORDF.xsl`, the production copy, writes the `gams.uni-graz.at` namespaces of the queries on every instance, since they are identifiers, not addresses. The SVN version in gams-www commit `e0d27f9` binds them to the former glossa server. Run locally on the TEI in `tei/`, it gives the published `RDF` datastreams of the edition and the taxonomy exactly, apart from the form of generated identifiers, which `npm test` checks with `test/rdf.test.mjs` ([testing.md](testing.md#guarantees)). The staging ingest of 2026-09-29 gave the RDF of the taxonomy byte for byte and that of the edition with the same resources. The RDF model is described in [data.md](data.md#rdf). `ufbas-TORDF-ontology.xsl` is checked against the TEI by `test/rdf-ontology.test.mjs` and `test/skos.test.mjs`, and against Saxon for Java by `saxon-check.mjs`.

### Switching the graph page

The `STYLESHEET` reference of `query:ufbas.graph` is set to the new stylesheet in the same step as the GAMS update. Until then the page renders with the 2017 shell, which loads Bootstrap and jQuery from `/lib/` and files from `/ufbas/` that the refactoring deleted (`css/navbar.css`, `js/jquery_scrolltotop.js`, `js/scrolldown.js`, `js/d3.tip.v0.6.3.js`). Its quick search sends a field `$1`, which the new `buildquery.js` answers with the message for an empty search. An update without the switch leaves the graph page unstyled and its search broken. The query object stays so that its addresses keep working, and `ufbas-graph.xsl` forwards to the Exploration page with the category in the fragment, since GAMS answers unknown query parameters with 404. No external link to the graph query is known. The 2017 paper cites a graph under `context:ufbas/StrafeStrafandrohung`, a different URL whose target was not checked, and it stays untouched.

## Presentation layer

Every page stylesheet includes `ufbas-static.xsl`, declares `$pageCss` and supplies a template named `content`, except `ufbas-ontology.xsl`, which imports `ufbas-context.xsl` and sets its mode.

| File | Object | `$pageCss` | Renders |
|---|---|---|---|
| `ufbas-static.xsl` | all | | Shell, navigation, quick search, footer, imprint text, `uf:date` |
| `ufbas-context.xsl` | `context:ufbas` | `context`, `exploration` for `mode=exploration`, `ontology` for `mode=ontologie` | Home page, project text from `ABOUT`, imprint, Datenkorb page, Exploration page, page Ontologie |
| `ufbas-object.xsl` | `o:ufbas.1563` | `edition` | Edition with view switch, marking switches, table of contents by date, entries with marked annotations and Datenkorb switches, and the page image pane |
| `ufbas-category.xsl` | `o:ufbas.kategorien` | `categories` | Category page with links to the entry list and, where the view has a filter, to the Exploration view |
| `ufbas-search.xsl` | the three search queries | `search` | Empty advanced form, result pages, category browse |
| `ufbas-graph.xsl` | `query:ufbas.graph` | `search` | Forward to the Exploration view |
| `ufbas-ontology.xsl` | `o:ufbas.ontology` | `ontology`, from `ufbas-context.xsl` | The page Ontologie, which `ufbas-ontology.xsl` imports from `ufbas-context.xsl` with the mode `ontologie`. The input, the `ONTOLOGY` datastream, only marks the navigation item. |

The shell builds, in order, the head with `css/template.css`, `css/{$pageCss}.css`, the print styles and the three shared scripts with `defer`, a skip link, the green header, the navigation `nav.site-nav` with the quick search `#volltextsuche` and the Datenkorb count in `#datenkorbstatic`, `main#main`, and the footer. It derives the current page from the input document (TEI PID, `mode` of `context:ufbas`, a `params` value with the project namespace for category browse and graph, every other query page as search) and marks it with `aria-current="page"` and the body class `page-<name>`.

The page head of `ufbas-static.xsl` links Droid Serif and Open Sans from the fonts GAMS serves under `/assets/fonts/` ([GAMS.md](../GAMS.md#knowledge)). `css/template.css` holds the tokens, the shell and the shared components (`.panel`, `.page-head`, the tools column `div.with-tools > aside.tools + div.main-col`, the entry item `ol.entry-list > li.entry-item`, chips, source icons, buttons, form fields). Each page type adds `css/context.css`, `edition.css`, `categories.css`, `search.css`, `exploration.css` or `ontology.css`, and `css/ufbas_print.css` applies to print. Visual decisions are in [design.md](design.md).

| Script | Loaded by | Does |
|---|---|---|
| `js/datenkorb.js` | every page | Datenkorb in `localStorage` under `ufbas.datenkorb`, one-time takeover of the 2017 key `itemsArray`, count in the navigation, the `.basket-check` switches, the Datenkorb page with sorting, removal, CSV and clearing, sync across tabs |
| `js/buildquery.js` | every page | Builds `params` from both search forms, reports errors at the form, fills the example searches, restores the form state on the result page |
| `js/highlighting.js` | every page, effective on the edition | The "Im Text markieren" switches, the tip with the labels of marked annotations, the annotation index of an entry built on demand, tips of the editorial notes, table of contents following the reading position |
| `js/edition-views.js` | edition page, after `highlighting.js` | The views "Text" and "Text und Bild" with the default by width and their state in the fragment of the address, the table of contents behind a button where the tools are a bar, the page image pane following the reading line, the folio labels as buttons |
| `js/openseadragon-6.1.1/openseadragon.min.js`, `data/ufbas-facsimile.json` | loaded by `edition-views.js` when "Text und Bild" is first chosen | Viewer and image services of the page images |
| `js/results.js` | result pages of search and category browse | The collapsed form on narrow screens, the CSV of the hits, and on a category browse one year at a time |
| `js/exploration.js` | Exploration page | Reads `query:ufbas.exploration` once, keeps the selection in the fragment, draws the marks of the entries in SVG, the filter menus, the legend and the entry table, CSV of the selection |

No generated page contains inline JavaScript. Script data travels as `<script type="application/json">`.

### Edition page

Every annotated element of the groups Person, Tat, Strafe, Ort and Schlagwort becomes `span.ann` with its group in `data-group` and the terms of its categories in `data-label`, and an element in several groups nests one span per group, since a span carries one mark. An annotated note is itself the annotation span, because a float takes no underline from its parent. The switches "Im Text markieren" set a class `mark-<group>` on `.edition-body`, and `edition.css` draws the marks in fixed slots and gives the labels to screen readers as visually hidden generated content. The heading row of an entry with annotations holds `button.index-toggle`, which builds `div.entry-index` after the entry text on first use. Page breaks carry the image number of `pb/@facs` in `data-facs`. The page head `div.edition-head` sets title and dates beside `div.head-side`, which holds the view switch `fieldset.view-switch` of the named template `view-switch`, the source icons and the citation with its handle. The pane `section.facsimile` inside `.edition-layout` names the dataset and the viewer in `data-images` and `data-viewer`, and `edition-views.js` sets `data-ansicht` on `.edition-layout`. The view and the marked groups travel in the fragment as `#Eintrag-12&ansicht=bild&markierung=Person,Strafe`, since GAMS answers the edition URL with a query parameter by 404 (short form) or 500 (`sdef:TEI/get`), checked on 2026-09-24. The images are IIIF Image API 2 level 0 on an object store that sends CORS headers for `gams.uni-graz.at` only, so the viewer uses the canvas drawer, which shows tiles as plain images on every host. The width of every container is `--page-max` of `template.css`, 75rem, which `edition.css` raises to 120rem on `body.page-edition`.

### Graph page

`ufbas-graph.xsl` reads the category from `params` and the taxonomy, and forwards by a refresh without delay, with a link beside it, to the Exploration view with the category selected, or to its entry list where the view has no filter for it. The result of `query:ufbas.graph` is not read.

### Exploration page

`context:ufbas` with `mode=exploration` renders the page head with a status line, the containers of the view and a data island `#explore-data` with the address of `query:ufbas.exploration`, the edition, the categories of the taxonomy that have a filter (id, term, gloss, filter, sanction group), the four sanction groups and the months of the cut-out pages. Which filter holds a category is `uf:facet` of `ufbas-static.xsl`, shared with the category page and the category browse, whose links open the view with the category selected. `js/exploration.js` fetches `sdef:Query/getJSON` once, which GAMS sends as `text/plain`, parses one entry per row ([data.md](data.md#rdf-as-source-of-the-exploration-view)) and counts everything in the browser. The selection travels in the fragment as `#tat=TatDiebstahl&strafe=StrafeAusweisung&klasse=ausweisung&zeit=1565-09&geschlecht=f&ansicht=tat&sortierung=ausweisung&eintrag=Eintrag-12`. Values of gender, sanction class and time combine by or, those of the other filters by and, and filters by and. A filter counts over the selection without its own filter if it combines by or, the sanction profile of a row over the selection without the class filter. The marks keep their element between redraws, so a change of view or width moves them, and a copy of an entry with several offences appears at its mark and returns there. A redraw returns the focus to the control with the same `data-key`. The Datenkorb switches of the table are those of the search pages, and `datenkorb.js` exposes `sync` so that the view sets their state after it drew them. Without script a `noscript` pointer to the category page stands in, and an unreadable answer leaves a message in the status line. The query reads the refactored RDF, so the page shows entries on GAMS only after the re-ingest. Locally `sparql.mjs` answers it with Oxigraph on the RDF that `ufbas-TORDF-ontology.xsl` derives from `tei/` ([testing.md](testing.md#exploration-view)). Blazegraph runs it first on staging, after the operator set the object and re-ingested the TEI objects.

## Search

Two forms and a category browse are answered by query objects whose SPARQL contains the placeholders `$1` and `$2`. `js/buildquery.js` fills them and calls `sdef:Query/get`, the category page links its query directly, and `ufbas-search.xsl` renders every result list. The query texts are kept in `gams/query/`, one file per query object named after its PID without `query:`.

### Queries

The search queries read the refactored RDF, the entry text and the text of every span as `gams:textualContent` and the categories as `ufbas-ont:category`. That text keeps the marginal notes of the manuscript and leaves the editors' notes out, so a term that stands only in an editors' note no longer finds its entry. On GAMS they answer only after the re-ingest.

- `query:ufbas.search` serves both forms. A subquery finds the hits, entries whose text matches the fragment in `$2`, bound with their Urfehde date as `?datum`. Only for these hits are the offenders and the categories whose span text contains `$1` added, and `ufbas-search.xsl` groups the rows by entry, since every combination of offender and matching category is a row. `$1` is compared as one literal string.
- `query:ufbas.volltext` runs a full-text match on `$1`, or finds the entries that name a place of that name, for old bookmarks.
- `query:ufbas.kategorien` takes a category IRI in angle brackets as `$1` and answers one row per span of the category. A gender token is a person attribute in the refactored RDF, so the query also finds the persons whose gender the concept names by `skos:exactMatch`.
- `query:ufbas.graph` keeps its text of 2017 on the RDF of 2017. The graph page does not read its answer ([Graph page](#graph-page)).

### Forms

The quick search `form#volltextsuche` and the advanced search `form#SucheErweitert` both send `query:ufbas.search`, with the fields `Stichwort`, `regex`, `von` and `bis`. Terms are separated by spaces. A plain term must occur, a term with `|` is an alternative, a term with `-` is excluded.

- Full text. `$2` combines `?inhalt bds:search "…"` with `bds:matchAllTerms "true"` for the required terms, one `UNION` branch per alternative, a further branch for the entries that name a place of the place list whose name is the search text (`ufbas-ont:mentionsPlace`, so a place name finds every spelling of the place), and one `MINUS` per excluded term. Blazegraph matches whole tokens case-insensitively, a trailing `*` matches word beginnings, and the quick search appends it to every required term.
- Regular expressions. `$2` is a `FILTER` of `regex()` calls combined with `&&` and `!`, each term bounded by a class of non-letters on a copy of the text padded with spaces, disjunction written as `!(!A && !B)`. The place branch joins it the same way, as `!(!(…) && NOT EXISTS { … })`.
- Date range. `von` and `bis` take a year, month or day and include the boundary, compared as strings on the coded Urfehde date `?datum` (`?datum <= "1566~"`, where `~` sorts after every digit). A range without terms sets `$1` to `~`.

Excluded terms and the date range follow the positive branches in `$2`, so they hold for the place branch as well.

`buildquery.js` rejects input that cannot work (only excluded terms, nothing to search, an invalid regular expression, a malformed date, `|` or backslash inside a term) and strips quotes, semicolons, braces and angle brackets. `$2` is SPARQL written by the client, and the endpoint only reads, so the exposure is limited to query load. Four example buttons fill the advanced form with `wyn |win`, `w[yi]n`, `Dieb*` and the year 1565 without sending it.

### Parameter channel

The value of `params` is `$1|…;$2|…`, tested on 2026-09-24 and 2026-09-23 ([code-audit-report-2026-09-23.md](../snapshots/code-audit-report-2026-09-23.md#search)).

- A `|` inside a value invalidates the query, probably because GAMS splits at it. This rules out `||` and regex alternation in parameters. Stored `QUERY` texts accept `|` and property paths such as `skos:broader*`, shown on DEPCHA queries on production.
- A backslash does not reach Blazegraph intact, so `\b` cannot be used.
- GAMS decodes the value twice. `buildquery.js` encodes `%` and `+` once before encoding the whole value, and the stylesheet turns `%2B` and `%25` back.
- A single quote in `$1` would close the literal `'$1'`, so the form removes it.

### Result page

`ufbas-search.xsl` reads terms, mode and dates back from `$params`. An empty value gives the advanced form. Otherwise the page head names the query and the hits and offers the icons for all hits into the Datenkorb and as CSV and, on a category browse, into the Exploration view. The CSV is built in the browser from the result page with the columns of the Exploration and Datenkorb CSV, where offences, sanctions and keywords hold only the categories the page shows for a hit, and gender, origin and procedure stay empty unless the browsed category is one of them. The XLS table through `getHSSF` is gone. The tools column holds the refilled form and links to the first hit of each year. Hits are entry items sorted by date, with an excerpt of up to three windows of context, the matching categories as chips with their group named, and the whole text in a closed `details`. Full-text terms are highlighted as word beginnings. A regular expression is highlighted only when it consists of letters, digits, `.`, `-`, classes of letters and quantifiers and cannot match the empty string, because `analyze-string` aborts the page otherwise. GAMS answers an invalid query with the endpoint address as text, and the page then reports that the query could not be run.

## Repository structure

The project has two repositories since 2026-10-27, following the ZimLab template for `gams-www`. gams-www holds only what GAMS serves, ufbas-data everything that describes, checks or feeds it. Paths in the knowledge documents are relative to ufbas-data, except the page stylesheets `ufbas-*.xsl`, `css/`, `js/`, `img/`, `data/ufbas-facsimile.json` and `data/ontology/`, which lie in gams-www.

gams-www, https://zimlab.uni-graz.at/gams/projects/ufbas/gams-www, whose root is the served folder `/ufbas/`:

| Path | Content |
|---|---|
| `ufbas-static.xsl`, `ufbas-context.xsl`, `ufbas-object.xsl`, `ufbas-search.xsl`, `ufbas-category.xsl`, `ufbas-graph.xsl`, `ufbas-ontology.xsl` | The page stylesheets, referenced by the `STYLESHEET` datastreams |
| `css/`, `js/`, `img/` | Styles, scripts with the vendored OpenSeadragon, images |
| `data/ufbas-facsimile.json` | The image services of the page images, read at runtime through `$server` |
| `data/ontology/` | The ontology in Turtle, its RDF/XML as target value of the `ONTOLOGY` datastream of `o:ufbas.ontology` and its JSON-LD, the SHACL shapes in Turtle and RDF/XML, and `ufbas.example.rdf`, the derivation of `Eintrag-0` shown on the page Ontologie. `local-test-build/make-ontology.mjs` writes the RDF/XML and JSON-LD from the Turtle, and `local-test-build/derive-rdf.mjs` writes the example. The page Ontologie reads the ontology, the shapes and the example through `$server` with `document()` and offers them as downloads, the first page that reads files of the served folder. On staging on 2026-09-29 the page rendered completely through the reads of ontology and shapes, and GAMS served `.ttl` as `text/turtle` and `.jsonld` as `application/ld+json`. The read of the example, added on 2026-10-21, is not yet checked there |
| `README.md`, `LICENSE` | Project description after the ZimLab template, MIT licence of the code |

ufbas-data, https://github.com/chpollin/ufbas-data:

| Path | Content |
|---|---|
| `tei/` | The TEI of `o:ufbas.1563` and `o:ufbas.kategorien`, byte for byte the published datastreams, one file per object and the ingest source of its object ([Ingest](#ingest)) |
| `rdf/`, `derived/`, `generated/` | The published RDF of 2017, the derived datasets and the untracked output of the TEI analysis, all of the data package ([README.md](../README.md#files)) |
| `gams/ufbas-TOTEI.xsl`, `gams/ufbas-TORDF.xsl` | The ingest transformations of `cirilo:TEI.ufbas` and `cirilo:ufbas` as production runs them |
| `gams/ufbas-TORDF-ontology.xsl` | The `TORDF` of `cirilo:ufbas` after the update, deriving the refactored RDF of the edition and the concept scheme of the taxonomy ([Ingest](#ingest)) |
| `gams/query/` | The `QUERY` texts of the objects maintained by the project, one file per object. The legacy `query:ufbas.alkohol` remains on production only |
| `gams/datastreams/` | Mirrors of further GAMS datastreams, named `<pid>.<DSID>` with `:` replaced by `-`, and explicitly listed prepared target values ([testing.md](testing.md#guarantees)) |
| `source-material/` | Older taxonomy files, the TEI part files of the 2016 course and the IIIF manifest of the Digitaler Lesesaal ([data.md](data.md#sources)) |
| `local-test-build/` | Local rendering of the gams-www checkout, preview, checks and the generators of derived files ([testing.md](testing.md)) |
| `research-artefacts/` | Curated tables from the research of 2026-09-24, with provenance in their README |
| `knowledge/`, `snapshots/` | Project knowledge and dated reports |
| `AGENTS.md`, `GAMS.md`, `CLAUDE.md` | Working rules for agents in both repositories |
