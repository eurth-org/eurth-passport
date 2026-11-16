/**
 * Drawing: a design goes in, SVG text comes out. One function per document, and every part of
 * the tool that shows a document (the editor, the downloads, the template pages, the tests)
 * uses these same functions.
 *
 * The data page and both sides of the card end with the SPECIMEN overprint. That last line of
 * each function is the rule; there is nothing to pass in that would change it.
 *
 * A visitor's own emblem or photograph comes in beside the design (RenderOptions), never in it:
 * what is saved, linked or written to a profile is the design alone.
 */
import { TEXT_DARK, contrast, coverInk, hexOf, luminance, mix, papers, printInks, shade } from './colours';
import { addYears, formatDate } from './dates';
import { describeDocument, titleOf, type DescribeOptions } from './describe';
import { chipSymbol, contactPad, emblem } from './emblems';
import { decorativeStrip, ownPicture, photoSpecimen, specimenOverprint, vectorOnly } from './fiction';
import { isMoonVisa, MOON_STAMP_TEXT } from './fun';
import type { Design, DocumentRef } from './model';
import { drawPattern } from './patterns';
import { drawPortrait } from './portraits';
import { n } from './random';
import { drawSignature } from './signature';
import { NOTE_BOX, drawStamp, noteStamp, stampExtent } from './stamps';
import { MONO, esc, svgOpen, text } from './svg';

/** The size of each document, in drawing units. Booklet and card keep the proportions of real ones. */
export const sizes = {
  cover: { w: 352, h: 500 },
  data: { w: 500, h: 352 },
  card: { w: 476, h: 300 },
  page: { w: 352, h: 500 },
} as const;

export interface RenderOptions {
  /** The profile's arms, as SVG text. Used on the cover only if the design asks and they are pure vector drawing. */
  arms?: string | null;
  /**
   * The visitor's own emblem, for this visit: SVG text that is pure vector drawing, or a picture
   * the tool made from their file (see ownPicture). It stands in place of the emblem and the arms.
   */
  emblem?: string | null;
  /** Stamp the visitor's own emblem into the cover in foil, by its outline, in place of its own colours. */
  emblemFoil?: boolean;
  /** The visitor's own photograph, for this visit, already cut to four by five (see ownPicture). */
  photo?: string | null;
  /**
   * SPECIMEN across that photograph. It is drawn unless this is exactly false: the one mark a
   * visitor may take off. The overprint on the page is not this, and has no option at all.
   */
  photoMark?: boolean;
  /** Makes ids unique where several drawings share one page. Letters, digits and hyphens. */
  idPrefix?: string;
  /** For a stamp on its own: on clear (the default) or on a patch of paper. */
  ground?: 'clear' | 'paper';
}

const prefix = (o: RenderOptions): string => (o.idPrefix ?? 'pp').replace(/[^A-Za-z0-9-]/g, '') || 'pp';

/** Whether a visitor's own emblem is offered and can be drawn. */
export function ownEmblemUsed(o: RenderOptions = {}): boolean {
  return vectorOnly(o.emblem) || ownPicture(o.emblem);
}

/** Whether a visitor's own photograph is offered and can be drawn. */
export function photoUsed(o: RenderOptions = {}): boolean {
  return ownPicture(o.photo);
}

/** Whether a visitor's photograph is drawn with SPECIMEN across it: always, unless they took that mark off. */
export function photoMarked(o: RenderOptions = {}): boolean {
  return photoUsed(o) && o.photoMark !== false;
}

/** Whether the arms a caller offers will really be drawn on the cover. */
export function armsUsed(design: Design, o: RenderOptions = {}): boolean {
  return !ownEmblemUsed(o) && design.cover.arms && vectorOnly(o.arms);
}

/** What the words about a document need to know of how it is drawn. */
export function describing(design: Design, o: RenderOptions = {}): DescribeOptions {
  return { armsUsed: armsUsed(design, o), ownEmblem: ownEmblemUsed(o), photo: photoUsed(o), photoMarked: photoMarked(o) };
}

/** An SVG as the address of a picture. Inside an image element the browser draws it and runs none of it. */
export function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function open(design: Design, ref: DocumentRef, w: number, h: number, o: RenderOptions): string {
  return svgOpen({ width: w, height: h, title: titleOf(design, ref), desc: describeDocument(design, ref, describing(design, o)) });
}

/** How the cover's foil is handed to the device: its paint, and where a mask for a visitor's own emblem may be kept. */
interface Foil {
  /** The foil as paint for our own emblems, which are drawn in a box of 100 moved into place. */
  inBox: (cx: number, cy: number, size: number) => { defs: string; paint: string };
  /** The foil as paint for anything drawn straight onto the cover. */
  paint: string;
  maskId: string;
}

/**
 * The device on a document, in a square of `size` centred on (cx, cy): the visitor's own emblem
 * if they brought one, or the profile's arms if the design asks, or one of our emblems.
 */
function device(design: Design, o: RenderOptions, cx: number, cy: number, size: number, fg: string, bg: string, opacity = 1, foil?: Foil): string {
  const fade = opacity < 1 ? ` opacity="${n(opacity)}"` : '';
  const box = `x="${n(cx - size / 2)}" y="${n(cy - size / 2)}" width="${n(size)}" height="${n(size)}"`;
  if (ownEmblemUsed(o)) {
    const href = esc(vectorOnly(o.emblem) ? svgDataUrl(o.emblem) : o.emblem!);
    const picture = `<image href="${href}" ${box} preserveAspectRatio="xMidYMid meet"`;
    // In foil: the picture's outline is the stamp, and the foil shows through it.
    if (foil && o.emblemFoil) return `<mask id="${foil.maskId}" mask-type="alpha" maskUnits="userSpaceOnUse" ${box}>${picture}/></mask><rect ${box} fill="${foil.paint}" mask="url(#${foil.maskId})"/>`;
    return `${picture}${fade}/>`;
  }
  if (armsUsed(design, o)) return `<image href="${esc(svgDataUrl(o.arms!))}" ${box} preserveAspectRatio="xMidYMid meet"${fade}/>`;
  const own = foil?.inBox(cx, cy, size);
  return `${own?.defs ?? ''}<g transform="translate(${n(cx - size / 2)} ${n(cy - size / 2)}) scale(${n(size / 100)})"${fade}>${emblem(design.cover.emblem).draw(own?.paint ?? fg, bg)}</g>`;
}

/** The widest a line of lettering on the cover may be: clear of the fold by the spine, and as clear of the other edge. */
const COVER_MEASURE = 272;

/** The state's name on the cover: on one line, or on two when it is long. */
function coverName(name: string, cx: number, foil: string): string {
  const shown = name.trim().toUpperCase();
  const words = shown.split(' ');
  if (Array.from(shown).length <= 26 || words.length < 2) return text(shown, { x: cx, y: 88, size: 21, max: COVER_MEASURE, min: 10, fill: foil, anchor: 'middle', spacing: 2 });
  // Break at the space that leaves the two lines most alike in length.
  let best = 1;
  let bestGap = Infinity;
  for (let i = 1; i < words.length; i++) {
    const gap = Math.abs(words.slice(0, i).join(' ').length - words.slice(i).join(' ').length);
    if (gap < bestGap) {
      best = i;
      bestGap = gap;
    }
  }
  const line = (content: string, y: number): string => text(content, { x: cx, y, size: 17, max: COVER_MEASURE, min: 9, fill: foil, anchor: 'middle', spacing: 1.6 });
  return line(words.slice(0, best).join(' '), 76) + line(words.slice(best).join(' '), 100);
}

/** How round a cover is where it opens, and how far the drawing stays in from the edge of the picture. */
const COVER_RADIUS = 16;

/**
 * The outline of a booklet's cover: square at the spine on the left, where the pages are bound,
 * and rounded on the right, where it opens. The pages inside keep four round corners.
 */
export function coverOutline(w: number, h: number): string {
  const r = COVER_RADIUS;
  return `M1 1H${w - 1 - r}a${r} ${r} 0 0 1 ${r} ${r}V${h - 1 - r}a${r} ${r} 0 0 1 -${r} ${r}H1Z`;
}

/**
 * Foil as it catches the light: bands of the foil's own colour, brighter and duller, across the
 * whole cover. A band that couldn't be read on this cover (under 3:1) is left at the foil's own colour.
 */
export function foilBands(base: string, cover: string): [number, string][] {
  // Dark lettering on a pale cover keeps to the dark: a bright band there would be a band that can't be read.
  const lift = luminance(base) < 0.2 ? 0.3 : 1;
  const bands: [number, string][] = [
    [0, shade(base, -0.34)],
    [0.16, shade(base, 0.18 * lift)],
    [0.3, shade(base, -0.16)],
    [0.46, shade(base, 0.62 * lift)],
    [0.58, base],
    [0.76, shade(base, -0.3)],
    [0.9, shade(base, 0.3 * lift)],
    [1, shade(base, -0.1)],
  ];
  return bands.map(([offset, colour]) => [offset, contrast(colour, cover) >= 3 ? colour : base]);
}

const foilStops = (base: string, cover: string): string => foilBands(base, cover).map(([offset, colour]) => `<stop offset="${offset}" stop-color="${colour}"/>`).join('');

/**
 * What makes a cover look handled: the grain of its cloth, a slight roll in the board that the
 * light picks out, the fold along the spine, a soft crease or two, and foil pressed into it.
 * All of it is drawn by the browser from a few numbers; none of it is a picture.
 */
function coverFinish(w: number, h: number, colour: string, base: string, id: string): { defs: string; hide: string; marks: string; foil: Foil } {
  const outline = coverOutline(w, h);
  const light = `<feDistantLight azimuth="232" elevation="64"/>`;
  const defs =
    `<defs>` +
    `<linearGradient id="${id}-foil" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${w}" y2="${n(h * 0.72)}">${foilStops(base, colour)}</linearGradient>` +
    `<linearGradient id="${id}-spine" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000000" stop-opacity=".34"/><stop offset=".5" stop-color="#000000" stop-opacity=".1"/><stop offset="1" stop-color="#000000" stop-opacity="0"/></linearGradient>` +
    `<linearGradient id="${id}-fall" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".09"/><stop offset=".45" stop-color="#ffffff" stop-opacity="0"/><stop offset="1" stop-color="#000000" stop-opacity=".2"/></linearGradient>` +
    // The cloth and the roll of the board: two layers of noise, each lit from the upper left.
    `<filter id="${id}-hide" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">` +
    `<feTurbulence type="fractalNoise" baseFrequency="1.5" numOctaves="3" seed="7" result="grain"/>` +
    `<feDiffuseLighting in="grain" surfaceScale="0.9" diffuseConstant="1.12" lighting-color="#ffffff" result="grainLit">${light}</feDiffuseLighting>` +
    `<feTurbulence type="fractalNoise" baseFrequency="0.004 0.0065" numOctaves="2" seed="23" result="roll"/>` +
    `<feDiffuseLighting in="roll" surfaceScale="7" diffuseConstant="1.1" lighting-color="#ffffff" result="rollLit">${light}</feDiffuseLighting>` +
    `<feSpecularLighting in="roll" surfaceScale="7" specularConstant="0.07" specularExponent="26" lighting-color="#ffffff" result="rollShine">${light}</feSpecularLighting>` +
    `<feBlend in="SourceGraphic" in2="grainLit" mode="multiply" result="clothed"/>` +
    `<feBlend in="clothed" in2="rollLit" mode="multiply" result="rolled"/>` +
    `<feComposite in="rollShine" in2="rolled" operator="over" result="lit"/>` +
    `<feComposite in="lit" in2="SourceGraphic" operator="in"/>` +
    `</filter>` +
    // Foil is pressed into the board: a thin shadow under its upper edge, a thin light under its lower.
    `<filter id="${id}-press" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">` +
    `<feOffset in="SourceAlpha" dy="-0.7" result="up"/><feGaussianBlur in="up" stdDeviation="0.4" result="upSoft"/><feFlood flood-color="#000000" flood-opacity=".5"/><feComposite in2="upSoft" operator="in" result="shadow"/>` +
    `<feOffset in="SourceAlpha" dy="0.7" result="down"/><feGaussianBlur in="down" stdDeviation="0.35" result="downSoft"/><feFlood flood-color="#ffffff" flood-opacity=".16"/><feComposite in2="downSoft" operator="in" result="lip"/>` +
    `<feMerge><feMergeNode in="shadow"/><feMergeNode in="lip"/><feMergeNode in="SourceGraphic"/></feMerge>` +
    `</filter>` +
    `</defs>`;
  const crease = (d: string, dx: number, dy: number, depth: number): string =>
    `<path d="${d}" fill="none" stroke="#000000" stroke-opacity="${n(0.22 * depth)}" stroke-width="1" stroke-linecap="round"/>` +
    `<path d="${d}" transform="translate(${dx} ${dy})" fill="none" stroke="#ffffff" stroke-opacity="${n(0.11 * depth)}" stroke-width=".8" stroke-linecap="round"/>`;
  const marks =
    `<g data-part="wear" pointer-events="none">` +
    `<path d="${outline}" fill="url(#${id}-fall)"/>` +
    // The spine, and the fold a little way in from it where the cover bends.
    `<rect x="1" y="1" width="30" height="${h - 2}" fill="url(#${id}-spine)"/>` +
    `<path d="M27 1V${h - 1}" stroke="#000000" stroke-opacity=".3" stroke-width="1.6"/><path d="M28.6 1V${h - 1}" stroke="#ffffff" stroke-opacity=".11" stroke-width=".9"/>` +
    // A corner that has been in a pocket, and a bend from being sat on.
    crease(`M${w - 62} ${h - 1.5}Q${w - 34} ${h - 30} ${w - 1.5} ${h - 58}`, 0.9, 0.9, 1) +
    crease(`M40 ${n(h * 0.712)}Q${n(w * 0.42)} ${n(h * 0.69)} ${w - 10} ${n(h * 0.728)}`, 0, 1, 0.5) +
    `<path d="${outline}" fill="none" stroke="#000000" stroke-opacity=".28" stroke-width="1.2"/>` +
    `</g>`;
  const foil: Foil = {
    paint: `url(#${id}-foil)`,
    maskId: `${id}-own`,
    // Our emblems are drawn in a box of 100 and moved into place, so the foil is moved back to match: one sheet of light over the whole cover.
    inBox: (cx, cy, size) => {
      const k = size / 100;
      return {
        defs: `<linearGradient id="${id}-foil-e" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${w}" y2="${n(h * 0.72)}" gradientTransform="scale(${n(1 / k)}) translate(${n(-(cx - size / 2))} ${n(-(cy - size / 2))})">${foilStops(base, colour)}</linearGradient>`,
        paint: `url(#${id}-foil-e)`,
      };
    },
  };
  return { defs, hide: `<path d="${outline}" fill="${colour}"/><path d="${outline}" fill="${colour}" filter="url(#${id}-hide)"/>`, marks, foil };
}

export function renderCover(design: Design, o: RenderOptions = {}): string {
  const { w, h } = sizes.cover;
  const { cover, state } = design;
  const base = coverInk(cover.colour, cover.foil);
  const finish = coverFinish(w, h, cover.colour, base, prefix(o));
  const foil = finish.foil.paint;
  const two = cover.titles[1].trim().length > 0;
  const titleY = cover.chip ? (two ? 384 : 398) : two ? 404 : 420;
  return (
    open(design, { kind: 'cover' }, w, h, o) +
    finish.defs +
    finish.hide +
    finish.marks +
    `<g data-part="foil" filter="url(#${prefix(o)}-press)">` +
    coverName(state.name, w / 2, foil) +
    device(design, o, w / 2, 236, 152, base, cover.colour, 1, finish.foil) +
    text(cover.titles[0].toUpperCase(), { x: w / 2, y: titleY, size: 31, max: COVER_MEASURE, min: 13, fill: foil, anchor: 'middle', spacing: 6 }) +
    (two ? text(cover.titles[1].toUpperCase(), { x: w / 2, y: titleY + 30, size: 19, max: COVER_MEASURE, min: 10, fill: foil, anchor: 'middle', spacing: 4 }) : '') +
    (cover.chip ? chipSymbol(w / 2, 450, 54, foil) : '') +
    `</g>` +
    `</svg>`
  );
}

/** A label and its value, as on a form. */
function field(label: string, value: string, x: number, y: number, max: number, ink: string, mono = false): string {
  return (
    text(label.toUpperCase(), { x, y, size: 6.4, fill: ink, spacing: 0.6, weight: 600, max }) +
    text(value, { x, y: y + 15, size: 12.5, fill: TEXT_DARK, weight: 600, max, min: 7, family: mono ? MONO : undefined })
  );
}

/** A line of tiny lettering: the state's name, over and over. */
function microtext(name: string, x: number, y: number, w: number, ink: string): string {
  const unit = `${name.trim().toUpperCase()} · `;
  const line = unit.repeat(Math.max(1, Math.ceil(w / 2.1 / Array.from(unit).length))).trim();
  return `<text x="${n(x)}" y="${n(y)}" font-family="system-ui, Arial, sans-serif" font-size="3.2" letter-spacing=".3" textLength="${n(w)}" lengthAdjust="spacingAndGlyphs" fill="${ink}" fill-opacity=".8">${esc(line)}</text>`;
}

/** Paper, rounded at the corners, with the security pattern clipped to it. */
function sheet(design: Design, w: number, h: number, radius: number, id: string, strength = 0.3): string {
  const paper = hexOf(papers, design.papers.paper);
  const ink = hexOf(printInks, design.papers.ink);
  return (
    `<clipPath id="${id}"><rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="${radius}"/></clipPath>` +
    `<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="${radius}" fill="${paper}" stroke="${mix(paper, ink, 0.35)}" stroke-width="1"/>` +
    `<g clip-path="url(#${id})" fill="none" stroke="${ink}" stroke-width=".6" stroke-opacity="${strength}">${drawPattern(design.papers.pattern, w, h, design.papers.seed)}</g>`
  );
}

/** The holder's likeness: one of our drawings, or the visitor's own photograph, with SPECIMEN across it unless they took that off. */
function portraitFrame(design: Design, o: RenderOptions, x: number, y: number, w: number, ink: string): string {
  const paper = hexOf(papers, design.papers.paper);
  const h = w * 1.25;
  const box = `x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}"`;
  const likeness = photoUsed(o)
    ? `<image href="${esc(o.photo!)}" ${box} preserveAspectRatio="xMidYMid slice"/>${photoMarked(o) ? photoSpecimen(x, y, w, h) : ''}`
    : `<svg ${box} viewBox="0 0 100 125">${drawPortrait(design.papers.portrait)}</svg>`;
  return `<rect ${box} fill="${mix(paper, ink, 0.14)}"/>${likeness}<rect ${box} fill="none" stroke="${ink}" stroke-width="1"/>`;
}

export function renderDataPage(design: Design, o: RenderOptions = {}): string {
  const { w, h } = sizes.data;
  const { state, cover, holder, papers: p, calendar } = design;
  const ink = hexOf(printInks, p.ink);
  const paper = hexOf(papers, p.paper);
  const expires = addYears(p.issued, p.years, calendar);
  const titles = cover.titles.map((t) => t.trim()).filter(Boolean).join(' / ').toUpperCase();
  const left = 156;
  const right = 334;
  return (
    open(design, { kind: 'data' }, w, h, o) +
    sheet(design, w, h, 10, `${prefix(o)}-dc`) +
    device(design, o, 408, 172, 150, ink, paper, 0.12) +
    text(state.name.toUpperCase(), { x: 20, y: 28, size: 12, max: 290, min: 7, fill: ink, weight: 700, spacing: 1 }) +
    text(titles, { x: w - 20, y: 28, size: 12, max: 160, min: 6, fill: ink, weight: 700, spacing: 1.5, anchor: 'end' }) +
    `<path d="M20 36H${w - 20}" stroke="${ink}" stroke-width=".8"/>` +
    portraitFrame(design, o, 20, 48, 120, ink) +
    field('Type', 'P', left, 54, 60, ink) +
    field('Document no.', p.number.trim(), right, 54, 146, ink, true) +
    field('Surname', holder.surname.trim(), left, 86, 324, ink) +
    field('Given names', holder.given.trim(), left, 118, 324, ink) +
    field('Nationality', state.demonym.trim(), left, 150, 166, ink) +
    field('Date of birth', formatDate(holder.born, calendar), right, 150, 146, ink) +
    field('Place of birth', holder.birthplace.trim(), left, 182, 324, ink) +
    field('Date of issue', formatDate(p.issued, calendar), left, 214, 166, ink) +
    field('Date of expiry', formatDate(expires, calendar), right, 214, 146, ink) +
    field('Authority', p.authority.trim(), left, 246, 324, ink) +
    text('HOLDER’S SIGNATURE', { x: 20, y: 214, size: 6.4, fill: ink, spacing: 0.6, weight: 600 }) +
    drawSignature(holder.given, holder.surname, 20, 220, 120, 36, TEXT_DARK) +
    microtext(state.name, 20, 276, w - 40, ink) +
    decorativeStrip(12, 284, w - 24, 56, ink) +
    specimenOverprint(w, h) +
    `</svg>`
  );
}

export function renderCardFront(design: Design, o: RenderOptions = {}): string {
  const { w, h } = sizes.card;
  const { state, card, holder, papers: p, calendar } = design;
  const ink = hexOf(printInks, p.ink);
  const paper = hexOf(papers, p.paper);
  const expires = addYears(p.issued, p.years, calendar);
  const titles = card.titles.map((t) => t.trim()).filter(Boolean).join(' / ').toUpperCase();
  const left = 150;
  const right = 318;
  return (
    open(design, { kind: 'cardFront' }, w, h, o) +
    sheet(design, w, h, 16, `${prefix(o)}-fc`) +
    device(design, o, 38, 32, 36, ink, paper) +
    text(state.name.toUpperCase(), { x: 64, y: 28, size: 12.5, max: 390, min: 7, fill: ink, weight: 700, spacing: 1 }) +
    text(titles, { x: 64, y: 44, size: 10, max: 390, min: 6, fill: ink, weight: 600, spacing: 2 }) +
    `<path d="M20 56H${w - 20}" stroke="${ink}" stroke-width=".8"/>` +
    portraitFrame(design, o, 20, 68, 112, ink) +
    field('Surname', holder.surname.trim(), left, 76, 306, ink) +
    field('Given names', holder.given.trim(), left, 108, 306, ink) +
    field('Nationality', state.demonym.trim(), left, 140, 156, ink) +
    field('Date of birth', formatDate(holder.born, calendar), right, 140, 138, ink) +
    field('Card no.', p.number.trim(), left, 172, 156, ink, true) +
    field('Date of expiry', formatDate(expires, calendar), right, 172, 138, ink) +
    text('HOLDER’S SIGNATURE', { x: left, y: 206, size: 6.4, fill: ink, spacing: 0.6, weight: 600 }) +
    drawSignature(holder.given, holder.surname, left, 210, 150, 34, TEXT_DARK) +
    chipSymbol(w - 44, 228, 40, ink) +
    microtext(state.name, 20, 284, w - 40, ink) +
    specimenOverprint(w, h) +
    `</svg>`
  );
}

export function renderCardBack(design: Design, o: RenderOptions = {}): string {
  const { w, h } = sizes.card;
  const { state, holder, papers: p, calendar } = design;
  const ink = hexOf(printInks, p.ink);
  const paper = hexOf(papers, p.paper);
  return (
    open(design, { kind: 'cardBack' }, w, h, o) +
    sheet(design, w, h, 16, `${prefix(o)}-bc`) +
    device(design, o, 250, 104, 150, ink, paper, 0.12) +
    field('Place of birth', holder.birthplace.trim(), 20, 34, 300, ink) +
    field('Date of issue', formatDate(p.issued, calendar), 20, 70, 300, ink) +
    field('Authority', p.authority.trim(), 20, 106, 300, ink) +
    contactPad(w - 110, 34, 84) +
    text('This card is a work of fiction.', { x: 20, y: 160, size: 9, fill: TEXT_DARK, weight: 600, max: 300 }) +
    text(`Issued in the name of ${state.name.trim()}, which isn’t on any map.`, { x: 20, y: 174, size: 7.5, fill: TEXT_DARK, max: w - 40, min: 5 }) +
    microtext(state.name, 20, 196, w - 40, ink) +
    decorativeStrip(12, 206, w - 24, 78, ink) +
    specimenOverprint(w, h) +
    `</svg>`
  );
}

/** Where the jacket stamp sits beside a Moon visa, in the stamp's own units. */
const JACKET_OFFSET = { x: 26, y: 26 };

/** One stamp on its own, with room for its turn. */
export function renderStamp(design: Design, index: number, o: RenderOptions = {}): string {
  const stamp = design.stamps[index];
  const ref: DocumentRef = { kind: 'stamp', index };
  if (!stamp) return `${svgOpen({ width: 100, height: 100, title: 'No such stamp', desc: 'No such stamp.' })}</svg>`;
  const extent = stampExtent(stamp);
  const moon = isMoonVisa(stamp);
  const pad = 14;
  const w = Math.ceil(extent.w + pad * 2 + (moon ? JACKET_OFFSET.x : 0));
  const h = Math.ceil(extent.h + pad * 2 + (moon ? NOTE_BOX.h + JACKET_OFFSET.y : 0));
  const cx = (extent.w + pad * 2) / 2;
  const cy = (extent.h + pad * 2) / 2;
  const ground = o.ground === 'paper' ? `<rect width="${w}" height="${h}" fill="${hexOf(papers, design.papers.paper)}"/>` : '';
  return (
    open(design, ref, w, h, o) +
    ground +
    drawStamp(stamp, cx, cy, { calendar: design.calendar, idPrefix: `${prefix(o)}-s${index}` }) +
    (moon ? noteStamp(MOON_STAMP_TEXT, 'red', 4, cx + JACKET_OFFSET.x, cy + extent.h / 2 + JACKET_OFFSET.y) : '') +
    `</svg>`
  );
}

/** How much smaller a stamp is on the visa page than on its own. */
export const PAGE_SCALE = 0.6;

/** The middle of a stamp on the visa page, in the page's units, from its place in per cent. */
export function stampCentre(x: number, y: number): { cx: number; cy: number } {
  const { w, h } = sizes.page;
  return { cx: 60 + (x / 100) * (w - 120), cy: 78 + (y / 100) * (h - 150) };
}

/** The place in per cent that puts a stamp's middle at a point on the visa page: the reverse of stampCentre. */
export function stampPlace(cx: number, cy: number): { x: number; y: number } {
  const { w, h } = sizes.page;
  const pc = (value: number): number => Math.round(Math.min(100, Math.max(0, value)));
  return { x: pc(((cx - 60) / (w - 120)) * 100), y: pc(((cy - 78) / (h - 150)) * 100) };
}

/**
 * Where the picture of one stamp (as renderStamp draws it) sits on the visa page, in the page's
 * units: so an editor can lay each stamp over a blank page and have it land exactly where
 * renderVisaPage draws it.
 */
export function stampOnPage(design: Design, index: number): { left: number; top: number; width: number; height: number } | null {
  const stamp = design.stamps[index];
  if (!stamp) return null;
  const extent = stampExtent(stamp);
  const moon = isMoonVisa(stamp);
  const pad = 14;
  const width = Math.ceil(extent.w + pad * 2 + (moon ? JACKET_OFFSET.x : 0));
  const height = Math.ceil(extent.h + pad * 2 + (moon ? NOTE_BOX.h + JACKET_OFFSET.y : 0));
  const { cx, cy } = stampCentre(stamp.x, stamp.y);
  return { left: cx - ((extent.w + pad * 2) / 2) * PAGE_SCALE, top: cy - ((extent.h + pad * 2) / 2) * PAGE_SCALE, width: width * PAGE_SCALE, height: height * PAGE_SCALE };
}

/** A visa page of the passport, with every stamp where it was pressed. */
export function renderVisaPage(design: Design, o: RenderOptions = {}): string {
  const { w, h } = sizes.page;
  const ink = hexOf(printInks, design.papers.ink);
  let stamps = '';
  design.stamps.forEach((stamp, index) => {
    const { cx, cy } = stampCentre(stamp.x, stamp.y);
    stamps += drawStamp(stamp, cx, cy, { calendar: design.calendar, idPrefix: `${prefix(o)}-v${index}` }, PAGE_SCALE);
    if (isMoonVisa(stamp)) stamps += noteStamp(MOON_STAMP_TEXT, 'red', 4, cx + JACKET_OFFSET.x * PAGE_SCALE, cy + (stampExtent(stamp).h / 2 + JACKET_OFFSET.y) * PAGE_SCALE, PAGE_SCALE);
  });
  return (
    open(design, { kind: 'visaPage' }, w, h, o) +
    sheet(design, w, h, 10, `${prefix(o)}-vc`, 0.2) +
    text('VISAS', { x: w / 2, y: 30, size: 11, fill: ink, anchor: 'middle', weight: 700, spacing: 4, opacity: 0.8 }) +
    text('7', { x: w / 2, y: h - 16, size: 10, fill: ink, anchor: 'middle', family: MONO, opacity: 0.8 }) +
    stamps +
    `</svg>`
  );
}

/** Any document, by reference. */
export function renderDocument(design: Design, ref: DocumentRef, o: RenderOptions = {}): string {
  switch (ref.kind) {
    case 'cover':
      return renderCover(design, o);
    case 'data':
      return renderDataPage(design, o);
    case 'cardFront':
      return renderCardFront(design, o);
    case 'cardBack':
      return renderCardBack(design, o);
    case 'stamp':
      return renderStamp(design, ref.index, o);
    default:
      return renderVisaPage(design, o);
  }
}

/** Every document a design has, in the order the tool lists them. */
export function documentsOf(design: Design): DocumentRef[] {
  return [
    { kind: 'cover' },
    { kind: 'data' },
    { kind: 'cardFront' },
    { kind: 'cardBack' },
    ...design.stamps.map((_, index): DocumentRef => ({ kind: 'stamp', index })),
    { kind: 'visaPage' },
  ];
}

/**
 * A document set on a plain ground, for the sharing sizes (a link preview, a square, a story):
 * the document as it is, centred, with room around it. The ground's colour is the caller's,
 * from the suite's tokens.
 */
export function renderShare(design: Design, ref: DocumentRef, size: { width: number; height: number }, ground: string, o: RenderOptions = {}): string {
  const inner = renderDocument(design, ref, o);
  const box = /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 ([\d.]+) ([\d.]+)" width="[\d.]+" height="[\d.]+" role="img" aria-label="[^"]*">/.exec(inner);
  const w = Number(box?.[1] ?? 100);
  const h = Number(box?.[2] ?? 100);
  const margin = Math.min(size.width, size.height) * 0.09;
  const scale = Math.min((size.width - margin * 2) / w, (size.height - margin * 2) / h);
  const placed = `<svg x="${n((size.width - w * scale) / 2)}" y="${n((size.height - h * scale) / 2)}" width="${n(w * scale)}" height="${n(h * scale)}" viewBox="0 0 ${n(w)} ${n(h)}">`;
  return (
    svgOpen({ width: size.width, height: size.height, title: titleOf(design, ref), desc: describeDocument(design, ref, describing(design, o)) }) +
    `<rect width="${n(size.width)}" height="${n(size.height)}" fill="${ground}"/>` +
    (box ? placed + inner.slice(box[0].length) : '') +
    `</svg>`
  );
}
