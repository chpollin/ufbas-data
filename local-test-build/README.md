# local-test-build

Local rendering of the UFBAS pages, checked before a change of gams-www is pushed to ZimLab `main` and reaches staging. The harness has two roots, set in `gams.mjs`. `dataRoot` is ufbas-data, the parent of this folder. `root` is the gams-www checkout with the page stylesheets and the served files, by default `ZIMLAB/ufbas` beside the ufbas-data folder and otherwise the path in the environment variable `UFBAS_WWW`, and the harness stops when it finds no `ufbas-static.xsl` there.

SaxonJS runs the page stylesheets of gams-www with their production URI as static base URI, so the server-relative `document()` calls resolve against a pool of datastreams. The TEI comes from `../tei/`, other datastreams from `../gams/datastreams/` where a mirror exists and otherwise once from production into `cache/`. Until the operator ingests `o:ufbas.ontology`, its `ONTOLOGY` datastream comes from `../ontology/ufbas.ontology.rdf`, in the pool and in both local servers, a deliberate shortcut named `localDatastreams` in `gams.mjs` and removed after the ingest. `derive-rdf.mjs` derives the refactored RDF and the SKOS of the taxonomy from the TEI with `../gams/ufbas-TORDF-ontology.xsl`, and `sparql.mjs` runs the query texts of `../gams/query/` on it with Oxigraph, so the preview and the tests answer the search and Exploration queries as GAMS will after the update. The preview serves `/ufbas/` from the gams-www checkout.

```
npm install
npm test                         # build every page type, then all checks, with UFBAS_OFFLINE=1 only from cache/
npm run build -- [page ...]      # render pages into build/ without checks
npm run browser -- [page ...]    # only the check in headless Chrome or Edge, on the last build
npm run serve                    # local preview on http://127.0.0.1:8771/context:ufbas
node abnahme.mjs abnahme.json    # acceptance sheet from the running preview
SAXON_JAR=… node saxon-check.mjs # stylesheets and ingest in Saxon-HE for Java, needs Java and the Saxon jar
node make-ontology.mjs           # write the RDF/XML and JSON-LD of the ontology and ufbas.shapes.rdf in ../ontology/ from its Turtle
node derive-rdf.mjs              # write ../ontology/ufbas.example.rdf, build/ufbas.1563.ontology.rdf and build/ufbas.kategorien.skos.rdf
node make-exploration-data.mjs   # write build/ufbas-exploration.json, the TEI reference of the Exploration view
node make-facsimile-tei.mjs      # write the page images into ../tei/ufbas.1563.xml from the Lesesaal manifest, after a storage move with --manifest=<file> --retrieved=<date>
node make-baseline.mjs           # render baseline/ with the stylesheets of 2017, run by npm test when missing
npm run compare -- [page ...]    # compare rendered pages with production
```

What the checks guarantee, the preview server, the pages of the build and the reads of production are described in [../knowledge/testing.md](../knowledge/testing.md).

## Comparison with production

`compare-production.mjs` renders each page type and compares it with the production page after normalising serializer details and `generate-id()` values, which differ between Saxon on GAMS and SaxonJS. On the code of 2017 all pages matched on 2026-09-23 except the category browse, whose query has no `ORDER BY` and returns rows in a different order on every run. After the refactoring the comparison shows what the new code changes until the GAMS update has been run.

An invalid query, including an empty `params` value, is reproduced as a result document without `results` element, which is what the stylesheet receives on GAMS.
