/**
 * Random: a whole set of papers for a state nobody has heard of. The name is put together from
 * syllables and checked against the real world like any typed name; everything else is picked
 * from the same closed lists the controls offer. The same seed always gives the same papers.
 *
 * With a nation already loaded from a profile, its name, people and calendar are kept and only
 * the look of the papers, the holder and the stamps are new.
 */
import { cleanDesign } from './clean';
import { coverColours } from './colours';
import { addYears, calendarOf, cleanDate, type Calendar, type DateParts } from './dates';
import { isRealCountry } from './fiction';
import {
  MAX_SEED,
  avatarIds,
  clothesIds,
  defaultDesign,
  defaultStamp,
  emblemIds,
  hairIds,
  limits,
  paperIds,
  patternIds,
  printInkIds,
  skinIds,
  stampBorders,
  stampInkIds,
  stampKinds,
  stampMarks,
  stampShapes,
  type Design,
  type FoilId,
  type Stamp,
  type StampKind,
  type State,
} from './model';
import { generateHolder, generateNumber, places, type NameLists } from './names';
import { rng, type Rng } from './random';

const starts = ['Al', 'Bel', 'Cor', 'Dar', 'El', 'Fen', 'Gal', 'Hal', 'Isk', 'Jor', 'Kal', 'Lor', 'Mar', 'Nor', 'Or', 'Pel', 'Quen', 'Ros', 'Sel', 'Tar', 'Ul', 'Val', 'Wen', 'Yar', 'Zel', 'Bran', 'Thal', 'Ves', 'Myr', 'Ond'] as const;
const middles = ['a', 'e', 'i', 'o', 'u', 'ae', 'an', 'ar', 'el', 'en', 'is', 'or', 'ov', 'yr'] as const;
const ends = ['dia', 'land', 'mark', 'ria', 'vara', 'eth', 'dor', 'wyn', 'moor', 'holt', 'gard', 'mere', 'via', 'nia', 'thia', 'ros', 'var', 'lund'] as const;

const forms = [
  'Republic of {x}',
  'Republic of {x}',
  'Kingdom of {x}',
  'Free State of {x}',
  'Commonwealth of {x}',
  'Principality of {x}',
  'Grand Duchy of {x}',
  'United Provinces of {x}',
  'Realm of {x}',
  '{x} Federation',
  '{x} League',
  '{x}',
] as const;

/** Cover colours a Random cover may wear, besides the mock-up's four: all dark enough for any foil. */
const moreCovers = ['#0f3d3e', '#3b2a5a', '#4a2b12', '#7a1f2b', '#23395b', '#2f4f2f', '#3a3a3a', '#5a3a1a'] as const;
const foilChances: readonly FoilId[] = ['gold', 'gold', 'gold', 'silver', 'white'];
/** A second language for the title: words that sound like "passport" somewhere that isn't anywhere. */
const secondTitles = ['Pasavar', 'Reisbrev', 'Vandrebok', 'Paszorta', 'Wegbrief', 'Itinerar'] as const;
const cardTitles = ['Identity card', 'National identity card', 'Citizen card', 'Card of identity'] as const;
const authorities = ['Ministry of the Interior', 'Ministry of Foreign Affairs', 'Office of the Chancellor', 'Passport Office', 'Department of Citizenship', 'Bureau of Records', 'Civil Registry', 'Office of the Seal'] as const;
const offices = ['Border Guard', 'Customs', 'Frontier Police', 'Harbour Office', 'Port Authority'] as const;
const crossings: Record<Stamp['mark'], readonly string[]> = {
  ship: ['Port of {p}', '{p} Harbour', '{p} Quay'],
  aircraft: ['{p} Airfield', '{p} Aerodrome'],
  train: ['{p} Station', '{p} Junction'],
  road: ['{p} Crossing', '{p} Gate', '{p} Bridge'],
  star: ['{p}'],
  none: ['{p}'],
};
const visas = ['Single entry · 90 days', 'Multiple entry · 1 year', 'Transit · 5 days', 'Visitor · 30 days', 'Scholar · 2 years'] as const;

/** What a nation is called by its people: Teland gives Telandic, Valoria gives Valorian. */
function demonymOf(root: string): string {
  if (/(land|mark|gard|holt|moor|mere|lund)$/.test(root)) return `${root}ic`;
  if (/a$/.test(root)) return `${root}n`;
  if (/(eth|wyn)$/.test(root)) return `${root}ic`;
  return `${root}ian`;
}

/** An invented state: its short name, its formal name and what its people are called. Never a real country. */
export function inventState(random: Rng): { root: string; state: State } {
  for (let tries = 0; tries < 40; tries++) {
    const root = random.pick(starts) + (random.next() < 0.6 ? random.pick(middles) : '') + random.pick(ends);
    const name = random.pick(forms).replace('{x}', root);
    if (isRealCountry(root) || isRealCountry(name) || name.length > limits.stateName) continue;
    return { root, state: { name, demonym: demonymOf(root) } };
  }
  const base = defaultDesign().state;
  return { root: 'Teland', state: base };
}

export interface InventOptions {
  /** A nation that is already there (from a loaded profile): its name and calendar are kept. */
  keep?: { state: State; shortName?: string | null; calendar: Calendar | null; arms?: boolean } | null;
  /** The profile's own names, for the holder and the places on stamps. */
  names?: NameLists | null;
  capital?: string | null;
}

/** A whole random set of papers. The same seed and options always give the same one. */
export function randomDesign(seed: number, options: InventOptions = {}): Design {
  const random = rng(seed);
  const invented = inventState(random);
  const keep = options.keep ?? null;
  const state = keep ? keep.state : invented.state;
  const short = keep ? (keep.shortName?.trim() || keep.state.name) : invented.root;
  const calendar = keep ? keep.calendar : null;
  const months = calendarOf(calendar).months;
  const base = defaultDesign();

  // In the plain calendar a date of issue in the last few years; in a world's own, the opening date made to exist there.
  const issued: DateParts = calendar
    ? cleanDate(base.papers.issued, calendar, base.papers.issued)
    : { d: random.int(1, 28), m: random.int(1, 12), y: random.int(2019, 2026) };
  const towns = (Array.isArray(options.names?.places) ? options.names.places : []).filter((p): p is string => typeof p === 'string' && p.trim().length > 0);
  const town = (): string => random.pick(towns.length ? towns : options.capital?.trim() ? [options.capital.trim()] : places);

  const stampOf = (kind: StampKind, index: number): Stamp => {
    const mark = kind === 'visa' ? random.pick(['star', 'none'] as const) : random.pick(stampMarks.filter((m) => m !== 'none' && m !== 'star'));
    const later = addYears(issued, random.int(0, 3), calendar);
    const m = random.int(1, months.length);
    return {
      ...defaultStamp(kind),
      shape: random.pick(stampShapes),
      border: random.pick(stampBorders),
      top: short,
      place: kind === 'visa' ? random.pick(visas) : random.pick(crossings[mark]).replace('{p}', town()),
      bottom: kind === 'visa' ? 'Consular Service' : random.pick(offices),
      date: cleanDate({ d: random.int(1, months[m - 1]!.days), m, y: later.y }, calendar, issued),
      mark,
      ink: random.pick(stampInkIds),
      rot: random.int(-9, 9),
      wear: random.int(0, 2),
      // One stamp to each third of the page, so they don't land on top of each other.
      x: random.int(18, 82),
      y: 14 + index * 30 + random.int(0, 12),
      seed: random.int(0, MAX_SEED),
    };
  };
  // Shuffled by hand, so that every browser deals the same order from the same seed.
  const order = [...stampKinds];
  for (let i = order.length - 1; i > 0; i--) {
    const j = random.int(0, i);
    [order[i], order[j]] = [order[j]!, order[i]!];
  }

  const holderSeed = random.int(0, MAX_SEED);
  const design: Design = {
    state,
    cover: {
      colour: random.pick([...coverColours.map((c) => c.hex), ...moreCovers]),
      foil: random.pick(foilChances),
      emblem: random.pick(emblemIds),
      arms: keep?.arms ?? false,
      titles: ['Passport', random.next() < 0.35 ? random.pick(secondTitles) : ''],
      chip: random.next() < 0.8,
    },
    holder: generateHolder(holderSeed, { names: options.names, calendar, issued, capital: options.capital ?? undefined }),
    papers: {
      number: generateNumber(holderSeed),
      issued,
      years: random.pick([5, 10, 10, 10, 15]),
      authority: random.pick(authorities),
      portrait: { avatar: random.pick(avatarIds), skin: random.pick(skinIds), hair: random.pick(hairIds), clothes: random.pick(clothesIds) },
      pattern: random.pick(patternIds.filter((id) => id !== 'none')),
      paper: random.pick(paperIds),
      ink: random.pick(printInkIds),
      seed: random.int(0, MAX_SEED),
    },
    card: { titles: [random.pick(cardTitles), ''] },
    stamps: order.map(stampOf),
    calendar,
  };
  // Whatever was put together above is still held to the rules everything typed is held to.
  return cleanDesign(design);
}
