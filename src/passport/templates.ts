/**
 * Templates: whole sets of papers for states that don't exist, to start from. The first is the
 * mock-up's Republic of Teland; Calderwyn, Vantmoor and Hesperwick are the Eurth profile's own
 * example nations. A test keeps every name and code here clear of the real world.
 */
import { cleanDesign } from './clean';
import type { Calendar } from './dates';
import { defaultDesign, type Design, type Stamp } from './model';

export interface Template {
  id: string;
  name: string;
  /** One line for the templates page. */
  blurb: string;
  design: Design;
}

type Part<T> = { [K in keyof T]?: T[K] extends (infer U)[] ? Part<U>[] : T[K] extends object | null ? Part<NonNullable<T[K]>> | null : T[K] };

const lanternReckoning: Calendar = {
  months: [
    { name: 'Frostwane', days: 31 },
    { name: 'Thawing', days: 28 },
    { name: 'Seedfall', days: 31 },
    { name: 'Rainmoot', days: 30 },
    { name: 'Blossom', days: 31 },
    { name: 'Highsun', days: 30 },
    { name: 'Goldgrain', days: 31 },
    { name: 'Reaping', days: 31 },
    { name: 'Mistfall', days: 30 },
    { name: 'Leafwane', days: 31 },
    { name: 'Emberdusk', days: 30 },
    { name: 'Longnight', days: 31 },
  ],
  era: 'LR',
};

const sunCount: Calendar = {
  months: ['First Sun', 'Second Sun', 'Third Sun', 'Fourth Sun', 'Fifth Sun', 'Sixth Sun', 'Seventh Sun', 'Eighth Sun', 'Ninth Sun', 'Tenth Sun'].map((name) => ({ name, days: 36 })),
  era: 'AS',
};

const yearOfTheRepublic: Calendar = {
  months: ['Thaw', 'Sowing', 'Meadow', 'Harvest', 'Vintage', 'Mist', 'Frost', 'Snow'].map((name) => ({ name, days: 45 })),
  era: 'YR',
};

/** Three stamps for a state: entry, exit and visa, each changed as the template likes. */
function stamps(top: string, date: Stamp['date'], entry: Part<Stamp>, exit: Part<Stamp>, visa: Part<Stamp>): Part<Stamp>[] {
  return [
    { kind: 'entry', top, date, ...entry },
    { kind: 'exit', top, date, ...exit },
    { kind: 'visa', top, date, ...visa },
  ];
}

const sets: { id: string; name: string; blurb: string; design: Part<Design> }[] = [
  {
    id: 'teland',
    name: 'Republic of Teland',
    blurb: 'The classic: burgundy, gold and a star in a ring.',
    design: {},
  },
  {
    id: 'calderwyn',
    name: 'Kingdom of Calderwyn',
    blurb: 'A seafaring kingdom with its own calendar, the Lantern Reckoning.',
    design: {
      state: { name: 'Kingdom of Calderwyn', demonym: 'Calderwynian' },
      cover: { colour: '#123a5a', foil: 'gold', emblem: 'lantern', titles: ['Passport', 'Farbrev'] },
      holder: { given: 'Ysolde', surname: 'Fenwright', born: { d: 9, m: 6, y: 988 }, birthplace: 'Haldermouth' },
      papers: { number: '2210574', issued: { d: 2, m: 11, y: 1022 }, years: 10, authority: 'Royal Passport Office', portrait: { avatar: 'long', skin: 'fair', hair: 'auburn', clothes: 'forest' }, pattern: 'rosettes', paper: 'blue', ink: 'blue', seed: 14 },
      card: { titles: ['Identity card', 'Kennbrev'] },
      calendar: lanternReckoning,
      stamps: stamps(
        'Calderwyn',
        { d: 4, m: 11, y: 1022 },
        { place: 'Haldermouth Harbour', bottom: 'Harbour Watch', mark: 'ship', shape: 'oval', border: 'double', ink: 'blue', dateStyle: 'long', rot: -5 },
        { place: 'Wynmere Gate', bottom: 'Harbour Watch', mark: 'road', shape: 'rounded', border: 'single', ink: 'black', rot: 6, x: 66, y: 44 },
        { place: 'One voyage · 60 days', bottom: 'Royal Consulate', mark: 'star', shape: 'shield', border: 'double', ink: 'violet', rot: 2, x: 34, y: 78 },
      ),
    },
  },
  {
    id: 'vantmoor',
    name: 'Republic of Vantmoor',
    blurb: 'Fen country: slate blue, a wreath, and a motto about steadiness.',
    design: {
      state: { name: 'Republic of Vantmoor', demonym: 'Vantmoorish' },
      cover: { colour: '#24415f', foil: 'gold', emblem: 'wreath', titles: ['Passport', ''] },
      holder: { given: 'Garrick', surname: 'Brackwater', born: { d: 23, m: 8, y: 1979 }, birthplace: 'Marrowgate' },
      papers: { number: '5067731', authority: 'Office of the Registrar', portrait: { avatar: 'cap', skin: 'porcelain', hair: 'grey', clothes: 'charcoal' }, pattern: 'lattice', paper: 'grey', ink: 'slate', seed: 31 },
      stamps: stamps(
        'Vantmoor',
        { d: 19, m: 12, y: 2026 },
        { place: 'Marrowgate Station', bottom: 'Fen Border Service', mark: 'train', shape: 'rectangle', border: 'toothed', ink: 'green', rot: -4 },
        { place: 'Marrowgate Station', bottom: 'Fen Border Service', mark: 'train', shape: 'rectangle', border: 'dashed', ink: 'black', rot: 3, x: 62, y: 48 },
        { place: 'Many entries · 1 year', bottom: 'Office of the Registrar', mark: 'none', shape: 'rounded', border: 'double', ink: 'blue', rot: -2 },
      ),
    },
  },
  {
    id: 'hesperwick',
    name: 'Hesperwick',
    blurb: 'A small coastal state: sea green, white lettering, a compass rose.',
    design: {
      state: { name: 'Hesperwick', demonym: 'Hesperwicker' },
      cover: { colour: '#1f6f5c', foil: 'white', emblem: 'compass', titles: ['Passport', ''] },
      holder: { given: 'Wren', surname: 'Skerry', born: { d: 2, m: 2, y: 2001 }, birthplace: 'Fenmouth' },
      papers: { number: '0091846', years: 5, authority: 'Harbourmaster’s Office', portrait: { avatar: 'ponytail', skin: 'olive', hair: 'black', clothes: 'sand' }, pattern: 'rings', paper: 'green', ink: 'green', seed: 5 },
      stamps: stamps(
        'Hesperwick',
        { d: 19, m: 12, y: 2026 },
        { place: 'Fenmouth Quay', bottom: 'Harbourmaster', mark: 'ship', shape: 'circle', border: 'toothed', ink: 'green', rot: 8 },
        { place: 'Fenmouth Quay', bottom: 'Harbourmaster', mark: 'ship', shape: 'circle', border: 'dotted', ink: 'red', rot: -9, x: 64, y: 50 },
        { place: 'Landing permit · 14 days', bottom: 'Harbourmaster', mark: 'none', shape: 'oval', border: 'single', ink: 'blue', rot: 3 },
      ),
    },
  },
  {
    id: 'ostaril',
    name: 'Grand Duchy of Ostaril',
    blurb: 'Old money and older titles: black, silver and a crown.',
    design: {
      state: { name: 'Grand Duchy of Ostaril', demonym: 'Ostarilian' },
      cover: { colour: '#1a1a1a', foil: 'silver', emblem: 'crown', titles: ['Passport', 'Putni list'] },
      holder: { given: 'Vanko', surname: 'Zelenko', born: { d: 30, m: 10, y: 1968 }, birthplace: 'Ostaril Old Town' },
      papers: { number: '1730022', authority: 'Ducal Chancellery', portrait: { avatar: 'glasses', skin: 'fair', hair: 'brown', clothes: 'wine' }, pattern: 'weave', paper: 'ivory', ink: 'plum', seed: 44 },
      card: { titles: ['Identity card', 'Osobna karta'] },
      stamps: stamps(
        'Ostaril',
        { d: 19, m: 12, y: 2026 },
        { label: 'Admitted', place: 'Ducal Airfield', bottom: 'Chancellery Guard', mark: 'aircraft', shape: 'shield', border: 'double', ink: 'violet', rot: -3 },
        { label: 'Departed', place: 'Ducal Airfield', bottom: 'Chancellery Guard', mark: 'aircraft', shape: 'shield', border: 'single', ink: 'black', rot: 4, x: 66, y: 50 },
        { place: 'By leave of the Grand Duke', bottom: 'Ducal Chancellery', mark: 'star', shape: 'rectangle', border: 'double', ink: 'red', rot: -1 },
      ),
    },
  },
  {
    id: 'brackwater',
    name: 'Free City of Brackwater',
    blurb: 'A city that issues its own papers, and keeps the key to its gate on the cover.',
    design: {
      state: { name: 'Free City of Brackwater', demonym: 'Brackwater burgher' },
      cover: { colour: '#1d4a36', foil: 'gold', emblem: 'key', titles: ['Burgher’s pass', ''], chip: false },
      holder: { given: 'Maud', surname: 'Holloway', born: { d: 11, m: 5, y: 1985 }, birthplace: 'Brackwater' },
      papers: { number: 'B-40017', years: 3, authority: 'Council of Aldermen', portrait: { avatar: 'bun', skin: 'umber', hair: 'black', clothes: 'forest' }, pattern: 'waves', paper: 'ivory', ink: 'green', seed: 62 },
      card: { titles: ['Burgher’s card', ''] },
      stamps: stamps(
        'Brackwater',
        { d: 19, m: 12, y: 2026 },
        { label: 'Gate', place: 'North Gate', bottom: 'City Watch', mark: 'road', shape: 'hexagon', border: 'double', ink: 'green', rot: -6 },
        { label: 'Out', place: 'River Gate', bottom: 'City Watch', mark: 'ship', shape: 'hexagon', border: 'dashed', ink: 'black', rot: 7, x: 64, y: 48 },
        { label: 'Market visa', place: 'Fair week only', bottom: 'Council of Aldermen', mark: 'none', shape: 'rounded', border: 'toothed', ink: 'red', rot: 2 },
      ),
    },
  },
  {
    id: 'brindle',
    name: 'Commonwealth of the Brindle Isles',
    blurb: 'An island chain where every journey starts with a ferry.',
    design: {
      state: { name: 'Commonwealth of the Brindle Isles', demonym: 'Brindle Islander' },
      cover: { colour: '#1c2c4c', foil: 'silver', emblem: 'anchor', titles: ['Passport', ''] },
      holder: { given: 'Tobin', surname: 'Greywater', born: { d: 6, m: 1, y: 1996 }, birthplace: 'Port Sorrel' },
      papers: { number: '7781350', authority: 'Isles Passport Service', portrait: { avatar: 'curls', skin: 'ebony', hair: 'black', clothes: 'navy' }, pattern: 'waves', paper: 'blue', ink: 'blue', seed: 77 },
      stamps: stamps(
        'Brindle Isles',
        { d: 19, m: 12, y: 2026 },
        { place: 'Port Sorrel Ferry', bottom: 'Isles Border Force', mark: 'ship', shape: 'oval', border: 'toothed', ink: 'blue', rot: -8, wear: 2 },
        { place: 'Lantern Quay', bottom: 'Isles Border Force', mark: 'ship', shape: 'oval', border: 'single', ink: 'red', rot: 5, wear: 3, x: 62, y: 46 },
        { place: 'All islands · 30 days', bottom: 'Isles Passport Service', mark: 'star', shape: 'circle', border: 'double', ink: 'green', rot: -2, wear: 0 },
      ),
    },
  },
  {
    id: 'dravenhold',
    name: 'People’s Republic of Dravenhold',
    blurb: 'Leaving takes paperwork too: an exit permit, in the Year of the Republic.',
    design: {
      state: { name: 'People’s Republic of Dravenhold', demonym: 'Dravenholder' },
      cover: { colour: '#7a1f2b', foil: 'gold', emblem: 'wheel', titles: ['Passport', 'Putevka'] },
      holder: { given: 'Marek', surname: 'Ostrander', born: { d: 17, m: 3, y: 41 }, birthplace: 'Ironwood' },
      papers: { number: '3300918', issued: { d: 5, m: 7, y: 78 }, years: 5, authority: 'Bureau of Travel Permits', portrait: { avatar: 'beard', skin: 'honey', hair: 'brown', clothes: 'charcoal' }, pattern: 'lattice', paper: 'rose', ink: 'brown', seed: 88 },
      card: { titles: ['Citizen’s card', ''] },
      calendar: yearOfTheRepublic,
      stamps: stamps(
        'Dravenhold',
        { d: 9, m: 7, y: 78 },
        { label: 'Returned', place: 'Ironwood Crossing', bottom: 'Frontier Bureau', mark: 'train', shape: 'rectangle', border: 'single', ink: 'black', rot: -2, dateStyle: 'numeric' },
        { label: 'Exit permit', place: 'Valid for one journey', bottom: 'Bureau of Travel Permits', mark: 'none', shape: 'rectangle', border: 'double', ink: 'red', rot: 3, dateStyle: 'numeric', x: 60, y: 48 },
        { place: 'Fraternal visit · 10 days', bottom: 'Frontier Bureau', mark: 'star', shape: 'hexagon', border: 'single', ink: 'red', rot: -4, dateStyle: 'numeric' },
      ),
    },
  },
  {
    id: 'heliara',
    name: 'Solar Dominion of Heliara',
    blurb: 'Ten months of thirty-six days, all named for the sun.',
    design: {
      state: { name: 'Solar Dominion of Heliara', demonym: 'Heliaran' },
      cover: { colour: '#6b3a1e', foil: 'gold', emblem: 'sun', titles: ['Passport', 'Soltessera'] },
      holder: { given: 'Isaura', surname: 'Emberly', born: { d: 30, m: 4, y: 512 }, birthplace: 'Highmoor' },
      papers: { number: '6124409', issued: { d: 1, m: 1, y: 540 }, years: 12, authority: 'Keeper of the Rolls', portrait: { avatar: 'scarf', skin: 'olive', hair: 'black', clothes: 'wine' }, pattern: 'rings', paper: 'ivory', ink: 'brown', seed: 101 },
      calendar: sunCount,
      stamps: stamps(
        'Heliara',
        { d: 12, m: 1, y: 540 },
        { place: 'Highmoor Pass', bottom: 'Wardens of the Road', mark: 'road', shape: 'circle', border: 'dotted', ink: 'red', rot: 9, dateStyle: 'long' },
        { place: 'Redwater Landing', bottom: 'Wardens of the Road', mark: 'ship', shape: 'circle', border: 'single', ink: 'black', rot: -6, dateStyle: 'long', x: 64, y: 50 },
        { place: 'Pilgrim · one season', bottom: 'Keeper of the Rolls', mark: 'star', shape: 'oval', border: 'double', ink: 'violet', rot: 1, dateStyle: 'long' },
      ),
    },
  },
  {
    id: 'arvel',
    name: 'Confederation of the High Cantons of Arvel',
    blurb: 'Mountain cantons, two official languages, and a long name that still fits.',
    design: {
      state: { name: 'Confederation of the High Cantons of Arvel', demonym: 'Arvelian' },
      cover: { colour: '#8c1c2c', foil: 'white', emblem: 'mountain', titles: ['Passport', 'Passeport'] },
      holder: { given: 'Linnea', surname: 'Fairbairn', born: { d: 19, m: 9, y: 1990 }, birthplace: 'Thornwick' },
      papers: { number: '8845012', authority: 'Federal Passport Bureau', portrait: { avatar: 'braids', skin: 'porcelain', hair: 'blond', clothes: 'wine' }, pattern: 'rosettes', paper: 'rose', ink: 'plum', seed: 120 },
      card: { titles: ['Identity card', 'Carte d’identité'] },
      stamps: stamps(
        'Arvel',
        { d: 19, m: 12, y: 2026 },
        { place: 'Thornwick Tunnel', bottom: 'Cantonal Police', mark: 'train', shape: 'rounded', border: 'double', ink: 'red', rot: -3 },
        { place: 'Highmoor Road', bottom: 'Cantonal Police', mark: 'road', shape: 'rounded', border: 'single', ink: 'blue', rot: 4, x: 62, y: 46 },
        { place: 'Seasonal work · 6 months', bottom: 'Federal Passport Bureau', mark: 'none', shape: 'rectangle', border: 'dashed', ink: 'green', rot: -1 },
      ),
    },
  },
  {
    id: 'lumeval',
    name: 'Principality of Lumeval',
    blurb: 'Small enough to walk across; proud enough to stamp you in and out.',
    design: {
      state: { name: 'Principality of Lumeval', demonym: 'Lumevalois' },
      cover: { colour: '#4a2545', foil: 'silver', emblem: 'tree', titles: ['Passport', ''] },
      holder: { given: 'Odalys', surname: 'Hartwell', born: { d: 3, m: 7, y: 1958 }, birthplace: 'Lumeval' },
      papers: { number: '0000312', authority: 'Office of the Prince', portrait: { avatar: 'elder', skin: 'umber', hair: 'white', clothes: 'sand' }, pattern: 'weave', paper: 'grey', ink: 'plum', seed: 133 },
      stamps: stamps(
        'Lumeval',
        { d: 19, m: 12, y: 2026 },
        { label: 'Welcome', place: 'The only road in', bottom: 'Princely Guard', mark: 'road', shape: 'shield', border: 'toothed', ink: 'violet', rot: -5 },
        { label: 'Farewell', place: 'The only road out', bottom: 'Princely Guard', mark: 'road', shape: 'shield', border: 'dotted', ink: 'violet', rot: 6, x: 66, y: 50 },
        { place: 'Day visit', bottom: 'Office of the Prince', mark: 'star', shape: 'circle', border: 'single', ink: 'red', rot: 3 },
      ),
    },
  },
  {
    id: 'tidewater',
    name: 'Tidewater League',
    blurb: 'A league of trading ports, where the stamp matters more than the cover.',
    design: {
      state: { name: 'Tidewater League', demonym: 'Leaguer' },
      cover: { colour: '#1f5a5a', foil: 'white', emblem: 'ship', titles: ['Sea pass', ''], chip: false },
      holder: { given: 'Aldren', surname: 'Coldharbour', born: { d: 27, m: 11, y: 1988 }, birthplace: 'Saltmarsh' },
      papers: { number: 'L-55180', years: 7, authority: 'League Factor at Saltmarsh', portrait: { avatar: 'short', skin: 'honey', hair: 'auburn', clothes: 'navy' }, pattern: 'rings', paper: 'blue', ink: 'slate', seed: 150 },
      card: { titles: ['Trader’s card', ''] },
      stamps: stamps(
        'Tidewater League',
        { d: 19, m: 12, y: 2026 },
        { label: 'Landed', place: 'Saltmarsh Roads', bottom: 'League Factor', mark: 'ship', shape: 'hexagon', border: 'toothed', ink: 'blue', rot: -7, wear: 2 },
        { label: 'Cleared', place: 'Coldharbour Mole', bottom: 'League Factor', mark: 'ship', shape: 'oval', border: 'double', ink: 'green', rot: 5, wear: 2, x: 62, y: 46 },
        { label: 'Trade visa', place: 'Cargo and crew', bottom: 'League Factor', mark: 'none', shape: 'rectangle', border: 'toothed', ink: 'black', rot: -2, wear: 1 },
      ),
    },
  },
];

/** A template's design is its changes laid over the opening design, then checked like any other input. */
function build(part: Part<Design>): Design {
  const base = defaultDesign() as unknown as Record<string, unknown>;
  const merged: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(part)) {
    const old = base[key];
    merged[key] = value && typeof value === 'object' && !Array.isArray(value) && old && typeof old === 'object' && !Array.isArray(old) ? mergeDeep(old as Record<string, unknown>, value as Record<string, unknown>) : value;
  }
  return cleanDesign(merged);
}

function mergeDeep(base: Record<string, unknown>, patch: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    const old = base[key];
    out[key] = value && typeof value === 'object' && !Array.isArray(value) && old && typeof old === 'object' && !Array.isArray(old) ? mergeDeep(old as Record<string, unknown>, value as Record<string, unknown>) : value;
  }
  return out;
}

export const templates: readonly Template[] = sets.map((set) => ({ id: set.id, name: set.name, blurb: set.blurb, design: build(set.design) }));

export const template = (id: string): Template | undefined => templates.find((t) => t.id === id);
