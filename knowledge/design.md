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

The 2026 refactoring keeps the identity of the 2017 site, meaning the green title band, the serif headings, the category colours and the logos of both universities, and renews surfaces, colour, shape and type. The operator adopted this design on 2026-09-24 (ADR-15 in [specification.md](specification.md#decisions)). Its diagnosis of the first refactored state, tiled white surfaces on grey, colourless neutrals, hard shapes and flat type, is recorded in [journal.md](journal.md). The styles are written without a framework. Fonts and tokens live at the top of `css/template.css`, the shared components below them, and each page type adds its own file ([architecture.md](architecture.md#presentation-layer)).

## Principles

- One white page per view. Structure comes from spacing, type size and weight and a few hairlines where the reader crosses a boundary, from entry to entry and from the text to the page image.
- No redundancy and few, fine controls. A fact stands once on a page, and a control shows as little frame as its state allows, with a tooltip saying what it does.
- No middle dot as a separator. Items of a line are parted by a comma, by space or by their own element, and page titles by a vertical bar.
- One tinted area, the tools column, as a rail beside the content. It is the only region set off by colour, because it holds the controls.
- Cards only for comparable, self-contained objects, the four ways in on the home page.
- Green for the title band, links, the current page and primary actions. Headings in dark ink.
- The category colours carry the category groups everywhere. Each group has its 2017 tint and a strong tone for edges and small marks.
- Soft, consistent shape. Corners of 6px on controls and 8px on areas, pill shapes for the group links of the home page.

## Colours

| Token | Value | Use |
|---|---|---|
| `--ufbas-green` | `#30783b` | title band, primary button, focus ring, current page bar |
| `--ufbas-green-dark` | `#245a2c` | links and active text, 8.2:1 on white |
| `--ufbas-green-tint` | `#edf4ee` | tonal buttons, hover |
| `--ufbas-ink` | `#1f2a23` | text, headings, footer background |
| `--ufbas-muted` | `#4f5b53` | secondary text, 7:1 on white |
| `--ufbas-surface` | `#ffffff` | page |
| `--ufbas-rail` | `#f4f7f4` | tools column, quick search field |
| `--ufbas-rule` | `#dfe5e0` | hairlines |
| `--ufbas-control` | `#7a877d` | borders of fields and checkboxes, 3.8:1 on white |

The neutrals lean slightly towards the green. The page stays white, since a cream tone would quote the usual costume of digital editions, which the project never wore.

| Group | Tint | Strong tone |
|---|---|---|
| Person | `#ffcdcd` | `#c04a4a` |
| Tat | `#cddeff` | `#3b67bd` |
| Strafe | `#d5ffcd` | `#3a873a` |
| Ort | `#feffc0` | `#8a8212` |
| Schlagwort | `#ffe0bc` | `#bb7220` |

A category never rides on colour alone. In the edition each group has its own mark besides its strong tone, a solid underline for Person, dashed for Tatbestand, dotted for Strafe, a double line for Orte and a light tint band behind the lower half of the letters for Schlagworte, an area where the others are lines. Chips and swatches put the group colour as a small square with an edge in the strong tone before a text label, and a chip names its group in text as well, since a term such as Schulden exists as Tatbestand and as Schlagwort.

## Type

Droid Serif for headings, the edition text, excerpts and the project texts, Open Sans for the interface, both from the fonts GAMS serves for all projects under `/assets/fonts/` (ADR-32). They are the pairing of the ZimLab template and the one the 2017 styles named without loading. GAMS serves Droid Serif in regular, italic, bold and bold italic and Open Sans in regular, italic and semibold, so a weight of 600 in a serif heading renders bold and a weight of 700 in the interface renders semibold. Both cover every character of the edition text except the marks ⊕, ★ and ✤, which fall back to the system fonts, and Georgia and the system sans stay as fallbacks. Junicode and Cardo, which GAMS also serves, cover the edition text as well, Cardo also ⊕. Droid Serif was chosen because it was drawn for reading on screens.

Headings are semibold in ink, the page title between 28 and 38px depending on the width, on the home page between 32 and 44px. Body text is 17px and follows the reader's font size setting, the edition text 18px with a fixed line height of 1.8, the navigation 16px so that it still fits on one line where it is sticky. Dates use lining figures. Continuous text stays below 80 characters per line. Project texts and the category list are hyphenated only below 48rem, where short ragged-right lines would otherwise gape, and keep whole words on wider screens. Headings, links and the edition text are never hyphenated, links because a split link text is a split target, the edition text because its line breaks are those of the manuscript.

## Components

- Title band. Green, with the logos at 40px. The black Basel logo appears in its negative form, which the university uses on colour.
- Navigation. A white bar under the title band with a hairline and, where sticky, a soft shadow. Items in ink, the current page green with a 3px green bar below it, hover on the green tint. Below 48rem the items stand in one line that scrolls sideways, with the current page scrolled into view. The quick search field sits on the rail tint with a joined green button.
- Page head. Title and facts directly on the page, secondary texts at 15px in the muted tone, source downloads beside the title on wide screens, shown as the TEI emblem of the TEI Consortium and the RDF icon of the W3C at one height and saved under the object's name. The citation suggestion of the edition stands in full at 13px, so it can be copied without a click.
- Tools column. One rail with rounded corners, its blocks separated by space, block headings in the sans at 16px bold.
- Buttons. Primary filled green. Secondary as tonal buttons, green-dark text on the green tint without an outline.
- Datenkorb switch. The same on the edition and in result lists, a checkbox named "In den Datenkorb" over a bookmark of 20px drawn as a CSS mask in a 32px target without frame, outlined while the entry is out and filled in green while it is in, so the state rests on the shape. Its tooltip says what a click does ("In den Datenkorb legen", "Aus dem Datenkorb nehmen"), and after every change a short dark note at the bottom of the window confirms it with the new count, which screen readers hear as a status.
- Tooltips. A small dark label above a control on pointer hover and keyboard focus, from `data-tip`, for icon controls and the switch of the annotation index. It says what the control does and stays out of the accessible name. Entry headings carry none.
- Marking switches. Independent checkboxes, several groups at once, two to a row in the rail and as many as fit where the tools stand above the text. Each name carries the mark of its group, so the switches are the legend. A checked switch shows its box, bold text and a frame in the strong tone.
- View switch. A segmented radio group "Ansicht" with "Text" and "Text und Bild", rendered by the named template `view-switch` beside the source icons of the page head. The checked option has bold text, the tint and a bar below, as the current page in the navigation. A TEI without page images, as GAMS serves it until the re-ingest of ADR-34, gets a short muted note in its place and neither switch nor page image pane.
- Entry lists (search, category browse). Rows on the page separated by hairlines, titles in ink semibold serif, excerpts in the serif. The Exploration view and the Datenkorb show their entries in the entry table.
- Edition entries. Rows on the page with a hairline between entries and a 2px green rule above each year of the book, centred at the reading width, a measure of 40rem for the serif text plus the margin column. The head of the entry centred and semibold. The heading row holds date and folio, then the quiet switch "Kategorien" with a chevron and the bookmark, which wrap together below the date on narrow screens. The lines of an entry after its head hang, so a manuscript line that wraps in a narrow column indents its continuation and stays one visual unit, with the line height kept.
- Marked annotations. The text keeps one line height of 1.8 with or without marking, and nothing is inserted into its lines. An annotation of a marked group takes the mark of its group, the lines 1.5px, the double line of Orte 3px, in one of three fixed slots below the letters, offset by whole pixels. A thinner line falls between two rows of device pixels on a screen of single density or at a zoom and is smoothed into grey, which the operator saw on 2026-10-26 as Orte in two colours. The slots follow the nesting in the TEI, counted on 2026-09-24 as Person > Ort 656, Tat > Person 166, Tat > Ort 139, Strafe > Person 17, Strafe > Ort 16, Ort > Person 2 and Strafe > Tat 1. Ort sits closest to the text, Person below it, Tat and Strafe share the lowest slot, and the one Tat span inside a Strafe span (Eintrag-187, without a person in it) takes the Person slot. The label of the categories (Täter, Wohnort, Betrug) stands outside the line. A mouse pointer shows it in a small dark tip, a tap on touch screens opens the same tip, which a second tap, a tap elsewhere, scrolling or Escape close. Screen readers hear it as visually hidden generated content before the span, which the Datenkorb does not copy. Marks of the manuscript (Kringel, Blume, additions, Eingangsnotiz) name their kind in the same tip, above the labels of the marked groups they stand in. The scribe change is a focusable note "Schreiberwechsel" with its tip, the stroke kept as in 2017. Expansions carry no tip, italics and brackets mark them. The page carries no `title` attribute.
- Annotation index. The switch "Kategorien" opens below the entry text a list of its annotations grouped by group in columns, each item the label in bold and an excerpt of up to 40 characters, as the former category panel showed them. It is built on first opening, serves keyboard and screen reader users without a tab stop per annotation, and pointing at an item tints its annotation in the text.
- Filters of the Exploration view. A row of menus above the chart, one per filter, each a summary with its name, a chevron and, when values are chosen, their number in a green badge. The open menu shows the values, each a full-width button with its term, its count in the selection on the right and a bar below, the pale track the whole book and the fill the selection, on the scale of its list. A chosen value has the tint, bold text and a green bar at its left edge. Ten values show, "alle N" opens the rest, the origins have a search field. One menu is open at a time, it closes on a click outside and on Escape. The definition of a category is its tooltip.
- Sanction classes. The colour of the marks of the Exploration view, the only place where a hue carries data outside the category groups. Ausweisung `#d95926`, Geldstrafe `#2a78d6`, Verbote `#1baf7a`, Haft, Körperstrafe and Amtsentlassung `#4a3aa7`, checked apart under protanopia and deuteranopia. Entries without a sanction are hollow in the control tone, so that class rests on the shape. A second class of an entry is a ring in its colour. The legend in the bar above the chart is also the filter by class, each item with its dot and its name, and with its count only while other filters make a selection, since without one the count would be a holding size.
- Marks. Circles of up to 14px on a pitch of one month, stacked by date, the pitch shrinking with the width and becoming a quarter below a readable size. A mark outside the selection keeps a seventh of its fill and stroke. Hover shows date, offenders, offences and sanctions in a dark tooltip at the pointer, the hovered or open mark carries an ink ring. The marks are one tab stop, arrow keys move along the axis and within a column, Enter opens the entry.
- Open entry. A card at its mark with the date, the icons for the edition, the Datenkorb and closing, and the offenders, offences, sanctions, origins, procedure and keywords as chips of their groups. Escape closes it.
- Selection. A row under the filters that appears with a selection, the count "N von M Einträgen" in bold, the chosen values as chips naming their filter, each a button that takes its value out, and "Auswahl aufheben".
- Entry table. The selection below the chart, and the entries of the Datenkorb, in a table under the heading "Einträge" without a count, with the date, offenders, offences, sanctions and origins, the icons for the edition and the Datenkorb, and in the Exploration view the dot of the sanction class first. A column head sorts, a second click reverses. From 48rem the head is sticky, below it every row stacks, date and icons on the first line and the other cells under their column name, without an inner scroll. Hover on a row marks the entry in the chart, a click on the date opens it there. The Exploration view shows the first 50 rows of the sorted selection and below the table a tonal button "Alle N Einträge zeigen" with the size of the selection, which shows the rest and moves the focus to the date of the first row it showed, because the whole book stacked on a phone would be a page of many screens. A change of selection or sort returns to 50 rows, opening an entry does not. The rows beyond stay hidden in the table, so "Alle Einträge der Auswahl in den Datenkorb legen" takes the whole selection. The Datenkorb shows all its entries.
- Icon buttons. A 20px mask in the text colour in a 32px target without frame, with its action as `data-tip` and in a visually hidden name, shared by the Exploration view, the Datenkorb, the result pages and the category page (edition, Datenkorb, CSV, clearing, Exploration, closing).
- Page image. A pane with the title "Seitenbild" and the folio, zoom buttons (+, −, "Ganze Seite") as tonal buttons, the OpenSeadragon viewer in the proportions of the page shown, so the page fills it from the top, and the credit of the Staatsarchiv linking to the record in the Digitaler Lesesaal. When the dataset, the viewer or an image fails, the link to the Lesesaal takes the place of the viewer. In the view "Text und Bild" the folio labels are dotted underlined buttons, and the label of the page shown carries a green bar.
- Home. Introduction and facsimile directly on the page, the facsimile with rounded corners and a soft shadow. The four ways as cards in one row from 75rem, two by two from 40rem and stacked below, with a hairline edge that turns green with a shadow on hover and focus. The five groups as pills in their tint.
- Footer. Ink, with white text and marks.

## Views

- Page shell. Title band, navigation with Home, Projekt, Urfehdebuch, Kategorien, Ontologie, Exploration, Datenkorb and Erweiterte Suche, and the quick search. Header, navigation and footer have one width on every page (`--page-max`, 75rem), and only the content varies by page type (`--content-max`), 75rem on the standard pages, 120rem on the edition, the whole window in the Exploration view. The navigation stays at the top of the window from 75rem, where it fits on one line also with a three-digit Datenkorb. Below that it wraps and scrolls away, and no menu button hides its items. The footer holds imprint, data protection, the GAMS, institute and licence marks, one line crediting the technical work of 2017 and 2026 and the contact address. The imprint page leaves the credit line out, since its own block names the credit (ADR-20).
- Imprint. One column in three sections of `IMPRINT`, Die Edition, Umsetzung and Rechtliches, read from top to bottom. Each fact is a row with its label beside it from 40rem and above it below. The licence of content and code has its own row.
- Home. Title of the edition, editors and date, the first sentence of the introduction as a quote with a link to the full introduction, beside it the first page of the manuscript linking to the first entry. Below, four ways in of equal weight. "Urfehdebuch lesen", "Suchen" with two example searches (`wyn |win`, `Dieb*`), "Kategorien" with the five groups as coloured links to their sections, and "Exploration" with one line on what the view draws.
- Edition. Page head with the title, which names the years, and below it the signature of the Staatsarchiv Basel-Stadt as a line of facts. Beside both from 75rem stand the view switch, the TEI and RDF source icons and the citation suggestion, below them on narrower screens. The title is the display title of the home page and `ABOUT`, while the archival title of the `titleStmt` stays in the TEI, its download and the citation suggestion. The link to the Digitaler Lesesaal stands with the page image. Then a tools column with "Im Text markieren" and the table of contents by year and month, one line per entry, sticky on wide screens with only the table of contents scrolling, above the entries on narrow ones. Each entry has a heading with date and folio, the switch of its annotation index and the bookmark, then the head of the entry as the manuscript sets it, centred above the text with its line breaks kept, then the diplomatic text. The categories live in the text as marked annotations and in the annotation index, the category panel beside the text was removed on 2026-09-24. Page breaks and marginal notes stand in a margin column left of the text from 48rem. Expansions are italic in brackets, editorial notes a focusable star whose tip opens on hover and focus and closes with Escape.
- Edition views. The content of the edition widens to 120rem, header and navigation keep the width of the shell. "Text und Bild" is the default from 86rem, where tools column, text at a measure of 38rem and page image fit side by side, the image sticky at the full window height and at least 20rem wide. Below 86rem the default is "Text", and a view in the fragment wins over the default. From 75rem to 86rem "Text und Bild" shrinks the tools to a sticky bar above the text, with the five switches in a row and the table of contents behind the button "Einträge nach Datum". Below 75rem the image stands above the text in the same grid cell, sticky at the top of the window at 40vh (45vh from 62rem, at least 10rem), with the tools column beside it from 62rem and above both on phones. Below 62rem the tools are a bar in both views, the five switches in a row and the table of contents behind the button "Einträge nach Datum", which opens it at full width below the switches. Anchors land below image and bar. Without script the page shows the text without switch, marking and image.
- Search. The empty form is the page, the fields beside a rail with the example table and the closed rules, date fields without placeholder. After a search the hit count with the query heads the page, with the icons for all hits into the Datenkorb and as CSV at its right end. The form with the example searches and the collapsed rules and the links to the first hit per year stand in the tools column, on narrow screens the form waits behind "Suche ändern" with the query while the year links stay visible. The hits follow in date order with highlighted terms, matched categories and the full text on demand.
- Categories. The groups as sections with the swatch in the heading, each category with its gloss, its name in the link green as the link to its entries and, for offences, sanctions, keywords and the procedure categories, the Exploration icon with the tip "In der Exploration zeigen". The tools column lists the groups, on narrow screens as a wrapping row.
- Category browse. A result list shown one year at a time, the year in the fragment and the current year in bold, with a link "Weiter mit" the next year, the Exploration icon where the view has a filter for the category, and all hits in the Datenkorb and the CSV. The former graph page forwards to the Exploration view.
- Datenkorb. The page head with the title, the icon buttons for the CSV and for clearing after a confirmation, and the note that the Datenkorb lives in this browser only. Below it the entry table without the dot, sorted by its column heads, each entry removed with its bookmark switch. The categories come once from the query of the Exploration view, offences, sanctions and origins in their columns, procedure and keywords in the CSV.
- Ontologie. Rendered from the `ONTOLOGY` datastream of `o:ufbas.ontology` alone, also as the page of that object (ADR-33). Page head with title, version and licence and one download as icon button, the RDF/XML of the datastream. The model as a tree of the classes, their properties as labels above the child box, a class drawn elsewhere as a dashed box, and the four classes that match a category group in its colour, from 62rem sticky beside the terms. Then the namespaces with links to the `RDF` datastreams of edition and taxonomy, which hold the refactored data and concept scheme after the re-ingest, and the classes, properties and individuals with anchors, labels, comment, domain, range and alignment.
- Exploration. The page takes the width of the window. Page head with the title and a status line for loading and failure, then one bar with the view switch "Zeit" and "Tatbestand", the legend of the sanction classes and the filter menus, the selection row, the chart over the whole width and the entry table. The force graph of the former graph page gave no reading of numbers, positions that meant nothing and hubs of near-universal formulas, and it covered one category at a time, and the calendar and matrix that followed it had to be read as numbers, so the view draws every entry as a mark (ADR-22).

## Accessibility and reflow

The pages meet the automatically testable rules of WCAG 2.2 A and AA and reflow without horizontal scrolling from 320px, which is also what 200 and 400 percent zoom reduce to ([testing.md](testing.md#browser)). No element scrolls sideways except tables in their focusable scroll region. Keyboard use starts with a skip link, every control has a visible focus ring, lists without bullets keep their list role, and targets are at least 24px. States never depend on colour alone, the current page has its bar, checked switches their box or radio and bold text, marked groups their line style or band, the Datenkorb icon its filled shape.

## Print

Printing keeps the text of a page and its dates and leaves out navigation, tools column, page actions, the view switch, the page image and controls. An entry is not split across pages.

## Open decisions

No design decision is open. The introduction sentence of the category page, standing explanatory prose from the TEI of `o:ufbas.kategorien`, stays as TEI content (ADR-28 in [specification.md](specification.md#decisions)).
