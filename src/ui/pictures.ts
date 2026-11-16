/**
 * A visitor's own pictures: an emblem for the cover, a photograph for the data page and card.
 * Each is read in this browser, drawn onto a canvas and kept in memory for the visit. Nothing is
 * sent anywhere, and nothing is stored: not in the link, not in the profile, not in the browser.
 */
import { MAX_PICTURE_LENGTH, MAX_SVG_LENGTH, ownPicture, vectorOnly } from '../passport/fiction';
import { svgDataUrl } from '../passport/render';
import { clearBackground } from './ground';

/** The largest file the tool will open. */
export const MAX_FILE_BYTES = 12 * 1024 * 1024;

export const EMBLEM_FILES = '.svg,.png,.jpg,.jpeg,.webp,.json,image/svg+xml,image/png,image/jpeg,image/webp,application/json';
export const PHOTO_FILES = '.png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp';

/** Said when a file can't be used. Each is a whole sentence for a toast. */
export const TOO_BIG_NOTE = 'That file is too big. Pick one under 12 MB.';
export const NOT_A_PICTURE_NOTE = 'That file couldn’t be read as a picture. Try an SVG, PNG, JPEG or WebP.';
export const NO_ARMS_NOTE = 'That profile has no coat of arms in it yet.';

/** Asks the visitor for one file. Null if they change their mind. */
export function pickFile(accept: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.addEventListener('change', () => resolve(input.files?.[0] ?? null), { once: true });
    input.addEventListener('cancel', () => resolve(null), { once: true });
    input.click();
  });
}

function readDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error(NOT_A_PICTURE_NOTE));
    reader.readAsDataURL(file);
  });
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => (image.naturalWidth > 0 && image.naturalHeight > 0 ? resolve(image) : reject(new Error(NOT_A_PICTURE_NOTE)));
    image.onerror = () => reject(new Error(NOT_A_PICTURE_NOTE));
    image.src = src;
  });
}

/** SVG text with a width and a height on it, taken from its viewBox: Firefox won't draw one on a canvas without. */
export function sized(svg: string): string {
  const root = /<svg\b[^>]*>/i.exec(svg);
  // A width in plain units is a size already. One in per cent ("100%") is not, and is replaced.
  if (!root || /\swidth\s*=\s*["']\s*[\d.]+(?:px)?\s*["']/.test(root[0])) return svg;
  const box = /\sviewBox\s*=\s*["']\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)\s*["']/i.exec(root[0]);
  const [w, h] = box ? [Number(box[1]), Number(box[2])] : [600, 600];
  const bare = root[0].replace(/\s(?:width|height)\s*=\s*(?:"[^"]*"|'[^']*')/gi, '');
  return svg.replace(root[0], bare.replace(/<svg\b/i, `<svg width="${w}" height="${h}"`));
}

/** A picture drawn to fit inside a square of `side`, as a PNG that keeps its clear parts clear. */
function fitted(image: HTMLImageElement, side: number): string {
  const scale = Math.min(1, side / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/png');
}

/** A picture as an emblem the drawing functions will take: smaller until it fits. */
function asEmblem(image: HTMLImageElement): string {
  for (const side of [768, 512, 320, 200]) {
    const picture = fitted(image, side);
    if (ownPicture(picture)) return picture;
  }
  throw new Error(NOT_A_PICTURE_NOTE);
}

/**
 * An emblem from a visitor's file. An SVG that is pure drawing is kept as it is, so it stays
 * sharp at any size; anything else is drawn onto a canvas and kept as a picture. A nation's
 * profile file gives the coat of arms inside it, as Arms saves them.
 */
export async function emblemFromFile(file: File): Promise<string> {
  if (file.size > MAX_FILE_BYTES) throw new Error(TOO_BIG_NOTE);
  const name = file.name.toLowerCase();
  const isJson = name.endsWith('.json') || file.type === 'application/json';
  if (isJson || name.endsWith('.svg') || file.type === 'image/svg+xml') {
    let svg = await file.text();
    if (isJson) {
      let arms: unknown;
      try {
        arms = (JSON.parse(svg) as { arms?: { svg?: unknown } } | null)?.arms?.svg;
      } catch {
        throw new Error(NOT_A_PICTURE_NOTE);
      }
      if (typeof arms !== 'string' || !arms) throw new Error(NO_ARMS_NOTE);
      svg = arms;
    }
    // (Asked of the value, not the variable, so the text stays a text for the lines below.)
    if (vectorOnly(svg as unknown)) return svg;
    if (svg.length > MAX_SVG_LENGTH * 8) throw new Error(TOO_BIG_NOTE);
    return asEmblem(await loadImage(svgDataUrl(sized(svg))));
  }
  return asEmblem(await loadImage(await readDataUrl(file)));
}

/**
 * An emblem with its plain background taken out (see ground.ts): drawn onto a canvas, cleared
 * from the edges inwards, and kept as a PNG. Takes what emblemFromFile gives: SVG text that is
 * pure drawing, or a picture.
 */
export async function withoutBackground(emblem: string): Promise<string> {
  const image = await loadImage(vectorOnly(emblem as unknown) ? svgDataUrl(sized(emblem)) : emblem);
  for (const side of [768, 512, 320, 200]) {
    const scale = Math.min(1, side / Math.max(image.naturalWidth, image.naturalHeight));
    // A drawing has no size of its own to lose, so it is drawn at the full side.
    const grow = vectorOnly(emblem as unknown) ? side / Math.max(image.naturalWidth, image.naturalHeight) : scale;
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * grow));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * grow));
    const context = canvas.getContext('2d')!;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    clearBackground(pixels.data, canvas.width, canvas.height);
    context.putImageData(pixels, 0, 0);
    const picture = canvas.toDataURL('image/png');
    if (ownPicture(picture)) return picture;
  }
  throw new Error(NOT_A_PICTURE_NOTE);
}

/** A photograph from a visitor's file, ready to be cut to size. */
export async function photoFromFile(file: File): Promise<HTMLImageElement> {
  if (file.size > MAX_FILE_BYTES) throw new Error(TOO_BIG_NOTE);
  return loadImage(await readDataUrl(file));
}

/** How a photograph sits in its frame: how far it is enlarged, and which part shows (0 to 1 each way). */
export interface Crop {
  zoom: number;
  x: number;
  y: number;
}

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 4;
export const centred = (): Crop => ({ zoom: 1, x: 0.5, y: 0.3 });

/** How much room a photograph has to move in its frame, as a share of the frame, each way. */
export function slack(image: { naturalWidth: number; naturalHeight: number }, crop: Crop): { x: number; y: number } {
  const cover = Math.max(4 / image.naturalWidth, 5 / image.naturalHeight) * crop.zoom;
  return { x: (image.naturalWidth * cover) / 4 - 1, y: (image.naturalHeight * cover) / 5 - 1 };
}

/** The photograph cut to four by five as the crop says, as a JPEG small enough to sit in a document. */
export function cropPhoto(image: HTMLImageElement, crop: Crop, width = 480): string {
  const height = width * 1.25;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d')!;
  // Paper white behind a picture with clear parts.
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  const room = slack(image, crop);
  const w = width * (1 + room.x);
  const h = height * (1 + room.y);
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, -width * room.x * crop.x, -height * room.y * crop.y, w, h);
  const picture = canvas.toDataURL('image/jpeg', 0.88);
  return picture.length <= MAX_PICTURE_LENGTH ? picture : canvas.toDataURL('image/jpeg', 0.6);
}
