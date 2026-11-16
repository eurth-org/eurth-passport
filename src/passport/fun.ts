/**
 * The easter eggs. A visa for the Moon gets a second stamp from a thoughtful official. And a
 * visitor who names their state Arstotzka, after the border post in the game Papers, Please, is
 * greeted the way its inspector would be: their cover turns black with its emblem stamped in
 * red, and the whole page goes dark, colourless and square, set in a pixel typeface.
 * The game's own emblem and look are its maker's: nothing of them is drawn or copied here.
 */
import { contrast } from './colours';
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

/** What an Arstotzkan cover is dressed in the moment the name is typed: black, with our own star. */
export const ARSTOTZKA_COVER = { colour: '#1a1a1a', emblem: 'star' } as const;
/** And what its emblem is stamped in, wherever that can be read. */
export const ARSTOTZKA_RED = '#d2382f';

// Arstotzka, Arstotzkan, Arstotska, Arstozka, Arztotzka and the like, as a word of its own.
const arstotzka = /(?:^| )ar[sz]t[ao][tszc]{1,3}[kc][a-z]*(?: |$)/;
// The same in Cyrillic. Named by number, so the letters can't be mistaken for Latin ones in this file.
const cyrillic = [0x430, 0x440, 0x441, 0x442, 0x43e, 0x446, 0x43a].map((code) => String.fromCodePoint(code)).join('');

/**
 * Whether a state's name is Arstotzka's, in any of the ways people write it: the word itself or
 * a near spelling of it, alone or with a form of state around it, or as the name of its people.
 */
export function isArstotzka(name: string): boolean {
  return arstotzka.test(normaliseName(name)) || name.toLowerCase().includes(cyrillic);
}

/**
 * The colour an Arstotzkan cover's emblem is stamped in: red, where red can be read on the cover
 * (3:1 or better). The lettering keeps the foil that was chosen. Null for every other state,
 * and for an Arstotzkan cover too pale or too red for it.
 */
export function arstotzkaInk(name: string, cover: string): string | null {
  return isArstotzka(name) && contrast(ARSTOTZKA_RED, cover) >= 3 ? ARSTOTZKA_RED : null;
}
