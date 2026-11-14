/**
 * A set of papers, as data: the state that issues them, the passport's cover, the holder, what
 * the data page and the identity card share, and the stamps. One design draws every document.
 *
 * Everything that could be a list is a closed one. A portrait is an id, never a picture; there is
 * no field for SPECIMEN, because it isn't a choice (see fiction.ts).
 */
import type { Calendar, DateParts, DateStyle } from './dates';

export const emblemIds = ['star', 'sun', 'tree', 'mountain', 'anchor', 'lantern', 'wheel', 'wreath', 'crown', 'key', 'ship', 'compass'] as const;
export type EmblemId = (typeof emblemIds)[number];

export const foilIds = ['gold', 'silver', 'white'] as const;
export type FoilId = (typeof foilIds)[number];

export const paperIds = ['ivory', 'blue', 'green', 'rose', 'grey'] as const;
export type PaperId = (typeof paperIds)[number];

export const printInkIds = ['blue', 'green', 'plum', 'brown', 'slate'] as const;
export type PrintInkId = (typeof printInkIds)[number];

export const patternIds = ['waves', 'rosettes', 'lattice', 'rings', 'weave', 'none'] as const;
export type PatternId = (typeof patternIds)[number];

export const avatarIds = ['short', 'bob', 'long', 'curls', 'bun', 'beard', 'glasses', 'scarf', 'cap', 'braids', 'elder', 'ponytail'] as const;
export type AvatarId = (typeof avatarIds)[number];

export const skinIds = ['porcelain', 'fair', 'honey', 'olive', 'umber', 'ebony'] as const;
export type SkinId = (typeof skinIds)[number];

export const hairIds = ['black', 'brown', 'auburn', 'blond', 'grey', 'white'] as const;
export type HairId = (typeof hairIds)[number];

export const clothesIds = ['navy', 'forest', 'wine', 'charcoal', 'sand'] as const;
export type ClothesId = (typeof clothesIds)[number];

export const stampKinds = ['visa', 'entry', 'exit'] as const;
export type StampKind = (typeof stampKinds)[number];

export const stampShapes = ['circle', 'oval', 'rectangle', 'rounded', 'hexagon', 'shield'] as const;
export type StampShape = (typeof stampShapes)[number];

export const stampBorders = ['single', 'double', 'dashed', 'dotted', 'toothed'] as const;
export type StampBorder = (typeof stampBorders)[number];

export const stampMarks = ['none', 'ship', 'aircraft', 'train', 'road', 'star'] as const;
export type StampMark = (typeof stampMarks)[number];

export const stampInkIds = ['blue', 'black', 'red', 'green', 'violet'] as const;
export type StampInkId = (typeof stampInkIds)[number];

/** The longest each text may be, in characters. */
export const limits = {
  stateName: 60,
  demonym: 40,
  title: 30,
  given: 40,
  surname: 40,
  place: 40,
  number: 12,
  authority: 40,
  stampLine: 30,
  stampLabel: 16,
} as const;

export const MAX_STAMPS = 12;
export const MIN_VALID_YEARS = 1;
export const MAX_VALID_YEARS = 20;
export const MAX_ROTATION = 15;
export const MAX_WEAR = 3;
export const MAX_SEED = 999999;

export interface State {
  /** The state's formal name, as on the cover: "Republic of Teland". */
  name: string;
  /** What its people are called, for the nationality field: "Telandic". */
  demonym: string;
}

export interface Cover {
  /** Any colour. The mock-up's are in colours.ts. */
  colour: string;
  foil: FoilId;
  /** One of our own emblems. */
  emblem: EmblemId;
  /** Use the profile's arms in place of the emblem, when a profile with usable arms is loaded. */
  arms: boolean;
  /** The document's name in up to two languages. The second may be empty. */
  titles: [string, string];
  chip: boolean;
}

export interface Holder {
  given: string;
  surname: string;
  born: DateParts;
  birthplace: string;
}

export interface Portrait {
  avatar: AvatarId;
  skin: SkinId;
  hair: HairId;
  clothes: ClothesId;
}

/** What the data page and the identity card have in common. */
export interface Papers {
  /** Letters, digits, spaces and hyphens. */
  number: string;
  issued: DateParts;
  /** How many years the document is valid; the expiry date follows from it. */
  years: number;
  authority: string;
  portrait: Portrait;
  pattern: PatternId;
  paper: PaperId;
  ink: PrintInkId;
  /** Shapes the security pattern. */
  seed: number;
}

export interface Card {
  /** The card's name in up to two languages. */
  titles: [string, string];
}

export interface Stamp {
  kind: StampKind;
  shape: StampShape;
  border: StampBorder;
  /** Usually the state. */
  top: string;
  /** The big word: VISA, ENTRY, EXIT, or your own. */
  label: string;
  /** A port, a crossing, or what the visa allows. */
  place: string;
  /** Usually the office. */
  bottom: string;
  date: DateParts;
  dateStyle: DateStyle;
  mark: StampMark;
  ink: StampInkId;
  /** Degrees, a few either way. */
  rot: number;
  /** 0 is a crisp stamp, 3 a tired one. */
  wear: number;
  /** Where it sits on the visa page, in per cent of the page. */
  x: number;
  y: number;
  /** Shapes the wear. */
  seed: number;
}

export interface Design {
  state: State;
  cover: Cover;
  holder: Holder;
  papers: Papers;
  card: Card;
  stamps: Stamp[];
  /** The world's own calendar, or null for a plain one. */
  calendar: Calendar | null;
}

/** Which document to draw. */
export type DocumentRef =
  | { kind: 'cover' }
  | { kind: 'data' }
  | { kind: 'cardFront' }
  | { kind: 'cardBack' }
  | { kind: 'stamp'; index: number }
  | { kind: 'visaPage' };

export const documentNames: Record<DocumentRef['kind'], string> = {
  cover: 'Passport cover',
  data: 'Passport data page',
  cardFront: 'Identity card, front',
  cardBack: 'Identity card, back',
  stamp: 'Stamp',
  visaPage: 'Visa page',
};

export const stampKindNames: Record<StampKind, string> = { visa: 'Visa stamp', entry: 'Entry stamp', exit: 'Exit stamp' };

export const DEFAULT_STATE_NAME = 'Republic of Teland';

const defaultDate: DateParts = { d: 19, m: 12, y: 2026 };

/** A fresh stamp of a kind, in the mock-up state's name. */
export function defaultStamp(kind: StampKind): Stamp {
  const shared = { top: 'Teland', date: { ...defaultDate }, dateStyle: 'short' as DateStyle, seed: 7 };
  switch (kind) {
    case 'visa':
      return { ...shared, kind, shape: 'rectangle', border: 'double', label: 'Visa', place: 'Single entry · 90 days', bottom: 'Consular Service', mark: 'star', ink: 'green', rot: -3, wear: 1, x: 44, y: 76, seed: 11 };
    case 'exit':
      return { ...shared, kind, shape: 'hexagon', border: 'single', label: 'Exit', place: 'Selun Airfield', bottom: 'Border Guard', mark: 'aircraft', ink: 'red', rot: 5, wear: 2, x: 68, y: 46, seed: 23 };
    default:
      return { ...shared, kind: 'entry', shape: 'circle', border: 'double', label: 'Entry', place: 'Port of Selun', bottom: 'Border Guard', mark: 'ship', ink: 'blue', rot: -7, wear: 1, x: 32, y: 22 };
  }
}

/** The papers the tool opens with: the mock-up's Republic of Teland. */
export function defaultDesign(): Design {
  return {
    state: { name: DEFAULT_STATE_NAME, demonym: 'Telandic' },
    cover: { colour: '#5b1a28', foil: 'gold', emblem: 'star', arms: false, titles: ['Passport', ''], chip: true },
    holder: { given: 'Liane', surname: 'Ashdale', born: { d: 14, m: 3, y: 1991 }, birthplace: 'Selun' },
    papers: {
      number: '0447192',
      issued: { ...defaultDate },
      years: 10,
      authority: 'Ministry of the Interior',
      portrait: { avatar: 'bob', skin: 'honey', hair: 'brown', clothes: 'navy' },
      pattern: 'waves',
      paper: 'ivory',
      ink: 'blue',
      seed: 1,
    },
    card: { titles: ['Identity card', ''] },
    stamps: [defaultStamp('entry'), defaultStamp('exit'), defaultStamp('visa')],
    calendar: null,
  };
}
