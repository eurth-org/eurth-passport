/**
 * The holder's signature: their own name, written in one hand. The first letter of the given
 * name, then the surname, in a joined-up script: each letter is a handful of points the pen
 * passes through, and one smooth line is drawn through them all, so the letters run into each
 * other as handwriting does. A long surname trails off into a line, as tired signatures do, and
 * a flourish runs back under the name.
 *
 * It is nobody's signature: the letterforms are the tool's own, and the small differences from
 * one holder to the next (the slant, the width, the wobble) come from a seed made of the name.
 * The same name always signs the same way.
 */
import { hashText, n, rng, type Rng } from './random';

type Point = readonly [number, number];

interface Glyph {
  /** Where the pen goes, in order. x runs right; y runs up, with the baseline at 0, the top of an "x" at 1, of an "l" at 2.2. */
  points: readonly Point[];
  /** How far the next letter starts from this one. */
  advance: number;
  /** A second touch of the pen, made after the word: the dot of an i, the bar of a t. */
  extra?: readonly Point[];
}

const ascender: readonly Point[] = [[0.3, 1.2], [0.55, 2.2], [0.3, 2.1], [0.25, 0.3]];
const bowl: readonly Point[] = [[0.9, 0.85], [0.45, 1.0], [0.1, 0.5], [0.45, 0.0], [0.9, 0.5]];

/** The letters, lower case. A capital is the same letter, written large. */
const glyphs: Record<string, Glyph> = {
  a: { points: [...bowl, [0.95, 1.0], [0.95, 0.3], [1.25, 0.0]], advance: 1.25 },
  b: { points: [...ascender, [0.5, 0.0], [0.9, 0.35], [0.8, 0.9], [0.45, 0.8], [1.15, 0.85]], advance: 1.15 },
  c: { points: [[0.9, 0.8], [0.5, 1.0], [0.1, 0.5], [0.45, 0.0], [1.0, 0.15]], advance: 1.0 },
  d: { points: [...bowl, [0.95, 2.2], [0.95, 0.3], [1.25, 0.0]], advance: 1.25 },
  e: { points: [[0.2, 0.45], [0.7, 0.75], [0.5, 1.0], [0.15, 0.5], [0.5, 0.0], [1.0, 0.15]], advance: 1.0 },
  f: { points: [[0.35, 1.2], [0.6, 2.2], [0.35, 2.1], [0.3, -0.9], [0.1, -1.0], [0.3, -0.1], [0.9, 0.1]], advance: 0.9 },
  g: { points: [...bowl, [0.95, 1.0], [0.9, -0.8], [0.5, -1.1], [0.2, -0.7], [1.2, 0.05]], advance: 1.2 },
  h: { points: [...ascender, [0.25, 0.0], [0.3, 0.6], [0.65, 1.0], [0.9, 0.6], [0.9, 0.15], [1.2, 0.0]], advance: 1.2 },
  i: { points: [[0.3, 1.0], [0.3, 0.2], [0.6, 0.0]], advance: 0.6, extra: [[0.3, 1.5], [0.36, 1.58]] },
  j: { points: [[0.4, 1.0], [0.4, -0.8], [0.1, -1.1], [-0.1, -0.7], [0.7, 0.05]], advance: 0.7, extra: [[0.4, 1.5], [0.46, 1.58]] },
  k: { points: [...ascender, [0.25, 0.0], [0.4, 0.7], [0.75, 1.0], [0.7, 0.6], [0.4, 0.5], [0.9, 0.0], [1.15, 0.05]], advance: 1.15 },
  l: { points: [...ascender, [0.6, 0.0]], advance: 0.6 },
  m: { points: [[0.2, 1.0], [0.2, 0.0], [0.25, 0.7], [0.55, 1.0], [0.7, 0.6], [0.7, 0.0], [0.75, 0.7], [1.05, 1.0], [1.2, 0.6], [1.2, 0.2], [1.5, 0.0]], advance: 1.5 },
  n: { points: [[0.2, 1.0], [0.2, 0.0], [0.25, 0.7], [0.6, 1.0], [0.8, 0.6], [0.8, 0.2], [1.1, 0.0]], advance: 1.1 },
  o: { points: [[0.55, 1.0], [0.15, 0.5], [0.5, 0.0], [0.85, 0.5], [0.55, 1.0], [0.75, 0.85], [1.1, 0.9]], advance: 1.05 },
  p: { points: [[0.2, 1.0], [0.2, -1.0], [0.25, 0.6], [0.6, 1.0], [0.9, 0.5], [0.55, 0.0], [0.3, 0.2], [1.15, 0.0]], advance: 1.15 },
  q: { points: [...bowl, [0.95, 1.0], [0.95, -1.0], [1.15, -0.4], [1.3, 0.0]], advance: 1.3 },
  r: { points: [[0.15, 0.9], [0.3, 1.05], [0.35, 0.9], [0.7, 0.8], [0.7, 0.2], [0.95, 0.0]], advance: 0.95 },
  s: { points: [[0.5, 1.0], [0.75, 0.45], [0.45, 0.0], [0.15, 0.15], [0.5, 0.05], [0.95, 0.05]], advance: 0.95 },
  t: { points: [[0.35, 1.9], [0.35, 0.25], [0.7, 0.0]], advance: 0.7, extra: [[0.05, 1.15], [0.7, 1.2]] },
  u: { points: [[0.2, 1.0], [0.2, 0.3], [0.5, 0.0], [0.8, 0.4], [0.8, 1.0], [0.85, 0.25], [1.15, 0.0]], advance: 1.15 },
  v: { points: [[0.2, 1.0], [0.5, 0.0], [0.85, 1.0], [1.1, 0.9]], advance: 1.0 },
  w: { points: [[0.2, 1.0], [0.4, 0.0], [0.65, 0.8], [0.9, 0.0], [1.2, 1.0], [1.45, 0.9]], advance: 1.4 },
  x: { points: [[0.15, 1.0], [0.5, 0.5], [0.85, 0.0], [1.1, 0.05]], advance: 1.0, extra: [[0.85, 1.0], [0.15, 0.0]] },
  y: { points: [[0.2, 1.0], [0.2, 0.3], [0.5, 0.0], [0.8, 0.4], [0.8, 1.0], [0.8, -0.8], [0.45, -1.1], [0.2, -0.7], [1.1, 0.05]], advance: 1.1 },
  z: { points: [[0.15, 0.95], [0.8, 1.0], [0.15, 0.05], [0.95, 0.0]], advance: 1.0 },
};

/** Letters a hand makes for a sound it has no letter for: a name in another script still signs as strokes. */
const stand = ['e', 'l', 'n', 'u', 'o', 'r'] as const;

/** How many letters of the surname are written out before the hand runs on into a line. */
export const SIGNED_LETTERS = 9;

// Accents, as they stand after a letter once a name is taken apart. Named by number, so none sits invisibly in this file.
const ACCENTS = new RegExp(`[${String.fromCodePoint(0x300)}-${String.fromCodePoint(0x36f)}]`, 'g');

/** The letters a name is signed with: lower case, accents left off, single spaces. */
function lettersOf(name: string): string {
  return name.normalize('NFD').replace(ACCENTS, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/** What is written: the given name's first letter and the surname. "Liane Ashdale" signs as "L Ashdale". */
export function signatureText(given: string, surname: string): string {
  const first = Array.from(lettersOf(given))[0] ?? '';
  const last = lettersOf(surname);
  const family = last ? Array.from(last)[0]!.toUpperCase() + Array.from(last).slice(1).join('') : '';
  return [first.toUpperCase(), family].filter(Boolean).join(' ');
}

/** A smooth line through points, as a path: each stretch bends towards its neighbours. */
function through(points: readonly Point[]): string {
  if (points.length < 2) return '';
  let d = `M${n(points[0]![0])} ${n(points[0]![1])}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]!;
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const p3 = points[Math.min(points.length - 1, i + 2)]!;
    d += `C${n(p1[0] + (p2[0] - p0[0]) / 6)} ${n(p1[1] + (p2[1] - p0[1]) / 6)} ${n(p2[0] - (p3[0] - p1[0]) / 6)} ${n(p2[1] - (p3[1] - p1[1]) / 6)} ${n(p2[0])} ${n(p2[1])}`;
  }
  return d;
}

interface Written {
  /** Each lift of the pen is its own line. */
  strokes: Point[][];
  /** Dots and bars, added after. */
  extras: Point[][];
  width: number;
  /** How high and how low the writing reaches, in letter units (up is positive). */
  top: number;
  bottom: number;
}

/** A word's points, in letter units, before it is fitted to its box. */
function write(text: string, random: Rng): Written {
  const strokes: Point[][] = [];
  const extras: Point[][] = [];
  let pen: Point[] = [];
  let x = 0;
  let top = 1;
  let bottom = 0;
  let written = 0;
  const lift = (): void => {
    if (pen.length > 1) strokes.push(pen);
    pen = [];
  };
  const chars = Array.from(text);
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]!;
    if (ch === ' ' || ch === '-' || ch === '’' || ch === "'") {
      lift();
      x += ch === ' ' ? 0.55 : 0.3;
      continue;
    }
    const lower = ch.toLowerCase();
    const capital = ch !== lower;
    const glyph = glyphs[lower] ?? glyphs[stand[(lower.codePointAt(0) ?? 0) % stand.length]!]!;
    // A capital is the letter written large, and it starts a new stroke.
    const size = capital ? 1.75 : random.range(0.92, 1.08);
    const squeeze = random.range(0.9, 1.06);
    if (capital) lift();
    // After the first few letters the hand stops spelling and runs on.
    if (!capital && written >= SIGNED_LETTERS) {
      const rest = chars.length - i;
      const run = Math.min(4.5, 1.2 + rest * 0.35);
      for (let step = 1; step <= 4; step++) pen.push([x + (run * step) / 4, step % 2 ? 0.28 : 0.05]);
      x += run;
      break;
    }
    const wobble = (): number => random.range(-0.035, 0.035);
    for (const [px, py] of glyph.points) {
      const point: Point = [x + px * size * squeeze + wobble(), py * size + wobble()];
      pen.push(point);
      top = Math.max(top, point[1]);
      bottom = Math.min(bottom, point[1]);
    }
    if (glyph.extra) {
      const touch = glyph.extra.map(([px, py]): Point => [x + px * size * squeeze, py * size]);
      extras.push(touch);
      // A dot or a bar counts towards how tall the writing is, so it stays in the box too.
      for (const [, py] of touch) top = Math.max(top, py);
    }
    x += glyph.advance * size * squeeze + (capital ? 0.1 : 0);
    if (!capital) written++;
  }
  lift();
  return { strokes, extras, width: Math.max(x, 0.1), top, bottom };
}

/**
 * The signature, in a box of w by h with its top-left corner at (x, y): the holder's initial and
 * surname in a joined hand, leaning to the right, with a flourish beneath.
 */
export function drawSignature(given: string, surname: string, x: number, y: number, w: number, h: number, colour: string): string {
  const text = signatureText(given, surname);
  const random = rng(hashText(`${given.trim()} ${surname.trim()}`.trim()) || 1);
  const slant = random.range(0.18, 0.34);
  const word = write(text || 'x', random);
  // Fit the writing to the box: as large as the height allows, narrower if the name is long.
  const tall = word.top - word.bottom + 0.9;
  const unit = Math.min((h * 0.92) / tall, (w * 0.94) / (word.width + slant * tall));
  const baseline = y + h * 0.08 + word.top * unit;
  const left = x + 2 - Math.min(0, word.bottom) * slant * unit;
  const place = ([px, py]: Point): Point => [left + (px + py * slant) * unit, baseline - py * unit];
  const lines = [...word.strokes, ...word.extras].map((stroke) => through(stroke.map(place)));
  // The flourish: back under the name from its end, in one sweep.
  const end = left + word.width * unit;
  const under = baseline + (0.55 - word.bottom * 0.35) * unit;
  const sweep = `M${n(end + unit * 0.2)} ${n(baseline - unit * 0.1)}C${n(end + unit * 0.9)} ${n(under + unit * 0.5)} ${n(left + word.width * unit * random.range(0.35, 0.6))} ${n(under + unit * random.range(0.1, 0.5))} ${n(left + unit * random.range(0, 0.6))} ${n(under - unit * random.range(0, 0.25))}`;
  return `<path data-part="signature" d="${lines.join('')}${sweep}" fill="none" stroke="${colour}" stroke-width="${n(Math.max(0.8, Math.min(1.3, unit * 0.16)))}" stroke-linecap="round" stroke-linejoin="round"/>`;
}
