/**
 * The Eurth profile: one file that carries a nation from tool to tool. Passport owns the
 * `passport` section and writes nothing else. It reads `identity` (names), `arms` (for the
 * cover), `names` (for the holder) and `calendar` (for dates), and leaves every other section,
 * and every key it doesn't know, exactly as it found them.
 *
 * These are plain functions over plain objects. Checking a file against the schema, and loading
 * and saving it, belong to @eurth/profile; the site calls that first and then these.
 */
import { cleanColour } from './colours';
import { cleanCalendar, type Calendar } from './dates';
import { cleanDesign, cleanStamp, cleanText } from './clean';
import { summarise } from './describe';
import { ARMS_NOTE, MAX_SVG_LENGTH, REAL_COUNTRY_NOTE, isRealCountry, vectorOnly } from './fiction';
import { compactDesign, designLink, expandDesign, fromLink } from './link';
import { defaultDesign, limits, type Design } from './model';
import { generateHolder, type NameLists } from './names';
import { hashText } from './random';
import { armsUsed, renderCover } from './render';

type Bag = Record<string, unknown>;
const bag = (value: unknown): Bag => (value && typeof value === 'object' && !Array.isArray(value) ? (value as Bag) : {});

/** What Passport takes from a profile. */
export interface ProfileFacts {
  /** The state's name for the cover, or null when the profile gives none Passport will print. */
  stateName: string | null;
  /** The short, everyday name, for stamps. */
  commonName: string | null;
  demonym: string | null;
  capital: string | null;
  /** The profile's arms, if they are there and are pure vector drawing. */
  arms: string | null;
  names: NameLists | null;
  calendar: Calendar | null;
  /** The papers saved in the profile, if there are any that can be read. */
  saved: Design | null;
  /** The cover colour the profile records, when there is no saved design to take it from. */
  colour: string | null;
  /** Things to tell the person, kindly. */
  notes: string[];
}

const textOrNull = (value: unknown, max: number): string | null => cleanText(value, max).trim() || null;

/** Reads what Passport needs from a profile. Takes anything; never throws. */
export function readProfile(profile: unknown): ProfileFacts {
  const p = bag(profile);
  const meta = bag(p.meta);
  const identity = bag(p.identity);
  const arms = bag(p.arms);
  const names = bag(p.names);
  const passport = bag(p.passport);
  const notes: string[] = [];

  const candidates = [identity.officialName, identity.commonName, meta.nation].map((n) => textOrNull(n, limits.stateName)).filter((n): n is string => n !== null);
  const stateName = candidates.find((n) => !isRealCountry(n)) ?? null;
  if (candidates.length && candidates.some(isRealCountry)) notes.push(REAL_COUNTRY_NOTE);
  const common = [identity.commonName, meta.nation].map((n) => textOrNull(n, limits.stampLine)).find((n) => n !== null && !isRealCountry(n)) ?? null;

  const hasArms = typeof arms.svg === 'string' && arms.svg.length > 0;
  const usable = hasArms && vectorOnly(arms.svg);
  if (hasArms && !usable) notes.push(ARMS_NOTE);

  const lists: NameLists = {
    people: Array.isArray(names.people) ? names.people : [],
    surnames: Array.isArray(names.surnames) ? names.surnames : [],
    places: Array.isArray(names.places) ? names.places : [],
  };
  const hasNames = [lists.people, lists.surnames, lists.places].some((list) => (list?.length ?? 0) > 0);

  const saved = isPlain(passport.design) ? expandDesign(passport.design) : fromLink(passport.link);

  return {
    stateName,
    commonName: common,
    demonym: textOrNull(identity.demonym, limits.demonym),
    capital: textOrNull(identity.capital, limits.place),
    arms: usable ? (arms.svg as string) : null,
    names: hasNames ? lists : null,
    calendar: cleanCalendar(p.calendar),
    saved,
    colour: typeof passport.colour === 'string' && /^#[0-9A-Fa-f]{6}$/.test(passport.colour) ? cleanColour(passport.colour) : null,
    notes,
  };
}

function isPlain(value: unknown): value is Bag {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * The papers for a loaded profile. If the profile holds papers saved by Passport, those come
 * back as they were. Otherwise the opening design is dressed in the nation's own name, arms,
 * calendar and names, with a new invented holder.
 */
export function designFromProfile(profile: unknown): { design: Design; facts: ProfileFacts } {
  const facts = readProfile(profile);
  if (facts.saved) return { design: facts.saved, facts };

  const base = defaultDesign();
  const calendar = facts.calendar;
  const short = facts.commonName ?? base.stamps[0]!.top;
  const seed = hashText(facts.stateName ?? facts.commonName ?? 'passport');
  const draft: Design = {
    ...base,
    state: { name: facts.stateName ?? base.state.name, demonym: facts.demonym ?? (facts.stateName ? '' : base.state.demonym) },
    cover: { ...base.cover, colour: facts.colour ?? base.cover.colour, arms: facts.arms !== null },
    calendar,
    stamps: base.stamps.map((stamp) => ({ ...stamp, top: short, place: facts.capital && stamp.kind !== 'visa' ? facts.capital : stamp.place })),
  };
  // Dates are made to exist in the nation's calendar before a holder is born into it.
  const settled = cleanDesign(draft);
  const holder = generateHolder(seed, { names: facts.names, calendar, issued: settled.papers.issued, capital: facts.capital ?? undefined });
  return { design: cleanDesign({ ...settled, holder, stamps: settled.stamps.map((s) => cleanStamp(s, calendar, s.kind)) }), facts };
}

export interface SectionOptions {
  /** The profile's arms, so the cover picture in the section shows them when the design asks. */
  arms?: string | null;
}

/**
 * What Passport writes into the profile's `passport` section (without `updated`, which is
 * stamped when the section is set): the link that brings the whole design back, a summary, the
 * cover's colour, the document's title and the cover as a picture. A design too big for a link
 * travels in the section itself, under `design`.
 */
export function passportSection(design: Design, options: SectionOptions = {}): Record<string, unknown> {
  const clean = cleanDesign(design);
  const { url, fits } = designLink(clean);
  const used = armsUsed(clean, options);
  const section: Bag = {};
  if (fits) section.link = url;
  section.summary = summarise(clean, { armsUsed: used });
  section.colour = clean.cover.colour;
  section.title = clean.cover.titles[0].trim();
  const cover = renderCover(clean, { arms: options.arms, idPrefix: 'cover' });
  if (cover.length <= MAX_SVG_LENGTH) section.svg = cover;
  if (!fits) section.design = compactDesign(clean);
  return section;
}

export interface WriteOptions extends SectionOptions {
  now?: Date;
}

/**
 * A new profile with the `passport` section set and both dates stamped. Every other section and
 * every unknown key is the same value in the same place; keys in the old section that this
 * version doesn't know are kept too. The profile passed in is not changed.
 */
export function withPassport<P extends Record<string, unknown>>(profile: P, design: Design, options: WriteOptions = {}): P {
  const updated = (options.now ?? new Date()).toISOString();
  const old = bag(profile.passport);
  const section = passportSection(design, options);
  const next: Bag = { ...old, ...section, updated };
  // A design that now fits its link no longer needs to travel in the section, and the reverse.
  if (!('design' in section)) delete next.design;
  if (!('link' in section)) delete next.link;
  if (!('svg' in section)) delete next.svg;
  return { ...profile, meta: { ...bag(profile.meta), updated }, passport: next } as P;
}
