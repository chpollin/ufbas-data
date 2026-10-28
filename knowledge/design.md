---
title: Design
project:
  name: Urfehdebücher der Stadt Basel
  repository: https://github.com/chpollin/ufbas-data  # the served files it describes are in https://zimlab.uni-graz.at/gams/projects/ufbas/gams-www
method:
  name: Promptotyping
  url: https://dhcraft.org/Promptotyping/
template:
  name: Vorlage Design
  version: 0.3
  url: https://dhcraft.org/Promptotyping/promptotyping-document/design
status: draft
created: 2026-09-23
updated: 2026-10-28
authors: [Christopher Pollin]
generated-with: Claude Code (Claude Opus 5.5)
related: [architecture.md, plan.md, testing.md]
---

# Design

The 2026 refactoring keeps the identity of the 2017 site, the green title band, the serif headings, the category colours and the logos of both universities, and renews surfaces, colour, shape and type. The operator adopted this design on 2026-09-24 (ADR-15 in [specification.md](specification.md#decisions)), answering a first refactored state of tiled white surfaces on grey, colourless neutrals, hard shapes and flat type. The styles use no framework. Tokens and shared components live in `css/template.css`, each page type adds its own file ([architecture.md](architecture.md#presentation-layer)), and exact sizes and values stand in the CSS.

## Principles

- One white page per view. Structure comes from spacing, type size and weight and a few hairlines where the reader crosses a boundary, from entry to entry and from text to page image.
- No redundancy and few, fine controls. A fact stands once on a page, and a control shows as little frame as its state allows, with a tooltip saying what it does.
- No middle dot as a separator. Items of a line are parted by a comma, by space or by their own element, and page titles by a vertical bar.
- One tinted area, the tools column, as a rail beside the content, since it holds the controls.
- Cards only for comparable, self-contained objects, the four ways in on the home page.
- Green for the title band, links, the current page and primary actions. Headings in dark ink.
- The category colours carry the category groups everywhere, each group with its 2017 tint and a strong tone for edges and small marks.
- Soft, consistent shape, with slightly larger radii on areas than on controls and pills for the group links of the home page.

## Colours

The tokens of `css/template.css` lean slightly towards the green. The page stays white, since a cream tone would quote the usual costume of digital editions, which the project never wore. Three tokens carry a contrast decision, `--ufbas-green-dark` for links and active text (8.2:1 on white), `--ufbas-muted` for secondary text (7:1) and `--ufbas-control` for borders of fields and checkboxes (3.8:1, above the 3:1 of non-text contrast).

A category never rides on colour alone. In the edition each group has its own mark besides its strong tone, a solid underline for Person, dashed for Tat, dotted for Strafe, a double line for Ort and a light tint band behind the lower half of the letters for Schlagwort. Chips and swatches put the group colour as a small square with an edge in the strong tone before a text label, and a chip names its group in text as well, since a term such as Schulden exists as Tat and as Schlagwort.

The sanction classes of the Exploration view are the only place where a hue carries data outside the category groups. Ausweisung `#d95926`, Geldstrafe `#2a78d6`, Verbote `#1baf7a`, and Haft, Körperstrafe and Amtsentlassung `#4a3aa7` were checked to stay apart under protanopia and deuteranopia. Entries without a sanction are hollow in the control tone, so that class rests on shape.

## Type

Droid Serif for headings, edition text, excerpts and project texts, Open Sans for the interface, both from the fonts GAMS serves under `/assets/fonts/` (ADR-32). They are the pairing of the ZimLab template and the one the 2017 styles named without loading, and Droid Serif was drawn for reading on screens. GAMS serves Droid Serif in regular, italic, bold and bold italic and Open Sans in regular, italic and semibold, so a weight of 600 in a serif heading renders bold and 700 in the interface renders semibold. Both cover the edition text except ⊕, ★ and ✤, which fall back to system fonts. Junicode and Cardo, which GAMS also serves, cover the text as well, Cardo also ⊕.

Body text follows the reader's font size setting. The edition text has a fixed line height, so marking never shifts its lines. The navigation keeps a size at which it fits on one line where it is sticky. Dates use lining figures, and continuous text stays below 80 characters per line. Project texts and the category list are hyphenated only below 48rem, where short ragged lines would gape. Headings, links and the edition text are never hyphenated, links because a split link text is a split target, the edition text because its line breaks are those of the manuscript.

## Components

- The title band is green with the logos, the black Basel logo in the negative form the university uses on colour. The navigation is a white bar with the current page marked by a green bar below it. Below 48rem its items stand in one line that scrolls sideways with the current page in view, and no menu button hides them.
- The page head sets title and facts directly on the page, with the TEI and RDF downloads as the TEI emblem and the W3C RDF icon, saved under the object's name. The citation suggestion of the edition stands in full so it can be copied without a click.
- The Datenkorb switch is the same on the edition and in result lists, a checkbox "In den Datenkorb" over a bookmark, outlined while the entry is out and filled in green while it is in, so the state rests on shape. Its tooltip names the action, and a short note at the bottom of the window confirms each change with the new count, announced to screen readers as a status.
- Tooltips come from `data-tip`, appear on hover and keyboard focus for icon controls and the annotation index switch, say what the control does and stay out of the accessible name. Entry headings carry none, and the page carries no `title` attribute.
- The marking switches are independent checkboxes, so several groups can be marked at once, and each name carries the mark of its group, which makes the switches the legend.
- The view switch "Ansicht" is a segmented radio group with "Text" and "Text und Bild" beside the source icons. A TEI without page images, as GAMS serves it until the re-ingest of ADR-34, gets a short note instead of switch and image pane.
- Marked annotations keep the line height, and nothing is inserted into a line. Marks are at least 1.5px, the double line of Ort 3px, offset by whole pixels, because a thinner line falls between device pixel rows at single density or zoom and is smoothed into grey, which the operator saw on 2026-10-26 as Ort in two colours. Three fixed slots below the letters follow the nesting in the TEI, counted on 2026-09-24 as Person > Ort 656, Tat > Person 166, Tat > Ort 139, Strafe > Person 17, Strafe > Ort 16, Ort > Person 2 and Strafe > Tat 1. Ort sits closest to the text, Person below it, Tat and Strafe share the lowest slot, and the one Tat span inside a Strafe span (`Eintrag-187`, without a person) takes the Person slot. Category labels stand outside the line, in a tip on hover or tap and as visually hidden text for screen readers, which the Datenkorb does not copy. Manuscript marks (Kringel, Blume, additions, Eingangsnotiz) name their kind in the same tip, the scribe change is a focusable note "Schreiberwechsel", and expansions carry no tip, since italics and brackets mark them.
- The annotation index "Kategorien" lists the annotations of an entry below its text by group, as the former category panel showed them. It is built on first opening and serves keyboard and screen reader users without a tab stop per annotation.
- The filters of the Exploration view are menus above the chart, each value a button with its count in the selection over a pale bar of the whole book. The definition of a category is its tooltip. The legend of the sanction classes is also the class filter and shows counts only while other filters make a selection, since without one a count would be a holding size.
- The marks of the Exploration view are circles stacked by date on a pitch of one month, which becomes a quarter where a month would be too narrow. A mark outside the selection fades instead of vanishing. The marks are one tab stop, arrow keys move along the axis and within a column, and Enter opens the entry as a card beside its mark.
- The entry table shows the Exploration selection and the Datenkorb in the same columns. Below 48rem every row stacks without an inner scroll. The Exploration view shows the first 50 rows of the sorted selection with a button for the rest, because the whole book stacked on a phone would run over many screens, and "Alle Einträge der Auswahl in den Datenkorb legen" still takes the whole selection.
- Icon buttons are a mask in the text colour in a target without frame, with the action as `data-tip` and as visually hidden name, shared by Exploration, Datenkorb, result pages and category page.
- The page image pane holds the OpenSeadragon viewer in the proportions of the page, zoom buttons and the credit of the Staatsarchiv linking to the record in the Digitaler Lesesaal. When dataset, viewer or an image fails, that link takes the place of the viewer.

## Views

- The page shell has the navigation Home, Projekt, Urfehdebuch, Kategorien, Ontologie, Exploration, Datenkorb and Erweiterte Suche with the quick search. Header, navigation and footer have one width on every page, and only the content width varies, wider on the edition and the whole window in the Exploration view. The navigation is sticky only from 75rem, where it fits on one line also with a three-digit Datenkorb. The footer credits the technical work of 2017 and 2026 in one line, which the imprint page leaves out, since its own block names the credit (ADR-20).
- The imprint is one column in the three sections of `IMPRINT`, Die Edition, Umsetzung and Rechtliches, with the licence of content and code in its own row.
- The home page shows title, editors and date, the first sentence of the introduction as a quote linking to the full text, the first manuscript page linking to the first entry, and four ways in of equal weight, "Urfehdebuch lesen", "Suchen" with two example searches, "Kategorien" with the five groups and "Exploration".
- The edition page title names the years as the home page and `ABOUT` do, while the archival title of the `titleStmt` stays in the TEI, its download and the citation. A tools column holds "Im Text markieren" and the table of contents by year and month, sticky on wide screens, above the entries on narrow ones. Each entry has a heading with date and folio, the index switch and the bookmark, then its head centred as the manuscript sets it, then the diplomatic text. Page breaks and marginal notes stand in a margin column from 48rem, expansions are italic in brackets, editorial notes a focusable star. The category panel beside the text was removed on 2026-09-24. Without script the page shows the text without switches, marking and image.
- "Text und Bild" is the default from 86rem, where tools, text and page image fit side by side, "Text" below it, and a view in the fragment wins over the default. From 75rem to 86rem "Text und Bild" shrinks the tools to a sticky bar above the text, with the five switches in a row and the table of contents behind the button "Einträge nach Datum". Below 75rem the image stands sticky above the text, with the tools column beside it from 62rem and above both on phones. Below 62rem the tools are that bar in both views.
- The search page is the empty form. After a search the hit count with the query heads the page, the form and the links to the first hit per year stand in the tools column, and the hits follow in date order with highlighted terms, matched categories and the full text on demand.
- The category page shows the groups as sections with their swatch, each category with its gloss, a link to its entries and, where the view has a filter, the Exploration icon. A category browse shows one year at a time, with the year in the fragment.
- The Datenkorb page has the CSV and clearing icons, the note that the Datenkorb lives in this browser only, and the entry table. Its categories come once from the query of the Exploration view.
- The page Ontologie renders from the `ONTOLOGY` datastream of `o:ufbas.ontology` alone (ADR-33), with the RDF/XML as its one download, the class tree with the four classes that match a category group in its colour, the namespaces and every term with anchor, labels, comment, domain, range and alignment.
- The Exploration page takes the width of the window, with one bar for the view switch "Zeit" and "Tatbestand", the legend and the filter menus, then the selection row, the chart and the entry table. The force graph of the former graph page gave no reading of numbers, positions that meant nothing, hubs of near-universal formulas and one category at a time, and the calendar and matrix that followed had to be read as numbers, so the view draws every entry as a mark (ADR-22).

## Accessibility and reflow

The pages meet the automatically testable rules of WCAG 2.2 A and AA and reflow without horizontal scrolling from 320px, which is also what 200 and 400 percent zoom reduce to ([testing.md](testing.md#browser-check)). No element scrolls sideways except tables in their focusable scroll region and the phone navigation. Keyboard use starts with a skip link, every control has a visible focus ring, lists without bullets keep their list role, and targets are at least 24px. States never depend on colour alone, the current page has its bar, checked switches their box or radio and bold text, marked groups their line style or band, the Datenkorb icon its filled shape.

## Print

Printing keeps the text of a page and its dates and leaves out navigation, tools column, page actions, view switch, page image and controls. An entry is not split across pages, a category browse shows every year, and the tables keep their column heads and row dates.

## Open decisions

No design decision is open. The introduction sentence of the category page stays as TEI content of `o:ufbas.kategorien` (ADR-28 in [specification.md](specification.md#decisions)).
