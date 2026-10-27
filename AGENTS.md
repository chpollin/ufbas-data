# AGENTS.md

Working rules for agents in the two UFBAS repositories, whatever tool runs them. This file lies in ufbas-data (https://github.com/chpollin/ufbas-data), which holds the knowledge, the local harness, the ingest stylesheets, the queries, the datastream mirrors and the data. The ZimLab repository gams-www (https://zimlab.uni-graz.at/gams/projects/ufbas/gams-www) holds only what GAMS serves from `/ufbas/`, the page stylesheets, `css/`, `js/`, `img/` and `data/`. Paths below are relative to ufbas-data unless they name gams-www. Read [GAMS.md](GAMS.md) first. It proposes shared GAMS rules that are binding locally in UFBAS together with this file. Their adoption across projects and canonical maintenance location remain open. Descriptions live in [README.md](README.md) and [knowledge/](knowledge/INDEX.md).

## Staging and production

- The refactoring preserves the edition text and TEI. The approved derived layers and the IMPRINT revision follow the exceptions below.
- Until production renders the refactored site ([plan.md](knowledge/plan.md#delivery)), edition text, TEI, RDF and the `ABOUT` datastream stay as published, and afterwards a change of content is the editors' decision. The `IMPRINT` datastream is revised for the current institution and the credit of the revision (ADR-20). Derived layers (the exploration dataset, the domain ontology) may add structure with its provenance and mark a doubtful value beside the published one without replacing it. A new data finding goes to `knowledge/data.md`, not into the TEI.
- A change is simulated locally before it is pushed. The harness renders the gams-www checkout beside ufbas-data (by default `ZIMLAB/ufbas` beside the ufbas-data folder, or the path in `UFBAS_WWW`), and `npm test` in `local-test-build/` passes before every push of gams-www, judged by its exit status, never read through a pipe, including the browser check, and the commit message names the check that ran ([knowledge/testing.md](knowledge/testing.md)). A push of gams-www goes to ZimLab `main` and reaches staging through the sync of the gamsdev mirror, after which the changed pages are looked at on staging.
- The Exploration view reads the RDF through `query:ufbas.exploration` once per page view and counts in the browser. `test/exploration-rdf.test.mjs` compares the answer with the TEI, and a new difference is documented in `knowledge/data.md` before the view shows it.
- `gams/ufbas-TORDF-ontology.xsl` derives the RDF of the edition and the concept scheme from the unchanged TEI. The data use only terms of `data/ontology/ufbas.ontology.ttl` in gams-www and the GAMS ontology, and a missing term goes into the ontology, never ad hoc into the data ([knowledge/domain.md](knowledge/domain.md#domain-ontology)).
- The Turtle files in `data/ontology/` of gams-www are the sources. Their RDF/XML and JSON-LD are written by `local-test-build/make-ontology.mjs` and never edited by hand.
- The SHACL shapes treat facts of the published TEI as warnings, counted exactly in `test/ontology.test.mjs`. A new warning or violation is documented in `knowledge/data.md` or fixed in the derivation before the count changes.
- `tei/` holds the ingest source of the TEI objects `o:ufbas.1563` and `o:ufbas.kategorien`, byte for byte the published datastreams, and `gams/query/` the texts of the query objects. `data/ontology/ufbas.ontology.rdf` of gams-www is the planned `ONTOLOGY` datastream of `o:ufbas.ontology`, which is not yet ingested.

## GAMS rules in UFBAS

How UFBAS applies the rules of [GAMS.md](GAMS.md).

- The target value of each datastream the operator sets stands in [knowledge/architecture.md](knowledge/architecture.md#cirilo-configuration).
- Answers of GAMS that the checks need are cached by `fetchCached` in `local-test-build/gams.mjs`, which serialises requests and limits their number within each process. Processes have separate queues and budgets. With `UFBAS_OFFLINE=1` this helper sends no requests and fails on a cache miss. It does not block network access outside the helper. Parallel processes and agents must coordinate their GAMS reads through the workflow.
- `gams/ufbas-TOTEI.xsl` and `gams/ufbas-TORDF.xsl` are the copies of the transformations of `cirilo:TEI.ufbas` and `cirilo:ufbas`. `test/mirror.test.mjs` requires both equal to cached production references and `test/rdf.test.mjs` the cached published RDF triple for triple from `gams/ufbas-TORDF.xsl`.
- `gams/datastreams/` holds the mirrored datastreams, which `test/mirror.test.mjs` compares with cached production references except the prepared target values it lists, and `gams/query/` the query texts. A current live-state claim requires a controlled renewal of the relevant reference ([knowledge/testing.md](knowledge/testing.md#reads-of-production)).
- The stylesheets are XSLT 2.0. `test/pages.smoke.mjs` fails on an empty non-void element, and `local-test-build/saxon-check.mjs` compiles every stylesheet in Saxon-HE 9.6 outside `npm test`.
- Paths into the served folder come from `$server`, and object links stay server-relative. `test/served-folder.test.mjs` renders one commit for production and staging and requires every asset of a page from `/ufbas/`, so a library comes from gams-www, never from a CDN.
- Search parameters contain no `|` and no backslash sequence ([knowledge/architecture.md](knowledge/architecture.md#parameter-channel)), checked by `test/search-params.test.mjs`. Stored query texts may use both.

## Read first

1. [knowledge/INDEX.md](knowledge/INDEX.md), then [knowledge/architecture.md](knowledge/architecture.md).
2. Depending on the task [knowledge/specification.md](knowledge/specification.md) for requirements and decisions, [knowledge/domain.md](knowledge/domain.md) for the meaning of entries, categories, marginal notes and amounts, [knowledge/data.md](knowledge/data.md) for TEI, RDF and data quality, [knowledge/design.md](knowledge/design.md) for the interface, [knowledge/plan.md](knowledge/plan.md) for open steps.

## Code

- Mirror the style of the file at hand (indentation, naming, `var` in the existing scripts). The pages load no framework, the scripts are plain JavaScript, and a vendored library (OpenSeadragon) loads only where it is used.
- Page stylesheets in gams-www include `ufbas-static.xsl` and contribute a `content` template, except `ufbas-ontology.xsl`, which imports `ufbas-context.xsl`. The page shell is never rebuilt in a page stylesheet. The page stylesheet names are referenced by GAMS objects and stay stable.
- Styles are `css/template.css` (tokens, shell, shared components) plus one file per page type, chosen by `$pageCss` in the page stylesheet. A rule used by several page types belongs in `template.css`.
- Accessibility and reflow are part of every change, checked by the browser check of `npm test` (axe-core for WCAG 2.2 A and AA, no horizontal scrolling from 320px).
- No middle dot (·) as a separator in any generated text, and no fact twice on a page ([knowledge/design.md](knowledge/design.md#principles)).
- A tooltip comes from `data-tip` (and `data-tip-on` for the on state of a switch), never from `title` beside it.
- No inline JavaScript in generated HTML. Data for a script travels as `<script type="application/json">`.
- Styles follow [knowledge/design.md](knowledge/design.md), with colours, radii and fonts from the tokens of `css/template.css`. A new design direction is shown to the operator in the local preview or on staging before it replaces the current one.
- Folio labels come from `uf:folio`, which counts the page breaks. The image number in `pb/@facs` is no folio.

## Knowledge

- Knowledge lives in ufbas-data. Knowledge documents are English and follow the Promptotyping conventions of the vault, each with its `template:` field. A durable finding goes into the document responsible for it, a dated measurement into `snapshots/`, a curated research table with its provenance into `research-artefacts/`.
- `knowledge/journal.md` gets one short entry per substantive session.

## Git

- Branch `main` in both repositories. Commits are English, imperative, stage explicit paths.
- Pushes of gams-www to ZimLab `main` are operator-gated and carry only a state whose local simulation passed. After a push the gamsdev mirror is synced, and staging shows the new state ([GAMS.md](GAMS.md#knowledge)).
