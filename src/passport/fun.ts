/**
 * The easter egg: a visa for the Moon gets a second stamp from a thoughtful official.
 */
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
