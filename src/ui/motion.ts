/**
 * Whether to hold still: the device asks for reduced motion, or the visitor switched motion off
 * in the footer.
 *
 * The page itself is asked, not the suite's calm(). The shell marks the page when motion is
 * switched off (<html data-motion="still">), at load and at every press of the switch, so that
 * mark is always right. calm() keeps its answer in the script's own memory, and a dev server
 * loads that script twice (once for the shell, once bundled for the designer), so the designer's
 * copy never hears the switch there.
 */
export function still(): boolean {
  if (typeof document === 'undefined') return true;
  return document.documentElement.dataset.motion === 'still' || matchMedia('(prefers-reduced-motion: reduce)').matches;
}
