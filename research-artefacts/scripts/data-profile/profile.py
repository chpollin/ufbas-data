# Data profile of Urfehdebuch X from the edition TEI (o:ufbas.1563) and the exploration JSON.
# Read-only on the repository; prints a plain-text report to stdout.
# The exploration JSON was data/ufbas-exploration.json on 2026-09-24. It is now written by
# local-test-build/make-exploration-data.mjs to local-test-build/build/, and may differ from that day's file.
import json
import re
from collections import Counter, defaultdict
from itertools import product
from lxml import etree
from pathlib import Path
REPO = Path(__file__).resolve().parents[3]  # repository root

T = "{http://www.tei-c.org/ns/1.0}"
XID = "{http://www.w3.org/XML/1998/namespace}id"

doc = etree.parse(str(REPO / "tei/ufbas.1563.xml"))
kat = etree.parse(str(REPO / "tei/ufbas.kategorien.xml"))
data = json.load(open(REPO / "local-test-build/build/ufbas-exploration.json", encoding="utf-8"))

# taxonomy: id -> (term, group)
GROUPS = {"uf_Person", "uf_Tat", "uf_Strafe", "uf_Ort", "uf_Schlagwort", "uf_Datum"}
cat = {}
tax = [x for x in kat.iter(T + "taxonomy") if x.get(XID) == "Urfehdekodierung"][0]
for c in tax.iter(T + "category"):
    top = [a for a in c.iterancestors(T + "category")]
    topid = (top[-1] if top else c).get(XID)
    term = " ".join((c.findtext(T + "catDesc/" + T + "term") or "").split())
    cat[c.get(XID)] = (term, topid[3:] if topid in GROUPS else "Weitere")


def toks(el):
    return [t.lstrip("#") for t in (el.get("ana") or "").split()]


def local(el):
    return el.tag.replace(T, "") if isinstance(el.tag, str) else None


def label(el):
    """Reading text as uf:label: notes and del left out, lb/pb break=no joined, lb/pb/metamark a space."""
    out = []

    def rec(e):
        if e.text:
            out.append(e.text)
        for ch in e:
            n = local(ch)
            if n in ("note", "del"):
                pass
            elif n in ("lb", "pb"):
                out.append("\uE000" if ch.get("break") == "no" else " ")
            elif n == "metamark":
                out.append(" ")
            elif n is not None:
                rec(ch)
            if ch.tail:
                out.append(ch.tail)
    rec(el)
    s = re.sub(r"\s*\uE000\s*", "", "".join(out))
    return " ".join(s.split())


def gender(p):
    ts = toks(p)
    for f in p.iter(T + "forename"):
        anc = next(f.iterancestors(T + "persName"), None)
        if anc is p:
            ts += toks(f)
    return "m" if "uf_male" in ts else "f" if "uf_female" in ts else None


def ancestor_person(el):
    return next(el.iterancestors(T + "persName"), None)


def H(title):
    print("\n## " + title)


body = doc.find(T + "text/" + T + "body")
entries = [d for d in body.iter(T + "div") if d.get("ana") == "#uf_Eintrag"]
H("Entries")
print("div[@ana='#uf_Eintrag']:", len(entries))
other_eintrag = [e for e in body.iter() if isinstance(e.tag, str) and "uf_Eintrag" in toks(e) and local(e) != "div"]
print("other elements with #uf_Eintrag:", [(local(e), e.get(XID)) for e in other_eintrag])
print("JSON entries:", len(data["entries"]), " JSON categories:", len(data["categories"]))
ids = [e.get(XID) for e in entries]
nums = [int(i.split("-")[1]) for i in ids]
print("id range:", min(nums), max(nums), " gaps:", sorted(set(range(min(nums), max(nums) + 1)) - set(nums)))

# annotations outside any entry
outside = Counter()
for el in body.iter():
    if isinstance(el.tag, str) and el.get("ana") and not any(a in entries for a in el.iterancestors(T + "div")) and el not in entries:
        for t in toks(el):
            outside[t] += 1
print("annotation tokens outside entries:", dict(outside))

# per-entry records
recs = []
for d in entries:
    r = {"id": d.get(XID), "el": d, "cats": Counter(), "elems": defaultdict(list)}
    for el in d.iter():
        if not isinstance(el.tag, str) or el is d:
            continue
        for t in set(toks(el)):
            r["cats"][t] += 1
            r["elems"][t].append(el)
    recs.append(r)

H("Category frequencies (elements / entries), by group")
elem_count = Counter(); entry_count = Counter()
for r in recs:
    for t, c in r["cats"].items():
        elem_count[t] += c; entry_count[t] += 1
by_group = defaultdict(list)
for t in set(elem_count) | set(k for k in cat if cat[k][0]):
    g = cat.get(t, ("?", "not-in-taxonomy"))[1]
    by_group[g].append(t)
for g in ["Person", "Tat", "Strafe", "Ort", "Datum", "Schlagwort", "Weitere", "not-in-taxonomy"]:
    items = sorted(by_group.get(g, []), key=lambda t: -elem_count[t])
    print(f"\n### {g}")
    for t in items:
        print(f"  {t[3:] if t.startswith('uf_') else t:40s} {cat.get(t, ('',))[0]:32s} elements={elem_count[t]:4d} entries={entry_count[t]:4d}")

# JSON cross-check
jcount = Counter(a["category"] for e in data["entries"] for a in e["annotations"])
diff = {k: (jcount[k], elem_count["uf_" + k]) for k in jcount if jcount[k] != elem_count["uf_" + k]}
print("\nJSON annotation count vs TEI element count, differing categories:", diff)
print("JSON annotation total:", sum(jcount.values()))

H("Entries without group")
def has_group(r, g):
    return any(cat.get(t, ("", ""))[1] == g and t != "uf_" + g for t in r["cats"])
for g in ["Tat", "Strafe", "Ort", "Schlagwort"]:
    miss = [r["id"] for r in recs if not has_group(r, g)]
    print(f"without {g}: {len(miss)}", miss[:40])
no_off = [r["id"] for r in recs if "uf_PersonTäter" not in r["cats"]]
print("without PersonTäter:", len(no_off), no_off)
no_any = [r["id"] for r in recs if not any(cat.get(t, ("", ""))[0] for t in r["cats"] if t not in ("uf_male", "uf_female"))]
print("without any termed category:", no_any)
no_notar = [r["id"] for r in recs if "uf_NotarialSubscription" not in r["cats"]]
print("without NotarialSubscription:", len(no_notar), no_notar)
no_eid = [r["id"] for r in recs if "uf_Urfehdeeid" not in r["cats"]]
print("without Urfehdeeid:", len(no_eid), no_eid)
no_haft = [r["id"] for r in recs if "uf_Untersuchungshaft" not in r["cats"]]
print("without Untersuchungshaft:", len(no_haft))

H("Multiplicity of Tat and Strafe per entry")
for g in ["Tat", "Strafe"]:
    distinct = Counter(len({t for t in r["cats"] if cat.get(t, ("", ""))[1] == g}) for r in recs)
    segs = Counter(sum(c for t, c in r["cats"].items() if cat.get(t, ("", ""))[1] == g) for r in recs)
    print(f"{g}: distinct categories per entry {sorted(distinct.items())}")
    print(f"{g}: annotated elements per entry {sorted(segs.items())}")

H("Tat x Strafe co-occurrence (entry level, distinct categories)")
pairs = Counter()
for r in recs:
    tats = {t[6:] for t in r["cats"] if t.startswith("uf_Tat")}
    strs = {t[9:] for t in r["cats"] if t.startswith("uf_Strafe")}
    for a, b in product(tats, strs):
        pairs[(a, b)] += 1
print("distinct pairs:", len(pairs))
for (a, b), c in pairs.most_common(30):
    print(f"  {c:4d}  {a} x {b}")
# excluding the near-universal Ermahnung / Strafandrohung
print("top pairs without Ermahnung, Strafandrohung, Ausnahme, Milderung:")
for (a, b), c in [p for p in pairs.most_common() if p[0][1] not in ("Ermahnung", "Strafandrohung", "Ausnahme", "Milderung")][:20]:
    print(f"  {c:4d}  {a} x {b}")

H("Dates")
DATE_TYPES = ["uf_DatumUrfehde", "uf_DatumTat", "uf_DatumFrist", "uf_DatumBegnadigung"]
iso = re.compile(r"^\d{4}(-\d{2}(-\d{2})?)?$")
anomalies = []
for dt in DATE_TYPES:
    els = [el for r in recs for el in r["elems"].get(dt, [])]
    when = [el.get("when") for el in els if el.get("when")]
    dur = [el for el in els if el.get("dur")]
    precision = Counter(len(w) for w in when)
    bad = [w for w in when if not iso.match(w)]
    years = Counter(w[:4] for w in when)
    ents = sum(1 for r in recs if dt in r["cats"])
    print(f"{dt}: elements={len(els)} entries={ents} with @when={len(when)} with @dur={len(dur)} "
          f"without when/dur={sum(1 for el in els if not el.get('when') and not el.get('dur'))} "
          f"elements by tag={Counter(local(e) for e in els)} when length={dict(precision)} nonISO={bad}")
    print(f"   years: {sorted(years.items())}")
    for el in els:
        w = el.get("when")
        if w and not ("1562" <= w[:4] <= "1570"):
            anomalies.append((dt, el.get(XID), w, label(el)))
print("when outside 1562-1570:", anomalies)
# all date elements incl. unannotated
alld = list(body.iter(T + "date"))
print("all tei:date in body:", len(alld), " without @ana:", sum(1 for d in alld if not d.get("ana")),
      " dur values:", Counter(d.get("dur") for d in alld if d.get("dur")).most_common(12))
print("date elements without ana:", Counter((d.get("when"), d.get("dur"), label(d)) for d in alld if not d.get("ana")).most_common(10))
# Urfehde dates per entry
n_urf = Counter(r["cats"].get("uf_DatumUrfehde", 0) for r in recs)
print("DatumUrfehde per entry:", sorted(n_urf.items()))
nodate = [r["id"] for r in recs if not any(el.get("when") for el in r["elems"].get("uf_DatumUrfehde", []))]
print("entries without DatumUrfehde/@when:", len(nodate), nodate)
multi = [(r["id"], [el.get("when") for el in r["elems"]["uf_DatumUrfehde"]]) for r in recs if r["cats"].get("uf_DatumUrfehde", 0) > 1]
print("entries with >1 DatumUrfehde:", multi)
combo = Counter(tuple(dt[8:] for dt in DATE_TYPES if dt in r["cats"]) for r in recs)
print("date-type combinations per entry:", combo.most_common())
# Tat after Urfehde, and ordering
late = []
for r in recs:
    u = [el.get("when") for el in r["elems"].get("uf_DatumUrfehde", []) if el.get("when")]
    for el in r["elems"].get("uf_DatumTat", []):
        w = el.get("when")
        if u and w and len(w) == 10 and w > max(u):
            late.append((r["id"], el.get(XID), w, u, label(el)))
    for el in r["elems"].get("uf_DatumFrist", []):
        w = el.get("when")
        if u and w and len(w) == 10 and w < min(u):
            late.append(("Frist-before-Urfehde", r["id"], el.get(XID), w, u, label(el)))
print("DatumTat after Urfehde / Frist before Urfehde:", late)
seq = [(r["id"], next((el.get("when") for el in r["elems"].get("uf_DatumUrfehde", []) if el.get("when")), None)) for r in recs]
back = []
last = None
for i, w in seq:
    if w and len(w) == 10:
        if last and w < last[1]:
            back.append((i, w, "after", last[0], last[1]))
        last = (i, w)
print("Urfehde date earlier than preceding dated entry (book order):", len(back))
for b in back:
    print("   ", b)
# precision of Urfehde dates
print("Urfehde @when lengths:", Counter(len(w) for _, w in seq if w))

H("Temporal distribution (first DatumUrfehde @when per entry)")
ym = Counter(); yc = Counter()
for _, w in seq:
    if w:
        yc[w[:4]] += 1
        if len(w) >= 7:
            ym[w[:7]] += 1
print("per year:", sorted(yc.items()))
print("per month:")
for k in sorted(ym):
    print("  ", k, ym[k])
months = [f"{y}-{m:02d}" for y in range(1563, 1570) for m in range(1, 13)]
print("months 1563-01..1569-12 with zero entries:", [m for m in months if ym[m] == 0])
# JSON date agreement
jd = {e["id"]: e["date"] for e in data["entries"]}
print("JSON date == TEI first Urfehde @when:", all(jd[i] == w for i, w in seq))

H("Offenders")
off_persons = []
for r in recs:
    for p in r["elems"].get("uf_PersonTäter", []):
        off_persons.append((r["id"], p, gender(p)))
print("PersonTäter persNames:", len(off_persons))
print("gender (person level):", Counter(g for _, _, g in off_persons))
per_entry = Counter(r["cats"].get("uf_PersonTäter", 0) for r in recs)
print("offenders per entry:", sorted(per_entry.items()))
eg = Counter()
for r in recs:
    gs = tuple(sorted({str(gender(p)) for p in r["elems"].get("uf_PersonTäter", [])}))
    eg[gs] += 1
print("entry gender composition:", eg.most_common())
nog = [(i, label(p)) for i, p, g in off_persons if g is None]
print("offenders without gender:", nog)
jg = Counter(o["gender"] for e in data["entries"] for o in e["offenders"])
print("JSON offender gender:", jg)
# nested offender persNames (a Täter inside another Täter)
nested = [(i, label(p)) for i, p, _ in off_persons if any("uf_PersonTäter" in toks(a) for a in p.iterancestors(T + "persName"))]
print("offender persName nested inside another offender:", nested)
# where does the offender stand (head vs p)
loc = Counter("head" if next(p.iterancestors(T + "head"), None) is not None else "note" if next(p.iterancestors(T + "note"), None) is not None else "p" for _, p, _ in off_persons)
print("offender element location:", loc)

H("Offender attributes (annotations nested in the offender persName, nearest persName = offender)")
def attrs_of(persons, token):
    vals = []
    for p in persons:
        for el in p.iter():
            if isinstance(el.tag, str) and token in toks(el) and el is not p and ancestor_person(el) is p:
                vals.append(label(el))
            elif el is p and token in toks(el):
                vals.append(label(el))
    return vals
offp = [p for _, p, _ in off_persons]
for token in ["uf_Beruf", "uf_Status", "uf_Zivilstand", "uf_Verwandtschaftsgrad", "uf_Beiname", "uf_OrtHerkunft", "uf_OrtWohnort"]:
    per = [bool(attrs_of([p], token)) for p in offp]
    vals = attrs_of(offp, token)
    norm = Counter(v.lower() for v in vals)
    print(f"{token}: offenders with value={sum(per)}/{len(offp)}  values={len(vals)} distinct(lowercased)={len(norm)}")
    print("    top:", norm.most_common(25))

H("All occupations, status, kinship (all persons)")
for token in ["uf_Beruf", "uf_Status", "uf_Zivilstand", "uf_Verwandtschaftsgrad"]:
    vals = [label(el) for r in recs for el in r["elems"].get(token, [])]
    norm = Counter(v.lower() for v in vals)
    notar = sum(1 for r in recs for el in r["elems"].get(token, []) if ancestor_person(el) is not None and "uf_PersonNotar" in toks(ancestor_person(el)) or "uf_PersonNotar" in toks(el))
    print(f"{token}: elements={len(vals)} distinct(lowercased)={len(norm)} inside Notar persName={notar}")
    print("    top:", norm.most_common(30))

H("Other person roles")
for token in ["uf_PersonMittäter", "uf_PersonOpfer", "uf_PersonKläger", "uf_PersonZeuge", "uf_PersonAnwesende", "uf_PersonHehler", "uf_PersonNotar", "uf_Person"]:
    els = [el for r in recs for el in r["elems"].get(token, [])]
    g = Counter(gender(el) if local(el) == "persName" else "not persName:" + local(el) for el in els)
    ents = sum(1 for r in recs if token in r["cats"])
    print(f"{token}: elements={len(els)} entries={ents} gender={dict(g)}")
    if token in ("uf_PersonOpfer",):
        print("    examples:", [label(e) for e in els[:12]])
notars = Counter(label(el) for r in recs for el in r["elems"].get("uf_PersonNotar", []))
print("Notar labels:", notars.most_common())
nsurname = Counter()
for r in recs:
    for el in r["elems"].get("uf_PersonNotar", []):
        s = el.find(".//" + T + "surname")
        nsurname[(s.xpath("string()") if s is not None else "(no surname)").strip()] += 1
print("Notar surnames:", nsurname.most_common())
notar_by_entry = Counter()
for r in recs:
    ss = {(el.find(".//" + T + "surname").xpath("string()").strip() if el.find(".//" + T + "surname") is not None else "?") for el in r["elems"].get("uf_PersonNotar", [])}
    notar_by_entry[tuple(sorted(ss))] += 1
print("Notar per entry:", notar_by_entry.most_common())

H("Places")
pn = list(body.iter(T + "placeName"))
listplace = {p.get(XID): p for p in doc.iter(T + "place")}
print("placeName in body:", len(pn), " with @ref:", sum(1 for p in pn if p.get("ref")), " listPlace places:", len(listplace))
refs = Counter(p.get("ref") for p in pn if p.get("ref"))
unres = {r: c for r, c in refs.items() if r.lstrip("#") not in listplace}
print("distinct refs:", len(refs), " unresolved refs:", unres)
unused = [k for k in listplace if "#" + k not in refs]
print("listPlace entries never referenced:", len(unused), unused[:30])
unsure = [(k, " ".join(p.xpath("string(.//*[local-name()='note'])").split())) for k, p in listplace.items() if p.find(T + "note") is not None]
print("listPlace entries with editorial note:", len(unsure))
for u in unsure: print("   ", u)
geo = [e for e in doc.iter() if local(e) in ("geo", "location", "idno", "region", "country", "settlement") and next(e.iterancestors(T + "back"), None) is not None]
print("geo/location/idno inside back:", len(geo))
for token in ["uf_OrtHerkunft", "uf_OrtWohnort", "uf_OrtTatort"]:
    els = [el for r in recs for el in r["elems"].get(token, [])]
    withref = [el for el in els if el.get("ref") or any(x.get("ref") for x in el.iter(T + "placeName"))]
    print(f"{token}: elements={len(els)} tags={dict(Counter(local(e) for e in els))} with ref (self or nested)={len(withref)} distinct refs={len({el.get('ref') for el in els if el.get('ref')})}")
    print("    top refs:", Counter(el.get("ref") for el in els if el.get("ref")).most_common(15))
    print("    no-ref examples:", [label(e) for e in els if e not in withref][:15])
plain = [p for p in pn if not p.get("ana")]
print("placeName without @ana:", len(plain), " of them with ref:", sum(1 for p in plain if p.get("ref")))
print("top refs overall:", refs.most_common(20))

H("Eingangsnotiz (marginal entry note)")
ein = [el for r in recs for el in r["elems"].get("uf_Eingangsnotiz", [])]
ein_out = [el for el in body.iter(T + "note") if "uf_Eingangsnotiz" in toks(el) and el not in ein]
print("Eingangsnotiz in entries:", len(ein), " outside entries:", len(ein_out), [label(e) for e in ein_out])
print("entries with n Eingangsnotiz:", sorted(Counter(r["cats"].get("uf_Eingangsnotiz", 0) for r in recs).items()))
inner = Counter()
names = defaultdict(Counter)
nums_ = Counter()
for el in ein:
    cs = set()
    for ch in el.iter():
        if ch is el or not isinstance(ch.tag, str):
            continue
        for t in toks(ch):
            if t not in ("uf_male", "uf_female"):
                cs.add(t); names[t][label(ch)] += 1
        if local(ch) == "num":
            nums_[label(ch)] += 1
    inner[tuple(sorted(cs))] += 1
print("category combinations inside Eingangsnotiz:", inner.most_common())
for t, c in names.items():
    print(f"  {t}: {c.most_common(30)}")
print("num values:", nums_.most_common())
print("Eingangsnotiz full labels (top 40):", Counter(label(e) for e in ein).most_common(40))

H("Cross-references")
ed = [n for n in body.iter(T + "note") if n.get("resp")]
print("editorial notes (@resp):", len(ed), Counter(n.get("resp") for n in ed))
ed_in = [n for n in ed if any(a in entries for a in n.iterancestors(T + "div"))]
print("  inside entries:", len(ed_in))
reft = [n for n in ed if re.search(r"fol\.|Urfehde|Eintrag", n.xpath("string()"))]
print("  mentioning fol./Urfehde/Eintrag:", len(reft))
for n in reft[:12]:
    print("    ", " ".join(n.xpath("string()").split())[:200])
for token in ["uf_FrüheresUrfehdeverfahren", "uf_AnderesUrfehdeverfahren", "uf_TatÜbertretungUrfehde"]:
    els = [el for r in recs for el in r["elems"].get(token, [])]
    withnote = sum(1 for el in els if el.find(".//" + T + "note") is not None or (el.getnext() is not None and local(el.getnext()) == "note"))
    print(f"{token}: elements={len(els)} entries={sum(1 for r in recs if token in r['cats'])} followed by/containing a note={withnote}")
print("machine-readable pointers (ref/ptr/@target/@corresp/@sameAs to entries):",
      [(local(e), dict(e.attrib)) for e in body.iter() if isinstance(e.tag, str) and any(a in e.attrib for a in ("target", "corresp", "sameAs")) or local(e) in ("ref", "ptr")])
print("persName/@ref:", [(p.get("ref"), label(p)) for p in body.iter(T + "persName") if p.get("ref")])

H("Offender name repeats across entries (heuristic, exact forename+surname, lowercased)")
keyed = defaultdict(set)
for i, p, _ in off_persons:
    f = " ".join(x.xpath("string()").strip() for x in p.findall(T + "forename"))
    s = " ".join(x.xpath("string()").strip() for x in p.findall(T + "surname"))
    if s:
        keyed[(f.lower(), s.lower())].add(i)
rep = {k: sorted(v, key=lambda x: int(x.split('-')[1])) for k, v in keyed.items() if len(v) > 1}
print("offender name keys:", len(keyed), " keys in >1 entry:", len(rep))
for k, v in sorted(rep.items(), key=lambda kv: -len(kv[1]))[:40]:
    print("   ", k, v)
nosur = sum(1 for _, p, _ in off_persons if p.find(T + "surname") is None)
print("offender persNames without direct surname child:", nosur)

H("Measures (amounts)")
ms = list(body.iter(T + "measure"))
print("measure:", len(ms), " units:", Counter(m.get("unit") for m in ms).most_common(), " types:", Counter(m.get("type") for m in ms))
ctx = Counter()
for m in ms:
    cs = set()
    for a in m.iterancestors():
        cs |= {t for t in toks(a) if t.startswith(("uf_Tat", "uf_Strafe"))}
    ctx[tuple(sorted(cs))] += 1
print("measure context (enclosing Tat/Strafe):", ctx.most_common(15))
print("quantity examples:", Counter(m.get("quantity") for m in ms).most_common(10))

H("Hands, metamarks, other")
print("handShift scribes:", Counter(h.get("scribe") for h in body.iter(T + "handShift")))
print("metamark rend:", Counter(m.get("rend") for m in body.iter(T + "metamark")))
print("margin notes:", sum(1 for n in body.iter(T + "note") if n.get("rend") == "margin"),
      " with change=#Nachtrag:", sum(1 for n in body.iter(T + "note") if n.get("change")))
print("folio (JSON) null:", sum(1 for e in data["entries"] if e["folio"] is None),
      " distinct folios:", len({e["folio"] for e in data["entries"]}))
print("pb count:", len(list(body.iter(T + "pb"))))

H("Label inconsistencies in annotations (same category, case/spelling variants)")
for token in ["uf_SchlagwortGefängnis", "uf_SchlagwortRatsknecht", "uf_SchlagwortStadtknecht", "uf_SchlagwortObersterKnecht", "uf_Vorinstanz", "uf_SchlagwortWirtshaus"]:
    vals = Counter(label(el) for r in recs for el in r["elems"].get(token, []))
    print(f"{token}: distinct={len(vals)} top={vals.most_common(25)}")
