/**
 * Colours: the closed lists a document draws from, and the sums for contrast and naming.
 * Every list entry has a name, because the tool never tells colours apart by colour alone.
 */
export interface Named<Id extends string = string> {
  id: Id;
  name: string;
  hex: string;
}

/** Cover colours from the mock-up, plus green. A cover may also take any other colour. */
export const coverColours = [
  { id: 'burgundy', name: 'Burgundy', hex: '#5b1a28' },
  { id: 'navy', name: 'Navy', hex: '#1c2c4c' },
  { id: 'black', name: 'Black', hex: '#1a1a1a' },
  { id: 'green', name: 'Green', hex: '#1d4a36' },
] as const satisfies readonly Named[];

/** What the cover's lettering and emblem are stamped in. */
export const foils = [
  { id: 'gold', name: 'Gold', hex: '#e8c46a' },
  { id: 'silver', name: 'Silver', hex: '#d5d9dc' },
  { id: 'white', name: 'White', hex: '#f7f3e8' },
] as const satisfies readonly Named[];

/** Paper tints for the data page, the card and the visa page. All pale, so SPECIMEN always shows. */
export const papers = [
  { id: 'ivory', name: 'Ivory', hex: '#f6efdc' },
  { id: 'blue', name: 'Pale blue', hex: '#dfeaf3' },
  { id: 'green', name: 'Pale green', hex: '#e1eedf' },
  { id: 'rose', name: 'Rose', hex: '#f3e1e2' },
  { id: 'grey', name: 'Pale grey', hex: '#e9ebec' },
] as const satisfies readonly Named[];

/** Printing inks for labels and the security pattern. All dark, so labels can be read. */
export const printInks = [
  { id: 'blue', name: 'Blue', hex: '#1b4f7c' },
  { id: 'green', name: 'Green', hex: '#1f5c3d' },
  { id: 'plum', name: 'Plum', hex: '#6a2c5a' },
  { id: 'brown', name: 'Brown', hex: '#6b4423' },
  { id: 'slate', name: 'Slate', hex: '#3d4852' },
] as const satisfies readonly Named[];

/** Stamp-pad inks. */
export const stampInks = [
  { id: 'blue', name: 'Blue', hex: '#1f4e9c' },
  { id: 'black', name: 'Black', hex: '#222222' },
  { id: 'red', name: 'Red', hex: '#b3261e' },
  { id: 'green', name: 'Green', hex: '#1e6b3a' },
  { id: 'violet', name: 'Violet', hex: '#5b2a86' },
] as const satisfies readonly Named[];

/** The colour of the SPECIMEN overprint. Not a setting. */
export const SPECIMEN_RED = '#b3261e';
/** Body text on paper. */
export const TEXT_DARK = '#1f2428';

export function hexOf<T extends Named>(list: readonly T[], id: string): string {
  return (list.find((entry) => entry.id === id) ?? list[0]!).hex;
}

export function nameOf<T extends Named>(list: readonly T[], id: string): string {
  return (list.find((entry) => entry.id === id) ?? list[0]!).name;
}

/** A six-digit hex colour in lower case, or the fallback. Accepts #abc and #aabbcc. */
export function cleanColour(value: unknown, fallback = '#5b1a28'): string {
  if (typeof value !== 'string') return fallback;
  const text = value.trim().toLowerCase().replace(/^#?/, '#');
  if (/^#[0-9a-f]{6}$/.test(text)) return text;
  if (/^#[0-9a-f]{3}$/.test(text)) return `#${text[1]}${text[1]}${text[2]}${text[2]}${text[3]}${text[3]}`;
  return fallback;
}

export function rgb(hex: string): [number, number, number] {
  const c = cleanColour(hex, '#000000');
  return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
}

const toHex = (r: number, g: number, b: number): string =>
  `#${[r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('')}`;

/** Relative luminance, as WCAG defines it. */
export function luminance(hex: string): number {
  const [r, g, b] = rgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contrast ratio between two colours, from 1 to 21. */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** `amount` of b over a: 0 is a, 1 is b. What a see-through layer looks like on its ground. */
export function mix(a: string, b: string, amount: number): string {
  const [ar, ag, ab] = rgb(a);
  const [br, bg, bb] = rgb(b);
  const t = Math.min(1, Math.max(0, amount));
  return toHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
}

/** Darker (negative) or lighter (positive), by a share of the way to black or white. */
export function shade(hex: string, amount: number): string {
  return amount < 0 ? mix(hex, '#000000', -amount) : mix(hex, '#ffffff', amount);
}

/**
 * The colour the cover's lettering is really stamped in: the chosen foil where it can be read
 * (3:1 or better against the cover), otherwise whichever foil, or near-black, reads best.
 */
export function coverInk(cover: string, foilId: string): string {
  const chosen = hexOf(foils, foilId);
  if (contrast(chosen, cover) >= 3) return chosen;
  const candidates = [...foils.map((f) => f.hex), '#1a1a1a'];
  return candidates.reduce((best, c) => (contrast(c, cover) > contrast(best, cover) ? c : best), chosen);
}

const named: readonly [string, string][] = [
  ['black', '#1a1a1a'],
  ['charcoal', '#3a3a3a'],
  ['grey', '#808080'],
  ['silver', '#d5d9dc'],
  ['white', '#ffffff'],
  ['cream', '#f6efdc'],
  ['burgundy', '#5b1a28'],
  ['maroon', '#7a1f2b'],
  ['red', '#c8102e'],
  ['scarlet', '#e03c31'],
  ['rose', '#e58aa0'],
  ['orange', '#e8762c'],
  ['brown', '#6b4423'],
  ['tan', '#c8a97e'],
  ['gold', '#e8c46a'],
  ['yellow', '#f2d21f'],
  ['olive', '#6b6b2a'],
  ['green', '#2e8b57'],
  ['dark green', '#1d4a36'],
  ['teal', '#1f7a7a'],
  ['turquoise', '#3cb8b0'],
  ['sky blue', '#6fb7e0'],
  ['blue', '#2466b0'],
  ['navy', '#1c2c4c'],
  ['indigo', '#3a2f7a'],
  ['violet', '#5b2a86'],
  ['purple', '#7d3c98'],
  ['plum', '#6a2c5a'],
  ['pink', '#e89ac7'],
];

/** The nearest everyday name for a colour, for descriptions. */
export function colourName(hex: string): string {
  const [r, g, b] = rgb(hex);
  let best = 'black';
  let bestDistance = Infinity;
  for (const [name, value] of named) {
    const [nr, ng, nb] = rgb(value);
    // Weighted so that the eye's sensitivity to green counts for more.
    const distance = 2 * (r - nr) ** 2 + 4 * (g - ng) ** 2 + 3 * (b - nb) ** 2;
    if (distance < bestDistance) {
      best = name;
      bestDistance = distance;
    }
  }
  return best;
}
