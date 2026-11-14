/**
 * Dates. A fictional world may keep its own calendar, so a date here is a day, a month and a year
 * in whatever calendar the design carries: the profile's, with its own month names and era, or a
 * plain twelve-month one. Nothing is converted between calendars.
 */
import { breakLongRuns, stripUnsafe } from './fiction';

export interface Month {
  name: string;
  days: number;
}

export interface Calendar {
  months: Month[];
  /** Written after the year, for example "FS" in "1022 FS". May be empty. */
  era: string;
}

export interface DateParts {
  /** Day of the month, from 1. */
  d: number;
  /** Month, from 1. */
  m: number;
  y: number;
}

export const dateStyles = ['long', 'short', 'numeric'] as const;
export type DateStyle = (typeof dateStyles)[number];

export const MAX_MONTHS = 40;
export const MAX_MONTH_NAME = 30;
export const MAX_ERA = 8;
export const MIN_YEAR = -9999;
export const MAX_YEAR = 99999;

/** The calendar used when a design has none of its own. February takes a leap day in its stride. */
export const plainCalendar: Calendar = {
  months: [
    { name: 'January', days: 31 },
    { name: 'February', days: 29 },
    { name: 'March', days: 31 },
    { name: 'April', days: 30 },
    { name: 'May', days: 31 },
    { name: 'June', days: 30 },
    { name: 'July', days: 31 },
    { name: 'August', days: 31 },
    { name: 'September', days: 30 },
    { name: 'October', days: 31 },
    { name: 'November', days: 30 },
    { name: 'December', days: 31 },
  ],
  era: '',
};

const whole = (value: unknown, min: number, max: number, fallback: number): number => {
  // Only a number, or text that is one, counts: null and "" are not zero.
  const v = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN;
  return Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : fallback;
};

// The same rules as every other text on a document (see cleanText in clean.ts).
const plainText = (value: unknown, max: number): string =>
  typeof value === 'string'
    ? Array.from(breakLongRuns(stripUnsafe(value.normalize('NFC')).replace(/\s+/g, ' ').trim()))
        .slice(0, max)
        .join('')
    : '';

/**
 * A calendar from anything: a design's own, or the profile's `calendar` section (which has
 * `months` with `name` and maybe `days`, and `era`). Null when it names no months.
 */
export function cleanCalendar(value: unknown): Calendar | null {
  if (!value || typeof value !== 'object') return null;
  const o = value as Record<string, unknown>;
  const months = (Array.isArray(o.months) ? o.months : [])
    .slice(0, MAX_MONTHS)
    .map((entry): Month | null => {
      const month = (entry && typeof entry === 'object' ? entry : {}) as Record<string, unknown>;
      const name = plainText(month.name, MAX_MONTH_NAME);
      return name ? { name, days: whole(month.days, 1, 1000, 30) } : null;
    })
    .filter((month): month is Month => month !== null);
  if (!months.length) return null;
  return { months, era: plainText(o.era, MAX_ERA) };
}

export const calendarOf = (calendar: Calendar | null | undefined): Calendar => calendar ?? plainCalendar;

/** A date from anything, made to exist in the calendar. */
export function cleanDate(value: unknown, calendar: Calendar | null, fallback: DateParts): DateParts {
  const cal = calendarOf(calendar);
  const o = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  const m = whole(o.m, 1, cal.months.length, Math.min(fallback.m, cal.months.length));
  const days = cal.months[m - 1]!.days;
  return { d: whole(o.d, 1, days, Math.min(fallback.d, days)), m, y: whole(o.y, MIN_YEAR, MAX_YEAR, fallback.y) };
}

/** The same day so many years on (or back), kept inside the calendar. */
export function addYears(date: DateParts, years: number, calendar: Calendar | null): DateParts {
  return cleanDate({ ...date, y: date.y + years }, calendar, date);
}

const two = (value: number): string => String(value).padStart(2, '0');

/**
 * A date as it is written on a document.
 * long: "14 Frostwane 1022 LR"; short: "14 FRO 1022 LR"; numeric: "14.01.1022".
 */
export function formatDate(date: DateParts, calendar: Calendar | null, style: DateStyle = 'long'): string {
  const cal = calendarOf(calendar);
  const month = cal.months[Math.min(cal.months.length, Math.max(1, date.m)) - 1]!;
  const era = cal.era ? ` ${cal.era}` : '';
  if (style === 'numeric') return `${two(date.d)}.${two(date.m)}.${date.y}`;
  if (style === 'short') return `${two(date.d)} ${Array.from(month.name).slice(0, 3).join('').toUpperCase()} ${date.y}${era}`;
  return `${date.d} ${month.name} ${date.y}${era}`;
}

/** Whether a comes before b. */
export function isBefore(a: DateParts, b: DateParts): boolean {
  return a.y !== b.y ? a.y < b.y : a.m !== b.m ? a.m < b.m : a.d < b.d;
}
