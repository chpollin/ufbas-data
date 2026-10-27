---
title: GAMS
method:
  name: Promptotyping
  url: https://dhcraft.org/Promptotyping/
template:
  name: Vorlage Architecture
  version: 0.4
  url: https://dhcraft.org/Promptotyping/promptotyping-document/architecture
status: draft
created: 2026-10-26
updated: 2026-10-27
authors: [Christopher Pollin]
generated-with: Claude Code (Claude Opus 5.5)
related: [knowledge/architecture.md, knowledge/testing.md, AGENTS.md]
---

# GAMS

Proposed shared working rules for agents in projects rendered by GAMS (Geisteswissenschaftliches Asset Management System, University of Graz), whatever agent tool does the work. These rules are binding locally in UFBAS. Adoption across projects and the canonical maintenance location remain undecided. This copy is derived from UFBAS and kept in its repository ufbas-data, whose [AGENTS.md](AGENTS.md) names the files and checks that apply each rule there.

## Rules

Each rule names its enforcement mechanism where implemented and any remaining gap. Tests, git hooks, CI and access restrictions have the scope provided by their configuration. A project's own rule file identifies the mechanisms it uses and their limits.

- The GAMS update and every Cirilo change are done by the operator, never by an agent. Required access restriction: agents receive no Cirilo or GAMS write account. Actual account provisioning must be verified separately.
- An agent keeps the target value of each datastream the operator sets in the repository and, after the change, verifies it read-only through the datastream URL. Enforced by: not yet.
- No request loops, no parallel agents fetching GAMS pages. Enforced within UFBAS `fetchCached` by a queue and request budget per process. Processes share no global queue or lock. Coordination between processes and agents remains a workflow rule. `UFBAS_OFFLINE=1` blocks cache-miss requests through this helper only. Other network tools and direct API calls are outside that restriction.
- An answer of GAMS that a check needs is saved once as fixture and reused. Enforced by: the project's local harness, where it has one.
- The ingest transformations kept in the repository are copies of what the project environment objects run. A change of either changes published data and needs a re-ingest. Enforced by: project test, where a project compares its transformations with saved production datastreams or published RDF. A cached reference establishes the saved state. Its controlled renewal is required before asserting the current live state.
- Mirrored datastreams are refreshed from GAMS and never edited as the source, except as a prepared target value named in the commit. Enforced by: project test, where a project compares its copies with cached production references. After an operator change, the relevant reference must be renewed in a controlled, sequential read documented with its date and scope before that test can confirm the new state.
- A changed query text is a target value that the operator sets in the `QUERY` datastream. Enforced by: not yet.
- Page stylesheets use no XSLT 3.0 construct and emit no empty non-void element. Enforced by: project test, where a project has a local harness.
- The page shell reads its assets from a base set per environment, so the same commit renders on staging and production. No host or project path is written into a page or script. Enforced by: project test, where a project renders one commit for both environments.

## Judgement

Criteria for decisions that stay with the model and the reviewer.

- Load on GAMS. Production and staging are read sequentially and sparingly. Datastream reads are cheap, rendered pages cost a server-side transformation each, and the IIIF image server is the most sensitive, so checks in loops and repeated full renderings belong in a local harness. A read is worth it when no fixture answers the question.
- Client or backend. Counting and filtering in the browser on one query answer spares GAMS a query per filter. Work belongs on GAMS when the browser would load a whole edition or when the result must stay reachable without script.
- Long-term availability. What GAMS serves as stored datastreams and files of the project folder outlives code that depends on a service beside it. A library a page needs is vendored in the project or taken from the shared assets GAMS serves under `/assets` and `/lib/` ([Knowledge](#knowledge)) rather than loaded from a CDN, and the choice between the two weighs the project's own control against GAMS-wide maintenance.
- Whether a rework pays off. A rework of a page or transformation pays off when it removes a defect readers meet, a dependency that will break, or a step the operator repeats by hand. Published content, TEI and RDF, carry the higher bar, since every change needs a re-ingest.

## Traps

Traps that have cost GAMS projects time, collected with the operator and extended when a new one is met. Each row names what an agent sees, the cause and what guards against it. A cause known only from one project says so.

| Symptom | Cause | Guard |
|---|---|---|
| Cirilo refreshes objects that should not have changed | Cirilo was connected to another repository, and an ingest with a PID refreshes the object of that PID there | The operator checks the repository before every ingest |
| `ingest.log` says "refreshed", but the RDF is old | "refreshed" proves an updated TEI only | The `RDF` datastream is read after the ingest |
| A new object renders with a generic layout, an updated one with an old stylesheet | A new object gets the stylesheet of its content model, an updated one keeps its references | The target references are kept in the repository and set by the operator |
| A query does not find a new object | The query names its graphs with `FROM`, and the graph of the new object is not among them (observed in projects) | Graph lists are reviewed when an object is added |
| A list driven by object metadata cannot filter by a property of the project RDF | Object metadata come from Mulgara, the project RDF lies in Sesame (observed in projects) | Such a list is built on a query of the project RDF |
| Values from another object are missing in the RDF, and the ingest reports no error | `document()` in `TORDF` reached no object, which yields an empty result without failing (inferred in SZD) | A test of the transformation fails when a lookup returns nothing |
| A page breaks after a harmless change | An empty non-void element, which browsers parse as HTML (inferred in UFBAS) | Local harness |

## Knowledge

GAMS and its client Cirilo are documented in Steiner and Stigler, *GAMS and Cirilo Client. Policies, Documentation and Tutorial* (last updated 2022-06-28, https://hdl.handle.net/11471/521.1.1), which the statements below follow unless they say otherwise. Where a statement below rests only on what projects observed, it says so. The details of UFBAS are in [knowledge/architecture.md](knowledge/architecture.md).

- Stack. GAMS is built on Fedora Commons, and the Cirilo documentation of 2022 names Fedora 3.x except 3.7 as the tested version. Pages are served through Apache Cocoon, whose i18n module carries multilingual interface texts. Cirilo works on the management API of Fedora. Persistent identifiers come from the handle server of the institute with the prefix 11471, recorded in `RELS-EXT`.
- Objects. Every object is an instance of a content model, which fixes the types of its datastreams and the dissemination methods working on them, and only the repository administrator can change a content model. PIDs start with `o:` for data objects, `context:` for contexts and `query:` for queries, and an ingested source with the PID of an existing object refreshes that object. Every object carries `DC`, `RELS-EXT`, `THUMBNAIL`, `STYLESHEET`, `FO_STYLESHEET`, `BIBTEX`, `QUERY` and `QR`. A method is addressed as `<PID>/<sdef>/<method>`, in the long form `/archive/objects/<PID>/methods/<sdef>/<method>`, for example `sdef:TEI/get`, `sdef:Context/get` or `sdef:Query/get`, and projects also use `getJSON`, `getXML`, `sdef:SKOS/get` and `sdef:IIIF/getManifest`. A datastream is read at `/archive/objects/<PID>/datastreams/<DSID>/content`. A context lists the objects whose `RELS-EXT` names it with `isMemberOf`, and its `QUERY` datastream, a query to Mulgara, gives the `METADATA` its pages see.
- Project environment. Most system datastreams of an object are redirects to the initializer object `cirilo:Backbone`, so a change there reaches every object. Cirilo can create per project an initializer `cirilo:<project>` with its own TEI, LIDO and context models (`cirilo:TEI.<project>`, `cirilo:Context.<project>`, which the documentation also writes in lower case). Objects of these models take their system datastreams from the project initializer, so a change of a mapping or stylesheet there reaches every object of the project. `TOTEI` and `TOMETS` come from the project environment when a project user is logged in or chosen as owner of the ingest, else from `cirilo:Backbone`. Projects place `TORDF` differently, inline in the initializer or as a redirect to the mirror.
- Triple stores. Mulgara, built into Fedora, holds `RELS-EXT`, context membership and what `RDF_MAPPING` writes to `RELS-INT`. `TORDF` writes its RDF to an openRDF Sesame repository, with Blazegraph integrated for full text, and a copy to the `RDF` datastream. The endpoints are `/sesame/sparqlendpoint` and `/mulgara/sparqlendpoint`. Projects observe one named graph per object with its PID as graph name.
- Transformations. `TOTEI` and `TORDF` run at the ingest, the page stylesheets at every request. At the ingest a transformation has no http base URI, so a relative `document()` finds nothing, while an absolute GAMS URL is read. SZD reads its index objects that way in `TORDF`. UFBAS infers from the regular expression errors of the server that Saxon runs the stylesheets as XSLT 2.0, and that browsers parse the XML output as HTML, which is why an empty non-void element breaks a page.
- Shared assets. GAMS serves libraries, fonts and logos for all projects under `/assets`, which the ZIM template gams-www (https://zimlab.uni-graz.at/gams/projects/templates/gams-www) addresses through its variable `gamsAssetsRootPath`, and an older versioned tree under `/lib/` (`/lib/2.0/`, `/lib/3.0/`). Neither tree lists its contents, so a file is known only from a project that references it. Referenced by the template and reachable on 2026-10-27 were Open Sans and Droid Serif under `/assets/fonts/`, jQuery 3.6.0, Bootstrap 5.0.2, gamsJS 1.x and OpenSeadragon 2.0 (`/assets/lib/editionviewer/`) under `/assets/lib/`, and Open Iconic and the gamsJS widget injection under `/lib/`. A version there is fixed for all projects, so a project that needs another version or a font GAMS does not serve vendors it in its gams-www repository.
- Environments. Where a project has staging and a gamsdev mirror, the mirror is a checkout of one branch of the project's gams-www repository on the GAMS server (`main` in UFBAS and DEPCHA, `develop` in SZD), synced with `git fetch` and `git reset --hard` to that branch and never edited, and staging renders from it. Staging is reachable only from the university network or over VPN. Production changes with the operator's GAMS update and also with every Cirilo setting and ingest the operator makes there, which are public at once.
- Ingest. Cirilo ingests every file of the chosen folder and its subfolders, validates each and writes a log to that folder, and a simulation runs the same without writing. A change of a transformation the objects reference reaches the data only in the order push, mirror sync, ingest, and registers are ingested before the holdings that cite them.
- Parameters. The documented parameters are `locale`, `mode` and `context` for object and context methods and `params` for query objects, and a stylesheet receives them as `xsl:param`. Projects observe that GAMS rejects other query parameters with HTTP 404 or 500 depending on the form of the URL, so client state belongs in the fragment of the URL. A query object is filled from `params` as `$1|…;$2|…`, its placeholders written `$1`, `$2`, for example `query:depcha.dashboard/methods/sdef:Query/get?params=$1%7C%3Chttps://gams.uni-graz.at/context:depcha.ssps%3E` with an IRI in angle brackets. In UFBAS a `|` inside a value broke the query, probably because GAMS splits at it, and the value arrived decoded twice, observed in one project only ([knowledge/architecture.md](knowledge/architecture.md#parameter-channel)).

Where GAMS.md does not answer a question, an agent reads the section of the documentation that does, once and from the handle URL, and records what it needed in the project's knowledge rather than reading again.

| Question | Section of the documentation |
|---|---|
| Object types, datastreams and methods, URL patterns | Content models, with "FEDORA and its object model", "Content models in Cirilo" and "The FEDORA web interface and adressing conventions" |
| Parameters a stylesheet receives | Predefined parameters |
| PIDs and what an ingest with an existing PID does | How to assign PIDs, How to ingest objects |
| Redirected system datastreams and their groups | How to edit an existing object, How to manage the initializer object |
| Project initializer and project models | How to create project specific environments |
| Customised TEI and `TOTEI` | How to ingest text documents and customized TEI |
| `DC_MAPPING`, `RDF_MAPPING`, `TORDF` and the triple stores | How to semantically enrich your data |
| Query objects, placeholders and `params` | How to semantically enrich your data, part "cirilo:Query model" |
| Contexts and membership | How to organize collections |
| Ingest options of Cirilo | The 'Preferences' option and how to use it to configure your ingest scenario |
| Handles | How to manage handles |
