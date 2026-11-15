/**
 * Saving and bringing back: the link, the profile's passport section, and the templates.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { cleanDesign } from '../src/passport/clean';
import { contrast, foils, hexOf } from '../src/passport/colours';
import { cleanDate } from '../src/passport/dates';
import { MAX_SVG_LENGTH } from '../src/passport/fiction';
import { LINK_PARAM, LINK_VERSION, MAX_LINK_LENGTH, SITE, compactDesign, decodeDesign, designLink, encodeDesign, expandDesign, fromLink, fromQuery, toQuery } from '../src/passport/link';
import { MAX_STAMPS, avatarIds, defaultDesign, emblemIds, patternIds, stampBorders, stampShapes, type Design } from '../src/passport/model';
import { givenNames, places, surnames } from '../src/passport/names';
import { designFromProfile, passportSection, readProfile, withPassport } from '../src/passport/profile';
import { template, templates } from '../src/passport/templates';
import { drawAll, problems, randomDesign } from './helpers/designs';

type Profile = Record<string, unknown> & { meta: Record<string, unknown> };
const fixture = (name: string): Profile => JSON.parse(readFileSync(new URL(`./fixtures/${name}.eurth.json`, import.meta.url), 'utf8')) as Profile;
const calderwyn = fixture('calderwyn');
const vantmoor = fixture('vantmoor');
const hesperwick = fixture('hesperwick');
const arms = (calderwyn.arms as { svg: string }).svg;
const asLink = (value: unknown): string => `${LINK_VERSION}.${Buffer.from(typeof value === 'string' ? value : JSON.stringify(value)).toString('base64url')}`;
const tweak = (change: (d: Design) => void): Design => {
  const d = defaultDesign();
  change(d);
  return cleanDesign(d);
};

/** A design as large as the limits allow: twelve wordy stamps and a forty-month calendar. */
const hugeDesign = (): Design =>
  cleanDesign({
    state: { name: 'Most Serene Federated Commonwealth of the Outer Brindle Isles', demonym: 'Outer Brindle Islander of the Commonwealth' },
    stamps: Array.from({ length: MAX_STAMPS }, (_, i) => ({ kind: 'visa', top: `Outer Brindle Isles office ${i}`, label: `Permit number ${i}`, place: `Port of Saint Wilhelmina no ${i}`, bottom: `Immigration and customs no ${i}`, x: i * 8, y: i * 7, seed: i })),
    calendar: { months: Array.from({ length: 40 }, (_, i) => ({ name: `Month of the Long Lanterns ${i}`, days: 20 + i })), era: 'AFTERFALL' },
  });

describe('the link', () => {
  it('is empty for the opening design, and holds only what differs otherwise', () => {
    expect(compactDesign(defaultDesign())).toEqual({});
    expect(toQuery(defaultDesign())).toBe('');
    // A link for a profile always names its design, the opening one too.
    expect(designLink(defaultDesign())).toEqual({ url: `${SITE}?d=1.e30`, fits: true });
    expect(compactDesign(tweak((x) => (x.cover.foil = 'silver')))).toEqual({ cover: { foil: 'silver' } });
    expect(compactDesign(tweak((x) => (x.holder.born.y = 1980)))).toEqual({ holder: { born: { y: 1980 } } });
    expect(compactDesign(tweak((x) => (x.stamps[0]!.ink = 'red')))).toEqual({ stamps: [{ kind: 'entry', ink: 'red' }, { kind: 'exit' }, { kind: 'visa' }] });
    expect(compactDesign(cleanDesign({ stamps: [] }))).toEqual({ stamps: [] });
  });

  it('brings back 250 designs and every template exactly', () => {
    for (const design of [...Array.from({ length: 250 }, (_, i) => randomDesign(i + 1)), ...templates.map((t) => t.design), hugeDesign(), cleanDesign({ stamps: [] })]) {
      expect(decodeDesign(encodeDesign(design))).toEqual(design);
      expect(expandDesign(compactDesign(design))).toEqual(design);
      expect(fromQuery(toQuery(design)) ?? defaultDesign()).toEqual(design);
      expect(fromLink(designLink(design).url) ?? defaultDesign()).toEqual(design);
    }
  });

  it('is made of characters that travel in a query string untouched', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const value = encodeDesign(randomDesign(seed));
      expect(value).toMatch(/^1\.[A-Za-z0-9_-]+$/);
      expect(encodeURIComponent(value)).toBe(value);
    }
    expect(toQuery(tweak((x) => (x.cover.foil = 'silver')))).toMatch(new RegExp(`^\\?${LINK_PARAM}=${LINK_VERSION}\\.`));
  });

  it('carries names in any script', () => {
    const design = tweak((x) => {
      x.state.name = '東京 Ωmega Ærø';
      x.holder.given = 'Élan d’Or';
    });
    expect(decodeDesign(encodeDesign(design))).toEqual(design);
  });

  it('keeps every template, and most designs, short enough for a profile', () => {
    for (const t of templates) {
      const { url, fits } = designLink(t.design);
      expect(fits, t.id).toBe(true);
      expect(url.length, t.id).toBeLessThan(2500);
      expect(url, t.id).toMatch(/^https:\/\/[!-~]+$/);
    }
    expect(designLink(hugeDesign()).fits).toBe(false);
    expect(MAX_LINK_LENGTH).toBe(4000);
  });

  it('reads nothing it does not understand', () => {
    const not = ['', '1', '1.', 'garbage', '.e30', '2.e30', '0.e30', '1.!!!', '1.e30=', '1.%7B%7D', asLink('not json'), asLink('[1,2]'), asLink('"text"'), asLink('null'), asLink('7'), `1.${'A'.repeat(25000)}`];
    for (const value of not) expect(decodeDesign(value), value.slice(0, 20)).toBeNull();
    for (const value of [undefined, null, 7, {}, []]) expect(decodeDesign(value as unknown as string)).toBeNull();
    expect(decodeDesign('1.e30')).toEqual(defaultDesign());
    expect(fromQuery('')).toBeNull();
    expect(fromQuery('?other=1')).toBeNull();
    expect(fromQuery('?d=nonsense')).toBeNull();
    expect(fromQuery('d=1.e30')).toEqual(defaultDesign());
    expect(fromQuery('?ref=forum&d=1.e30')).toEqual(defaultDesign());
  });

  it('cleans whatever a link carries before it is drawn', () => {
    const hostile = {
      __proto__: { polluted: true },
      state: { name: '<script>alert(1)</script>', demonym: { toString: 'x' } },
      cover: { colour: 'url(javascript:alert(1))', emblem: '../../etc/passwd', titles: [{}, []] },
      papers: { years: 1e9, portrait: 'me.jpg', seed: 'NaN' },
      stamps: Array.from({ length: 40 }, () => ({ kind: 'visa', rot: 1e9, top: 'x'.repeat(90) })),
      calendar: { months: Array.from({ length: 90 }, () => ({ name: 'y'.repeat(50), days: -1 })) },
    };
    // Anything too long to be a design is not read at all.
    expect(decodeDesign(asLink({ ...hostile, stamps: Array.from({ length: 1000 }, () => ({ kind: 'visa', top: 'x'.repeat(5000) })) }))).toBeNull();
    const design = decodeDesign(asLink(JSON.stringify(hostile).replace('{', '{"__proto__":{"polluted":true},')))!;
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(design).toEqual(cleanDesign(design));
    expect(design.state.name).toBe('scriptalert(1)/script');
    expect(design.cover).toEqual(defaultDesign().cover);
    expect(design.papers.years).toBe(20);
    expect(design.stamps).toHaveLength(MAX_STAMPS);
    expect(design.calendar!.months).toHaveLength(40);
    for (const { ref, svg } of drawAll(design)) expect(problems(svg), ref.kind).toEqual([]);
    // Nesting a thousand deep does no harm either.
    const deep = `${'{"state":'.repeat(1000)}1${'}'.repeat(1000)}`;
    expect(decodeDesign(asLink(deep))).toEqual(defaultDesign());
  });

  it('reads a design only from a link to Passport itself', () => {
    const design = template('calderwyn')!.design;
    const query = toQuery(design);
    expect(fromLink(`${SITE}${query}`)).toEqual(design);
    expect(fromLink(`${SITE}${query}#top`)).toEqual(design);
    expect(fromLink(`${SITE}guide/${query}`)).toEqual(design);
    for (const link of [`https://evil.example/${query}`, `https://passport.eurth.org.evil.example/${query}`, `http://passport.eurth.org/${query}`, `//passport.eurth.org/${query}`, SITE, `${SITE}#example-calderwyn`, '', null, 7, {}]) {
      expect(fromLink(link), String(link).slice(0, 40)).toBeNull();
    }
  });
});

describe('reading a profile', () => {
  it('takes the name, arms, names and calendar from a full profile', () => {
    const facts = readProfile(calderwyn);
    expect(facts.stateName).toBe('Kingdom of Calderwyn');
    expect(facts.commonName).toBe('Calderwyn');
    expect(facts.demonym).toBe('Calderwynian');
    expect(facts.capital).toBe('Haldermouth');
    expect(facts.arms).toBe(arms);
    expect(facts.names!.people).toContain('Ysolde');
    expect(facts.calendar!.months).toHaveLength(12);
    expect(facts.calendar!.era).toBe('LR');
    expect(facts.colour).toBe('#123a5a');
    // The example's link is a placeholder, not a saved design.
    expect(facts.saved).toBeNull();
    expect(facts.notes).toEqual([]);
  });

  it('makes do with what a smaller profile has', () => {
    const mid = readProfile(vantmoor);
    expect(mid).toMatchObject({ stateName: 'Republic of Vantmoor', commonName: 'Vantmoor', demonym: 'Vantmoorish', capital: 'Marrowgate', arms: null, names: null, calendar: null, saved: null, colour: null });
    const small = readProfile(hesperwick);
    expect(small).toMatchObject({ stateName: 'Hesperwick', commonName: 'Hesperwick', demonym: null, capital: null, arms: null, names: null, calendar: null });
  });

  it('takes anything in its stride', () => {
    for (const junk of [null, undefined, 7, 'profile', [], {}, { meta: 5, identity: [], arms: 'x', names: 7, calendar: 'y', passport: null }]) {
      const facts = readProfile(junk);
      expect(facts).toMatchObject({ stateName: null, arms: null, names: null, calendar: null, saved: null, colour: null, notes: [] });
      expect(designFromProfile(junk).design.cover.arms).toBe(false);
    }
    expect(readProfile({ passport: { colour: 'red' } }).colour).toBeNull();
    expect(readProfile({ passport: { colour: '#ABCDEF' } }).colour).toBe('#abcdef');
    expect(readProfile({ identity: { commonName: '<b>Teland</b>' } }).stateName).toBe('bTeland/b');
  });

  it('dresses the opening design in a nation’s own name, arms, calendar and names', () => {
    const { design } = designFromProfile(calderwyn);
    expect(design.state).toEqual({ name: 'Kingdom of Calderwyn', demonym: 'Calderwynian' });
    expect(design.cover.colour).toBe('#123a5a');
    expect(design.cover.arms).toBe(true);
    expect(design.calendar!.era).toBe('LR');
    const names = calderwyn.names as { people: string[]; surnames: string[]; places: string[] };
    expect(names.people).toContain(design.holder.given);
    expect(names.surnames).toContain(design.holder.surname);
    expect(names.places).toContain(design.holder.birthplace);
    expect(cleanDate(design.holder.born, design.calendar, design.papers.issued)).toEqual(design.holder.born);
    const age = design.papers.issued.y - design.holder.born.y;
    expect(age).toBeGreaterThanOrEqual(18);
    expect(age).toBeLessThanOrEqual(70);
    expect(design.stamps.map((s) => s.top)).toEqual(['Calderwyn', 'Calderwyn', 'Calderwyn']);
    expect(design.stamps.map((s) => s.place)).toEqual(['Haldermouth', 'Haldermouth', 'Single entry · 90 days']);
    expect(designFromProfile(calderwyn).design).toEqual(design);
    expect(cleanDesign(design)).toEqual(design);
    for (const { ref, svg } of drawAll(design, { arms })) expect(problems(svg), ref.kind).toEqual([]);
  });

  it('invents a holder from its own lists when the profile has no names', () => {
    const { design } = designFromProfile(vantmoor);
    expect(design.state.name).toBe('Republic of Vantmoor');
    expect(design.cover.arms).toBe(false);
    expect(design.calendar).toBeNull();
    expect(givenNames).toContain(design.holder.given);
    expect(surnames).toContain(design.holder.surname);
    expect(design.holder.birthplace).toBe('Marrowgate');
    const small = designFromProfile(hesperwick).design;
    expect(small.state).toEqual({ name: 'Hesperwick', demonym: '' });
    expect(places).toContain(small.holder.birthplace);
    expect(small.stamps[0]!.top).toBe('Hesperwick');
    // Different nations get different holders.
    expect(small.holder).not.toEqual(design.holder);
  });
});

describe('writing the passport section', () => {
  const now = new Date('2026-11-14T22:30:00.000Z');
  const schemaDate = /^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])T([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9](\.[0-9]{1,9})?(Z|[+-]([01][0-9]|2[0-3]):[0-5][0-9])$/;

  it('holds a link, a summary, the colour, the title and the cover as a picture', () => {
    const section = passportSection(defaultDesign());
    expect(Object.keys(section)).toEqual(['link', 'summary', 'colour', 'title', 'svg']);
    expect(section.link).toBe(`${SITE}?d=1.e30`);
    expect(section.colour).toBe('#5b1a28');
    expect(section.title).toBe('Passport');
    expect(section.summary).toMatch(/^A burgundy passport with gold lettering/);
    expect(problems(section.svg as string)).toEqual([]);
    expect(section.svg).toContain('REPUBLIC OF TELAND');
  });

  it('fits the profile’s schema for every template and 100 designs', () => {
    for (const design of [...templates.map((t) => t.design), ...Array.from({ length: 100 }, (_, i) => randomDesign(i + 1)), hugeDesign()]) {
      const section = passportSection(design);
      if ('link' in section) {
        expect(section.link).toMatch(/^https:\/\/[!-~]+$/);
        expect((section.link as string).length).toBeLessThanOrEqual(4000);
      }
      expect(typeof section.summary).toBe('string');
      expect(Array.from(section.summary as string).length).toBeLessThanOrEqual(600);
      expect(section.colour).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect((section.svg as string).length).toBeLessThanOrEqual(MAX_SVG_LENGTH);
      expect('link' in section || 'design' in section).toBe(true);
    }
  });

  it('shows the arms in the cover picture when the design asks for them', () => {
    const design = designFromProfile(calderwyn).design;
    expect(passportSection(design, { arms }).svg).toContain('<image href="data:image/svg+xml');
    expect(passportSection(design, { arms }).summary).toContain('the national arms');
    expect(passportSection(design).svg).not.toContain('<image');
    expect(passportSection(design, { arms: '<svg xmlns="http://www.w3.org/2000/svg"><image href="face.jpg"/></svg>' }).svg).not.toContain('<image');
  });

  it('carries a design too big for a link in the section itself', () => {
    const huge = hugeDesign();
    const section = passportSection(huge);
    expect('link' in section).toBe(false);
    expect(section.design).toEqual(compactDesign(huge));
    expect(readProfile({ meta: { schema: 1, nation: 'x' }, passport: section }).saved).toEqual(huge);
    expect(JSON.stringify(section).length).toBeLessThan(40000);
  });

  it('changes the passport section and the two dates, and nothing else', () => {
    for (const original of [calderwyn, vantmoor, hesperwick]) {
      const before = JSON.stringify(original);
      const design = template('ostaril')!.design;
      const next = withPassport(original, design, { now, arms });
      expect(JSON.stringify(original)).toBe(before);
      const keys = Object.keys(original);
      expect(Object.keys(next)).toEqual(keys.includes('passport') ? keys : [...keys, 'passport']);
      for (const key of keys) {
        if (key === 'meta' || key === 'passport') continue;
        expect(next[key], key).toBe(original[key]);
        expect(JSON.stringify(next[key]), key).toBe(JSON.stringify(original[key]));
      }
      expect(next.meta).toEqual({ ...original.meta, updated: '2026-11-14T22:30:00.000Z' });
      expect(Object.keys(next.meta)).toEqual(Object.keys(original.meta));
      const section = next.passport;
      expect(section.updated).toBe('2026-11-14T22:30:00.000Z');
      expect(section.updated).toMatch(schemaDate);
      expect(section.colour).toBe('#1a1a1a');
      expect(designFromProfile(next).design).toEqual(design);
    }
  });

  it('keeps what it does not know, in the section and beside it', () => {
    const profile = { meta: { schema: 1, nation: 'Teland', updated: '2026-01-01T00:00:00Z', future: true }, moon: { base: 'Alpha' }, passport: { link: 'https://passport.eurth.org/#old', colour: '#000000', laminate: 'matte', design: { state: { name: 'Old' } } } };
    const next = withPassport(profile, defaultDesign(), { now });
    expect(next.moon).toBe(profile.moon);
    expect(next.meta).toEqual({ schema: 1, nation: 'Teland', updated: '2026-11-14T22:30:00.000Z', future: true });
    expect(next.passport).toMatchObject({ link: `${SITE}?d=1.e30`, colour: '#5b1a28', laminate: 'matte', title: 'Passport' });
    // A design that now fits its link no longer travels in the section.
    expect('design' in next.passport).toBe(false);
    const back = withPassport(next, hugeDesign(), { now });
    expect('link' in back.passport).toBe(false);
    expect(back.passport).toMatchObject({ laminate: 'matte' });
    expect(designFromProfile(back).design).toEqual(hugeDesign());
  });

  it('stamps the time it is given, or the time it is', () => {
    const before = Date.now();
    const stamped = withPassport({ meta: { schema: 1, nation: 'Teland' } }, defaultDesign());
    const when = Date.parse(stamped.passport.updated);
    expect(when).toBeGreaterThanOrEqual(before);
    expect(when).toBeLessThanOrEqual(Date.now());
    expect(stamped.meta.updated).toMatch(schemaDate);
  });

  it('goes round: a profile saved by Passport brings the same papers back', () => {
    for (const t of templates) {
      const saved = withPassport(hesperwick, t.design, { now });
      // As a file would carry it.
      const loaded = JSON.parse(JSON.stringify(saved)) as unknown;
      const { design, facts } = designFromProfile(loaded);
      expect(design, t.id).toEqual(t.design);
      expect(facts.saved, t.id).toEqual(t.design);
    }
  });
});

describe('templates', () => {
  it('offers twelve sets of papers, each with an id, a name and a line about it', () => {
    expect(templates).toHaveLength(12);
    expect(new Set(templates.map((t) => t.id)).size).toBe(12);
    expect(new Set(templates.map((t) => t.name)).size).toBe(12);
    for (const t of templates) {
      expect(t.id).toMatch(/^[a-z]+$/);
      expect(t.blurb, t.id).toMatch(/^[A-Z].{20,110}\.$/);
      expect(t.name, t.id).toBe(t.design.state.name.replace(/’/g, '’'));
      expect(template(t.id)).toBe(t);
    }
    expect(template('atlantis')).toBeUndefined();
  });

  it('starts with the mock-up’s Republic of Teland, which is the opening design', () => {
    expect(templates[0]!.id).toBe('teland');
    expect(templates[0]!.design).toEqual(defaultDesign());
    expect(templates.slice(1, 4).map((t) => t.id)).toEqual(['calderwyn', 'vantmoor', 'hesperwick']);
  });

  it('is clean as it stands: nothing in a template is changed by the checks every input gets', () => {
    for (const t of templates) expect(cleanDesign(t.design), t.id).toEqual(t.design);
  });

  it('gives each an entry stamp, an exit stamp and a visa', () => {
    for (const t of templates) {
      expect(t.design.stamps.map((s) => s.kind), t.id).toEqual(['entry', 'exit', 'visa']);
      const short = t.design.stamps[0]!.top;
      for (const s of t.design.stamps) expect(s.top, t.id).toBe(short);
      expect(t.design.state.name, t.id).toContain(short);
    }
  });

  it('shows off everything the tool can draw', () => {
    const used = <T>(get: (d: Design) => T[]): Set<T> => new Set(templates.flatMap((t) => get(t.design)));
    expect(used((d) => [d.cover.emblem])).toEqual(new Set(emblemIds));
    expect(used((d) => [d.papers.portrait.avatar])).toEqual(new Set(avatarIds));
    expect(used((d) => [d.papers.pattern])).toEqual(new Set(patternIds.filter((p) => p !== 'none')));
    expect(used((d) => d.stamps.map((s) => s.shape))).toEqual(new Set(stampShapes));
    expect(used((d) => d.stamps.map((s) => s.border))).toEqual(new Set(stampBorders));
    expect(templates.filter((t) => t.design.calendar).length).toBeGreaterThanOrEqual(3);
    expect(templates.filter((t) => t.design.cover.titles[1]).length).toBeGreaterThanOrEqual(3);
  });

  it('stamps every cover in the foil it names', () => {
    for (const t of templates) expect(contrast(hexOf(foils, t.design.cover.foil), t.design.cover.colour), t.id).toBeGreaterThanOrEqual(4.5);
  });

  it('issues every document before it expires and after its holder was born', () => {
    for (const t of templates) {
      const { holder, papers } = t.design;
      const age = papers.issued.y - holder.born.y;
      expect(age, t.id).toBeGreaterThanOrEqual(18);
      expect(age, t.id).toBeLessThanOrEqual(80);
      for (const s of t.design.stamps) expect(s.date.y, t.id).toBeGreaterThanOrEqual(papers.issued.y);
    }
  });

  it('draws every document of every template well formed', () => {
    for (const t of templates) for (const { ref, svg } of drawAll(t.design, { idPrefix: t.id })) expect(problems(svg), `${t.id} ${ref.kind}`).toEqual([]);
  });
});
