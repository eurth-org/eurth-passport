/**
 * Taking the plain background out of a picture: for a visitor's own emblem that comes on a
 * square of colour, so that only the emblem itself is pressed into the cover.
 *
 * Plain sums over a picture's pixels, with nothing of the browser in them, so they can be tested.
 */

/** How far a pixel's colour may be from the background's and still count as background (0 to 765). */
export const GROUND_TOLERANCE = 54;

/**
 * Makes the background of a picture clear, in place. The background is whatever is joined to
 * the picture's edge in the colour of its corners: it is found by spreading inwards from the
 * edge, so a patch of the same colour inside the emblem (the black of a shield on a black
 * square) is left alone. `data` is four numbers a pixel: red, green, blue, alpha.
 * Returns how many pixels were cleared.
 */
export function clearBackground(data: Uint8ClampedArray, width: number, height: number, tolerance = GROUND_TOLERANCE): number {
  if (width < 1 || height < 1 || data.length < width * height * 4) return 0;
  // The background's colour: the one most of the four corners agree on (the first, if none do).
  const corners = [0, width - 1, (height - 1) * width, height * width - 1].map((p) => [data[p * 4]!, data[p * 4 + 1]!, data[p * 4 + 2]!, data[p * 4 + 3]!] as const);
  const near = (a: readonly number[], b: readonly number[]): boolean => Math.abs(a[0]! - b[0]!) + Math.abs(a[1]! - b[1]!) + Math.abs(a[2]! - b[2]!) <= tolerance;
  const ground = corners.reduce((best, c) => (corners.filter((o) => near(o, c)).length > corners.filter((o) => near(o, best)).length ? c : best), corners[0]!);
  // Already clear at the corners: there is no background to take out.
  if (ground[3] < 16) return 0;

  const isGround = (p: number): boolean => data[p * 4 + 3]! >= 16 && near([data[p * 4]!, data[p * 4 + 1]!, data[p * 4 + 2]!], ground);
  const seen = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;
  const visit = (p: number): void => {
    if (seen[p] === 0 && isGround(p)) {
      seen[p] = 1;
      queue[tail++] = p;
    }
  };
  for (let x = 0; x < width; x++) {
    visit(x);
    visit((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    visit(y * width);
    visit(y * width + width - 1);
  }
  while (head < tail) {
    const p = queue[head++]!;
    data[p * 4 + 3] = 0;
    const x = p % width;
    if (x > 0) visit(p - 1);
    if (x < width - 1) visit(p + 1);
    if (p >= width) visit(p - width);
    if (p < (height - 1) * width) visit(p + width);
  }
  return tail;
}
