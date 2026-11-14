/**
 * Small helpers for writing SVG as text. Documents use the device's own fonts and nothing else,
 * so text can't be measured here; widths are estimated, and where a line might still run over,
 * the browser is told its limit (textLength) and squeezes it to fit.
 */
import { n } from './random';

export const SANS = 'system-ui, Arial, sans-serif';
export const MONO = 'ui-monospace, Menlo, monospace';

/** Text made safe to sit inside SVG, as content or as an attribute. */
export function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export interface TextOptions {
  x: number;
  y: number;
  size: number;
  fill: string;
  anchor?: 'start' | 'middle' | 'end';
  weight?: number;
  family?: string;
  /** Letter-spacing, in units. */
  spacing?: number;
  /** The widest the text may be. It shrinks to fit, down to `min`, and is squeezed after that. */
  max?: number;
  min?: number;
  opacity?: number;
  transform?: string;
}

/** A rough width for a line of text in a device font: good enough to decide when to shrink it. */
export function estimateWidth(content: string, size: number, options: { family?: string; weight?: number; spacing?: number } = {}): number {
  const chars = Array.from(content);
  if (!chars.length) return 0;
  let units = 0;
  for (const ch of chars) {
    if (options.family === MONO) units += 0.61;
    else if (ch === ' ') units += 0.3;
    else if (/[iljtfr.,:;·'’|!]/.test(ch)) units += 0.34;
    else if (/[mwMW]/.test(ch)) units += 0.88;
    else if (/[A-Z0-9]/.test(ch)) units += 0.68;
    else if (/[ᄀ-ￜ]/.test(ch)) units += 1;
    else units += 0.56;
  }
  const bold = (options.weight ?? 400) >= 600 ? 1.06 : 1;
  return units * size * bold + (options.spacing ?? 0) * chars.length;
}

/** One line of text. */
export function text(content: string, o: TextOptions): string {
  const shown = content.trim();
  if (!shown) return '';
  let size = o.size;
  let squeeze = '';
  if (o.max) {
    const width = estimateWidth(shown, size, o);
    if (width > o.max) {
      size = Math.max(o.min ?? size * 0.6, (size * o.max) / width);
      // Still too wide at the smallest size, or close enough that the estimate can't be trusted.
      if (estimateWidth(shown, size, o) > o.max * 0.97) squeeze = ` textLength="${n(o.max)}" lengthAdjust="spacingAndGlyphs"`;
    }
  }
  const attrs = [
    `x="${n(o.x)}"`,
    `y="${n(o.y)}"`,
    o.anchor && o.anchor !== 'start' ? `text-anchor="${o.anchor}"` : '',
    `font-family="${o.family ?? SANS}"`,
    `font-size="${n(size)}"`,
    o.weight ? `font-weight="${o.weight}"` : '',
    o.spacing ? `letter-spacing="${n(o.spacing)}"` : '',
    `fill="${o.fill}"`,
    o.opacity !== undefined && o.opacity < 1 ? `fill-opacity="${n(o.opacity)}"` : '',
    o.transform ? `transform="${o.transform}"` : '',
  ].filter(Boolean);
  return `<text ${attrs.join(' ')}${squeeze}>${esc(shown)}</text>`;
}

/** The points of a star, as a polygon's `points`. */
export function starPoints(cx: number, cy: number, outer: number, inner: number, points: number, turn = 0): string {
  const out: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = (Math.PI * i) / points - Math.PI / 2 + turn;
    out.push(`${n(cx + radius * Math.cos(angle))},${n(cy + radius * Math.sin(angle))}`);
  }
  return out.join(' ');
}

export interface SvgOptions {
  width: number;
  height: number;
  title: string;
  desc: string;
}

/** The outer element, with the title and description every document carries. */
export function svgOpen(o: SvgOptions): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n(o.width)} ${n(o.height)}" width="${n(o.width)}" height="${n(o.height)}" role="img" aria-label="${esc(o.title)}">` +
    `<title>${esc(o.title)}</title><desc>${esc(o.desc)}</desc>`
  );
}
