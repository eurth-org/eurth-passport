/**
 * Stamps: the ink a border guard leaves in a passport. A stamp is a shape with a border, a few
 * lines of text, a date and perhaps a small mark for how the traveller arrived, pressed down a
 * little crooked and never quite evenly.
 *
 * The wear is drawn as shapes from a seed, not with filters, so a stamp looks the same on screen,
 * in the SVG and in a PNG.
 */
import { hexOf, stampInks } from './colours';
import { formatDate, type Calendar } from './dates';
import type { Stamp, StampBorder, StampMark, StampShape } from './model';
import { n, rng } from './random';
import { MONO, SANS, esc, estimateWidth, starPoints, text } from './svg';

/** Each shape's full width and height, before it is turned. */
export const stampBox: Record<StampShape, { w: number; h: number }> = {
  circle: { w: 184, h: 184 },
  oval: { w: 244, h: 168 },
  rectangle: { w: 232, h: 144 },
  rounded: { w: 232, h: 144 },
  hexagon: { w: 236, h: 176 },
  shield: { w: 176, h: 212 },
};

export const shapeNames: Record<StampShape, string> = {
  circle: 'Round',
  oval: 'Oval',
  rectangle: 'Rectangle',
  rounded: 'Rounded rectangle',
  hexagon: 'Hexagon',
  shield: 'Shield',
};

export const borderNames: Record<StampBorder, string> = {
  single: 'Single line',
  double: 'Double line',
  dashed: 'Dashed',
  dotted: 'Dotted',
  toothed: 'Toothed',
};

export const markNames: Record<StampMark, string> = {
  none: 'No mark',
  ship: 'Ship',
  aircraft: 'Aircraft',
  train: 'Train',
  road: 'Road',
  star: 'Star',
};

/** The outline of a shape, centred on the origin, drawn `inset` units inside its edge. */
function outline(shape: StampShape, inset: number): string {
  const { w, h } = stampBox[shape];
  const hw = w / 2 - inset;
  const hh = h / 2 - inset;
  switch (shape) {
    case 'circle':
    case 'oval':
      return `M${n(-hw)} 0A${n(hw)} ${n(hh)} 0 1 0 ${n(hw)} 0A${n(hw)} ${n(hh)} 0 1 0 ${n(-hw)} 0Z`;
    case 'rounded': {
      const r = Math.max(3, 20 - inset);
      return `M${n(-hw + r)} ${n(-hh)}H${n(hw - r)}A${n(r)} ${n(r)} 0 0 1 ${n(hw)} ${n(-hh + r)}V${n(hh - r)}A${n(r)} ${n(r)} 0 0 1 ${n(hw - r)} ${n(hh)}H${n(-hw + r)}A${n(r)} ${n(r)} 0 0 1 ${n(-hw)} ${n(hh - r)}V${n(-hh + r)}A${n(r)} ${n(r)} 0 0 1 ${n(-hw + r)} ${n(-hh)}Z`;
    }
    case 'hexagon': {
      const flat = hw * 0.525;
      return `M${n(-hw)} 0L${n(-flat)} ${n(-hh)}H${n(flat)}L${n(hw)} 0L${n(flat)} ${n(hh)}H${n(-flat)}Z`;
    }
    case 'shield':
      return `M${n(-hw)} ${n(-hh)}H${n(hw)}V${n(hh * 0.1)}C${n(hw)} ${n(hh * 0.57)} ${n(hw * 0.45)} ${n(hh * 0.87)} 0 ${n(hh)}C${n(-hw * 0.45)} ${n(hh * 0.87)} ${n(-hw)} ${n(hh * 0.57)} ${n(-hw)} ${n(hh * 0.1)}Z`;
    default:
      return `M${n(-hw)} ${n(-hh)}H${n(hw)}V${n(hh)}H${n(-hw)}Z`;
  }
}

function border(shape: StampShape, kind: StampBorder, ink: string): string {
  const line = (inset: number, width: number, extra = ''): string => `<path d="${outline(shape, inset)}" fill="none" stroke="${ink}" stroke-width="${width}"${extra}/>`;
  switch (kind) {
    case 'double':
      return line(2.5, 4.5) + line(10, 1.6);
    case 'dashed':
      return line(2.5, 4, ' stroke-dasharray="13 6"');
    case 'dotted':
      return line(3, 5, ' stroke-dasharray="0.1 9.5" stroke-linecap="round"');
    case 'toothed':
      return line(4, 7, ' stroke-dasharray="3.2 3.2"') + line(11, 1.6);
    default:
      return line(2.5, 5);
  }
}

/** A small mark for how the traveller came, drawn about `size` units across and centred on (x, y). */
function mark(kind: StampMark, x: number, y: number, size: number, ink: string): string {
  let shape = '';
  switch (kind) {
    case 'ship':
      shape = `<path d="M-11 3h22l-4.5 7h-13zM-1.2-10v11h-8.500zM1.2-7v8h7.500z" fill="${ink}"/>`;
      break;
    case 'aircraft':
      shape = `<path d="M-11 0L6-1.700Q11.5 0 6 1.700ZM0-1L-5-10.500h3L5.5-1ZM0 1L-5 10.500h3L5.5 1ZM-9.5-.5L-11.5-5h2.200L-6.5-.5ZM-9.5.5L-11.5 5h2.200L-6.5.5Z" fill="${ink}"/>`;
      break;
    case 'train':
      shape = `<path d="M-8-6.500a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v9.500a3 3 0 0 1-3 3h-10a3 3 0 0 1-3-3zM-5-6.500h10v5h-10z" fill="${ink}" fill-rule="evenodd"/><path d="M-5 7.500l-3 4M5 7.500l3 4" stroke="${ink}" stroke-width="1.8" stroke-linecap="round"/>`;
      break;
    case 'road':
      shape = `<path d="M-9 11L-3.5-11M9 11L3.5-11" stroke="${ink}" stroke-width="2.2" stroke-linecap="round" fill="none"/><path d="M0 10V6M0 2.500V-1M0-4.500V-8" stroke="${ink}" stroke-width="1.6" stroke-linecap="round" fill="none"/>`;
      break;
    case 'star':
      shape = `<polygon points="${starPoints(0, 0, 11, 4.4, 5)}" fill="${ink}"/>`;
      break;
    default:
      return '';
  }
  return `<g transform="translate(${n(x)} ${n(y)}) scale(${n(size / 24)})">${shape}</g>`;
}

/** Text along a curve. The path runs left to right; the text is centred on it and shrinks to fit. */
function arcText(content: string, id: string, d: string, length: number, size: number, ink: string): string {
  const shown = content.trim().toUpperCase();
  if (!shown) return '';
  const options = { weight: 700, spacing: 1.6 };
  const width = estimateWidth(shown, size, options);
  const fitted = width > length ? Math.max(5.5, (size * length) / width) : size;
  return (
    `<path id="${id}" d="${d}" fill="none"/>` +
    `<text font-family="${SANS}" font-size="${n(fitted)}" font-weight="700" letter-spacing="${n((options.spacing * fitted) / size)}" fill="${ink}" text-anchor="middle"><textPath href="#${id}" startOffset="50%">${esc(shown)}</textPath></text>`
  );
}

export interface StampOptions {
  calendar: Calendar | null;
  /** Makes the ids inside the drawing unique where several drawings share a page. */
  idPrefix: string;
}

/** The stamp as it is cut: border, mark and text, centred on the origin, not yet pressed. */
export function stampFace(stamp: Stamp, o: StampOptions): string {
  const ink = hexOf(stampInks, stamp.ink);
  const up = (value: string): string => value.trim().toUpperCase();
  const date = formatDate(stamp.date, o.calendar, stamp.dateStyle).toUpperCase();
  const has = stamp.mark !== 'none';
  const line = (content: string, y: number, size: number, max: number, extra: { weight?: number; spacing?: number; family?: string; x?: number } = {}): string =>
    text(up(content), { x: extra.x ?? 0, y, size, max, min: size * 0.45, fill: ink, anchor: 'middle', weight: extra.weight ?? 700, spacing: extra.spacing, family: extra.family });

  let inside = '';
  switch (stamp.shape) {
    case 'circle':
    case 'oval': {
      const { w, h } = stampBox[stamp.shape];
      const round = stamp.shape === 'circle';
      const [tx, ty] = [w / 2 - 26, h / 2 - 26];
      const [bx, by] = [w / 2 - 15, h / 2 - 15];
      const half = (a: number, b: number): number => Math.PI * Math.sqrt((a * a + b * b) / 2);
      inside =
        arcText(stamp.top, `${o.idPrefix}t`, `M${n(-tx)} 0A${n(tx)} ${n(ty)} 0 0 1 ${n(tx)} 0`, half(tx, ty) * 0.8, 11, ink) +
        arcText(stamp.bottom, `${o.idPrefix}b`, `M${n(-bx)} 0A${n(bx)} ${n(by)} 0 0 0 ${n(bx)} 0`, half(bx, by) * 0.7, 9.5, ink) +
        mark(stamp.mark, 0, round ? -40 : -35, round ? 20 : 16, ink) +
        line(stamp.label, round ? -8 : -5, round ? 27 : 26, round ? 112 : 150, { weight: 800, spacing: 2 }) +
        line(date, round ? 14 : 16, 12.5, round ? 124 : 150, { family: MONO }) +
        line(stamp.place, round ? 31 : 32, 9.5, round ? 100 : 130, { weight: 600, spacing: 0.6 });
      break;
    }
    case 'hexagon':
      inside =
        line(stamp.top, -62, 9.5, 104, { spacing: 1.6 }) +
        mark(stamp.mark, -71, -27, 18, ink) +
        line(stamp.label, -18, 26, has ? 104 : 160, { weight: 800, spacing: 2 }) +
        line(stamp.place, 3, 9.5, 170, { weight: 600, spacing: 0.6 }) +
        line(date, 25, 12.5, 160, { family: MONO }) +
        line(stamp.bottom, 62, 9, 104, { spacing: 1.4 });
      break;
    case 'shield':
      inside =
        line(stamp.top, -78, 9.5, 136, { spacing: 1.6 }) +
        mark(stamp.mark, 0, -52, 20, ink) +
        line(stamp.label, -14, 25, 136, { weight: 800, spacing: 2 }) +
        line(stamp.place, 5, 9.5, 136, { weight: 600, spacing: 0.6 }) +
        line(date, 27, 12.5, 136, { family: MONO }) +
        line(stamp.bottom, 48, 8.5, 104, { spacing: 1.4 });
      break;
    default:
      inside =
        line(stamp.top, -41, 10.5, 186, { spacing: 2 }) +
        mark(stamp.mark, -84, -9, 24, ink) +
        line(stamp.label, -9, 28, has ? 124 : 188, { weight: 800, spacing: 2 }) +
        line(stamp.place, 11, 9.5, 188, { weight: 600, spacing: 0.6 }) +
        line(date, 32, 12.5, 188, { family: MONO }) +
        line(stamp.bottom, 52, 9, 188, { spacing: 1.4 });
  }
  return border(stamp.shape, stamp.border, ink) + inside;
}

const WEAR = [
  { opacity: 0.95, ghost: 0, dx: 0, dy: 0, patches: 0 },
  { opacity: 0.9, ghost: 0.16, dx: 1.2, dy: 0.8, patches: 4 },
  { opacity: 0.85, ghost: 0.2, dx: 1.9, dy: 1.2, patches: 9 },
  { opacity: 0.78, ghost: 0.26, dx: 2.6, dy: 1.7, patches: 16 },
] as const;

/**
 * The stamp as it lands on paper, centred on (cx, cy): turned a little, with the faint second
 * edge of a stamp that slipped, and patches where the ink didn't take.
 */
export function drawStamp(stamp: Stamp, cx: number, cy: number, o: StampOptions, scale = 1): string {
  const wear = WEAR[Math.min(3, Math.max(0, Math.round(stamp.wear)))]!;
  const { w, h } = stampBox[stamp.shape];
  const face = stampFace(stamp, o);
  let mask = '';
  let masked = '';
  if (wear.patches) {
    const random = rng(stamp.seed);
    let holes = '';
    for (let i = 0; i < wear.patches; i++) {
      holes += `<ellipse cx="${n(random.range(-w / 2, w / 2))}" cy="${n(random.range(-h / 2, h / 2))}" rx="${n(random.range(4, 15))}" ry="${n(random.range(3, 10))}" fill="#000" fill-opacity="${n(random.range(0.45, 0.9))}" transform="rotate(${random.int(0, 179)})"/>`;
    }
    mask = `<mask id="${o.idPrefix}w" maskUnits="userSpaceOnUse" x="${n(-w / 2 - 8)}" y="${n(-h / 2 - 8)}" width="${n(w + 16)}" height="${n(h + 16)}"><rect x="${n(-w / 2 - 8)}" y="${n(-h / 2 - 8)}" width="${n(w + 16)}" height="${n(h + 16)}" fill="#fff"/>${holes}</mask>`;
    masked = ` mask="url(#${o.idPrefix}w)"`;
  }
  // The slipped second impression is drawn from shapes only: text along a curve needs its ids once.
  const ghost = wear.ghost ? `<g opacity="${wear.ghost}" transform="translate(${wear.dx} ${wear.dy})">${border(stamp.shape, stamp.border, hexOf(stampInks, stamp.ink))}</g>` : '';
  const size = scale === 1 ? '' : ` scale(${n(scale)})`;
  return `<g data-stamp="${stamp.kind}" transform="translate(${n(cx)} ${n(cy)})${size} rotate(${n(stamp.rot)})" opacity="${wear.opacity}">${mask}${ghost}<g${masked}>${face}</g></g>`;
}

/** How much room a stamp takes once it is turned. */
export function stampExtent(stamp: Stamp): { w: number; h: number } {
  const { w, h } = stampBox[stamp.shape];
  const a = (Math.abs(stamp.rot) * Math.PI) / 180;
  return { w: w * Math.cos(a) + h * Math.sin(a), h: w * Math.sin(a) + h * Math.cos(a) };
}

export const NOTE_BOX = { w: 196, h: 44 };

/** A one-line rubber stamp, such as an official adds beside a visa. */
export function noteStamp(content: string, inkId: string, rot: number, cx: number, cy: number, scale = 1): string {
  const ink = hexOf(stampInks, inkId);
  const { w, h } = NOTE_BOX;
  const size = scale === 1 ? '' : ` scale(${n(scale)})`;
  return (
    `<g data-stamp="note" transform="translate(${n(cx)} ${n(cy)})${size} rotate(${n(rot)})" opacity=".88">` +
    `<rect x="${n(-w / 2 + 2)}" y="${n(-h / 2 + 2)}" width="${n(w - 4)}" height="${n(h - 4)}" rx="6" fill="none" stroke="${ink}" stroke-width="3.5"/>` +
    text(content.toUpperCase(), { x: 0, y: 6.5, size: 18, max: w - 28, fill: ink, anchor: 'middle', weight: 800, spacing: 1.5 }) +
    `</g>`
  );
}
