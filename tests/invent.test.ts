/**
 * Random: a whole set of papers for a state nobody has heard of. Whatever the dice give is held
 * to the same rules as anything typed.
 */
import { describe, expect, it } from 'vitest';
import { cleanDesign } from '../src/passport/clean';
import { contrast, coverInk } from '../src/passport/colours';
import { hasMachineReadableRun, isRealCode, isRealCountry } from '../src/passport/fiction';
import { inventState, randomDesign } from '../src/passport/invent';
import { compactDesign, expandDesign } from '../src/passport/link';
import { limits, stampKinds, type Design } from '../src/passport/model';
import { rng } from '../src/passport/random';
import { specimenKinds, problems } from './helpers/designs';
import { renderDocument, documentsOf } from '../src/passport/render';
import { textsOf } from './helpers/mrz';

const SEEDS = Array.from({ length: 500 }, (_, i) => i * 7919 + 1);
const texts = (d: Design): string[] => [d.state.name, d.state.demonym, ...d.cover.titles, ...d.card.titles, d.holder.given, d.holder.surname, d.holder.birthplace, d.papers.authority, d.papers.number, ...d.stamps.flatMap((s) => [s.top, s.label, s.place, s.bottom])];

describe('random papers', () => {
  it('gives the same papers for the same seed, and different ones for different seeds', () => {
    for (const seed of SEEDS.slice(0, 50)) expect(randomDesign(seed)).toEqual(randomDesign(seed));
    expect(new Set(SEEDS.map((seed) => randomDesign(seed).state.name)).size).toBeGreaterThan(300);
    expect(new Set(SEEDS.map((seed) => JSON.stringify(randomDesign(seed)))).size).toBe(SEEDS.length);
  });

  it('never names a real country, in 500 states and in every part of each name', () => {
    for (const seed of SEEDS) {
      const { root, state } = inventState(rng(seed));
      expect(isRealCountry(root), root).toBe(false);
      expect(isRealCountry(state.name), state.name).toBe(false);
      expect(isRealCode(root), root).toBe(false);
      expect(state.name).toContain(root);
      expect(state.demonym.startsWith(root), state.demonym).toBe(true);
      expect(Array.from(state.name).length).toBeLessThanOrEqual(limits.stateName);
    }
  });

  it('is already clean: the rules for typed papers change nothing in it', () => {
    for (const seed of SEEDS) {
      const design = randomDesign(seed);
      expect(cleanDesign(design), String(seed)).toEqual(design);
      expect(expandDesign(compactDesign(design)), String(seed)).toEqual(design);
      for (const text of texts(design)) expect(hasMachineReadableRun(text), text).toBe(false);
    }
  });

  it('draws well: every document whole, SPECIMEN on the papers, and lettering that can be read on its cover', () => {
    for (const seed of SEEDS.slice(0, 60)) {
      const design = randomDesign(seed);
      for (const ref of documentsOf(design)) {
        const svg = renderDocument(design, ref);
        expect(problems(svg), `${seed} ${ref.kind}`).toEqual([]);
        if ((specimenKinds as readonly string[]).includes(ref.kind)) expect(svg).toContain('data-fiction="specimen"');
      }
      expect(contrast(coverInk(design.cover.colour, design.cover.foil), design.cover.colour), design.cover.colour).toBeGreaterThanOrEqual(3);
      // On one line, or on two when the name is long.
      expect(textsOf(renderDocument(design, { kind: 'cover' })).join(' ')).toContain(design.state.name.toUpperCase());
    }
  });

  it('makes a full set: a holder, a card, and one stamp of each kind in the state’s short name', () => {
    for (const seed of SEEDS.slice(0, 100)) {
      const design = randomDesign(seed);
      const { root } = inventState(rng(seed));
      expect(design.stamps.map((s) => s.kind).sort()).toEqual([...stampKinds].sort());
      for (const stamp of design.stamps) expect(stamp.top).toBe(root);
      expect(design.holder.given.length).toBeGreaterThan(0);
      expect(design.holder.surname.length).toBeGreaterThan(0);
      expect(design.papers.number).toMatch(/^\d{7}$/);
      expect(design.papers.pattern).not.toBe('none');
      expect(design.calendar).toBeNull();
      expect(design.cover.arms).toBe(false);
    }
  });

  it('keeps a nation that is already loaded: its name, its people, its calendar and its arms', () => {
    const calendar = { months: ['Thaw', 'Sowing', 'Meadow', 'Harvest'].map((name) => ({ name, days: 45 })), era: 'YR' };
    const keep = { state: { name: 'Free City of Calderwyn', demonym: 'Calderwynian' }, shortName: 'Calderwyn', calendar, arms: true };
    const names = { people: ['Aldis'], surnames: ['Varr'], places: ['Lanternquay'] };
    for (const seed of SEEDS.slice(0, 60)) {
      const design = randomDesign(seed, { keep, names, capital: 'Calder' });
      expect(design.state).toEqual(keep.state);
      expect(design.calendar).toEqual(calendar);
      expect(design.cover.arms).toBe(true);
      expect(design.holder).toMatchObject({ given: 'Aldis', surname: 'Varr', birthplace: 'Lanternquay' });
      for (const stamp of design.stamps) {
        expect(stamp.top).toBe('Calderwyn');
        expect(stamp.date.m).toBeLessThanOrEqual(4);
        expect(stamp.date.d).toBeLessThanOrEqual(45);
        if (stamp.kind !== 'visa') expect(stamp.place).toContain('Lanternquay');
      }
      expect(cleanDesign(design)).toEqual(design);
    }
    // Different looks for the same nation.
    expect(new Set(SEEDS.slice(0, 60).map((seed) => randomDesign(seed, { keep }).cover.colour)).size).toBeGreaterThan(4);
  });
});
