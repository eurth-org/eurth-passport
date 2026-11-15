/**
 * Fiction only, always. Passport makes papers for countries that don't exist, and these are the
 * rules that keep it there. None of them is a setting:
 *
 * 1. SPECIMEN is drawn over every data page and card (see render.ts, which calls specimen()
 *    last; the model has no field that could leave it out).
 * 2. No photographs: a portrait is one of our own drawings, picked by id (see portraits.ts), and
 *    a profile's arms are used only when they are pure vector drawing (vectorOnly, below).
 * 3. No real countries: not in the presets, and not as the issuing state (isRealCountry).
 * 4. No machine-readable zone: a decorative strip that reads as words stands where a real
 *    passport has one, and no text field can hold a line that looks like one (breakLongRuns).
 *
 * The tests in tests/fiction.test.ts hold the tool to each of them.
 */
import { SPECIMEN_RED } from './colours';
import { n } from './random';
import { alpha2, alpha3, countryNames, travelCodes } from './realworld';
import { MONO, SANS, esc, text } from './svg';

/** The overprint. One word, the same on every data page and card. */
export const SPECIMEN_WORD = 'SPECIMEN';

/** What the strip says, where a real passport has its machine-readable zone. */
export const STRIP_TEXT = 'FICTIONAL · NOT A TRAVEL DOCUMENT · FICTIONAL · NOT A TRAVEL DOCUMENT';
export const STRIP_CAPTION = 'Decorative strip. Not machine readable.';

/** Said, kindly, when someone types a real country as the issuing state. */
export const REAL_COUNTRY_NOTE = 'That is a real country. Passport only makes papers for invented ones.';
/** Said when a profile's arms can't be used. */
export const ARMS_NOTE = 'These arms hold a picture or a link, so Passport is using one of its own emblems instead.';

/**
 * The longest unbroken run of letters and digits a text field may hold. A machine-readable line
 * is thirty characters or more with no spaces; nothing typed here can reach that.
 */
export const MAX_RUN = 24;

const span = (from: number, to: number): string => `${String.fromCodePoint(from)}-${String.fromCodePoint(to)}`;
// Markup brackets, control characters, zero-width characters, direction overrides and the
// byte-order mark. Named by number, so that none of them ever sits invisibly in this file.
const UNSAFE = new RegExp(`[<>${span(0x00, 0x1f)}${span(0x7f, 0x9f)}${span(0x200b, 0x200f)}${span(0x202a, 0x202e)}${span(0x2060, 0x2069)}${String.fromCodePoint(0xfeff)}]`, 'g');

/** Text without the characters no document should carry: markup, control codes, and the invisible ones. */
export function stripUnsafe(text: string): string {
  return text.replace(UNSAFE, '');
}

/** Cuts any unbroken run of letters and digits down to MAX_RUN characters. */
export function breakLongRuns(text: string): string {
  return text.replace(/[A-Za-z0-9]+/g, (run) => run.slice(0, MAX_RUN));
}

/** Whether a text holds a run that a document reader could take for a machine-readable line. */
export function hasMachineReadableRun(text: string): boolean {
  return /[A-Z0-9<]{25,}/.test(text.toUpperCase()) || text.includes('<');
}

/** A name as it is compared: lower case, no accents or punctuation, "&" as "and", "St." as "Saint". */
export function normaliseName(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\bst\.?\s/g, 'saint ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/^the\s+/, '');
}

const realNames: ReadonlySet<string> = new Set(countryNames.map(normaliseName));
// The same names with their spaces closed up, so "U.S.A." and "U S A" are caught with "USA".
const realNamesClosed: ReadonlySet<string> = new Set(countryNames.map((name) => normaliseName(name).replace(/ /g, '')));
const realCodes: ReadonlySet<string> = new Set([...alpha2, ...alpha3, ...travelCodes]);

// "Federal Republic of", "People's Democratic Republic of the", "United States of", and so on.
const form =
  /^(?:(?:federal|federated|federative|democratic|people s|peoples|popular|socialist|islamic|arab|united|independent|sovereign|free|plurinational|bolivarian|co operative|cooperative|hashemite|oriental|eastern|grand|holy|most serene)\s+)*(?:republic|republics|kingdom|state|states|commonwealth|principality|duchy|sultanate|emirate|emirates|union|federation|confederation|empire|dominion|territory|nation|country|government|province|provinces|city)\s+of\s+(?:the\s+)?/;

/**
 * Whether a name is a real country's: its everyday name, or that name behind a form of state
 * ("Republic of ...", "Kingdom of the ..."). Whole names only, so "New Francia" is free and
 * "France" is not.
 */
export function isRealCountry(name: string): boolean {
  const plain = normaliseName(name);
  if (!plain) return false;
  if (realNames.has(plain) || realNamesClosed.has(plain.replace(/ /g, ''))) return true;
  const bare = plain.replace(form, '');
  return bare !== plain && (realNames.has(bare) || realNamesClosed.has(bare.replace(/ /g, '')));
}

/** Whether a short code is one a real country or travel document uses. */
export function isRealCode(code: string): boolean {
  return realCodes.has(code.trim().toUpperCase());
}

/** The largest SVG a profile may carry, in characters (as @eurth/profile has it). */
export const MAX_SVG_LENGTH = 524288;

/**
 * Whether an SVG is pure vector drawing: nothing embedded, nothing fetched, nothing that runs.
 * This is what keeps "no photographs" true when a profile's arms go on a cover: an SVG can wrap
 * a photograph, and one that does is turned away. Strict on purpose; when in doubt, it says no.
 */
export function vectorOnly(svg: unknown): svg is string {
  if (typeof svg !== 'string' || svg.length === 0 || svg.length > MAX_SVG_LENGTH) return false;
  if (!/^\s*(?:<\?xml[^>]*\?>\s*)?(?:<!--[\s\S]*?-->\s*)*<svg[\s>]/i.test(svg)) return false;
  // Pictures, pages within pages, scripts, and the doctype tricks that can hide any of them.
  if (/<\s*(?:image|img|foreignObject|script|iframe|object|embed|video|audio|canvas|feImage|a|animate\w*|set|style)\b/i.test(svg)) return false;
  if (/<!(?:DOCTYPE|ENTITY|\[CDATA)/i.test(svg)) return false;
  // No addresses at all, once the namespace declarations are set aside.
  if (/:\/\//.test(svg.replace(/\sxmlns(?::[a-z]+)?\s*=\s*(?:"[^"]*"|'[^']*')/gi, ''))) return false;
  // Every reference must point inside the drawing itself: href="#shape", url(#gradient).
  if (/href\s*=\s*(?:"(?!#)|'(?!#)|[^"'\s])/i.test(svg)) return false;
  if (/url\(\s*(?:"(?!#)|'(?!#)|[^"'#\s])/i.test(svg)) return false;
  if (/data:|javascript:|@import|\bon[a-z]+\s*=/i.test(svg)) return false;
  // Anything written as a character reference could be one of the above in disguise.
  if (/&#/.test(svg)) return false;
  return true;
}

/**
 * The SPECIMEN overprint for a document of w by h: one word across the middle, on a slant, in
 * red, with an outline so it reads on any paper. The drawing functions put it on last, over
 * everything else. It takes no options, on purpose.
 */
export function specimenOverprint(w: number, h: number): string {
  const size = w * 0.15;
  const cx = w / 2;
  const cy = h / 2;
  return (
    `<g data-fiction="specimen" pointer-events="none">` +
    `<text x="${n(cx)}" y="${n(cy + size * 0.36)}" text-anchor="middle" transform="rotate(-24 ${n(cx)} ${n(cy)})" font-family="${SANS}" font-size="${n(size)}" font-weight="800" ` +
    `letter-spacing="${n(size * 0.06)}" textLength="${n(w * 0.8)}" lengthAdjust="spacingAndGlyphs" fill="${SPECIMEN_RED}" fill-opacity=".34" stroke="${SPECIMEN_RED}" stroke-opacity=".8" stroke-width="1.6">${SPECIMEN_WORD}</text></g>`
  );
}

/**
 * The decorative strip, in a band of w by h with its top-left corner at (x, y): where a real
 * document has lines for a machine to read, this has words for a person to read, between two
 * rows of ornament, with a caption that says what it is.
 */
export function decorativeStrip(x: number, y: number, w: number, h: number, ink: string): string {
  let lozenges = '';
  for (const row of [y + h * 0.17, y + h * 0.66]) {
    for (let lx = x + 12; lx <= x + w - 12; lx += 9) lozenges += `M${n(lx)} ${n(row - 2.2)}l2.6 2.2l-2.6 2.2l-2.6-2.2z`;
  }
  return (
    `<g data-fiction="strip"><rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" fill="#ffffff" fill-opacity=".55"/>` +
    `<path d="${lozenges}" fill="${ink}" fill-opacity=".55"/>` +
    `<text x="${n(x + w / 2)}" y="${n(y + h * 0.5)}" text-anchor="middle" font-family="${MONO}" font-size="${n(Math.min(11, h * 0.2))}" font-weight="700" textLength="${n(w - 36)}" lengthAdjust="spacingAndGlyphs" fill="${ink}">${esc(STRIP_TEXT)}</text>` +
    text(STRIP_CAPTION, { x: x + w / 2, y: y + h * 0.92, size: Math.min(6.5, h * 0.13), fill: ink, anchor: 'middle', max: w - 24 }) +
    `</g>`
  );
}
