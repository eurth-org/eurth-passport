/**
 * The holder: an invented person. Names come from the profile's `names` section when it has
 * some, and otherwise from the lists below, which belong to no real place. The same seed always
 * gives the same person.
 */
import { addYears, calendarOf, cleanDate, type Calendar, type DateParts } from './dates';
import { cleanText } from './clean';
import { limits, type Holder } from './model';
import { rng } from './random';

export const givenNames: readonly string[] = [
  'Aerin', 'Aldren', 'Bram', 'Brisa', 'Cato', 'Corin', 'Dalia', 'Edric', 'Elowen', 'Fenna', 'Garrick', 'Hesper',
  'Ilsa', 'Joren', 'Kaela', 'Liane', 'Maud', 'Nerys', 'Orin', 'Petra', 'Quill', 'Rowan', 'Sabine', 'Tobin',
  'Ulla', 'Vanko', 'Wren', 'Ysolde', 'Zarek', 'Alaric', 'Mirela', 'Tamsin', 'Osric', 'Linnea', 'Davor', 'Isaura',
  'Kestrel', 'Marek', 'Odalys', 'Rurik',
];

export const surnames: readonly string[] = [
  'Ashdale', 'Brackwater', 'Corvane', 'Dunmarrow', 'Eskerholt', 'Fenwright', 'Galloway', 'Holloway', 'Ironwood', 'Kalluna', 'Larkenfold', 'Maravel',
  'Norrow', 'Okonmere', 'Pellam', 'Quillon', 'Rookwood', 'Sorrel', 'Tarn', 'Underhill', 'Varenko', 'Wynmere', 'Yarrow', 'Zelenko',
  'Thistlewood', 'Marlowe', 'Hartwell', 'Skerry', 'Vantross', 'Bellweather', 'Coldharbour', 'Drummond', 'Emberly', 'Fairbairn', 'Greywater', 'Hollin',
  'Kettering', 'Lindqvist', 'Morrowby', 'Ostrander',
];

export const places: readonly string[] = [
  'Selun', 'Haldermouth', 'Wynmere', 'Tarrowby', 'Marrowgate', 'Eskerholt', 'Corvane', 'Larkenfold', 'Dunmarrow', 'Brackwater',
  'Port Sorrel', 'Greywater', 'Lantern Quay', 'Fenmouth', 'Highmoor', 'Saltmarsh', 'Coldharbour', 'Redwater', 'Thornwick', 'Oldbridge',
];

export interface NameLists {
  people?: readonly unknown[];
  surnames?: readonly unknown[];
  places?: readonly unknown[];
}

const usable = (list: readonly unknown[] | undefined, max: number): string[] =>
  (Array.isArray(list) ? list : [])
    .slice(0, 200)
    .map((entry) => cleanText(entry, max).trim())
    .filter((entry) => entry.length > 0);

export interface HolderOptions {
  /** The profile's `names` section, or part of one. A list that is missing or empty falls back to ours. */
  names?: NameLists | null;
  calendar?: Calendar | null;
  /** The date the document is issued: the holder is 18 to 70 years old on it. */
  issued: DateParts;
  /** Used as the birthplace when the profile names no places. */
  capital?: string;
}

/** An invented holder. The same seed and options always give the same one. */
export function generateHolder(seed: number, options: HolderOptions): Holder {
  const random = rng(seed);
  const calendar = calendarOf(options.calendar);
  const own = options.names ?? {};
  const people = usable(own.people, limits.given);
  const family = usable(own.surnames, limits.surname);
  const towns = usable(own.places, limits.place);
  const capital = cleanText(options.capital, limits.place).trim();

  const given = random.pick(people.length ? people : givenNames);
  const surname = random.pick(family.length ? family : surnames);
  const birthplace = random.pick(towns.length ? towns : capital ? [capital] : places);
  const m = random.int(1, calendar.months.length);
  const d = random.int(1, calendar.months[m - 1]!.days);
  const age = random.int(18, 70);
  const born = cleanDate({ d, m, y: addYears(options.issued, -age, options.calendar ?? null).y }, options.calendar ?? null, options.issued);
  return { given, surname, born, birthplace };
}

/** A document number that looks like nothing in particular: seven digits. */
export function generateNumber(seed: number): string {
  const random = rng(seed ^ 0x5bd1e995);
  return String(random.int(0, 9999999)).padStart(7, '0');
}
