/**
 * Portraits: our own flat drawings, built from a few parts. A holder's portrait is always one of
 * these, picked by id. A visitor may lay their own photograph over it for the visit (see
 * fiction.ts); the design itself never holds one.
 *
 * Each is drawn in a box of 100 by 125 (four to five, as a passport photograph is), looking
 * straight ahead with a neutral face, as the rules for such photographs ask.
 */
import { hexOf, shade, type Named } from './colours';
import type { AvatarId, ClothesId, HairId, Portrait, SkinId } from './model';

/** Skin tones, light to deep. They differ in lightness, so they can be told apart without colour. */
export const skins: readonly Named<SkinId>[] = [
  { id: 'porcelain', name: 'Porcelain', hex: '#f6dccb' },
  { id: 'fair', name: 'Fair', hex: '#ecc4a4' },
  { id: 'honey', name: 'Honey', hex: '#d9a67c' },
  { id: 'olive', name: 'Olive', hex: '#b98558' },
  { id: 'umber', name: 'Umber', hex: '#8a5a3a' },
  { id: 'ebony', name: 'Ebony', hex: '#5a3a26' },
];

export const hairColours: readonly Named<HairId>[] = [
  { id: 'black', name: 'Black', hex: '#1e1a18' },
  { id: 'brown', name: 'Brown', hex: '#5a3b24' },
  { id: 'auburn', name: 'Auburn', hex: '#8c4a26' },
  { id: 'blond', name: 'Blond', hex: '#d8b56a' },
  { id: 'grey', name: 'Grey', hex: '#8f9196' },
  { id: 'white', name: 'White', hex: '#e6e4de' },
];

export const clothesColours: readonly Named<ClothesId>[] = [
  { id: 'navy', name: 'Navy', hex: '#24385e' },
  { id: 'forest', name: 'Forest green', hex: '#2f5a40' },
  { id: 'wine', name: 'Wine', hex: '#6e2438' },
  { id: 'charcoal', name: 'Charcoal', hex: '#3a3d42' },
  { id: 'sand', name: 'Sand', hex: '#b9a077' },
];

type Hair = 'short' | 'bob' | 'long' | 'curls' | 'bun' | 'none' | 'sides' | 'braids' | 'ponytail';
type Collar = 'round' | 'shirt' | 'tie' | 'vneck' | 'hood' | 'cardigan';

export interface Avatar {
  id: AvatarId;
  name: string;
  /** In words, for descriptions and screen readers. */
  phrase: string;
  hair: Hair;
  collar: Collar;
  beard?: 'full' | 'moustache';
  glasses?: boolean;
  headwear?: 'scarf' | 'cap';
}

export const avatars: readonly Avatar[] = [
  { id: 'short', name: 'Short hair', phrase: 'short hair and a round-necked jumper', hair: 'short', collar: 'round' },
  { id: 'bob', name: 'Bob', phrase: 'a chin-length bob and a collared shirt', hair: 'bob', collar: 'shirt' },
  { id: 'long', name: 'Long hair', phrase: 'long hair and a V-necked top', hair: 'long', collar: 'vneck' },
  { id: 'curls', name: 'Curls', phrase: 'a cloud of curls and a plain jumper', hair: 'curls', collar: 'round' },
  { id: 'bun', name: 'Bun', phrase: 'hair in a bun and a collared shirt', hair: 'bun', collar: 'shirt' },
  { id: 'beard', name: 'Beard', phrase: 'a bald head, a full beard and a jumper', hair: 'none', collar: 'round', beard: 'full' },
  { id: 'glasses', name: 'Glasses', phrase: 'short hair, round glasses, a shirt and tie', hair: 'short', collar: 'tie', glasses: true },
  { id: 'scarf', name: 'Headscarf', phrase: 'a headscarf and a plain top', hair: 'none', collar: 'round', headwear: 'scarf' },
  { id: 'cap', name: 'Flat cap', phrase: 'a flat cap, a moustache and a collared shirt', hair: 'short', collar: 'shirt', beard: 'moustache', headwear: 'cap' },
  { id: 'braids', name: 'Braids', phrase: 'two braids and a V-necked top', hair: 'braids', collar: 'vneck' },
  { id: 'elder', name: 'Thinning hair', phrase: 'thinning hair, glasses and a cardigan', hair: 'sides', collar: 'cardigan', glasses: true },
  { id: 'ponytail', name: 'Ponytail', phrase: 'a ponytail and a hooded top', hair: 'ponytail', collar: 'hood' },
];

export const avatar = (id: string): Avatar => avatars.find((a) => a.id === id) ?? avatars[0]!;

const SHIRT = '#f4f1ea';

function backHair(kind: Hair, colour: string): string {
  switch (kind) {
    case 'bob':
      return `<path d="M23 50C20 14 80 14 77 50v24c0 5-9 5-9 0l-36 0c0 5-9 5-9 0z" fill="${colour}"/>`;
    case 'long':
      return `<path d="M22 50C19 12 81 12 78 50l5 52H17z" fill="${colour}"/>`;
    case 'curls': {
      let puffs = '';
      const spots: [number, number, number][] = [[26, 44, 11], [30, 28, 12], [42, 17, 12], [58, 17, 12], [70, 28, 12], [74, 44, 11], [24, 58, 9], [76, 58, 9], [50, 14, 11]];
      for (const [x, y, r] of spots) puffs += `<circle cx="${x}" cy="${y}" r="${r}"/>`;
      return `<g fill="${colour}">${puffs}</g>`;
    }
    case 'bun':
      return `<circle cx="50" cy="17" r="10" fill="${colour}"/>`;
    case 'braids': {
      let plaits = '';
      for (const x of [25, 75]) for (let i = 0; i < 6; i++) plaits += `<ellipse cx="${x + (i % 2 ? 1.5 : -1.5) * (x < 50 ? 1 : -1)}" cy="${62 + i * 8}" rx="5.5" ry="5"/>`;
      return `<g fill="${colour}">${plaits}</g>`;
    }
    case 'ponytail':
      return `<path d="M68 30c22-2 24 34 12 56c1-20-3-34-14-44z" fill="${colour}"/>`;
    default:
      return '';
  }
}

function frontHair(kind: Hair, colour: string): string {
  switch (kind) {
    case 'short':
    case 'bun':
    case 'ponytail':
    case 'braids':
      return `<path d="M27 52C23 22 77 22 73 52c-3-11-10-17-23-17s-20 6-23 17z" fill="${colour}"/>`;
    case 'bob':
    case 'long':
      return `<path d="M27 54C22 20 78 20 73 54c-2-12-8-19-14-21c-10 5-24 6-30 16z" fill="${colour}"/>`;
    case 'curls':
      return `<path d="M28 46C28 26 72 26 72 46c-6-9-14-12-22-12s-16 3-22 12z" fill="${colour}"/>`;
    case 'sides':
      return `<g fill="${colour}"><path d="M27 54c-3-10 0-20 6-25c-2 8-2 16-1 24z"/><path d="M73 54c3-10 0-20-6-25c2 8 2 16 1 24z"/></g>`;
    default:
      return '';
  }
}

function clothing(kind: Collar, colour: string, skin: string): string {
  const body = `<path d="M4 125c0-22 16-31 36-35h20c20 4 36 13 36 35z" fill="${colour}"/>`;
  const dark = shade(colour, -0.25);
  switch (kind) {
    case 'shirt':
      return `${body}<g fill="${SHIRT}"><polygon points="40,89 50,103 41,109 35,93"/><polygon points="60,89 50,103 59,109 65,93"/></g>`;
    case 'tie':
      return `${body}<g fill="${SHIRT}"><polygon points="38,89 62,89 56,125 44,125"/></g><polygon points="47,99 53,99 55,125 45,125" fill="${dark}"/><g fill="${SHIRT}" stroke="${dark}" stroke-width=".6"><polygon points="40,89 50,101 42,107 35,93"/><polygon points="60,89 50,101 58,107 65,93"/></g>`;
    case 'vneck':
      return `${body}<polygon points="40,89 60,89 50,108" fill="${skin}"/>`;
    case 'hood':
      return `<path d="M26 96c-4-18 6-34 24-34s28 16 24 34z" fill="${dark}"/>${body}<path d="M45 101v16M55 101v16" stroke="${SHIRT}" stroke-width="1.6" stroke-linecap="round"/>`;
    case 'cardigan':
      return `${body}<polygon points="40,89 60,89 54,125 46,125" fill="${SHIRT}"/><path d="M40 89l8 36M60 89l-8 36" stroke="${dark}" stroke-width="1.5" fill="none"/>`;
    default:
      return `${body}<path d="M39 90c3 7 19 7 22 0" fill="none" stroke="${dark}" stroke-width="2.5"/>`;
  }
}

/** A portrait as SVG markup, in a box of 100 by 125. */
export function drawPortrait(portrait: Portrait): string {
  const who = avatar(portrait.avatar);
  const skin = hexOf(skins, portrait.skin);
  const hair = hexOf(hairColours, portrait.hair);
  const clothes = hexOf(clothesColours, portrait.clothes);
  const line = shade(skin, -0.5);
  const shadow = shade(skin, -0.14);
  const scarfColour = shade(clothes, 0.18);

  const parts: string[] = [];
  parts.push(backHair(who.hair, hair));
  if (who.headwear === 'scarf') parts.push(`<path d="M22 52C19 12 81 12 78 52c2 24-6 40-14 46H36c-8-6-16-22-14-46z" fill="${scarfColour}"/>`);
  parts.push(clothing(who.collar, clothes, skin));
  // Neck, with the shadow of the chin.
  parts.push(`<path d="M41 70h18v19c-4 5-14 5-18 0z" fill="${skin}"/><path d="M41 76c5 6 13 6 18 0v-6H41z" fill="${shadow}"/>`);
  if (who.headwear !== 'scarf') parts.push(`<g fill="${skin}"><circle cx="27.5" cy="56" r="4.5"/><circle cx="72.5" cy="56" r="4.5"/></g>`);
  parts.push(`<ellipse cx="50" cy="53" rx="22" ry="27" fill="${skin}"/>`);
  if (who.headwear === 'scarf') {
    // The scarf frames the face.
    parts.push(`<path d="M22 52C19 12 81 12 78 52c0-22-12-30-28-30S22 30 22 52z" fill="${scarfColour}"/><path d="M27 60c2 16 12 24 23 24s21-8 23-24c2 20-8 34-23 34s-25-14-23-34z" fill="${scarfColour}"/>`);
  }
  if (who.beard === 'full') parts.push(`<path d="M28 56c1 30 13 32 22 32s21-2 22-32c-4 10-12 15-22 15s-18-5-22-15z" fill="${hair}"/>`);
  parts.push(frontHair(who.hair, hair));
  if (who.headwear === 'cap') parts.push(`<path d="M25 40c0-24 50-24 50 0z" fill="${shade(clothes, -0.1)}"/><path d="M24 39h60c2 0 2 5 0 5H24z" fill="${shade(clothes, -0.3)}"/>`);
  // The face: level eyes, a hint of a nose, a mouth that isn't smiling.
  parts.push(
    `<g fill="${line}"><circle cx="41" cy="55" r="2.1"/><circle cx="59" cy="55" r="2.1"/></g>` +
      `<g fill="none" stroke="${line}" stroke-linecap="round"><path d="M36.5 49.500q4.5-2.2 9 0M54.5 49.500q4.5-2.2 9 0" stroke-width="1.5"/><path d="M50 58l-2.5 7.500h4.5" stroke-width="1.2" stroke-linejoin="round"/>` +
      `<path d="M44.5 71.500q5.5 1.8 11 0" stroke-width="1.6"/></g>`,
  );
  if (who.beard === 'moustache') parts.push(`<path d="M41 69c3-5 7-5 9-2c2-3 6-3 9 2c-4-1-7-1-9 0c-2-1-5-1-9 0z" fill="${hair}"/>`);
  if (who.glasses) parts.push(`<g fill="none" stroke="${shade(line, -0.3)}" stroke-width="1.5"><circle cx="41" cy="55" r="6.5"/><circle cx="59" cy="55" r="6.5"/><path d="M47.5 55h5M34.5 54l-6-1.500M65.5 54l6-1.5"/></g>`);
  return parts.join('');
}

/** A portrait in words: "A drawing: a chin-length bob and a collared shirt." */
export function describePortrait(portrait: Portrait): string {
  return `a drawing, not a photograph: ${avatar(portrait.avatar).phrase}`;
}
