/**
 * The drawings: emblems, portraits, security patterns, stamps and the documents themselves, and
 * the words that describe them.
 */
import { describe, expect, it } from 'vitest';
import { cleanDesign } from '../src/passport/clean';
import { contrast, coverInk, hexOf, papers, stampInks } from '../src/passport/colours';
import { describeCard, describeCover, describeDataPage, describeDocument, describeStamp, describeVisaPage, listOf, stampLines, summarise, theOffice, titleOf, withArticle } from '../src/passport/describe';
import { chipSymbol, contactPad, emblem, emblems } from '../src/passport/emblems';
import { ARSTOTZKA_TEXT, MOON_STAMP_TEXT, hasMoonVisa, isArstotzka, isMoonVisa } from '../src/passport/fun';
import { isRealCountry } from '../src/passport/fiction';
import { cleanStateName } from '../src/passport/clean';
import { avatarIds, clothesIds, defaultDesign, defaultStamp, emblemIds, foilIds, hairIds, patternIds, skinIds, stampBorders, stampMarks, stampShapes, type Design, type DocumentRef, type Stamp } from '../src/passport/model';
import { drawPattern, pattern, patterns } from '../src/passport/patterns';
import { avatar, avatars, describePortrait, drawPortrait, hairColours, skins } from '../src/passport/portraits';
import { coverOutline, documentsOf, foilBands, renderCardBack, renderCardFront, renderCover, renderDataPage, renderDocument, renderStamp, renderVisaPage, sizes, svgDataUrl } from '../src/passport/render';
import { generateHolder } from '../src/passport/names';
import { SIGNED_LETTERS, drawSignature, signatureText } from '../src/passport/signature';
import { borderNames, drawStamp, markNames, noteStamp, shapeNames, stampBox, stampExtent, stampFace } from '../src/passport/stamps';
import { MONO, esc, estimateWidth, starPoints, text } from '../src/passport/svg';
import { template } from '../src/passport/templates';
import { drawAll, problems, randomDesign } from './helpers/designs';
import { textsOf } from './helpers/mrz';

const wrap = (inner: string): string => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 125">${inner}</svg>`;
const elements = (svg: string): Set<string> => new Set([...svg.matchAll(/<([A-Za-z]+)\b/g)].map((m) => m[1]!));
const tweak = (change: (d: Design) => void): Design => {
  const d = defaultDesign();
  change(d);
  return cleanDesign(d);
};
const options = { calendar: null, idPrefix: 't' };

describe('writing SVG', () => {
  it('escapes text for content and attributes alike', () => {
    expect(esc(`Tom & "Jerry" <'x'>`)).toBe('Tom &amp; &quot;Jerry&quot; &lt;&#39;x&#39;&gt;');
    expect(text('A & B', { x: 1, y: 2, size: 10, fill: '#000000' })).toBe('<text x="1" y="2" font-family="system-ui, Arial, sans-serif" font-size="10" fill="#000000">A &amp; B</text>');
    expect(text('   ', { x: 1, y: 2, size: 10, fill: '#000000' })).toBe('');
  });

  it('shrinks a line that is too wide, and tells the browser its limit when shrinking is not enough', () => {
    const fits = text('Short', { x: 0, y: 0, size: 12, fill: '#000000', max: 200 });
    expect(fits).toContain('font-size="12"');
    expect(fits).not.toContain('textLength');
    const shrunk = text('A rather longer line of text than fits', { x: 0, y: 0, size: 12, fill: '#000000', max: 150, min: 4 });
    expect(Number(/font-size="([\d.]+)"/.exec(shrunk)![1])).toBeLessThan(12);
    const squeezed = text('W'.repeat(40), { x: 0, y: 0, size: 12, fill: '#000000', max: 60, min: 10 });
    expect(squeezed).toContain('font-size="10"');
    expect(squeezed).toContain('textLength="60" lengthAdjust="spacingAndGlyphs"');
  });

  it('estimates wider for wider letters, bold and spacing', () => {
    expect(estimateWidth('', 10)).toBe(0);
    expect(estimateWidth('WWW', 10)).toBeGreaterThan(estimateWidth('iii', 10));
    expect(estimateWidth('abc', 10, { weight: 700 })).toBeGreaterThan(estimateWidth('abc', 10));
    expect(estimateWidth('abc', 10, { spacing: 2 })).toBeCloseTo(estimateWidth('abc', 10) + 6, 5);
    expect(estimateWidth('iii', 10, { family: MONO })).toBeCloseTo(estimateWidth('WWW', 10, { family: MONO }), 5);
  });

  it('draws a star with twice as many corners as points', () => {
    expect(starPoints(0, 0, 10, 4, 5).split(' ')).toHaveLength(10);
    expect(starPoints(0, 0, 10, 4, 5).split(' ')[0]).toBe('0,-10');
  });
});

describe('emblems', () => {
  it('has one drawing for every emblem in the model, each with a name and a phrase of its own', () => {
    expect(emblems.map((e) => e.id)).toEqual([...emblemIds]);
    expect(new Set(emblems.map((e) => e.name)).size).toBe(emblems.length);
    expect(new Set(emblems.map((e) => e.phrase)).size).toBe(emblems.length);
    for (const e of emblems) expect(e.phrase, e.id).toMatch(/^(a|an|two) /);
    expect(emblem('nonsense').id).toBe('star');
  });

  it('draws each in one colour, from simple shapes, well formed', () => {
    const allowed = ['svg', 'g', 'circle', 'polygon', 'path', 'rect', 'line', 'ellipse'];
    for (const e of emblems) {
      const svg = wrap(e.draw('#e8c46a', '#5b1a28'));
      expect(problems(svg), e.id).toEqual([]);
      expect(svg, e.id).toContain('#e8c46a');
      expect(svg, e.id).not.toMatch(/NaN|undefined|Infinity/);
      for (const el of elements(svg)) expect(allowed, `${e.id}: ${el}`).toContain(el);
      const colours = new Set([...svg.matchAll(/#[0-9a-f]{6}/g)].map((m) => m[0]));
      for (const colour of colours) expect(['#e8c46a', '#5b1a28'], e.id).toContain(colour);
    }
    expect(new Set(emblems.map((e) => e.draw('#e8c46a', '#5b1a28'))).size).toBe(emblems.length);
  });

  it('draws the chip symbol and the contact pad', () => {
    expect(problems(wrap(chipSymbol(50, 50, 54, '#e8c46a')))).toEqual([]);
    // As on a real booklet: a bar above and a bar below, each cut round the circle in the middle, and the circle itself.
    const chip = chipSymbol(50, 50, 54, '#e8c46a');
    expect(chip).toContain('data-part="chip"');
    expect(chip.match(/M[\d.]+ [\d.]+H/g)).toHaveLength(2);
    expect(chip.match(/A[\d.]+ [\d.]+ 0 0 [01] /g)).toHaveLength(2);
    expect(chip.match(/<circle\b/g)).toHaveLength(1);
    // The line across the middle is clear: neither bar reaches the centre line.
    const edges = [...chip.matchAll(/V([\d.]+)H/g)].map((m) => Number(m[1]));
    expect(edges).toHaveLength(2);
    expect(Math.min(...edges)).toBeLessThan(50);
    expect(Math.max(...edges)).toBeGreaterThan(50);
    expect(problems(wrap(contactPad(10, 10, 84)))).toEqual([]);
  });
});

describe('portraits: hair', () => {
  it('covers the top of the head: the hair’s outer edge never runs inside the skull', () => {
    // The head is an ellipse centred on (50, 53), 22 wide and 27 tall each way; its top is at 26.
    const inHead = (x: number, y: number): boolean => ((x - 50) / 22) ** 2 + ((y - 53) / 27) ** 2 < 0.98;
    const hair = hairColours.find((h) => h.id === 'black')!.hex;
    let checked = 0;
    for (const a of avatars) {
      if (a.hair === 'none' || a.hair === 'sides') continue;
      const svg = drawPortrait({ avatar: a.id, skin: 'fair', hair: 'black', clothes: 'navy' });
      // The front hair: the path that starts at one temple and arches to the other in one curve.
      const front = [...svg.matchAll(new RegExp(`<path d="M(\\d+) (\\d+)C(\\d+) (\\d+) (\\d+) (\\d+) (\\d+) (\\d+)c[^"]*" fill="${hair}"/>`, 'g'))].map((m) => m.slice(1).map(Number)).filter((p) => p[0]! < 30 && p[6]! > 70 && p[1]! < 60);
      expect(front, a.id).toHaveLength(1);
      const [x0, y0, x1, y1, x2, y2, x3, y3] = front[0] as [number, number, number, number, number, number, number, number];
      let top = Infinity;
      for (let t = 0.05; t < 0.96; t += 0.05) {
        const u = 1 - t;
        const x = u ** 3 * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t ** 3 * x3;
        const y = u ** 3 * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t ** 3 * y3;
        expect(inHead(x, y), `${a.id} at ${t.toFixed(2)}: (${x.toFixed(1)}, ${y.toFixed(1)})`).toBe(false);
        top = Math.min(top, y);
      }
      expect(top, a.id).toBeLessThan(26);
      checked++;
    }
    expect(checked).toBeGreaterThanOrEqual(8);
  });
});

describe('portraits', () => {
  it('has one drawing for every avatar in the model, each described in words', () => {
    expect(avatars.map((a) => a.id)).toEqual([...avatarIds]);
    expect(new Set(avatars.map((a) => a.phrase)).size).toBe(avatars.length);
    expect(new Set(avatars.map((a) => a.name)).size).toBe(avatars.length);
    expect(avatar('nonsense').id).toBe('short');
    expect(describePortrait({ avatar: 'bob', skin: 'honey', hair: 'brown', clothes: 'navy' })).toBe('a drawing, not a photograph: a chin-length bob and a collared shirt');
  });

  it('draws every avatar in every skin tone, well formed, as shapes and nothing else', () => {
    const drawings = new Set<string>();
    for (const id of avatarIds) {
      for (const skin of skinIds) {
        const markup = drawPortrait({ avatar: id, skin, hair: hairIds[0], clothes: clothesIds[0] });
        const svg = wrap(markup);
        expect(problems(svg), `${id} ${skin}`).toEqual([]);
        expect(svg).toContain(hexOf(skins, skin));
        expect(svg).not.toMatch(/NaN|undefined|Infinity/);
        for (const el of elements(svg)) expect(['svg', 'g', 'circle', 'polygon', 'path', 'rect', 'ellipse'], `${id}: ${el}`).toContain(el);
        drawings.add(markup);
      }
    }
    expect(drawings.size).toBe(avatarIds.length * skinIds.length);
  });

  it('changes with hair and clothes, and is the same every time', () => {
    const base = { avatar: 'long', skin: 'fair', hair: 'black', clothes: 'navy' } as const;
    expect(drawPortrait(base)).toBe(drawPortrait({ ...base }));
    expect(drawPortrait({ ...base, hair: 'blond' })).not.toBe(drawPortrait(base));
    expect(drawPortrait({ ...base, clothes: 'wine' })).not.toBe(drawPortrait(base));
  });
});

describe('security patterns', () => {
  it('has a name and a phrase for every pattern in the model', () => {
    expect(patterns.map((p) => p.id)).toEqual([...patternIds]);
    expect(pattern('nonsense').id).toBe('waves');
  });

  it('draws each from its seed: the same seed the same lines, another seed other lines', () => {
    for (const id of patternIds) {
      const a = drawPattern(id, 500, 352, 3);
      expect(drawPattern(id, 500, 352, 3), id).toBe(a);
      if (id === 'none') {
        expect(a).toBe('');
        continue;
      }
      expect(drawPattern(id, 500, 352, 4), id).not.toBe(a);
      expect(problems(wrap(a)), id).toEqual([]);
      expect(a, id).not.toMatch(/NaN|undefined|Infinity/);
      for (const el of elements(a)) expect(['path', 'circle'], id).toContain(el);
    }
  });

  it('never grows past what a download can carry comfortably', () => {
    for (const id of patternIds) for (let seed = 0; seed < 40; seed++) expect(drawPattern(id, 500, 352, seed).length, `${id} ${seed}`).toBeLessThan(60000);
  });
});

describe('stamps', () => {
  it('has a size and a name for every shape, border and mark', () => {
    for (const shape of stampShapes) {
      expect(stampBox[shape].w).toBeGreaterThan(100);
      expect(shapeNames[shape]).toBeTruthy();
    }
    for (const border of stampBorders) expect(borderNames[border]).toBeTruthy();
    for (const mark of stampMarks) expect(markNames[mark]).toBeTruthy();
  });

  it('draws every shape with every border and every degree of wear, well formed', () => {
    for (const shape of stampShapes) {
      for (const border of stampBorders) {
        for (const wear of [0, 1, 2, 3]) {
          for (const mark of stampMarks) {
            const stamp: Stamp = { ...defaultStamp('entry'), shape, border, wear, mark };
            const svg = wrap(drawStamp(stamp, 100, 100, options));
            const where = `${shape} ${border} ${wear} ${mark}`;
            expect(problems(svg), where).toEqual([]);
            expect(svg, where).not.toMatch(/NaN|undefined|Infinity/);
            expect(svg, where).toContain(hexOf(stampInks, stamp.ink));
          }
        }
      }
    }
  });

  it('prints its lines in capitals, with the date in the style asked for', () => {
    const stamp = defaultStamp('entry');
    const face = wrap(stampFace(stamp, options));
    expect(textsOf(face)).toEqual(expect.arrayContaining(['TELAND', 'ENTRY', '19 DEC 2026', 'PORT OF SELUN', 'BORDER GUARD']));
    expect(textsOf(wrap(stampFace({ ...stamp, dateStyle: 'numeric' }, options)))).toContain('19.12.2026');
    expect(textsOf(wrap(stampFace({ ...stamp, dateStyle: 'long', shape: 'rectangle' }, options)))).toContain('19 DECEMBER 2026');
    const lantern = { months: [{ name: 'Frostwane', days: 31 }], era: 'LR' };
    expect(textsOf(wrap(stampFace({ ...stamp, date: { d: 4, m: 1, y: 1022 } }, { calendar: lantern, idPrefix: 't' })))).toContain('04 FRO 1022 LR');
  });

  it('leaves out a line that is empty, and the mark when there is none', () => {
    const bare = wrap(stampFace({ ...defaultStamp('exit'), top: '', place: '', bottom: '', mark: 'none', shape: 'circle' }, options));
    expect(textsOf(bare)).toEqual(['EXIT', '19 DEC 2026']);
    expect(bare).not.toContain('textPath');
    expect(problems(bare)).toEqual([]);
  });

  it('lands a little crooked and wears as it is told to', () => {
    const stamp = defaultStamp('entry');
    const crisp = drawStamp({ ...stamp, wear: 0 }, 0, 0, options);
    expect(crisp).toContain('rotate(-7)');
    expect(crisp).not.toContain('<mask');
    expect(crisp).toContain('opacity="0.95"');
    const tired = drawStamp({ ...stamp, wear: 3 }, 0, 0, options);
    expect(tired.match(/<ellipse/g)).toHaveLength(16);
    expect(tired).toContain('opacity="0.78"');
    expect(drawStamp({ ...stamp, wear: 3 }, 0, 0, options)).toBe(tired);
    expect(drawStamp({ ...stamp, wear: 3, seed: stamp.seed + 1 }, 0, 0, options)).not.toBe(tired);
    expect(drawStamp(stamp, 0, 0, options, 0.6)).toContain('scale(0.6)');
  });

  it('needs more room once it is turned', () => {
    const straight = stampExtent({ ...defaultStamp('visa'), rot: 0 });
    expect(straight).toEqual(stampBox.rectangle);
    const turned = stampExtent({ ...defaultStamp('visa'), rot: 15 });
    expect(turned.w).toBeGreaterThan(straight.w);
    expect(turned.h).toBeGreaterThan(straight.h);
    expect(stampExtent({ ...defaultStamp('visa'), rot: -15 })).toEqual(turned);
  });

  it('draws a one-line note stamp', () => {
    const note = wrap(noteStamp('Bring a jacket.', 'red', 4, 50, 50));
    expect(problems(note)).toEqual([]);
    expect(textsOf(note)).toEqual(['BRING A JACKET.']);
  });
});

describe('documents', () => {
  it('lists every document a design has', () => {
    expect(documentsOf(defaultDesign()).map((ref) => ref.kind)).toEqual(['cover', 'data', 'cardFront', 'cardBack', 'stamp', 'stamp', 'stamp', 'visaPage']);
    expect(documentsOf(cleanDesign({ stamps: [] })).map((ref) => ref.kind)).toEqual(['cover', 'data', 'cardFront', 'cardBack', 'visaPage']);
  });

  it('draws every document of 150 designs well formed, with a title and a description inside', () => {
    for (let seed = 1; seed <= 150; seed++) {
      const design = randomDesign(seed);
      for (const { ref, svg } of drawAll(design, { ground: seed % 2 ? 'paper' : 'clear' })) {
        const where = `seed ${seed}, ${ref.kind}`;
        expect(problems(svg), where).toEqual([]);
        expect(svg, where).not.toMatch(/NaN|undefined|Infinity/);
        expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '), where).toBe(true);
        expect(svg, where).toContain('role="img"');
        const texts = textsOf(svg);
        expect(texts[0], where).toBe(titleOf(design, ref));
        expect(texts[1], where).toBe(describeDocument(design, ref));
        expect(svg.length, where).toBeLessThan(150000);
      }
    }
  });

  it('keeps the proportions of a real booklet and a real card', () => {
    const d = defaultDesign();
    expect(renderCover(d)).toContain('viewBox="0 0 352 500"');
    expect(renderDataPage(d)).toContain('viewBox="0 0 500 352"');
    expect(renderCardFront(d)).toContain('viewBox="0 0 476 300"');
    expect(renderCardBack(d)).toContain('viewBox="0 0 476 300"');
    expect(renderVisaPage(d)).toContain('viewBox="0 0 352 500"');
    expect(sizes.cover.w / sizes.cover.h).toBeCloseTo(88 / 125, 3);
    expect(sizes.data.w / sizes.data.h).toBeCloseTo(125 / 88, 2);
    expect(sizes.card.w / sizes.card.h).toBeCloseTo(85.6 / 53.98, 2);
  });

  it('is the same drawing every time, and the same through renderDocument', () => {
    const d = randomDesign(77);
    const refs: [DocumentRef, string][] = [
      [{ kind: 'cover' }, renderCover(d)],
      [{ kind: 'data' }, renderDataPage(d)],
      [{ kind: 'cardFront' }, renderCardFront(d)],
      [{ kind: 'cardBack' }, renderCardBack(d)],
      [{ kind: 'visaPage' }, renderVisaPage(d)],
    ];
    for (const [ref, svg] of refs) expect(renderDocument(d, ref), ref.kind).toBe(svg);
    d.stamps.forEach((_, index) => expect(renderDocument(d, { kind: 'stamp', index })).toBe(renderStamp(d, index)));
  });

  it('keeps its ids to itself, so several drawings can share a page', () => {
    const d = defaultDesign();
    const ids = (svg: string): string[] => [...svg.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]!);
    for (const ref of documentsOf(d)) {
      const a = ids(renderDocument(d, ref, { idPrefix: 'one' }));
      const b = ids(renderDocument(d, ref, { idPrefix: 'two' }));
      for (const id of a) {
        expect(id.startsWith('one-'), `${ref.kind}: ${id}`).toBe(true);
        expect(b).not.toContain(id);
      }
    }
    const hostile = renderDataPage(d, { idPrefix: 'a"><script>' });
    expect(problems(hostile)).toEqual([]);
    for (const id of ids(hostile)) expect(id).toMatch(/^[A-Za-z0-9-]+$/);
    expect(ids(renderDataPage(d, { idPrefix: '"' }))[0]).toMatch(/^pp-/);
  });

  it('shows text as text, whatever it holds', () => {
    const d = cleanDesign({ state: { name: `Tom & "Jerry" 'Isles'` }, holder: { surname: 'O’Hara & Sons', given: '東京 Ωmega' } });
    for (const { ref, svg } of drawAll(d)) expect(problems(svg), ref.kind).toEqual([]);
    expect(textsOf(renderDataPage(d))).toEqual(expect.arrayContaining(['O’Hara & Sons', '東京 Ωmega', `TOM & "JERRY" 'ISLES'`]));
  });

  it('draws the cover as the mock-up has it: name, emblem, title, chip', () => {
    const d = defaultDesign();
    const cover = renderCover(d);
    expect(textsOf(cover).slice(2)).toEqual(['REPUBLIC OF TELAND', 'PASSPORT']);
    expect(cover).toContain('fill="#5b1a28"');
    expect(cover).toContain('#e8c46a');
    expect(cover).toContain('data-part="chip"');
    const plain = renderCover(tweak((x) => (x.cover.chip = false)));
    expect(plain).not.toContain('data-part="chip"');
    const two = renderCover(tweak((x) => (x.cover.titles = ['Passport', 'Reispas'])));
    expect(textsOf(two).slice(2)).toEqual(['REPUBLIC OF TELAND', 'PASSPORT', 'REISPAS']);
    for (const id of emblemIds) expect(problems(renderCover(tweak((x) => (x.cover.emblem = id)))), id).toEqual([]);
  });

  it('sets a long name on the cover in two lines of like length', () => {
    const cover = renderCover(tweak((x) => (x.state.name = 'Confederation of the High Cantons of Arvel')));
    expect(textsOf(cover).slice(2, 4)).toEqual(['CONFEDERATION OF THE', 'HIGH CANTONS OF ARVEL']);
    const one = renderCover(tweak((x) => (x.state.name = 'Supercalifragilisticexpi Alidocious')));
    expect(textsOf(one).slice(2, 4)).toEqual(['SUPERCALIFRAGILISTICEXPI', 'ALIDOCIOUS']);
  });

  it('stamps a pale cover in something dark, so it can still be read', () => {
    const cover = renderCover(tweak((x) => (x.cover.colour = '#f5f0e0')));
    expect(cover).toContain('stop-color="#1a1a1a"');
    expect(cover).not.toContain('#e8c46a');
  });

  it('gives a cover a square spine and round corners only where it opens; the pages inside stay round', () => {
    const { w, h } = sizes.cover;
    const outline = coverOutline(w, h);
    // From the top of the spine straight along the top edge: no arc at either left corner.
    expect(outline).toMatch(/^M1 1H\d+a16 16 0 0 1 16 16V\d+a16 16 0 0 1 -16 16H1Z$/);
    const cover = renderCover(defaultDesign());
    expect(cover).toContain(`<path d="${outline}" fill="#5b1a28"/>`);
    expect(cover).not.toMatch(/<rect[^>]*\srx="16"/);
    for (const page of [renderDataPage(defaultDesign()), renderCardFront(defaultDesign()), renderCardBack(defaultDesign()), renderVisaPage(defaultDesign())]) expect(page).toMatch(/<rect x="1" y="1"[^>]*\srx="1[06]"/);
  });

  it('stamps the cover in foil that catches the light: one sheet of it across name, emblem, title and chip', () => {
    const cover = renderCover(defaultDesign());
    expect(cover).toContain('<linearGradient id="pp-foil" gradientUnits="userSpaceOnUse"');
    for (const line of ['REPUBLIC OF TELAND', 'PASSPORT']) expect(cover).toMatch(new RegExp(`<text [^>]*fill="url\\(#pp-foil\\)"[^>]*>${line}</text>`));
    expect(cover).toMatch(/<g data-part="chip" fill="url\(#pp-foil\)">/);
    // The emblem is drawn in a box of its own, so its foil is the same sheet moved to match.
    expect(cover).toMatch(/<linearGradient id="pp-foil-e"[^>]*gradientTransform="scale\([\d.]+\) translate\(-[\d.]+ -[\d.]+\)"/);
    expect(cover).toContain('url(#pp-foil-e)');
    expect(cover).toContain('<g data-part="foil" filter="url(#pp-press)">');
    for (const id of emblemIds) expect(renderCover(tweak((x) => (x.cover.emblem = id))), id).toContain('url(#pp-foil-e)');
  });

  it('keeps every band of the foil readable on its cover', () => {
    for (const colour of ['#5b1a28', '#1c2c4c', '#1a1a1a', '#1d4a36', '#f5f0e0', '#808080', '#c8a97e', '#2e8b57', '#ffffff', '#000000', '#7a1f2b']) {
      for (const foil of foilIds) {
        const base = coverInk(colour, foil);
        if (contrast(base, colour) < 3) continue;
        for (const [, band] of foilBands(base, colour)) expect(contrast(band, colour), `${foil} on ${colour}: ${band}`).toBeGreaterThanOrEqual(3);
      }
    }
    // And on the usual dark covers the foil really does vary.
    expect(new Set(foilBands('#e8c46a', '#5b1a28').map(([, c]) => c)).size).toBeGreaterThan(5);
  });

  it('gives the cover its wear from a few numbers, not from a picture: cloth, a fold by the spine, a crease', () => {
    const cover = renderCover(defaultDesign());
    expect(cover).toContain('<filter id="pp-hide"');
    expect(cover.match(/<feTurbulence\b/g)).toHaveLength(2);
    expect(cover).toContain('<g data-part="wear" pointer-events="none">');
    expect(cover).not.toMatch(/<(?:image|feImage)\b/);
    expect(problems(cover)).toEqual([]);
    // Two covers on one page don't share an id.
    const ids = (svg: string): string[] => [...svg.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]!);
    const a = ids(renderCover(defaultDesign(), { idPrefix: 'a' }));
    const b = ids(renderCover(defaultDesign(), { idPrefix: 'b' }));
    expect(a.length).toBeGreaterThan(4);
    expect(a.filter((id) => b.includes(id))).toEqual([]);
    expect(new Set(a).size).toBe(a.length);
  });

  it('keeps the cover’s lettering clear of the fold by the spine', () => {
    const cover = renderCover(tweak((x) => (x.state.name = 'Fenisholt Federation of the North')));
    for (const m of cover.matchAll(/<text [^>]*textLength="([\d.]+)"/g)) expect(Number(m[1])).toBeLessThanOrEqual(272);
  });

  it('fills in the data page from the design', () => {
    const texts = textsOf(renderDataPage(defaultDesign()));
    expect(texts).toEqual(expect.arrayContaining(['REPUBLIC OF TELAND', 'PASSPORT', 'P', '0447192', 'Ashdale', 'Liane', 'Telandic', '14 March 1991', 'Selun', '19 December 2026', '19 December 2036', 'Ministry of the Interior']));
    expect(texts).toEqual(expect.arrayContaining(['SURNAME', 'GIVEN NAMES', 'NATIONALITY', 'DATE OF BIRTH', 'PLACE OF BIRTH', 'DATE OF ISSUE', 'DATE OF EXPIRY', 'AUTHORITY', 'DOCUMENT NO.', 'HOLDER’S SIGNATURE']));
  });

  it('writes dates in the world’s own calendar', () => {
    const calderwyn = template('calderwyn')!.design;
    const texts = textsOf(renderDataPage(calderwyn));
    expect(texts).toEqual(expect.arrayContaining(['9 Highsun 988 LR', '2 Emberdusk 1022 LR', '2 Emberdusk 1032 LR', 'PASSPORT / FARBREV']));
    expect(textsOf(renderStamp(calderwyn, 0))).toContain('4 EMBERDUSK 1022 LR');
  });

  it('fills in both sides of the card', () => {
    const d = defaultDesign();
    expect(textsOf(renderCardFront(d))).toEqual(expect.arrayContaining(['REPUBLIC OF TELAND', 'IDENTITY CARD', 'Ashdale', 'Liane', 'Telandic', '14 March 1991', '0447192', '19 December 2036']));
    expect(textsOf(renderCardBack(d))).toEqual(expect.arrayContaining(['Selun', '19 December 2026', 'Ministry of the Interior', 'This card is a work of fiction.', 'Issued in the name of Republic of Teland, which isn’t on any map.']));
  });

  it('signs for the holder with a line that is nobody’s signature, the same for the same name', () => {
    const path = (svg: string): string => /<path data-part="signature" d="(M[^"]+)" fill="none" stroke="#1f2428"/.exec(svg)![1]!;
    const a = path(renderDataPage(defaultDesign()));
    expect(path(renderDataPage(defaultDesign()))).toBe(a);
    expect(path(renderDataPage(tweak((x) => (x.holder.given = 'Maud'))))).not.toBe(a);
    expect(path(renderDataPage(tweak((x) => (x.holder.surname = 'Quillon'))))).not.toBe(a);
    for (const page of [renderDataPage(defaultDesign()), renderCardFront(defaultDesign())]) expect(page.match(/data-part="signature"/g)).toHaveLength(1);
    expect(renderCardBack(defaultDesign())).not.toContain('data-part="signature"');
  });

  it('writes the signature from the holder’s own name: the first letter of the given name, then the surname', () => {
    expect(signatureText('Liane', 'Ashdale')).toBe('L Ashdale');
    expect(signatureText(' bram ', '  QUILLON ')).toBe('B Quillon');
    // Accents are left off, as a quick hand leaves them; the letters under them stay.
    expect(signatureText('Élan', 'Ærø Ünter')).toBe('E Ærø unter');
    expect(signatureText('', 'Tarn')).toBe('Tarn');
    expect(signatureText('Wren', '')).toBe('W');
    expect(signatureText('', '')).toBe('');
  });

  it('writes more for a longer surname, letter by letter, and trails off when the name runs long', () => {
    const strokes = (given: string, surname: string): number => (drawSignature(given, surname, 0, 0, 120, 36, '#000').match(/C/g) ?? []).length;
    expect(strokes('Jo', 'Li')).toBeLessThan(strokes('Jo', 'Lind'));
    expect(strokes('Jo', 'Lind')).toBeLessThan(strokes('Jo', 'Lindqvist'));
    // The same letters in another order are another signature: it follows the name, not just its length.
    expect(drawSignature('Jo', 'Tarn', 0, 0, 120, 36, '#000')).not.toBe(drawSignature('Jo', 'Rant', 0, 0, 120, 36, '#000'));
    // Past the first few letters the hand runs on into a line, however long the name is.
    const long = 'Bellweathercoldharbour';
    expect(Array.from(long).length).toBeGreaterThan(SIGNED_LETTERS + 4);
    expect(strokes('Jo', long)).toBe(strokes('Jo', `${long}andthensome`));
    expect(strokes('Jo', long)).toBeLessThan(strokes('Jo', long.slice(0, SIGNED_LETTERS + 1)) + 12);
  });

  it('keeps every signature inside its box, whatever the name', () => {
    const names: [string, string][] = [
      ['', ''],
      ['Jo', 'Li'],
      ['Zarek', 'Bellweather-Coldharbour'],
      ['Élan', 'O’Hara'],
      ['東', '京'],
      ['Ωmega', 'Ærø'],
      ['Q', 'Fjgpqy'],
      ['W', 'Mmmmmmmmm'],
      ['A', 'I'],
      ...Array.from({ length: 200 }, (_, seed): [string, string] => {
        const holder = generateHolder(seed, { issued: { d: 1, m: 1, y: 2026 } });
        return [holder.given, holder.surname];
      }),
    ];
    for (const [given, surname] of names) {
      for (const [x, y, w, h] of [[20, 220, 120, 36], [150, 210, 150, 34]] as const) {
        const svg = drawSignature(given, surname, x, y, w, h, '#1f2428');
        expect(svg, `${given} ${surname}`).not.toMatch(/NaN|undefined|Infinity/);
        expect(problems(wrap(svg)), `${given} ${surname}`).toEqual([]);
        const d = /d="([^"]+)"/.exec(svg)![1]!;
        const numbers = [...d.matchAll(/-?\d+(?:\.\d+)?/g)].map((m) => Number(m[0]));
        for (let i = 0; i < numbers.length; i += 2) {
          expect(numbers[i], `${given} ${surname}: x`).toBeGreaterThanOrEqual(x - 3);
          expect(numbers[i], `${given} ${surname}: x`).toBeLessThanOrEqual(x + w + 3);
          expect(numbers[i + 1], `${given} ${surname}: y`).toBeGreaterThanOrEqual(y - 3);
          expect(numbers[i + 1], `${given} ${surname}: y`).toBeLessThanOrEqual(y + h + 6);
        }
      }
    }
  });

  it('draws a stamp on clear or on paper, and nothing for a stamp that is not there', () => {
    const d = defaultDesign();
    const paper = hexOf(papers, d.papers.paper);
    expect(renderStamp(d, 0)).not.toContain(`fill="${paper}"`);
    expect(renderStamp(d, 0, { ground: 'paper' })).toContain(`fill="${paper}"`);
    const missing = renderStamp(d, 9);
    expect(problems(missing)).toEqual([]);
    expect(textsOf(missing)).toEqual(['No such stamp', 'No such stamp.']);
    expect(renderStamp(d, -1)).toBe(missing);
  });

  it('lays every stamp on the visa page where it was pressed', () => {
    const d = defaultDesign();
    const page = renderVisaPage(d);
    expect(page.match(/data-stamp="(?:entry|exit|visa)"/g)).toHaveLength(3);
    expect(page.match(/scale\(0\.6\)/g)).toHaveLength(3);
    expect(textsOf(page)).toEqual(expect.arrayContaining(['VISAS', 'ENTRY', 'EXIT', 'VISA']));
    const corner = renderVisaPage(tweak((x) => Object.assign(x.stamps[0]!, { x: 0, y: 0 })));
    expect(corner).toContain('translate(60 78)');
    expect(renderVisaPage(cleanDesign({ stamps: [] }))).not.toContain('data-stamp');
  });

  it('turns an SVG into the address of a picture, and back', () => {
    const svg = renderCover(defaultDesign());
    const url = svgDataUrl(svg);
    expect(url.startsWith('data:image/svg+xml;charset=utf-8,')).toBe(true);
    expect(decodeURIComponent(url.slice('data:image/svg+xml;charset=utf-8,'.length))).toBe(svg);
  });
});

describe('descriptions', () => {
  it('gives a state its article when its name is built around a form of state', () => {
    expect(withArticle('Republic of Teland')).toBe('the Republic of Teland');
    expect(withArticle('Tidewater League')).toBe('the Tidewater League');
    expect(withArticle('Solar Dominion of Heliara')).toBe('the Solar Dominion of Heliara');
    expect(withArticle('Free City of Brackwater')).toBe('the Free City of Brackwater');
    expect(withArticle('Calderwyn')).toBe('Calderwyn');
    expect(withArticle('Hesperwick')).toBe('Hesperwick');
    expect(withArticle('The Brindle Isles')).toBe('the Brindle Isles');
    expect(theOffice('Ministry of the Interior')).toBe('the Ministry of the Interior');
    expect(theOffice('The Chancellery')).toBe('the Chancellery');
  });

  it('writes a list as people say one', () => {
    expect(listOf([])).toBe('');
    expect(listOf(['a'])).toBe('a');
    expect(listOf(['a', 'b'])).toBe('a and b');
    expect(listOf(['a', 'b', 'c'])).toBe('a, b and c');
  });

  it('describes the cover', () => {
    const d = defaultDesign();
    expect(describeCover(d)).toBe(
      'Passport cover of the Republic of Teland. A burgundy cover with gold lettering: the state’s name at the top, a five-pointed star in a ring in the middle, “Passport” below and a chip symbol at the foot.',
    );
    expect(describeCover(d, { armsUsed: true })).toContain('the national arms in the middle');
    const other = tweak((x) => Object.assign(x.cover, { colour: '#1d4a36', foil: 'silver', titles: ['Passport', 'Reispas'], chip: false, emblem: 'ship' }));
    expect(describeCover(other)).toBe('Passport cover of the Republic of Teland. A green cover with silver lettering: the state’s name at the top, a ship under sail in the middle and “Passport” and “Reispas” below.');
    // On a mid-green cover silver can't be read, so the tool stamps it in near-black and says so.
    expect(describeCover(tweak((x) => Object.assign(x.cover, { colour: '#2e8b57', foil: 'silver' })))).toContain('A green cover with black lettering');
  });

  it('describes the data page and says plainly what it is', () => {
    expect(describeDataPage(defaultDesign())).toBe(
      'Passport data page of the Republic of Teland, overprinted SPECIMEN. Holder: Liane Ashdale, Telandic, born 14 March 1991 in Selun. ' +
        'Document number 0447192, issued 19 December 2026, expires 19 December 2036, by the Ministry of the Interior. ' +
        'The portrait is a drawing, not a photograph: a chin-length bob and a collared shirt. Printed on ivory paper with fine wave lines in blue. ' +
        'Where a real passport has a machine-readable zone, this one has a decorative strip that reads “Fictional · not a travel document”.',
    );
    expect(describeDataPage(tweak((x) => (x.papers.pattern = 'none')))).toContain('Printed on ivory paper, with no pattern.');
  });

  it('describes both sides of the card', () => {
    const d = defaultDesign();
    expect(describeCard(d, 'front')).toContain('Identity card of the Republic of Teland, front, titled “Identity card” and overprinted SPECIMEN.');
    expect(describeCard(d, 'front')).toContain('Card number 0447192, expires 19 December 2036.');
    expect(describeCard(d, 'back')).toContain('Place of birth: Selun. Issued 19 December 2026 by the Ministry of the Interior.');
    expect(describeCard(d, 'back')).toContain('“This card is a work of fiction.”');
  });

  it('describes a stamp: its shape, border, ink, turn, wear and what it reads', () => {
    const d = defaultDesign();
    expect(describeStamp(d.stamps[0]!, d)).toBe(
      'Entry stamp of the Republic of Teland: round, with a double line border, in blue ink, turned 7 degrees anticlockwise and lightly worn. It reads “TELAND”, “ENTRY”, “PORT OF SELUN”, “19 DEC 2026” and “BORDER GUARD”, with a ship.',
    );
    expect(describeStamp(d.stamps[1]!, d)).toContain('hexagon, with a single line border, in red ink, turned 5 degrees clockwise and worn.');
    expect(describeStamp(d.stamps[1]!, d)).toContain('with an aircraft.');
    const plain: Stamp = { ...d.stamps[0]!, rot: 0, wear: 0, mark: 'none', top: '', bottom: '' };
    expect(describeStamp(plain, d)).toBe('Entry stamp of the Republic of Teland: round, with a double line border, in blue ink, set straight and crisp. It reads “ENTRY”, “PORT OF SELUN” and “19 DEC 2026”.');
    expect(describeStamp({ ...plain, rot: 1 }, d)).toContain('turned 1 degree clockwise');
    expect(stampLines(d.stamps[2]!, d)).toEqual(['TELAND', 'VISA', 'SINGLE ENTRY · 90 DAYS', '19 DEC 2026', 'CONSULAR SERVICE']);
  });

  it('describes the visa page', () => {
    expect(describeVisaPage(defaultDesign())).toBe('A visa page from a passport of the Republic of Teland, on ivory paper, with 3 stamps: entry (round, blue), exit (hexagon, red) and visa (rectangle, green).');
    expect(describeVisaPage(cleanDesign({ stamps: [] }))).toBe('A visa page from a passport of the Republic of Teland, with no stamps yet.');
    expect(describeVisaPage(cleanDesign({ stamps: [{ kind: 'exit' }] }))).toContain('with 1 stamp: exit (hexagon, red).');
  });

  it('names every document, and says so when a stamp is not there', () => {
    const d = defaultDesign();
    expect(titleOf(d, { kind: 'cover' })).toBe('Passport cover of the Republic of Teland');
    expect(titleOf(d, { kind: 'data' })).toBe('Passport data page of the Republic of Teland (specimen)');
    expect(titleOf(d, { kind: 'cardFront' })).toBe('Identity card of the Republic of Teland, front (specimen)');
    expect(titleOf(d, { kind: 'cardBack' })).toBe('Identity card of the Republic of Teland, back (specimen)');
    expect(titleOf(d, { kind: 'stamp', index: 2 })).toBe('Visa stamp of the Republic of Teland');
    expect(titleOf(d, { kind: 'stamp', index: 9 })).toBe('Stamp of the Republic of Teland');
    expect(titleOf(d, { kind: 'visaPage' })).toBe('Visa page of the Republic of Teland');
    expect(describeDocument(d, { kind: 'stamp', index: 9 })).toBe('No such stamp.');
    expect(describeDocument(d, { kind: 'cover' }, { armsUsed: true })).toContain('the national arms');
  });

  it('sums the papers up in one paragraph that fits the profile', () => {
    expect(summarise(defaultDesign())).toBe(
      'A burgundy passport with gold lettering and a five-pointed star in a ring, titled “Passport”. The data page and identity card are on ivory paper with fine wave lines in blue, with 3 stamps to go with them.',
    );
    expect(summarise(cleanDesign({ stamps: [] }), { armsUsed: true })).toBe(
      'A burgundy passport with gold lettering and the national arms, titled “Passport”. The data page and identity card are on ivory paper with fine wave lines in blue.',
    );
    for (let seed = 1; seed <= 100; seed++) expect(Array.from(summarise(randomDesign(seed))).length).toBeLessThanOrEqual(600);
  });

  it('describes every document of 100 designs in whole sentences', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const design = randomDesign(seed);
      for (const ref of documentsOf(design)) {
        const words = describeDocument(design, ref);
        expect(words.length, `${seed} ${ref.kind}`).toBeGreaterThan(30);
        expect(words, `${seed} ${ref.kind}`).not.toMatch(/undefined|NaN|\[object|<|>/);
        expect(words, `${seed} ${ref.kind}`).toMatch(/[.”]$/);
      }
    }
  });
});

describe('the Moon', () => {
  const moon = tweak((x) => (x.stamps[2]!.place = 'Valid for the Moon'));

  it('knows a visa for the Moon', () => {
    const visa = defaultStamp('visa');
    for (const place of ['Valid for the Moon', 'THE MOON', 'Luna', 'Lunar Colony Three', 'moon', 'Sea of Tranquillity, Moon.']) expect(isMoonVisa({ ...visa, place }), place).toBe(true);
    for (const place of ['Moonstone Bay', 'Lunatic Asylum', 'Honeymoon Isle', 'Port of Selun', '']) expect(isMoonVisa({ ...visa, place }), place).toBe(false);
    expect(isMoonVisa({ ...visa, top: 'The Moon' })).toBe(true);
    expect(isMoonVisa({ ...visa, bottom: 'Lunar Consulate' })).toBe(true);
    // Only a visa: nobody stamps you into the Moon without one.
    expect(isMoonVisa({ ...defaultStamp('entry'), place: 'The Moon' })).toBe(false);
    expect(hasMoonVisa(moon.stamps)).toBe(true);
    expect(hasMoonVisa(defaultDesign().stamps)).toBe(false);
  });

  it('adds the stamp “Bring a jacket.” beside it, on its own and on the page', () => {
    expect(MOON_STAMP_TEXT).toBe('Bring a jacket.');
    const alone = renderStamp(moon, 2);
    expect(textsOf(alone)).toContain('BRING A JACKET.');
    expect(alone.match(/data-stamp="note"/g)).toHaveLength(1);
    expect(problems(alone)).toEqual([]);
    const height = (svg: string): number => Number(/viewBox="0 0 [\d.]+ ([\d.]+)"/.exec(svg)![1]);
    expect(height(alone)).toBeGreaterThan(height(renderStamp(defaultDesign(), 2)));
    const page = renderVisaPage(moon);
    expect(page.match(/data-stamp="note"/g)).toHaveLength(1);
    expect(problems(page)).toEqual([]);
    for (const { svg } of drawAll(defaultDesign())) expect(svg).not.toContain('data-stamp="note"');
  });

  it('says so in the description', () => {
    expect(describeStamp(moon.stamps[2]!, moon)).toMatch(/Beside it, a second stamp: “BRING A JACKET\.”$/);
    expect(describeVisaPage(moon)).toMatch(/One more reads “BRING A JACKET\.”$/);
    expect(describeVisaPage(defaultDesign())).not.toContain('JACKET');
  });
});

describe('the other easter egg: Arstotzka', () => {
  it('knows the state by its name, with or without a form of state around it', () => {
    for (const name of ['Arstotzka', 'arstotzka', ' ARSTOTZKA ', 'Republic of Arstotzka', 'The Glorious State of Arstotzka', 'Arstotzka, Greatest Country', 'Arstótzka', 'East Arstotzka']) expect(isArstotzka(name), name).toBe(true);
    for (const name of ['Arstotzkan Union', 'Arstotzkaland', 'Republic of Teland', 'Kolechia', 'Arstot zka', '']) expect(isArstotzka(name), name).toBe(false);
  });

  it('greets it as its border inspector would, and prints its papers like any other invented state’s', () => {
    expect(ARSTOTZKA_TEXT).toBe('Glory to Arstotzka. Papers, please.');
    // It is nobody's real country, so the name is printed as typed, SPECIMEN and all.
    expect(isRealCountry('Arstotzka')).toBe(false);
    expect(cleanStateName('Arstotzka')).toBe('Arstotzka');
    const page = renderDataPage(tweak((x) => (x.state.name = 'Arstotzka')));
    expect(textsOf(page)).toContain('ARSTOTZKA');
    expect(page).toContain('data-fiction="specimen"');
  });
});
