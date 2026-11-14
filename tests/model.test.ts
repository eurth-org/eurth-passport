/**
 * The model and what guards it: cleaning, colours, the seeded generator, dates and holder names.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { clamp, cleanDesign, cleanNumber, cleanStamp, cleanText, pick, whole } from '../src/passport/clean';
import { TEXT_DARK, cleanColour, colourName, contrast, coverColours, coverInk, foils, hexOf, luminance, mix, nameOf, papers, printInks, shade, stampInks } from '../src/passport/colours';
import { MAX_ERA, MAX_MONTHS, MAX_MONTH_NAME, MAX_YEAR, MIN_YEAR, addYears, cleanCalendar, cleanDate, formatDate, isBefore, plainCalendar } from '../src/passport/dates';
import {
  MAX_STAMPS,
  clothesIds,
  defaultDesign,
  defaultStamp,
  foilIds,
  hairIds,
  limits,
  paperIds,
  printInkIds,
  skinIds,
  stampInkIds,
  stampKinds,
} from '../src/passport/model';
import { generateHolder, generateNumber, givenNames, places, surnames } from '../src/passport/names';
import { clothesColours, hairColours, skins } from '../src/passport/portraits';
import { hashText, n, rng } from '../src/passport/random';
import { randomDesign } from './helpers/designs';

const calderwyn = JSON.parse(readFileSync(new URL('./fixtures/calderwyn.eurth.json', import.meta.url), 'utf8')) as {
  calendar: unknown;
  names: { people: string[]; surnames: string[]; places: string[] };
};
const lantern = cleanCalendar(calderwyn.calendar)!;
const ch = (...points: number[]): string => String.fromCodePoint(...points);

describe('cleaning what arrives', () => {
  it('makes the opening design from anything that is not a design', () => {
    for (const junk of [undefined, null, 42, 'passport', [], [1, 2], true, () => 1]) expect(cleanDesign(junk)).toEqual(defaultDesign());
    expect(cleanDesign(defaultDesign())).toEqual(defaultDesign());
  });

  it('changes nothing in a design that is already clean', () => {
    for (let seed = 1; seed <= 150; seed++) {
      const design = randomDesign(seed);
      expect(cleanDesign(design)).toEqual(design);
      expect(cleanDesign(JSON.parse(JSON.stringify(design)))).toEqual(design);
    }
  });

  it('drops keys it does not know', () => {
    const design = cleanDesign({ extra: 1, state: { name: 'X Land', extra: 2 }, cover: { hologram: true }, papers: { portrait: { hat: 'top' } }, stamps: [{ kind: 'visa', glow: 1 }] });
    expect(Object.keys(design).sort()).toEqual(['calendar', 'card', 'cover', 'holder', 'papers', 'stamps', 'state']);
    expect(Object.keys(design.state).sort()).toEqual(['demonym', 'name']);
    expect(Object.keys(design.cover).sort()).toEqual(['arms', 'chip', 'colour', 'emblem', 'foil', 'titles']);
    expect(Object.keys(design.stamps[0]!).sort()).toEqual(Object.keys(defaultStamp('visa')).sort());
  });

  it('is not fooled by a poisoned prototype', () => {
    cleanDesign(JSON.parse('{"__proto__":{"polluted":true},"state":{"__proto__":{"polluted":true},"name":"X Land"},"constructor":{"prototype":{"polluted":true}}}'));
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it('keeps every text within its limit', () => {
    const long = 'Word '.repeat(60);
    const d = cleanDesign({
      state: { name: long, demonym: long },
      cover: { titles: [long, long] },
      holder: { given: long, surname: long, birthplace: long },
      papers: { number: 'A1'.repeat(30), authority: long },
      card: { titles: [long, long] },
      stamps: [{ kind: 'entry', top: long, label: long, place: long, bottom: long }],
    });
    const size = (text: string): number => Array.from(text).length;
    expect(size(d.state.name)).toBe(limits.stateName);
    expect(size(d.state.demonym)).toBe(limits.demonym);
    expect(d.cover.titles.map(size)).toEqual([limits.title, limits.title]);
    expect(d.card.titles.map(size)).toEqual([limits.title, limits.title]);
    expect(size(d.holder.given)).toBe(limits.given);
    expect(size(d.holder.surname)).toBe(limits.surname);
    expect(size(d.holder.birthplace)).toBe(limits.place);
    expect(d.papers.number).toHaveLength(limits.number);
    expect(size(d.papers.authority)).toBe(limits.authority);
    const stamp = d.stamps[0]!;
    expect([stamp.top, stamp.place, stamp.bottom].map(size)).toEqual([limits.stampLine, limits.stampLine, limits.stampLine]);
    expect(size(stamp.label)).toBe(limits.stampLabel);
  });

  it('cleans text: plain, single-spaced, no markup, nothing invisible', () => {
    expect(cleanText('  Port   of \n Selun', 40)).toBe('Port of Selun');
    // A trailing space survives, so typing "Port of " is not undone mid-word.
    expect(cleanText('Port of ', 40)).toBe('Port of ');
    expect(cleanText('<b>bold</b>', 40)).toBe('bbold/b');
    expect(cleanText(`${ch(0x202e)}abc${ch(0x200b)}d${ch(0xfeff)}${ch(0x07)}${ch(0x9f)}`, 40)).toBe('abcd');
    expect(cleanText(ch(0x65, 0x301), 40)).toBe(ch(0xe9));
    expect(Array.from(cleanText(ch(0x1f600).repeat(50), 10))).toHaveLength(10);
    for (const junk of [undefined, null, 7, {}, []]) expect(cleanText(junk, 40, 'fallback')).toBe('fallback');
    expect(cleanText('', 40, 'fallback')).toBe('');
  });

  it('cleans a document number to capitals, digits, spaces and hyphens', () => {
    expect(cleanNumber('ab-12 34!@#é')).toBe('AB-12 34');
    expect(cleanNumber('  x  1')).toBe('X 1');
    expect(cleanNumber('1'.repeat(40))).toHaveLength(limits.number);
    expect(cleanNumber(1234567, 'none')).toBe('none');
  });

  it('clamps numbers and takes only listed ids', () => {
    expect(clamp(5, 0, 3, 1)).toBe(3);
    expect(clamp('2.5', 0, 3, 1)).toBe(2.5);
    expect(clamp('', 0, 3, 1)).toBe(1);
    expect(clamp(NaN, 0, 3, 1)).toBe(1);
    expect(clamp(Infinity, 0, 3, 1)).toBe(1);
    expect(whole(2.6, 0, 3, 1)).toBe(3);
    expect(pick('gold', foilIds, 'silver')).toBe('gold');
    expect(pick('platinum', foilIds, 'silver')).toBe('silver');
    const d = cleanDesign({
      cover: { colour: 'red', foil: 'platinum', emblem: 'dragon', chip: 0, arms: 'yes' },
      papers: { years: 999, seed: -5, pattern: 'plaid', paper: 'black', ink: 'invisible' },
      stamps: [{ kind: 'bribe', shape: 'blob', border: 'none', mark: 'rocket', ink: 'gold', rot: 99, wear: 9, x: -5, y: 500, seed: 1e12, dateStyle: 'roman' }],
    });
    const base = defaultDesign();
    expect(d.cover).toEqual({ ...base.cover, chip: true, arms: false });
    expect(d.papers.years).toBe(20);
    expect(d.papers.seed).toBe(0);
    expect([d.papers.pattern, d.papers.paper, d.papers.ink]).toEqual([base.papers.pattern, base.papers.paper, base.papers.ink]);
    const entry = defaultStamp('entry');
    expect(d.stamps[0]).toEqual({ ...entry, rot: 15, wear: 3, x: 0, y: 100, seed: 999999 });
    expect(cleanDesign({ papers: { years: 0 } }).papers.years).toBe(1);
    expect(cleanDesign({ cover: { chip: false, arms: true } }).cover).toMatchObject({ chip: false, arms: true });
  });

  it('keeps a list of stamps as given, up to twelve, and an empty one empty', () => {
    expect(cleanDesign({ stamps: [] }).stamps).toEqual([]);
    expect(cleanDesign({ stamps: 'three' }).stamps).toEqual(defaultDesign().stamps);
    const many = cleanDesign({ stamps: Array.from({ length: 40 }, () => ({ kind: 'exit' })) }).stamps;
    expect(many).toHaveLength(MAX_STAMPS);
    expect(many.every((s) => s.kind === 'exit')).toBe(true);
    for (const kind of stampKinds) expect(cleanStamp({ kind }, null)).toEqual(defaultStamp(kind));
    expect(cleanStamp(null, null, 'visa')).toEqual(defaultStamp('visa'));
  });

  it('keeps a first title, and lets the second be empty', () => {
    expect(cleanDesign({ cover: { titles: ['', 'Reispas'] } }).cover.titles).toEqual(['Passport', 'Reispas']);
    expect(cleanDesign({ cover: { titles: ['Sea pass'] } }).cover.titles).toEqual(['Sea pass', '']);
    expect(cleanDesign({ card: { titles: 'Card' } }).card.titles).toEqual(['Identity card', '']);
  });
});

describe('colours', () => {
  it('reads and tidies hex colours', () => {
    expect(cleanColour('#ABC')).toBe('#aabbcc');
    expect(cleanColour('A1B2C3')).toBe('#a1b2c3');
    expect(cleanColour(' #123456 ')).toBe('#123456');
    for (const junk of ['red', '#12345', '#1234567', 'url(x)', 5, null]) expect(cleanColour(junk, '#000001')).toBe('#000001');
  });

  it('works out contrast as WCAG does', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrast('#ffffff', '#000000')).toBeCloseTo(21, 5);
    expect(contrast('#777777', '#777777')).toBe(1);
    expect(luminance('#ffffff')).toBeCloseTo(1, 5);
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(shade('#808080', -1)).toBe('#000000');
    expect(shade('#808080', 1)).toBe('#ffffff');
  });

  it('has one named colour for every id in the model, and no name twice', () => {
    const pairs: [readonly { id: string; name: string }[], readonly string[]][] = [
      [foils, foilIds],
      [papers, paperIds],
      [printInks, printInkIds],
      [stampInks, stampInkIds],
      [skins, skinIds],
      [hairColours, hairIds],
      [clothesColours, clothesIds],
    ];
    for (const [list, ids] of pairs) {
      expect(list.map((entry) => entry.id)).toEqual([...ids]);
      expect(new Set(list.map((entry) => entry.name)).size).toBe(list.length);
    }
    expect(hexOf(foils, 'silver')).toBe('#d5d9dc');
    expect(hexOf(foils, 'nonsense')).toBe(foils[0].hex);
    expect(nameOf(papers, 'rose')).toBe('Rose');
  });

  it('prints text that can be read on every paper', () => {
    for (const paper of papers) {
      expect(contrast(TEXT_DARK, paper.hex), paper.name).toBeGreaterThanOrEqual(7);
      for (const ink of [...printInks, ...stampInks]) expect(contrast(ink.hex, paper.hex), `${ink.name} on ${paper.name}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('tells skin tones apart by lightness, not by hue alone', () => {
    const lightness = skins.map((skin) => luminance(skin.hex));
    for (let i = 1; i < lightness.length; i++) expect(lightness[i - 1]! / lightness[i]!, skins[i]!.name).toBeGreaterThan(1.25);
  });

  it('always stamps the cover in something that can be read on it', () => {
    for (const cover of coverColours) for (const foil of foils) expect(coverInk(cover.hex, foil.id), `${foil.name} on ${cover.name}`).toBe(foil.hex);
    const random = rng(9);
    for (let i = 0; i < 400; i++) {
      const cover = `#${random.int(0, 0xffffff).toString(16).padStart(6, '0')}`;
      for (const foil of foils) expect(contrast(coverInk(cover, foil.id), cover), `${foil.name} on ${cover}`).toBeGreaterThanOrEqual(3);
    }
    expect(coverInk('#f5f0e0', 'gold')).toBe('#1a1a1a');
  });

  it('names a colour in a word', () => {
    expect(colourName('#5b1a28')).toBe('burgundy');
    expect(colourName('#1c2c4c')).toBe('navy');
    expect(colourName('#fefefe')).toBe('white');
    expect(colourName('#101010')).toBe('black');
  });
});

describe('the seeded generator', () => {
  it('gives the same numbers for the same seed, and others for another', () => {
    const a = rng(42);
    const b = rng(42);
    const c = rng(43);
    const first = Array.from({ length: 20 }, () => a.next());
    expect(Array.from({ length: 20 }, () => b.next())).toEqual(first);
    expect(Array.from({ length: 20 }, () => c.next())).not.toEqual(first);
  });

  it('stays inside what it is asked for', () => {
    const r = rng(7);
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i++) {
      const v = r.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
      const k = r.int(3, 6);
      seen.add(k);
      expect(k).toBeGreaterThanOrEqual(3);
      expect(k).toBeLessThanOrEqual(6);
      const f = r.range(-2, 2);
      expect(f).toBeGreaterThanOrEqual(-2);
      expect(f).toBeLessThan(2);
      expect(['a', 'b', 'c']).toContain(r.pick(['a', 'b', 'c']));
    }
    expect([...seen].sort()).toEqual([3, 4, 5, 6]);
    for (const odd of [NaN, Infinity, -1, 1.5]) expect(rng(odd).next()).toBeLessThan(1);
  });

  it('turns text into a seed and numbers into short text', () => {
    expect(hashText('Liane Ashdale')).toBe(hashText('Liane Ashdale'));
    expect(hashText('Liane Ashdale')).not.toBe(hashText('Liane Ashdall'));
    expect(n(1.23456)).toBe('1.23');
    expect(n(2)).toBe('2');
    expect(n(-0.5)).toBe('-0.5');
  });
});

describe('dates in the world’s own calendar', () => {
  it('writes a date three ways', () => {
    const date = { d: 4, m: 1, y: 1022 };
    expect(formatDate(date, lantern, 'long')).toBe('4 Frostwane 1022 LR');
    expect(formatDate(date, lantern, 'short')).toBe('04 FRO 1022 LR');
    expect(formatDate(date, lantern, 'numeric')).toBe('04.01.1022');
    expect(formatDate({ d: 19, m: 12, y: 2026 }, null)).toBe('19 December 2026');
    expect(formatDate({ d: 19, m: 12, y: 2026 }, null, 'short')).toBe('19 DEC 2026');
    expect(formatDate({ d: 1, m: 3, y: -44 }, null)).toBe('1 March -44');
    // A month that isn't there is read as the nearest one that is.
    expect(formatDate({ d: 1, m: 99, y: 1 }, null)).toBe('1 December 1');
  });

  it('reads the profile’s calendar section', () => {
    expect(lantern.months).toHaveLength(12);
    expect(lantern.months[0]).toEqual({ name: 'Frostwane', days: 31 });
    expect(lantern.era).toBe('LR');
    expect(plainCalendar.months).toHaveLength(12);
  });

  it('gives no calendar when there are no months to name', () => {
    for (const junk of [null, undefined, 5, 'x', [], {}, { months: [] }, { months: 'twelve' }, { months: [{ days: 30 }, { name: '   ' }, 7, null] }]) expect(cleanCalendar(junk)).toBeNull();
  });

  it('caps and cleans a calendar from someone else', () => {
    const cal = cleanCalendar({
      months: [{ name: '<b>Thaw</b>' }, { name: 'M'.repeat(80), days: 5000 }, { name: 'Short', days: 0 }, { name: 'Odd', days: 'ten' }, ...Array.from({ length: 100 }, (_, i) => ({ name: `Month ${i}`, days: 30 }))],
      era: 'An era with far too long a name',
    })!;
    expect(cal.months).toHaveLength(MAX_MONTHS);
    expect(cal.months[0]).toEqual({ name: 'bThaw/b', days: 30 });
    expect(cal.months[1]!.name.length).toBeLessThanOrEqual(MAX_MONTH_NAME);
    expect(cal.months[1]!.days).toBe(1000);
    expect(cal.months[2]!.days).toBe(1);
    expect(cal.months[3]!.days).toBe(30);
    expect(cal.era.length).toBeLessThanOrEqual(MAX_ERA);
  });

  it('makes a date exist in its calendar', () => {
    const fallback = { d: 1, m: 1, y: 2000 };
    expect(cleanDate({ d: 31, m: 2, y: 2024 }, null, fallback)).toEqual({ d: 29, m: 2, y: 2024 });
    expect(cleanDate({ d: 31, m: 2, y: 1022 }, lantern, fallback)).toEqual({ d: 28, m: 2, y: 1022 });
    expect(cleanDate({ d: 0, m: 0, y: 1e9 }, null, fallback)).toEqual({ d: 1, m: 1, y: MAX_YEAR });
    expect(cleanDate({ d: 5, m: 13, y: -1e9 }, null, fallback)).toEqual({ d: 5, m: 12, y: MIN_YEAR });
    expect(cleanDate('tomorrow', null, fallback)).toEqual(fallback);
    expect(cleanDate({ d: 'x', m: null }, null, { d: 40, m: 40, y: 5 })).toEqual({ d: 31, m: 12, y: 5 });
    const short = cleanCalendar({ months: [{ name: 'Only', days: 10 }] });
    expect(cleanDate({ d: 25, m: 6, y: 3 }, short, fallback)).toEqual({ d: 10, m: 1, y: 3 });
  });

  it('counts years on and back, and knows which date is earlier', () => {
    expect(addYears({ d: 19, m: 12, y: 2026 }, 10, null)).toEqual({ d: 19, m: 12, y: 2036 });
    expect(addYears({ d: 2, m: 11, y: 1022 }, -34, lantern)).toEqual({ d: 2, m: 11, y: 988 });
    expect(isBefore({ d: 1, m: 1, y: 2000 }, { d: 2, m: 1, y: 2000 })).toBe(true);
    expect(isBefore({ d: 1, m: 2, y: 2000 }, { d: 2, m: 1, y: 2000 })).toBe(false);
    expect(isBefore({ d: 9, m: 9, y: 1999 }, { d: 1, m: 1, y: 2000 })).toBe(true);
    expect(isBefore({ d: 1, m: 1, y: 2000 }, { d: 1, m: 1, y: 2000 })).toBe(false);
  });

  it('puts dates into a design’s own calendar when the design is cleaned', () => {
    const design = cleanDesign({ calendar: { months: [{ name: 'Only', days: 10 }], era: 'XX' }, holder: { born: { d: 31, m: 12, y: 5 } }, papers: { issued: { d: 31, m: 12, y: 30 } } });
    expect(design.holder.born).toEqual({ d: 10, m: 1, y: 5 });
    expect(design.papers.issued).toEqual({ d: 10, m: 1, y: 30 });
    for (const stamp of design.stamps) expect(stamp.date).toMatchObject({ m: 1 });
  });
});

describe('the holder', () => {
  const issued = { d: 19, m: 12, y: 2026 };

  it('is the same person for the same seed, and someone else for another', () => {
    expect(generateHolder(5, { issued })).toEqual(generateHolder(5, { issued }));
    const people = new Set(Array.from({ length: 60 }, (_, seed) => `${generateHolder(seed, { issued }).given} ${generateHolder(seed, { issued }).surname}`));
    expect(people.size).toBeGreaterThan(40);
  });

  it('comes from the built-in lists when the profile has no names', () => {
    for (let seed = 0; seed < 100; seed++) {
      const holder = generateHolder(seed, { issued });
      expect(givenNames).toContain(holder.given);
      expect(surnames).toContain(holder.surname);
      expect(places).toContain(holder.birthplace);
    }
  });

  it('is named from the profile when it has names', () => {
    for (let seed = 0; seed < 100; seed++) {
      const holder = generateHolder(seed, { issued: { d: 2, m: 11, y: 1022 }, names: calderwyn.names, calendar: lantern });
      expect(calderwyn.names.people).toContain(holder.given);
      expect(calderwyn.names.surnames).toContain(holder.surname);
      expect(calderwyn.names.places).toContain(holder.birthplace);
    }
  });

  it('fills in whatever the profile leaves out', () => {
    const partial = generateHolder(3, { issued, names: { people: ['Ysolde'], surnames: [], places: undefined }, capital: 'Haldermouth' });
    expect(partial.given).toBe('Ysolde');
    expect(surnames).toContain(partial.surname);
    expect(partial.birthplace).toBe('Haldermouth');
    expect(places).toContain(generateHolder(3, { issued, names: null }).birthplace);
  });

  it('is 18 to 70 on the day of issue, and born on a day that exists', () => {
    for (let seed = 0; seed < 300; seed++) {
      const holder = generateHolder(seed, { issued: { d: 2, m: 11, y: 1022 }, calendar: lantern });
      const age = 1022 - holder.born.y;
      expect(age).toBeGreaterThanOrEqual(18);
      expect(age).toBeLessThanOrEqual(70);
      expect(holder.born.m).toBeLessThanOrEqual(12);
      expect(holder.born.d).toBeLessThanOrEqual(lantern.months[holder.born.m - 1]!.days);
      expect(cleanDate(holder.born, lantern, issued)).toEqual(holder.born);
    }
  });

  it('cleans names that come from a file like any other text', () => {
    const holder = generateHolder(1, { issued, names: { people: [7, null, '<i>Ysolde</i>'], surnames: ['M'.repeat(90)], places: ['   ', 'Wyn   mere'] } });
    expect(holder.given).toBe('iYsolde/i');
    expect(holder.surname).toBe('M'.repeat(24));
    expect(holder.birthplace).toBe('Wyn mere');
  });

  it('has built-in lists worth drawing from', () => {
    for (const list of [givenNames, surnames, places]) {
      expect(list.length).toBeGreaterThanOrEqual(20);
      expect(new Set(list).size).toBe(list.length);
      for (const name of list) expect(name).toMatch(/^[A-Z][A-Za-z’ ]+$/);
    }
    expect(generateNumber(1)).toBe(generateNumber(1));
    expect(new Set(Array.from({ length: 50 }, (_, i) => generateNumber(i))).size).toBeGreaterThan(45);
  });
});
