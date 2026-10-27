# /// script
# requires-python = ">=3.11"
# dependencies = ["lxml"]
# ///
"""Inventory UFBAS TEI without changing source bytes (standalone script).

Usage: uv run scripts/analyze_tei.py tei/ufbas.1563.xml --output generated/tei-analysis.json
Strict parsing deliberately overrides recover mode at the validation boundary.
Entities and DTD loading are disabled. See knowledge/tei-analysis.md for interpretation.
"""

import argparse
import hashlib
import json
import sys
from collections import Counter
from pathlib import Path

from lxml import etree

NS = {"t": "http://www.tei-c.org/ns/1.0"}
ID = "{http://www.w3.org/XML/1998/namespace}id"


def _name(e: etree._Element) -> str:
    return etree.QName(e).localname


def _record(e: etree._Element) -> dict:
    return {
        "tag": _name(e),
        "id": e.get(ID),
        "line": e.sourceline,
        "attributes": dict(e.attrib),
        "text": " ".join("".join(e.itertext()).split())[:300],
    }


def analyze(path: Path) -> dict:
    """Return observed structure and anomalies, without schema-validity claims."""
    raw = path.read_bytes()
    root = etree.fromstring(
        raw, etree.XMLParser(resolve_entities=False, no_network=True, recover=False)
    )
    if root.tag != f"{{{NS['t']}}}TEI" or root.getroottree().docinfo.doctype:
        raise ValueError("Expected TEI namespace and no DTD. Check downloaded source.")
    body = root.find("t:text/t:body", NS)
    if body is None:
        raise ValueError("Missing TEI text/body. Check downloaded source.")
    elements = list(root.iter())
    ids = Counter(e.get(ID) for e in elements if e.get(ID))
    entries = [e for e in body.iter() if "#uf_Eintrag" in e.get("ana", "").split()]
    entry_set = set(entries)
    annotations = Counter(a for e in elements for a in e.get("ana", "").split())
    unresolved = []
    for e in elements:
        for attr in ("ref", "target", "resp", "change", "spanTo"):
            for token in e.get(attr, "").split():
                if token.startswith("#") and token[1:] not in ids:
                    unresolved.append({**_record(e), "attribute": attr, "token": token})
    dates = list(body.iter(f"{{{NS['t']}}}date"))
    oath_dates = [e for e in dates if "#uf_DatumUrfehde" in e.get("ana", "").split()]
    backwards = []
    previous = None
    for e in oath_dates:
        if e.get("when"):
            if previous is not None and e.get("when") < previous.get("when"):
                backwards.append({"previous": _record(previous), "current": _record(e)})
            previous = e
    examples = {}
    for identifier in (
        "Eintrag-0",
        "Eintrag-2",
        "Eintrag-132",
        "Eintrag-133",
        "Eintrag-188",
        "Eintrag-439",
        "placeName-564",
        "Urfehdeeid-228",
    ):
        e = next((e for e in elements if e.get(ID) == identifier), None)
        if e is not None:
            examples[identifier] = {
                **_record(e),
                "xml": etree.tostring(e, encoding="unicode", with_tail=False),
            }
    return {
        "source_sha256": hashlib.sha256(raw).hexdigest(),
        "bytes": len(raw),
        "strict_xml_parse": True,
        "schema_validated": False,
        "elements": dict(sorted(Counter(_name(e) for e in elements).items())),
        "body_children": dict(Counter(_name(e) for e in body)),
        "duplicate_ids": {k: v for k, v in ids.items() if v > 1},
        "entry_marker_tags": dict(Counter(_name(e) for e in entries)),
        "unmarked_body_divs": [
            _record(e) for e in body.findall("t:div", NS) if e not in entry_set
        ],
        "annotations": dict(sorted(annotations.items())),
        "ana_tokens_not_local_ids": sorted(
            a for a in annotations if a.startswith("#") and a[1:] not in ids
        ),
        "unresolved_local_references": unresolved,
        "empty_annotations": [
            _record(e)
            for e in elements
            if e.get("ana") and not "".join(e.itertext()).strip()
        ],
        "annotations_outside_entries": [
            _record(e)
            for e in body.iter()
            if e.get("ana")
            and e not in entry_set
            and not any(p in entry_set for p in e.iterancestors())
        ],
        "date_calendars": dict(Counter(e.get("calendar", "<absent>") for e in dates)),
        "oath_date_range_as_encoded": [
            min(e.get("when") for e in oath_dates if e.get("when")),
            max(e.get("when") for e in oath_dates if e.get("when")),
        ],
        "backwards_oath_dates": backwards,
        "measure_review_candidates": [
            _record(e)
            for e in body.iter(f"{{{NS['t']}}}measure")
            if not e.get("quantity") or not e.get("unit") or e.get("type") != "currency"
        ],
        "examples": examples,
    }


def _check(source: Path) -> None:
    """Check the frozen source and boundary rejection using the real fixture.

    Malformed XML and DTD inputs are synthetic because the corpus is well-formed.
    """
    import tempfile

    before = source.read_bytes()
    first = analyze(source)
    if (
        first["source_sha256"]
        != "8b3aaac90296eae8f347df396ad1d0777ea47a8aa5aada536b8a207aafbee1af"
    ):
        raise ValueError("Self-check requires the documented UFBAS fixture.")
    assert first == analyze(source), "Inventory must be deterministic"
    assert source.read_bytes() == before, "Source bytes changed"
    assert first["examples"]["Eintrag-133"]["tag"] == "p"
    assert not first["duplicate_ids"]
    assert any(e["id"] == "Urfehdeeid-228" for e in first["empty_annotations"])
    assert any(e["token"] == "#Modon" for e in first["unresolved_local_references"])
    with tempfile.TemporaryDirectory() as directory:
        path = Path(directory) / "invalid.xml"
        for raw in (
            b"<TEI>",
            b"<TEI/>",
            b'<!DOCTYPE TEI [<!ENTITY x "x">]><TEI xmlns="http://www.tei-c.org/ns/1.0"><text><body>&x;</body></text></TEI>',
        ):
            path.write_bytes(raw)
            try:
                analyze(path)
            except (etree.XMLSyntaxError, ValueError):
                continue
            raise AssertionError("Invalid boundary input accepted")
    print(
        "OK: repeatability, source preservation, real edge cases and boundary rejection"
    )


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--self-check", action="store_true")
    args = parser.parse_args()
    if args.source.resolve() == args.output.resolve():
        parser.error("Output must differ from source.")
    if args.self_check:
        _check(args.source)
    result = analyze(args.source)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"OK: analysis written to {args.output}")


if __name__ == "__main__":
    main()
