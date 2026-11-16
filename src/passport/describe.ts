/**
 * Every document in plain words: for Copy description, for screen readers, and as the title and
 * description inside each downloaded picture.
 */
import { colourName, coverColours, coverInk, foils, nameOf, papers, printInks, stampInks } from './colours';
import { addYears, formatDate } from './dates';
import { emblem } from './emblems';
import { isMoonVisa, MOON_STAMP_TEXT } from './fun';
import { stampKindNames, type Design, type DocumentRef, type Stamp } from './model';
import { pattern } from './patterns';
import { describePortrait } from './portraits';
import { borderNames, markNames, shapeNames } from './stamps';

// A name built around a form of state takes "the": the Republic of Teland, the Tidewater League.
const formWord = /\b(republic|kingdom|united|federation|federal|commonwealth|principality|duchy|empire|free city|league|union|confederation|confederacy|sultanate|emirate|emirates|states|isles|islands|realm|dominion|protectorate|cantons|provinces)\b/i;

/** A state's name as it sits in a sentence: "the Republic of Teland", "Calderwyn". */
export function withArticle(name: string): string {
  const plain = name.trim();
  if (/^the\s/i.test(plain)) return plain.replace(/^the/i, 'the');
  return formWord.test(plain) ? `the ${plain}` : plain;
}

/** An office's name as it sits in a sentence: "the Ministry of the Interior". */
export function theOffice(name: string): string {
  const plain = name.trim();
  return /^the\s/i.test(plain) ? plain.replace(/^the/i, 'the') : `the ${plain}`;
}

const lower = (text: string): string => text.charAt(0).toLowerCase() + text.slice(1);

/** A list in words: "a", "a and b", "a, b and c". */
export function listOf(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

function coverColourName(hex: string): string {
  const known = coverColours.find((c) => c.hex === hex.toLowerCase());
  return known ? lower(known.name) : colourName(hex);
}

function foilName(design: Design): string {
  const used = coverInk(design.cover.colour, design.cover.foil);
  const chosen = foils.find((f) => f.hex === used);
  return chosen ? lower(chosen.name) : colourName(used);
}

const titlesOf = (titles: readonly [string, string]): string => listOf(titles.map((t) => t.trim()).filter(Boolean).map((t) => `“${t}”`));

/** The device on the cover, in words. */
function devicePhrase(design: Design, options: DescribeOptions): string {
  if (options.ownEmblem) return 'an emblem of the maker’s own';
  return options.armsUsed ? 'the national arms' : emblem(design.cover.emblem).phrase;
}

/** The likeness on a data page or card, in words. */
function portraitPhrase(design: Design, options: DescribeOptions): string {
  return options.photo ? 'a photograph the maker added, with SPECIMEN across it' : describePortrait(design.papers.portrait);
}

export function describeCover(design: Design, options: DescribeOptions = {}): string {
  const { cover, state } = design;
  const device = devicePhrase(design, options);
  const parts = [`the state’s name at the top`, `${device} in the middle`, `${titlesOf(cover.titles)} below`];
  if (cover.chip) parts.push('a chip symbol at the foot');
  return `Passport cover of ${withArticle(state.name)}. A ${coverColourName(cover.colour)} cover with ${foilName(design)} lettering: ${listOf(parts)}.`;
}

function paperPhrase(design: Design): string {
  const { papers: p } = design;
  const paper = lower(nameOf(papers, p.paper));
  return p.pattern === 'none' ? `${paper} paper, with no pattern` : `${paper} paper with ${pattern(p.pattern).phrase} in ${lower(nameOf(printInks, p.ink))}`;
}

const fullName = (design: Design): string => `${design.holder.given.trim()} ${design.holder.surname.trim()}`.trim();

export function describeDataPage(design: Design, options: DescribeOptions = {}): string {
  const { holder, papers: p, state, calendar } = design;
  const expires = addYears(p.issued, p.years, calendar);
  return (
    `Passport data page of ${withArticle(state.name)}, overprinted SPECIMEN. ` +
    `Holder: ${fullName(design)}, ${state.demonym.trim()}, born ${formatDate(holder.born, calendar)} in ${holder.birthplace.trim()}. ` +
    `Document number ${p.number.trim()}, issued ${formatDate(p.issued, calendar)}, expires ${formatDate(expires, calendar)}, by ${theOffice(p.authority)}. ` +
    `The portrait is ${portraitPhrase(design, options)}. ` +
    `Printed on ${paperPhrase(design)}. ` +
    `Where a real passport has a machine-readable zone, this one has a decorative strip that reads “Fictional · not a travel document”.`
  );
}

export function describeCard(design: Design, side: 'front' | 'back', options: DescribeOptions = {}): string {
  const { holder, papers: p, state, calendar, card } = design;
  const expires = addYears(p.issued, p.years, calendar);
  const head = `Identity card of ${withArticle(state.name)}, ${side}, titled ${titlesOf(card.titles)} and overprinted SPECIMEN. `;
  if (side === 'front') {
    return (
      head +
      `Holder: ${fullName(design)}, ${state.demonym.trim()}, born ${formatDate(holder.born, calendar)}. ` +
      `Card number ${p.number.trim()}, expires ${formatDate(expires, calendar)}. ` +
      `The portrait is ${portraitPhrase(design, options)}. Printed on ${paperPhrase(design)}.`
    );
  }
  return (
    head +
    `Place of birth: ${holder.birthplace.trim()}. Issued ${formatDate(p.issued, calendar)} by ${theOffice(p.authority)}. ` +
    `A drawing of a chip, the line “This card is a work of fiction.”, and a decorative strip that reads “Fictional · not a travel document”. Printed on ${paperPhrase(design)}.`
  );
}

const wearWords = ['crisp', 'lightly worn', 'worn', 'badly worn'] as const;

function turnPhrase(rot: number): string {
  const degrees = Math.round(Math.abs(rot));
  if (degrees === 0) return 'set straight';
  return `turned ${degrees} ${degrees === 1 ? 'degree' : 'degrees'} ${rot < 0 ? 'anticlockwise' : 'clockwise'}`;
}

/** The lines a stamp shows, top to bottom, as they are printed. */
export function stampLines(stamp: Stamp, design: Design): string[] {
  const date = formatDate(stamp.date, design.calendar, stamp.dateStyle);
  return [stamp.top, stamp.label, stamp.place, date, stamp.bottom].map((line) => line.trim().toUpperCase()).filter(Boolean);
}

export function describeStamp(stamp: Stamp, design: Design): string {
  const lines = stampLines(stamp, design).map((line) => `“${line}”`);
  const markPart = stamp.mark === 'none' ? '' : `, with ${stamp.mark === 'aircraft' ? 'an' : 'a'} ${lower(markNames[stamp.mark])}`;
  const moon = isMoonVisa(stamp) ? ` Beside it, a second stamp: “${MOON_STAMP_TEXT.toUpperCase()}”` : '';
  return (
    `${stampKindNames[stamp.kind]} of ${withArticle(design.state.name)}: ${lower(shapeNames[stamp.shape])}, with a ${lower(borderNames[stamp.border])} border, in ${lower(nameOf(stampInks, stamp.ink))} ink, ` +
    `${turnPhrase(stamp.rot)} and ${wearWords[Math.min(3, Math.max(0, Math.round(stamp.wear)))]}. It reads ${listOf(lines)}${markPart}.${moon}`
  );
}

export function describeVisaPage(design: Design): string {
  const count = design.stamps.length;
  if (!count) return `A visa page from a passport of ${withArticle(design.state.name)}, with no stamps yet.`;
  const each = design.stamps.map((s) => `${lower(stampKindNames[s.kind]).replace(' stamp', '')} (${lower(shapeNames[s.shape])}, ${lower(nameOf(stampInks, s.ink))})`);
  const moon = design.stamps.some(isMoonVisa) ? ` One more reads “${MOON_STAMP_TEXT.toUpperCase()}”` : '';
  return `A visa page from a passport of ${withArticle(design.state.name)}, on ${lower(nameOf(papers, design.papers.paper))} paper, with ${count} ${count === 1 ? 'stamp' : 'stamps'}: ${listOf(each)}.${moon}`;
}

export interface DescribeOptions {
  /** Whether the profile's arms are drawn on the cover in place of the emblem. */
  armsUsed?: boolean;
  /** Whether the visitor's own emblem is drawn in place of both. */
  ownEmblem?: boolean;
  /** Whether the visitor's own photograph stands where the drawn portrait would. */
  photo?: boolean;
}

/** A short name for a document: "Passport cover of the Republic of Teland". */
export function titleOf(design: Design, ref: DocumentRef): string {
  const of = `of ${withArticle(design.state.name)}`;
  switch (ref.kind) {
    case 'cover':
      return `Passport cover ${of}`;
    case 'data':
      return `Passport data page ${of} (specimen)`;
    case 'cardFront':
      return `Identity card ${of}, front (specimen)`;
    case 'cardBack':
      return `Identity card ${of}, back (specimen)`;
    case 'stamp': {
      const stamp = design.stamps[ref.index];
      return stamp ? `${stampKindNames[stamp.kind]} ${of}` : `Stamp ${of}`;
    }
    default:
      return `Visa page ${of}`;
  }
}

/** A document in full sentences. */
export function describeDocument(design: Design, ref: DocumentRef, options: DescribeOptions = {}): string {
  switch (ref.kind) {
    case 'cover':
      return describeCover(design, options);
    case 'data':
      return describeDataPage(design, options);
    case 'cardFront':
      return describeCard(design, 'front', options);
    case 'cardBack':
      return describeCard(design, 'back');
    case 'stamp': {
      const stamp = design.stamps[ref.index];
      return stamp ? describeStamp(stamp, design) : 'No such stamp.';
    }
    default:
      return describeVisaPage(design);
  }
}

/** One paragraph on the whole set of papers, for the profile's `summary` (at most 600 characters). */
export function summarise(design: Design, options: DescribeOptions = {}): string {
  const { cover } = design;
  const device = devicePhrase(design, options);
  const count = design.stamps.length;
  const text =
    `A ${coverColourName(cover.colour)} passport with ${foilName(design)} lettering and ${device}, titled ${titlesOf(cover.titles)}. ` +
    `The data page and identity card are on ${paperPhrase(design)}` +
    (count ? `, with ${count} ${count === 1 ? 'stamp' : 'stamps'} to go with them.` : '.');
  return Array.from(text).slice(0, 600).join('');
}
