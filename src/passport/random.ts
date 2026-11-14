/**
 * A small seeded generator. The same seed always gives the same holder, the same security
 * pattern and the same wear on a stamp, on screen and in every download.
 */
export interface Rng {
  /** A number from 0 up to, but not including, 1. */
  next(): number;
  /** A whole number from min to max, both included. */
  int(min: number, max: number): number;
  /** A number from min up to max. */
  range(min: number, max: number): number;
  pick<T>(list: readonly T[]): T;
}

export function rng(seed: number): Rng {
  let a = (Math.floor(Number.isFinite(seed) ? seed : 0) ^ 0x9e3779b9) >>> 0;
  const next = (): number => {
    // mulberry32
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min: number, max: number): number => min + Math.floor(next() * (max - min + 1));
  return {
    next,
    int,
    range: (min, max) => min + next() * (max - min),
    pick: (list) => list[int(0, list.length - 1)]!,
  };
}

/** A seed from any text, so a name can stand for its own signature. */
export function hashText(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** A number as short text for SVG: at most two decimals, no trailing zeros. */
export const n = (value: number): string => String(Math.round(value * 100) / 100);
