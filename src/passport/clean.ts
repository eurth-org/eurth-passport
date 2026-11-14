/**
 * Whatever arrives from a link or a file is someone else's input. cleanDesign takes any value and
 * gives back a design that is safe to draw: texts capped and stripped, colours and ids checked
 * against the closed lists, numbers clamped, dates made to exist, unknown keys dropped.
 */
import { cleanColour } from './colours';
import { cleanCalendar, cleanDate, dateStyles, type Calendar, type DateParts } from './dates';
import { breakLongRuns, isRealCountry, stripUnsafe } from './fiction';
import {
  DEFAULT_STATE_NAME,
  MAX_ROTATION,
  MAX_SEED,
  MAX_STAMPS,
  MAX_VALID_YEARS,
  MAX_WEAR,
  MIN_VALID_YEARS,
  avatarIds,
  clothesIds,
  defaultDesign,
  defaultStamp,
  emblemIds,
  foilIds,
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
  type Stamp,
  type StampKind,
} from './model';

type Bag = Record<string, unknown>;
const bag = (value: unknown): Bag => (value && typeof value === 'object' && !Array.isArray(value) ? (value as Bag) : {});

/**
 * Plain text for a document: no markup characters, no control or direction-override characters,
 * single spaces, no unbroken run long enough to pass for a machine-readable line, and at most
 * `max` characters. Trailing space is kept so that typing "Port of " isn't undone mid-word.
 */
export function cleanText(value: unknown, max: number, fallback = ''): string {
  if (typeof value !== 'string') return fallback;
  const plain = stripUnsafe(value.normalize('NFC'))
    .replace(/\s+/g, ' ')
    .replace(/^ /, '');
  return Array.from(breakLongRuns(plain)).slice(0, max).join('');
}

/** A document number: capital letters, digits, spaces and hyphens. */
export function cleanNumber(value: unknown, fallback = ''): string {
  if (typeof value !== 'string') return fallback;
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9 -]/g, '')
    .replace(/\s+/g, ' ')
    .trimStart()
    .slice(0, limits.number);
}

export function clamp(value: unknown, min: number, max: number, fallback: number): number {
  const v = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN;
  return Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;
}

export const whole = (value: unknown, min: number, max: number, fallback: number): number => Math.round(clamp(value, min, max, fallback));

export function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

/**
 * The issuing state's name. A real country's name is turned away and the fallback stands in:
 * Passport is for countries that don't exist.
 */
export function cleanStateName(value: unknown, fallback = DEFAULT_STATE_NAME): string {
  const name = cleanText(value, limits.stateName);
  return name.trim() && !isReal(value, name) ? name : fallback;
}

/** Whether a text is a real country's name, as typed in full or as it reads once cut to length. */
function isReal(value: unknown, shown: string): boolean {
  return isRealCountry(shown) || isRealCountry(cleanText(value, 200));
}

/**
 * Text for a place on a document where the issuer speaks: a title, an authority, a stamp's own
 * lines. A real country's name on its own is turned away there too, and the fallback stands in.
 * (A holder may still be called Jordan, or born in a town called Georgia.)
 */
export function cleanIssuerText(value: unknown, max: number, fallback = ''): string {
  const text = cleanText(value, max, fallback);
  return isReal(value, text) ? fallback : text;
}

function cleanTitles(value: unknown, fallback: [string, string]): [string, string] {
  const list = Array.isArray(value) ? value : [];
  const first = cleanIssuerText(list[0], limits.title);
  return [first.trim() ? first : fallback[0], cleanIssuerText(list[1], limits.title)];
}

export function cleanStamp(value: unknown, calendar: Calendar | null, fallbackKind: StampKind = 'entry'): Stamp {
  const o = bag(value);
  const kind = pick(o.kind, stampKinds, fallbackKind);
  const base = defaultStamp(kind);
  return {
    kind,
    shape: pick(o.shape, stampShapes, base.shape),
    border: pick(o.border, stampBorders, base.border),
    // A stamp can't claim a real country either.
    top: cleanIssuerText(o.top, limits.stampLine, base.top),
    label: cleanIssuerText(o.label, limits.stampLabel, base.label),
    place: cleanText(o.place, limits.stampLine, base.place),
    bottom: cleanIssuerText(o.bottom, limits.stampLine, base.bottom),
    date: cleanDate(o.date, calendar, base.date),
    dateStyle: pick(o.dateStyle, dateStyles, base.dateStyle),
    mark: pick(o.mark, stampMarks, base.mark),
    ink: pick(o.ink, stampInkIds, base.ink),
    rot: Math.round(clamp(o.rot, -MAX_ROTATION, MAX_ROTATION, base.rot) * 10) / 10,
    wear: whole(o.wear, 0, MAX_WEAR, base.wear),
    x: whole(o.x, 0, 100, base.x),
    y: whole(o.y, 0, 100, base.y),
    seed: whole(o.seed, 0, MAX_SEED, base.seed),
  };
}

/** Any value, made into a design that is safe to draw. */
export function cleanDesign(value: unknown): Design {
  const o = bag(value);
  const base = defaultDesign();
  const calendar = cleanCalendar(o.calendar);
  const date = (v: unknown, fallback: DateParts): DateParts => cleanDate(v, calendar, fallback);

  const state = bag(o.state);
  const cover = bag(o.cover);
  const holder = bag(o.holder);
  const papers = bag(o.papers);
  const portrait = bag(papers.portrait);
  const card = bag(o.card);
  const stamps = Array.isArray(o.stamps) ? o.stamps.slice(0, MAX_STAMPS).map((s) => cleanStamp(s, calendar)) : base.stamps.map((s) => cleanStamp(s, calendar));

  return {
    state: {
      name: cleanStateName(state.name, base.state.name),
      demonym: cleanText(state.demonym, limits.demonym, base.state.demonym),
    },
    cover: {
      colour: cleanColour(cover.colour, base.cover.colour),
      foil: pick(cover.foil, foilIds, base.cover.foil),
      emblem: pick(cover.emblem, emblemIds, base.cover.emblem),
      arms: cover.arms === true,
      titles: cleanTitles(cover.titles, base.cover.titles),
      chip: cover.chip !== false,
    },
    holder: {
      given: cleanText(holder.given, limits.given, base.holder.given),
      surname: cleanText(holder.surname, limits.surname, base.holder.surname),
      born: date(holder.born, base.holder.born),
      birthplace: cleanText(holder.birthplace, limits.place, base.holder.birthplace),
    },
    papers: {
      number: cleanNumber(papers.number, base.papers.number),
      issued: date(papers.issued, base.papers.issued),
      years: whole(papers.years, MIN_VALID_YEARS, MAX_VALID_YEARS, base.papers.years),
      authority: cleanIssuerText(papers.authority, limits.authority, base.papers.authority),
      portrait: {
        avatar: pick(portrait.avatar, avatarIds, base.papers.portrait.avatar),
        skin: pick(portrait.skin, skinIds, base.papers.portrait.skin),
        hair: pick(portrait.hair, hairIds, base.papers.portrait.hair),
        clothes: pick(portrait.clothes, clothesIds, base.papers.portrait.clothes),
      },
      pattern: pick(papers.pattern, patternIds, base.papers.pattern),
      paper: pick(papers.paper, paperIds, base.papers.paper),
      ink: pick(papers.ink, printInkIds, base.papers.ink),
      seed: whole(papers.seed, 0, MAX_SEED, base.papers.seed),
    },
    card: { titles: cleanTitles(card.titles, base.card.titles) },
    stamps,
    calendar,
  };
}
