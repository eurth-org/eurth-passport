/**
 * Naming a picture for what it is. A browser asked for WebP may hand back a PNG instead (Safari
 * does, without saying so); a PNG saved as ".webp" opens in some programs and not in others. So
 * the file is named after what the browser really made, and the person is told when that isn't
 * what they asked for.
 */
export type PictureKind = 'png' | 'webp';

export const WEBP_NOTE = 'This browser can’t make WebP pictures, so this one is a PNG.';
export const PICTURE_ERROR = 'This browser couldn’t make the picture. The SVG download always works.';

const kinds: Record<string, PictureKind> = { 'image/png': 'png', 'image/webp': 'webp' };

/**
 * The file name for a picture, from the name wanted, the kind asked for and the media type the
 * browser made. `note` is something to tell the person, or null when they got what they asked for.
 */
export function pictureFile(name: string, asked: PictureKind, made: string): { filename: string; note: string | null } {
  const kind = kinds[made.toLowerCase().split(';')[0]!.trim()] ?? asked;
  return { filename: `${name}.${kind}`, note: kind === asked ? null : WEBP_NOTE };
}
