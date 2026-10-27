// Runs js/highlighting.js and js/edition-views.js in jsdom on the edition page built by
// build.mjs: the marking of the annotation groups with their tips and index, the views of
// text and page image, and the editorial notes.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { root } from '../gams.mjs';
import { ORIGIN, built, open, runner } from './lib.mjs';

const { test, done } = runner('marking-views', 'tests');

await test('the marking switches mark several groups at once and add nothing to the text', async () => {
  const window = await open(built('edition'), { scripts: ['highlighting.js'] });
  const doc = window.document;
  const body = doc.querySelector('.edition-body');
  const text = doc.getElementById('Eintrag-0').querySelector('.entry-text').textContent;
  assert.equal(doc.querySelector('.mark-switches').hidden, false, 'shown once the script runs');
  const box = (value) => doc.querySelector(`.mark-switches input[value="${value}"]`);
  box('Ort').click();
  box('Person').click();
  assert.ok(body.classList.contains('mark-Person') && body.classList.contains('mark-Ort'), 'several groups at once');
  assert.equal(body.getAttribute('style'), null, 'no line height or slot set by the script');
  assert.equal(doc.getElementById('Eintrag-0').querySelector('.entry-text').textContent, text, 'no text inserted');
  box('Person').click();
  assert.ok(!body.classList.contains('mark-Person') && body.classList.contains('mark-Ort'));
});

// a pointer event as jsdom has none; the scripts read only its type and position
const pointer = (window, type, target, pointerType, x = 100, y = 200) => {
  const event = new window.MouseEvent(type, { bubbles: true, clientX: x, clientY: y });
  Object.defineProperty(event, 'pointerType', { value: pointerType });
  target.dispatchEvent(event);
};

await test('a marked annotation shows its labels in a tip on hover, outermost first, unmarked groups left out', async () => {
  const window = await open(built('edition'), { scripts: ['highlighting.js'] });
  const doc = window.document;
  // <persName ana="#uf_PersonTäter">… <placeName ana="#uf_OrtWohnort">mindren Basell</placeName></persName>
  const place = doc.querySelector('#Eintrag-0 .entry-rubric .ann[data-group="Ort"]');
  pointer(window, 'pointerover', place, 'mouse');
  assert.ok(!doc.querySelector('.ann-tip:not([hidden])'), 'no tip while no group is marked');
  doc.querySelector('.mark-switches input[value="Person"]').click();
  pointer(window, 'pointerover', place, 'mouse');
  const tip = doc.querySelector('.ann-tip');
  assert.deepEqual([...tip.children].map((row) => row.textContent), ['Person: Täter']);
  assert.equal(tip.getAttribute('aria-hidden'), 'true', 'screen readers get the label from the text');
  doc.querySelector('.mark-switches input[value="Ort"]').click();
  pointer(window, 'pointerover', place.parentElement, 'mouse');
  pointer(window, 'pointerover', place, 'mouse');
  assert.deepEqual([...tip.children].map((row) => row.textContent), ['Person: Täter', 'Ort: Wohnort']);
  pointer(window, 'pointerover', place, 'touch');
  assert.equal(tip.hidden, false, 'touch goes by tap');
  pointer(window, 'pointerleave', doc.querySelector('.edition-body'), 'mouse');
  assert.equal(tip.hidden, true);
});

await test('a mark of the manuscript shows its kind in the tip, before the labels of marked annotations', async () => {
  const window = await open(built('edition'), { scripts: ['highlighting.js'] });
  const doc = window.document;
  // <metamark rend="kringel">
  const kringel = [...doc.querySelectorAll('.metamark')].find((m) => m.getAttribute('data-kind') === 'Kringel');
  pointer(window, 'pointerover', kringel, 'mouse');
  const tip = doc.querySelector('.ann-tip');
  assert.equal(tip && !tip.hidden && tip.textContent, 'Kringel', 'shown without any group marked');
  // <note ana="#uf_Eingangsnotiz #uf_SchlagwortAuffällig" rend="margin"><persName ana="#uf_SchlagwortRatsknecht">Köferlj</persName></note>, pointed at the note itself
  const note = doc.querySelector('#Eintrag-222 .margin-note.ann');
  doc.querySelector('.mark-switches input[value="Schlagwort"]').click();
  pointer(window, 'pointerover', note, 'mouse');
  assert.deepEqual([...tip.children].map((row) => row.textContent), ['Eingangsnotiz', 'Schlagwort: Auffällig']);
  // the change of scribe has its own data-tip, so no second tip opens
  pointer(window, 'pointerover', doc.querySelector('.hand-shift'), 'mouse');
  assert.equal(tip.hidden, true);
});

await test('a tap opens the label of an annotation, a second tap, a tap elsewhere and Escape close it', async () => {
  const window = await open(built('edition'), { scripts: ['highlighting.js'] });
  const doc = window.document;
  doc.querySelector('.mark-switches input[value="Tat"]').click();
  const deed = doc.querySelector('#Eintrag-0 .ann[data-group="Tat"]');
  deed.click();
  const tip = doc.querySelector('.ann-tip');
  assert.equal(tip.hidden, false);
  assert.equal(tip.textContent, 'Tatbestand: Betrug');
  deed.click();
  assert.equal(tip.hidden, true, 'second tap closes');
  deed.click();
  doc.querySelector('#Eintrag-0 .entry-rubric').click();
  assert.equal(tip.hidden, true, 'a tap elsewhere closes');
  deed.click();
  doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' }));
  assert.equal(tip.hidden, true, 'Escape closes');
});

await test('each entry opens the list of its annotations by group below its text', async () => {
  const window = await open(built('edition'), { scripts: ['highlighting.js'] });
  const doc = window.document;
  const entry = doc.getElementById('Eintrag-146');
  const button = entry.querySelector('.entry-head .index-toggle');
  assert.equal(button.hidden, false, 'shown once the script runs');
  assert.equal(button.getAttribute('aria-expanded'), 'false');
  assert.equal(entry.querySelector('.entry-index'), null, 'built on first opening');
  button.click();
  const index = entry.querySelector('.entry-text + .entry-index');
  assert.equal(button.getAttribute('aria-expanded'), 'true');
  assert.equal(button.getAttribute('aria-controls'), index.id);
  const groups = [...index.querySelectorAll('.index-group')].map((g) => g.getAttribute('data-group'));
  assert.deepEqual(groups, ['Person', 'Tat', 'Strafe', 'Ort', 'Schlagwort'].filter((g) => groups.includes(g)), 'groups in the order of the switches');
  assert.equal(index.querySelector('.index-group h4').textContent, 'Person');
  // <roleName>mey<lb break="no"/> ger</roleName> is joined as in every derived label
  const offender = [...index.querySelectorAll('li')].find((li) => li.querySelector('b').textContent === 'Täter');
  assert.equal(offender.textContent, 'Täter Hanns Zwilchenbart der meyger');
  assert.equal(index.querySelectorAll('li').length, entry.querySelectorAll('.entry-text .ann').length, 'one item per annotation');
  const span = entry.querySelector('.entry-text .ann[data-group="Person"]');
  offender.dispatchEvent(new window.MouseEvent('mouseenter'));
  assert.ok(span.classList.contains('is-pointed'), 'pointing at an item shows its annotation');
  offender.dispatchEvent(new window.MouseEvent('mouseleave'));
  assert.ok(!span.classList.contains('is-pointed'));
  button.click();
  assert.equal(index.hidden, true);
  assert.equal(entry.querySelectorAll('.entry-index').length, 1);
  assert.ok(!doc.querySelector('.entry-text').textContent.includes('Täter'), 'the text itself stays as it is');
});

await test('boxes the browser restored are applied on load', async () => {
  const html = built('edition').replace('<input type="checkbox" name="markierung" value="Ort"/>', '<input type="checkbox" name="markierung" value="Ort" checked="checked"/>');
  const window = await open(html, { scripts: ['highlighting.js'] });
  assert.ok(window.document.querySelector('.edition-body').classList.contains('mark-Ort'));
});

// Views and page image. OpenSeadragon and fetch are stubbed; the stub records what
// the page asks of the viewer.
const facsimileData = JSON.parse(readFileSync(resolve(root, 'data/ufbas-facsimile.json'), 'utf8'));
function stubs({ dataOk = true } = {}) {
  const calls = { fetched: [], created: [], opened: [], zoom: [], home: 0, scrolled: [], handlers: {} };
  calls.before = (window) => {
    window.fetch = (url) => {
      calls.fetched.push(url);
      return Promise.resolve(dataOk ? { ok: true, json: () => Promise.resolve(facsimileData) } : { ok: false, status: 404 });
    };
    window.OpenSeadragon = (options) => {
      calls.created.push(options);
      return {
        addHandler: (name, fn) => { calls.handlers[name] = fn; },
        open: (source) => { calls.opened.push(source); },
        viewport: { zoomBy: (factor) => calls.zoom.push(factor), applyConstraints() {}, goHome: () => { calls.home++; } }
      };
    };
    window.Element.prototype.scrollIntoView = function () { calls.scrolled.push(this.id); };
  };
  return calls;
}
const settle = () => new Promise((done) => setTimeout(done, 40));
const views = (window) => {
  const doc = window.document;
  return {
    doc,
    layout: doc.querySelector('.edition-layout'),
    pane: doc.querySelector('.facsimile'),
    view: (value) => { doc.querySelector(`input[name="ansicht"][value="${value}"]`).click(); },
    mark: (value) => { doc.querySelector(`.mark-switches input[value="${value}"]`).click(); },
    markers: [...doc.querySelectorAll('.edition-body .folio[data-facs]')]
  };
};
// Lays the book out so that the given folio label is the last one above the reading
// line, a third down the window (jsdom reports a window height of 768 and no rects).
function readAt(window, marker) {
  const body = window.document.querySelector('.edition-body');
  const children = [...body.children];
  const part = children.findIndex((c) => c.contains(marker));
  const inPart = [...children[part].querySelectorAll('.folio[data-facs]')];
  const partTop = 768 / 3 - 50 - 100 * inPart.indexOf(marker);
  const rect = (top) => () => ({ top, bottom: top + 50, left: 0, right: 600, width: 600, height: 50 });
  children.forEach((child, i) => { child.getBoundingClientRect = rect(partTop + (i - part) * 100000); });
  inPart.forEach((m, k) => { m.getBoundingClientRect = rect(partTop + 100 * k); });
  window.dispatchEvent(new window.Event('scroll'));
}

await test('the view switch shows, starts with the text and keeps view and marking in the fragment', async () => {
  const calls = stubs();
  const window = await open(built('edition'), { scripts: ['highlighting.js', 'edition-views.js'], before: calls.before });
  const { doc, layout, pane, view, mark } = views(window);
  assert.equal(doc.querySelector('.view-switch').hidden, false, 'shown once the script runs');
  assert.equal(layout.getAttribute('data-ansicht'), 'text');
  assert.equal(pane.hidden, true);
  assert.deepEqual(calls.fetched, [], 'nothing loaded for the text view');
  assert.equal(calls.created.length, 0);
  mark('Person');
  assert.equal(window.location.hash, '#markierung=Person');
  view('bild');
  assert.equal(layout.getAttribute('data-ansicht'), 'bild');
  assert.equal(pane.hidden, false);
  assert.equal(window.location.hash, '#ansicht=bild&markierung=Person');
  // a followed entry link replaces the fragment, the state joins it again
  window.location.hash = '#Eintrag-5';
  await settle();
  assert.equal(window.location.hash, '#Eintrag-5&ansicht=bild&markierung=Person');
  view('text');
  mark('Person');
  assert.equal(window.location.hash, '#Eintrag-5');
  assert.equal(window.location.search, '', 'no query parameter, GAMS answers the edition URL with one by 404');
});

await test('a linked view is read from the fragment, with the entry scrolled to', async () => {
  const calls = stubs();
  const window = await open(built('edition'), { url: ORIGIN + '/o:ufbas.1563#Eintrag-146&ansicht=bild&markierung=Ort,Tat,Unbekannt', scripts: ['highlighting.js', 'edition-views.js'], before: calls.before });
  const { doc, layout } = views(window);
  const body = doc.querySelector('.edition-body');
  assert.equal(layout.getAttribute('data-ansicht'), 'bild');
  assert.deepEqual([...doc.querySelectorAll('.mark-switches input:checked')].map((b) => b.value), ['Tat', 'Ort']);
  assert.ok(body.classList.contains('mark-Tat') && body.classList.contains('mark-Ort'), 'marking applied by highlighting.js');
  assert.deepEqual(calls.scrolled, ['Eintrag-146']);
  const other = await open(built('edition'), { url: ORIGIN + '/o:ufbas.1563#ansicht=galerie', scripts: ['highlighting.js', 'edition-views.js'], before: stubs().before });
  assert.equal(views(other).layout.getAttribute('data-ansicht'), 'text', 'an unknown view falls back to the text');
});

await test('Text und Bild is the default where tools, text and image fit side by side, a view in the fragment wins', async () => {
  const wide = (calls) => (window) => {
    calls.before(window);
    window.matchMedia = (query) => ({ matches: query === '(min-width: 86rem)' });
  };
  let calls = stubs();
  let window = await open(built('edition'), { scripts: ['highlighting.js', 'edition-views.js'], before: wide(calls) });
  let { layout, view } = views(window);
  assert.equal(layout.getAttribute('data-ansicht'), 'bild');
  assert.equal(window.location.hash, '', 'the default needs no fragment');
  view('text');
  assert.equal(window.location.hash, '#ansicht=text', 'a view other than the default is kept');
  view('bild');
  assert.equal(window.location.hash, '');
  calls = stubs();
  window = await open(built('edition'), { url: ORIGIN + '/o:ufbas.1563#ansicht=text', scripts: ['highlighting.js', 'edition-views.js'], before: wide(calls) });
  assert.equal(views(window).layout.getAttribute('data-ansicht'), 'text');
  assert.deepEqual(calls.fetched, [], 'nothing loaded for the text view');
});

await test('where the tools shrink to a bar, the table of contents opens behind a button', async () => {
  const window = await open(built('edition'), { scripts: ['highlighting.js', 'edition-views.js'], before: stubs().before });
  const doc = window.document;
  const button = doc.querySelector('.tools .toc-toggle');
  const tools = button.closest('.tools');
  assert.equal(button.hidden, false);
  assert.equal(button.getAttribute('aria-controls'), doc.querySelector('.edition-toc').id);
  button.click();
  assert.equal(button.getAttribute('aria-expanded'), 'true');
  assert.ok(tools.classList.contains('toc-open'));
  doc.querySelector('.edition-toc a').click();
  assert.equal(button.getAttribute('aria-expanded'), 'false', 'a chosen entry closes it');
  button.click();
  doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' }));
  assert.ok(!tools.classList.contains('toc-open'), 'Escape closes it');
  assert.equal(doc.activeElement, button);
});

await test('Text und Bild loads dataset and viewer once and follows the page at the reading line', async () => {
  const calls = stubs();
  const window = await open(built('edition'), { scripts: ['highlighting.js', 'edition-views.js'], before: calls.before });
  const { doc, pane, view, markers } = views(window);
  const byImage = (n) => markers.find((m) => m.getAttribute('data-facs') === String(n));
  readAt(window, markers[0]);
  view('bild');
  await settle();
  assert.deepEqual(calls.fetched, ['/ufbas/data/ufbas-facsimile.json']);
  assert.equal(calls.created.length, 1);
  const options = calls.created[0];
  assert.equal(options.drawer, 'canvas', 'tiles as plain images, the store allows CORS for gams.uni-graz.at only');
  assert.equal(options.showNavigationControl, false);
  assert.ok(pane.contains(options.element));
  const source = calls.opened.at(-1);
  assert.equal(source['@id'], facsimileData.images[19].service);
  assert.deepEqual([source.width, source.height, source.profile[0], JSON.stringify(source.tiles)],
    [facsimileData.images[19].width, facsimileData.images[19].height, 'http://iiif.io/api/image/2/level0.json', '[{"width":2048,"scaleFactors":[1,2]}]']);
  assert.equal(pane.querySelector('.facsimile-credit a').textContent, facsimileData.source.credit);
  // scrolling moves the page break of image 47 above the reading line
  readAt(window, byImage(47));
  await settle();
  assert.equal(calls.opened.at(-1)['@id'], facsimileData.images[47].service);
  assert.equal(pane.querySelector('.facsimile-folio').textContent, byImage(47).textContent);
  assert.deepEqual(markers.filter((m) => m.getAttribute('aria-current')).map((m) => m.getAttribute('data-facs')), ['47']);
  // a folio label opens its page by Enter and by click
  const leaf = byImage(85);
  assert.deepEqual([leaf.getAttribute('role'), leaf.getAttribute('tabindex'), leaf.getAttribute('aria-label')], ['button', '0', 'Seitenbild fol. 32ar']);
  leaf.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  assert.equal(calls.opened.at(-1)['@id'], facsimileData.images[85].service);
  byImage(20).click();
  assert.equal(calls.opened.at(-1)['@id'], facsimileData.images[20].service);
  // own zoom buttons, usable once the viewer has opened the page
  assert.equal(pane.querySelector('[data-zoom="in"]').disabled, true);
  calls.handlers.open();
  pane.querySelector('[data-zoom="in"]').click();
  pane.querySelector('[data-zoom="out"]').click();
  pane.querySelector('[data-zoom="home"]').click();
  assert.deepEqual([calls.zoom[0], Math.round(calls.zoom[1] * 1000) / 1000, calls.home], [1.5, 0.667, 1]);
  // back to the text: the labels are plain text again, and nothing is loaded twice
  view('text');
  assert.equal(pane.hidden, true);
  assert.equal(doc.querySelectorAll('.folio[role], .folio[tabindex], .folio[aria-current]').length, 0);
  view('bild');
  await settle();
  assert.equal(calls.fetched.length, 1);
  assert.equal(calls.created.length, 1);
});

await test('without the dataset the page image area links to the Lesesaal instead of a viewer', async () => {
  const calls = stubs({ dataOk: false });
  const window = await open(built('edition'), { url: ORIGIN + '/o:ufbas.1563#ansicht=bild', scripts: ['highlighting.js', 'edition-views.js'], before: calls.before });
  await settle();
  const { pane } = views(window);
  assert.equal(pane.querySelector('.facsimile-missing').hidden, false);
  assert.equal(pane.querySelector('.facsimile-missing a').getAttribute('href'), 'https://dls.staatsarchiv.bs.ch/records/315538');
  assert.equal(pane.querySelector('.facsimile-zoom').hidden, true, 'no zoom buttons without a viewer');
  assert.equal(calls.created.length, 0);
});

await test('an image that does not load gives way to the link, the next page tries again', async () => {
  const calls = stubs();
  const window = await open(built('edition'), { scripts: ['highlighting.js', 'edition-views.js'], before: calls.before });
  const { pane, view, markers } = views(window);
  readAt(window, markers[0]);
  view('bild');
  await settle();
  calls.handlers['tile-load-failed']();
  assert.equal(pane.querySelector('.facsimile-missing').hidden, false);
  assert.equal(pane.querySelector('.facsimile-viewer').hidden, true);
  readAt(window, markers[3]);
  await settle();
  assert.equal(pane.querySelector('.facsimile-missing').hidden, true);
  assert.equal(pane.querySelector('.facsimile-viewer').hidden, false);
  assert.equal(calls.opened.at(-1)['@id'], facsimileData.images[markers[3].getAttribute('data-facs')].service);
});

await test('an editorial note shows its text on focus and hides on Escape', async () => {
  const window = await open(built('edition'), { scripts: ['highlighting.js'] });
  const doc = window.document;
  const note = doc.querySelector('.editor-note');
  const text = note.getAttribute('data-note');
  note.focus();
  const tip = doc.querySelector('.note-tip');
  assert.ok(tip && !tip.hidden, 'tip shown');
  assert.equal(tip.textContent, text);
  doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' }));
  assert.equal(tip.hidden, true);
});

done();
