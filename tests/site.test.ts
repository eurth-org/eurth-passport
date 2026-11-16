/**
 * Where the engine meets the suite: links the shared helpers can read, a profile section the
 * real schema accepts, stamps that sit on screen where the download draws them, and documents
 * set on a ground in the sharing sizes.
 */
import { createProfile, getSection, parseProfile, serialiseProfile, setSection, validateProfile, type EurthProfile } from '@eurth/profile';
import { PICTURE_SIZES, decodeState, encodeState, pictureFilename, resolveColors } from '@eurth/style';
import tokens from '@eurth/style/tokens.json';
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanDesign } from '../src/passport/clean';
import { describeDocument, titleOf } from '../src/passport/describe';
import { specimenOverprint } from '../src/passport/fiction';
import { LINK_PARAM, compactDesign, decodeDesign, encodeDesign, expandDesign, toQuery } from '../src/passport/link';
import { MAX_STAMPS, defaultDesign, type Design } from '../src/passport/model';
import { designFromProfile, nextSection, withPassport } from '../src/passport/profile';
import { PAGE_SCALE, documentsOf, renderDocument, renderShare, renderStamp, sizes, stampCentre, stampOnPage, stampPlace } from '../src/passport/render';
import { stampExtent } from '../src/passport/stamps';
import { templates } from '../src/passport/templates';
import { problems, randomDesign } from './helpers/designs';
import { mrzFindings, textsOf } from './helpers/mrz';
import { still } from '../src/ui/motion';

const fixture = (name: string): EurthProfile => JSON.parse(readFileSync(new URL(`./fixtures/${name}.eurth.json`, import.meta.url), 'utf8')) as EurthProfile;
const calderwyn = fixture('calderwyn');
const arms = (calderwyn.arms as { svg: string }).svg;
const huge = (): Design =>
  cleanDesign({
    stamps: Array.from({ length: MAX_STAMPS }, (_, i) => ({ kind: 'visa', top: `Outer Brindle Isles office ${i}`, label: `Permit number ${i}`, place: `Port of Saint Wilhelmina no ${i}`, bottom: `Immigration and customs no ${i}` })),
    calendar: { months: Array.from({ length: 40 }, (_, i) => ({ name: `Month of the Long Lanterns ${i}`, days: 20 + i })), era: 'AFTERFALL' },
  });
const moon = cleanDesign({ stamps: [{ kind: 'visa', place: 'Valid for the Moon' }] });

describe('the link, in the suite’s own form', () => {
  it('uses the parameter every Eurth tool uses', () => {
    expect(LINK_PARAM).toBe('d');
    expect(toQuery(templates[1]!.design)).toMatch(/^\?d=1\./);
  });

  it('reads what the shared helpers write, and writes what they read', () => {
    for (const design of [...templates.map((t) => t.design), ...Array.from({ length: 60 }, (_, i) => randomDesign(i + 1))]) {
      const compact = compactDesign(design);
      expect(decodeDesign(encodeState(compact))).toEqual(design);
      expect(encodeState(compact)).toBe(encodeDesign(design));
      const read = decodeState(encodeDesign(design), { maxLength: 24000 });
      expect(read?.version).toBe(1);
      expect(expandDesign(read?.value)).toEqual(design);
    }
  });
});

describe('the profile, checked by @eurth/profile itself', () => {
  const now = new Date('2026-11-15T01:00:00.000Z');

  it('writes a passport section the schema accepts, for every template, 60 designs and the largest design there can be', () => {
    for (const design of [...templates.map((t) => t.design), ...Array.from({ length: 60 }, (_, i) => randomDesign(i + 1)), huge(), moon]) {
      const written = withPassport(calderwyn, design, { now, arms });
      const checked = validateProfile(written);
      expect(checked.ok, checked.ok ? '' : JSON.stringify(checked.errors)).toBe(true);
    }
  });

  it('saves and loads through the library as a file would', () => {
    for (const t of templates) {
      const base = createProfile(t.design.state.name);
      const saved = setSection(base, 'passport', nextSection(getSection(base, 'passport'), t.design), { now });
      const file = serialiseProfile(saved);
      const loaded = parseProfile(file);
      expect(loaded.ok, t.id).toBe(true);
      if (!loaded.ok) continue;
      expect(Object.keys(loaded.profile)).toEqual(['meta', 'passport']);
      expect(loaded.profile.meta.nation).toBe(t.design.state.name);
      expect(designFromProfile(loaded.profile).design, t.id).toEqual(t.design);
    }
  });

  it('builds the section to save from what was there: new values over old, unknown keys kept, stale ones dropped', () => {
    const old = { link: 'https://passport.eurth.org/#old', colour: '#000000', laminate: 'matte', design: { state: { name: 'Old' } }, updated: '2026-01-01T00:00:00Z' };
    const next = nextSection(old, defaultDesign());
    expect(next).toMatchObject({ link: 'https://passport.eurth.org/?d=1.e30', colour: '#5b1a28', laminate: 'matte', title: 'Passport' });
    expect('design' in next).toBe(false);
    // The library stamps the date; this never carries an old one forward.
    expect('updated' in next).toBe(false);
    const big = nextSection(next, huge());
    expect('link' in big).toBe(false);
    expect(big.laminate).toBe('matte');
    expect(nextSection(undefined, defaultDesign())).toEqual(nextSection({}, defaultDesign()));
  });

  it('leaves every other section of a full profile exactly as it was, through the library too', () => {
    const saved = setSection(calderwyn, 'passport', nextSection(getSection(calderwyn, 'passport'), templates[4]!.design, { arms }), { now });
    for (const key of Object.keys(calderwyn)) {
      if (key === 'meta' || key === 'passport') continue;
      expect(JSON.stringify((saved as Record<string, unknown>)[key]), key).toBe(JSON.stringify((calderwyn as Record<string, unknown>)[key]));
    }
    expect(validateProfile(saved).ok).toBe(true);
  });
});

describe('stamps on the visa page', () => {
  it('turns a place in per cent into a point on the page, and back', () => {
    for (let x = 0; x <= 100; x += 5) for (let y = 0; y <= 100; y += 5) expect(stampPlace(stampCentre(x, y).cx, stampCentre(x, y).cy)).toEqual({ x, y });
    expect(stampCentre(0, 0)).toEqual({ cx: 60, cy: 78 });
    expect(stampCentre(100, 100)).toEqual({ cx: sizes.page.w - 60, cy: sizes.page.h - 72 });
    // Dragged off the page, a stamp stops at the edge.
    expect(stampPlace(-500, 9999)).toEqual({ x: 0, y: 100 });
  });

  it('lays each stamp’s own picture exactly where the page draws it', () => {
    for (const design of [...templates.map((t) => t.design), moon, ...Array.from({ length: 40 }, (_, i) => randomDesign(i + 1))]) {
      design.stamps.forEach((stamp, index) => {
        const box = stampOnPage(design, index)!;
        const picture = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(renderStamp(design, index))!;
        expect(box.width).toBeCloseTo(Number(picture[1]) * PAGE_SCALE, 6);
        expect(box.height).toBeCloseTo(Number(picture[2]) * PAGE_SCALE, 6);
        const extent = stampExtent(stamp);
        const centre = stampCentre(stamp.x, stamp.y);
        expect(box.left + ((extent.w + 28) / 2) * PAGE_SCALE).toBeCloseTo(centre.cx, 6);
        expect(box.top + ((extent.h + 28) / 2) * PAGE_SCALE).toBeCloseTo(centre.cy, 6);
      });
    }
    expect(stampOnPage(defaultDesign(), 9)).toBeNull();
    // A visa for the Moon needs room for the second stamp.
    expect(stampOnPage(moon, 0)!.height).toBeGreaterThan(stampOnPage(cleanDesign({ stamps: [{ kind: 'visa' }] }), 0)!.height);
  });
});

describe('a document set on a ground, in the sharing sizes', () => {
  const ground = resolveColors(tokens, 'dark').surface!;

  it('has the six sizes the handbook asks for', () => {
    expect(PICTURE_SIZES.map((p) => `${p.width}x${p.height}`)).toEqual(['1200x630', '1080x1080', '1080x1350', '1080x1920', '1000x1500', '1600x900']);
    expect(ground).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('draws every document in every size, whole, well formed and inside the picture', () => {
    const design = templates[1]!.design;
    for (const size of PICTURE_SIZES) {
      for (const ref of documentsOf(design)) {
        const svg = renderShare(design, ref, size, ground, { arms, idPrefix: 'share' });
        const where = `${size.id} ${ref.kind}`;
        expect(problems(svg), where).toEqual([]);
        expect(svg.startsWith(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size.width} ${size.height}" width="${size.width}" height="${size.height}"`), where).toBe(true);
        expect(svg, where).toContain(`<rect width="${size.width}" height="${size.height}" fill="${ground}"/>`);
        expect(textsOf(svg).slice(0, 2), where).toEqual([titleOf(design, ref), describeDocument(design, ref)]);
        const placed = /<svg x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)" viewBox="0 0 ([\d.]+) ([\d.]+)">/.exec(svg)!;
        const [x, y, w, h, vw, vh] = placed.slice(1).map(Number) as [number, number, number, number, number, number];
        expect(x, where).toBeGreaterThan(0);
        expect(y, where).toBeGreaterThan(0);
        expect(x + w, where).toBeLessThan(size.width);
        expect(y + h, where).toBeLessThan(size.height);
        // Centred, and not stretched.
        expect(x * 2 + w, where).toBeCloseTo(size.width, 0);
        expect(y * 2 + h, where).toBeCloseTo(size.height, 0);
        expect(w / h, where).toBeCloseTo(vw / vh, 2);
      }
    }
  });

  it('keeps SPECIMEN on a data page and a card in every size: a sharing picture is no way round the rule', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const design = randomDesign(seed);
      for (const size of PICTURE_SIZES) {
        for (const [kind, box] of [['data', sizes.data], ['cardFront', sizes.card], ['cardBack', sizes.card]] as const) {
          const svg = renderShare(design, { kind }, size, ground);
          expect(svg.match(/data-fiction="specimen"/g), `${seed} ${size.id} ${kind}`).toHaveLength(1);
          expect(svg.endsWith(`${specimenOverprint(box.w, box.h)}</svg></svg>`), `${seed} ${size.id} ${kind}`).toBe(true);
          expect(mrzFindings(textsOf(svg))).toEqual([]);
        }
      }
    }
  });
});

describe('a picture is named for what the browser really made', () => {
  // The designer names its downloads with the suite's own helper (@eurth/style 1.3.0 or newer).
  it('keeps the name asked for when the browser made that kind', () => {
    expect(pictureFilename('teland-cover', { type: 'image/png' }, 'image/png')).toMatchObject({ filename: 'teland-cover.png', note: null });
    expect(pictureFilename('teland-cover', { type: 'image/webp' }, 'image/webp')).toMatchObject({ filename: 'teland-cover.webp', note: null });
  });

  it('calls a PNG a PNG when Safari answers a request for WebP with one, and says so', () => {
    const file = pictureFilename('teland-cover-square', { type: 'image/png' }, 'image/webp');
    expect(file.filename).toBe('teland-cover-square.png');
    expect(file.note).toBe('This browser can’t make WebP pictures, so this one is a PNG.');
  });
});

describe('holding still: the footer’s motion switch and the device’s own wish', () => {
  afterEach(() => vi.unstubAllGlobals());
  const page = (motion: string | undefined, reduced: boolean): void => {
    vi.stubGlobal('document', { documentElement: { dataset: motion ? { motion } : {} } });
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: reduced && query === '(prefers-reduced-motion: reduce)' }));
  };

  it('moves only when neither asks for stillness', () => {
    page(undefined, false);
    expect(still()).toBe(false);
  });

  it('holds still when motion is switched off in the footer, which the shell marks on the page', () => {
    page('still', false);
    expect(still()).toBe(true);
  });

  it('holds still when the device asks for reduced motion', () => {
    page(undefined, true);
    expect(still()).toBe(true);
  });

  it('holds still where there is no page at all', () => {
    expect(still()).toBe(true);
  });

  it('is what the designer asks before anything leans, lights up or shakes', () => {
    const designer = readFileSync(new URL('../src/ui/Designer.svelte', import.meta.url), 'utf8');
    // Not the suite's calm(): a dev server loads that script twice, and the designer's copy never hears the switch.
    expect(designer).not.toMatch(/\bcalm\(/);
    expect(designer.match(/if \(still\(\)\)/g)).toHaveLength(2);
    // And the stylesheet lays the page flat by itself, whatever the script last set.
    expect(designer).toContain(":global(html[data-motion='still']) .leaf");
    expect(designer).toContain(":global(html[data-motion='still']) .shine");
    expect(designer).toContain('@media (prefers-reduced-motion: reduce)');
  });
});

describe('the designer’s controls, by the handbook', () => {
  const ui = ['Designer', 'CoverControls', 'PapersControls', 'PhotoControls', 'StampControls', 'Choice', 'Toggle', 'VisaPage', 'DateInput'].map((name) => ({
    name,
    source: readFileSync(new URL(`../src/ui/${name}.svelte`, import.meta.url), 'utf8'),
  }));

  it('gives every pill the suite’s tick, so a choice never rests on colour alone and the tick can pop in', () => {
    let pills = 0;
    for (const { name, source } of ui) {
      const count = (source.match(/class="eu-pill/g) ?? []).length;
      expect((source.match(/class="eu-check"/g) ?? []).length, name).toBe(count);
      pills += count;
    }
    expect(pills).toBeGreaterThanOrEqual(3);
  });

  it('gives every button something to answer a click with: an icon, a swatch or a picture', () => {
    let buttons = 0;
    for (const { name, source } of ui) {
      for (const match of source.matchAll(/<(button|label)\b[^>]*class="eu-btn[^"]*"[\s\S]*?<\/\1>/g)) {
        expect(match[0], `${name}: ${match[0].slice(0, 90)}`).toMatch(/<Icon\b|<img\b|eu-swatch/);
        buttons++;
      }
    }
    expect(buttons).toBeGreaterThan(15);
  });

  it('keeps the bar of documents at the top of the window, on one line that scrolls sideways', () => {
    const designer = ui[0]!.source;
    expect(designer).toContain('<div class="eu-row eu-scroll bar">');
    const rule = (selector: string): string => new RegExp(`\\n  ${selector} \\{([^}]*)\\}`).exec(designer)?.[1] ?? '';
    expect(rule('\\.tabs')).toMatch(/position: sticky;[\s\S]*top: 0;/);
    expect(rule('\\.tabs')).toContain('background: var(--surface);');
    expect(rule('\\.bar')).toContain('flex-wrap: nowrap;');
    // The result sticks below the bar, not under it.
    expect(rule('\\.result')).toContain('top: calc(var(--bar) + var(--space-4));');
    // A tooltip would be cut off inside a bar that scrolls, so nothing in it has one.
    expect(/<fieldset class="tabs">[\s\S]*?<\/fieldset>/.exec(designer)![0]).not.toContain('data-tip');
  });

  it('lines the download buttons up with the picture’s size box, not with its label', () => {
    const designer = ui[0]!.source;
    expect(designer).toContain('<div class="eu-row saving">');
    expect(designer).toMatch(/\.saving \{\s*align-items: flex-end;/);
  });
});

describe('Arstotzka in the designer: dark, colourless, square, and set in a pixel typeface', () => {
  const designer = readFileSync(new URL('../src/ui/Designer.svelte', import.meta.url), 'utf8');

  it('goes to the suite’s own Night theme while the name stands, and back to what it was after', () => {
    expect(designer).toContain("root.dataset.theme = 'dark';");
    expect(designer).toContain("themeBefore = root.getAttribute('data-theme');");
    expect(designer).toMatch(/if \(themeBefore === null\) root\.removeAttribute\('data-theme'\);\s*else root\.dataset\.theme = themeBefore;/);
    expect(designer).toContain("root.dataset.arstotzka = '';");
    expect(designer).toContain('delete root.dataset.arstotzka;');
    // Nothing is kept for it: no storage, and not the visit's own choices either.
    expect(designer).not.toMatch(/localStorage|sessionStorage|setPrefs/);
  });

  it('sets the words of the interface in Departure Mono, from this site’s own files, with its licence beside it', () => {
    expect(designer).toMatch(/@font-face \{\s*font-family: 'Departure Mono';\s*src: url\('\/fonts\/DepartureMono-Regular\.woff2'\) format\('woff2'\);\s*font-display: swap;/);
    expect(designer).toContain(":global(html[data-arstotzka] *)");
    expect(designer).toContain("font-family: 'Departure Mono', var(--font-mono) !important;");
    // Nothing is fetched from another address, and the font is the real file.
    expect(designer).not.toMatch(/url\(['"]?https?:/);
    const font = readFileSync(new URL('../public/fonts/DepartureMono-Regular.woff2', import.meta.url));
    expect(font.subarray(0, 4).toString('latin1')).toBe('wOF2');
    expect(font.length).toBeGreaterThan(10000);
    const licence = readFileSync(new URL('../public/fonts/DepartureMono-OFL.txt', import.meta.url), 'utf8');
    expect(licence).toContain('Helena Zhang');
    expect(licence).toContain('SIL Open Font License, Version 1.1');
  });

  it('credits the typeface in the footer of the page that uses it', () => {
    const page = readFileSync(new URL('../src/pages/index.astro', import.meta.url), 'utf8');
    const credit = /<Fragment slot="inspirations">([\s\S]*?)<\/Fragment>/.exec(page)![1]!;
    expect(credit).toContain('Departure Mono</a> by Helena Zhang');
    expect(credit).toContain('href="/fonts/DepartureMono-OFL.txt"');
  });

  it('leaves the documents alone: they are pictures with their own lettering, never pixelled and never in that typeface', () => {
    expect(designer).toContain('<img class="document" src={svgDataUrl(svg)}');
    expect(designer).not.toMatch(/image-rendering|pixels/);
    const design = cleanDesign({ ...defaultDesign(), state: { name: 'Arstotzka', demonym: 'Arstotzkan' } });
    for (const ref of documentsOf(design)) expect(renderDocument(design, ref), ref.kind).not.toMatch(/Departure/);
  });

  it('uses no colour of its own for the look', () => {
    const bleak = designer.slice(designer.indexOf('/* Arstotzka: the colour drains'), designer.indexOf("/* The picture's size has a label above it"));
    expect(bleak).toContain('filter: grayscale(0.9);');
    expect(bleak).toContain('border-radius: 0 !important;');
    expect(bleak).not.toMatch(/#[0-9a-f]{3,6}\b|rgb\(/i);
  });
});
