/**
 * Security patterns: the fine line work behind the text of a real document, here for the look of
 * it. Each is drawn from a seed as plain lines, so it is the same on screen and in every
 * download, and none of it copies any real document's pattern.
 */
import type { PatternId } from './model';
import { n, rng } from './random';

export interface Pattern {
  id: PatternId;
  name: string;
  /** How a description names it. */
  phrase: string;
}

export const patterns: readonly Pattern[] = [
  { id: 'waves', name: 'Wave lines', phrase: 'fine wave lines' },
  { id: 'rosettes', name: 'Rosettes', phrase: 'guilloche rosettes' },
  { id: 'lattice', name: 'Lattice', phrase: 'a lattice of crossing lines' },
  { id: 'rings', name: 'Rings', phrase: 'rings spreading from one point' },
  { id: 'weave', name: 'Weave', phrase: 'woven ribbons of line' },
  { id: 'none', name: 'None', phrase: 'no pattern' },
];

export const pattern = (id: string): Pattern => patterns.find((p) => p.id === id) ?? patterns[0]!;

const path = (points: [number, number][], close = false): string =>
  `<path d="M${points.map(([x, y]) => `${n(x)} ${n(y)}`).join('L')}${close ? 'Z' : ''}"/>`;

function waves(w: number, h: number, seed: number): string {
  const random = rng(seed);
  const length = random.range(70, 130);
  const drift = random.range(0.25, 0.6);
  let out = '';
  const lines = Math.round(h / 16);
  for (let i = 0; i <= lines; i++) {
    const y0 = (i * h) / lines;
    const phase = i * drift + random.range(0, 0.4);
    const points: [number, number][] = [];
    for (let x = 0; x <= w; x += 8) points.push([x, y0 + 5 * Math.sin((x / length) * 2 * Math.PI + phase) + 2 * Math.sin((x / (length * 0.37)) * 2 * Math.PI)]);
    out += path(points);
  }
  return out;
}

function rosette(cx: number, cy: number, radius: number, lobes: number, turns: number): string {
  let out = '';
  for (let k = 0; k < turns; k++) {
    // Each line is the same wavy ring, shifted a step round, so the lines weave through each other.
    const phase = (k * 2 * Math.PI) / turns;
    const points: [number, number][] = [];
    for (let i = 0; i < 120; i++) {
      const a = (i / 120) * 2 * Math.PI;
      const r = radius * (0.74 + 0.26 * Math.cos(lobes * a + phase));
      points.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
    out += path(points, true);
  }
  return out;
}

function rosettes(w: number, h: number, seed: number): string {
  const random = rng(seed);
  const big = Math.min(w, h) * random.range(0.36, 0.44);
  const small = big * 0.55;
  return (
    rosette(w * random.range(0.6, 0.72), h * random.range(0.4, 0.5), big, random.int(7, 12), 6) +
    rosette(w * random.range(0.14, 0.24), h * random.range(0.68, 0.8), small, random.int(6, 9), 5)
  );
}

function lattice(w: number, h: number, seed: number): string {
  const random = rng(seed);
  const gap = random.range(22, 30);
  const lean = random.range(0.5, 0.8);
  let out = '';
  for (const direction of [1, -1]) {
    for (let start = -h * lean; start <= w + h * lean; start += gap) {
      const points: [number, number][] = [];
      for (let y = 0; y <= h; y += 10) points.push([start + direction * lean * y + 3 * Math.sin(y / 14 + start), y]);
      out += path(points);
    }
  }
  return out;
}

function rings(w: number, h: number, seed: number): string {
  const random = rng(seed);
  const cx = w * random.range(0.55, 0.8);
  const cy = h * random.range(0.3, 0.6);
  const gap = random.range(9, 13);
  let out = '';
  for (let r = gap; r < Math.max(w, h) * 0.75; r += gap) out += `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}"/>`;
  return out;
}

function weave(w: number, h: number, seed: number): string {
  const random = rng(seed);
  const bands = 4;
  const length = random.range(46, 70);
  let out = '';
  for (let b = 0; b < bands; b++) {
    const y0 = ((b + 0.5) * h) / bands;
    for (const strand of [0, 1, 2]) {
      const points: [number, number][] = [];
      for (let x = 0; x <= w; x += 6) {
        const t = (x / length) * 2 * Math.PI + (strand * 2 * Math.PI) / 3 + b;
        points.push([x, y0 + (h / bands) * 0.3 * Math.sin(t) + 2.5 * Math.sin(t * 5)]);
      }
      out += path(points);
    }
  }
  return out;
}

/**
 * The pattern's lines for an area of w by h, as SVG shapes with no colour of their own: wrap them
 * in a group that sets the stroke and clips them to the page.
 */
export function drawPattern(id: PatternId, w: number, h: number, seed: number): string {
  switch (id) {
    case 'waves':
      return waves(w, h, seed);
    case 'rosettes':
      return rosettes(w, h, seed);
    case 'lattice':
      return lattice(w, h, seed);
    case 'rings':
      return rings(w, h, seed);
    case 'weave':
      return weave(w, h, seed);
    default:
      return '';
  }
}
