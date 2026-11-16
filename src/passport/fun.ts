/**
 * The easter eggs. A visa for the Moon gets a second stamp from a thoughtful official. And a
 * visitor who names their state Arstotzka, after the border post in the game Papers, Please, is
 * greeted the way its inspector would be.
 */
import { normaliseName } from './fiction';
import type { Stamp } from './model';

export const MOON_STAMP_TEXT = 'Bring a jacket.';

const moon = /(?:^|[^a-z])(?:moon|luna|lunar)(?:[^a-z]|$)/i;

/** Whether a stamp is a visa for the Moon: a visa that names it on any of its lines. */
export function isMoonVisa(stamp: Stamp): boolean {
  return stamp.kind === 'visa' && [stamp.top, stamp.label, stamp.place, stamp.bottom].some((line) => moon.test(line));
}

/** Whether any of a design's stamps earns the jacket. */
export function hasMoonVisa(stamps: readonly Stamp[]): boolean {
  return stamps.some(isMoonVisa);
}

/** Said once, when the issuing state turns out to be Arstotzka. */
export const ARSTOTZKA_TEXT = 'Glory to Arstotzka. Papers, please.';

/** Whether a state's name is Arstotzka's: the word itself, with or without a form of state around it. */
export function isArstotzka(name: string): boolean {
  return /(?:^| )arstotzka(?: |$)/.test(normaliseName(name));
}
