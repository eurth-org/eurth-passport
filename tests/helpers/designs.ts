/**
 * Designs for the tests: random ones from a seed, and hostile ones that try every text field.
 */
import { cleanDesign } from '../../src/passport/clean';
import { dateStyles } from '../../src/passport/dates';
import {
  avatarIds,
  clothesIds,
  emblemIds,
  foilIds,
  hairIds,
  paperIds,
  patternIds,
  printInkIds,
  skinIds,
  stampBorders,
  stampInkIds,
  stampKinds,
  stampMarks,
  stampShapes,
  type Design,
  type DocumentRef,
} from '../../src/passport/model';
import { rng, type Rng } from '../../src/passport/random';
import { documentsOf, renderDocument, type RenderOptions } from '../../src/passport/render';

const words = ['Teland', 'Brindle', 'Outer', 'Isles', 'Grand', 'Duchy', 'of', 'the', 'Free', 'City', 'Port', 'Sorrel', 'Ministry', 'Office', 'Guard', 'North', 'Gate', 'Quay', 'Élan', 'Ærø', 'Ünter', 'O’Hara', 'd’Or', '&', 'A&B', '"quoted"', "it's", '東京', 'Ωmega', '7', '90 days'];

const phrase = (r: Rng, max: number): string => {
  const count = r.int(1, 5);
  const out: string[] = [];
  for (let i = 0; i < count; i++) out.push(r.pick(words));
  return out.join(' ').slice(0, max);
};

/** A varied design from a seed. Always passes through cleanDesign, as every real design does. */
export function randomDesign(seed: number): Design {
  const r = rng(seed);
  const own = r.next() < 0.4;
  const months = own ? Array.from({ length: r.int(1, 16) }, (_, i) => ({ name: `${r.pick(words)}month${i}`, days: r.int(1, 60) })) : null;
  const date = (): { d: number; m: number; y: number } => ({ d: r.int(1, 31), m: r.int(1, 12), y: r.int(-200, 3000) });
  const stamps = Array.from({ length: r.int(0, 6) }, () => ({
    kind: r.pick(stampKinds),
    shape: r.pick(stampShapes),
    border: r.pick(stampBorders),
    top: phrase(r, 30),
    label: phrase(r, 16),
    place: phrase(r, 30),
    bottom: phrase(r, 30),
    date: date(),
    dateStyle: r.pick(dateStyles),
    mark: r.pick(stampMarks),
    ink: r.pick(stampInkIds),
    rot: r.range(-15, 15),
    wear: r.int(0, 3),
    x: r.int(0, 100),
    y: r.int(0, 100),
    seed: r.int(0, 999999),
  }));
  return cleanDesign({
    state: { name: phrase(r, 60), demonym: phrase(r, 40) },
    cover: { colour: `#${r.int(0, 0xffffff).toString(16).padStart(6, '0')}`, foil: r.pick(foilIds), emblem: r.pick(emblemIds), arms: r.next() < 0.3, titles: [phrase(r, 30), r.next() < 0.5 ? phrase(r, 30) : ''], chip: r.next() < 0.7 },
    holder: { given: phrase(r, 40), surname: phrase(r, 40), born: date(), birthplace: phrase(r, 40) },
    papers: {
      number: `${r.int(0, 9999999)}`,
      issued: date(),
      years: r.int(1, 20),
      authority: phrase(r, 40),
      portrait: { avatar: r.pick(avatarIds), skin: r.pick(skinIds), hair: r.pick(hairIds), clothes: r.pick(clothesIds) },
      pattern: r.pick(patternIds),
      paper: r.pick(paperIds),
      ink: r.pick(printInkIds),
      seed: r.int(0, 999999),
    },
    card: { titles: [phrase(r, 30), r.next() < 0.5 ? phrase(r, 30) : ''] },
    stamps,
    calendar: months ? { months, era: r.next() < 0.5 ? 'FS' : '' } : null,
  });
}

/** A raw design (not yet cleaned) with the same text in every field that takes text. */
export function everyTextField(text: string): Record<string, unknown> {
  const stamp = (kind: string): Record<string, unknown> => ({ kind, top: text, label: text, place: text, bottom: text, date: { d: 1, m: 1, y: 2000 }, dateStyle: 'long' });
  return {
    state: { name: text, demonym: text },
    cover: { titles: [text, text] },
    holder: { given: text, surname: text, birthplace: text },
    papers: { number: text, authority: text },
    card: { titles: [text, text] },
    stamps: [stamp('entry'), stamp('exit'), stamp('visa')],
    calendar: { months: [{ name: text, days: 30 }, { name: `${text}2`, days: 30 }], era: text },
  };
}

/** Every document of a design, drawn. */
export function drawAll(design: Design, options: RenderOptions = {}): { ref: DocumentRef; svg: string }[] {
  return documentsOf(design).map((ref) => ({ ref, svg: renderDocument(design, ref, options) }));
}

/** The documents the SPECIMEN rule covers. */
export const specimenKinds = ['data', 'cardFront', 'cardBack'] as const;

/**
 * Why an SVG isn't well formed, or an empty list: tags balanced, attributes quoted, no stray
 * brackets, only the five entities the drawing code writes.
 */
export function problems(svg: string): string[] {
  const found: string[] = [];
  const stack: string[] = [];
  const tag = /<(\/?)([A-Za-z][\w:-]*)((?:\s+[\w:-]+="[^"<>]*")*)\s*(\/?)>/g;
  let last = 0;
  for (const match of svg.matchAll(tag)) {
    const between = svg.slice(last, match.index);
    if (/[<>]/.test(between)) found.push(`stray bracket in "${between.slice(0, 40)}"`);
    last = match.index + match[0].length;
    const [, closing, name, , selfClosing] = match;
    if (closing) {
      const open = stack.pop();
      if (open !== name) found.push(`</${name}> closes <${open}>`);
    } else if (!selfClosing) stack.push(name!);
  }
  if (/[<>]/.test(svg.slice(last))) found.push('stray bracket at the end');
  if (stack.length) found.push(`unclosed: ${stack.join(', ')}`);
  if (/&(?!amp;|lt;|gt;|quot;|#39;)/.test(svg)) found.push('a bare ampersand');
  const ids = [...svg.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]!);
  if (new Set(ids).size !== ids.length) found.push('an id used twice');
  for (const ref of svg.matchAll(/(?:url\(#|href="#)([^)"]+)/g)) if (!ids.includes(ref[1]!)) found.push(`a reference to a missing id, ${ref[1]}`);
  return found;
}
