/**
 * Emblems drawn for Passport: a dozen simple devices for a cover, each in one colour, as a real
 * cover is stamped in one foil. Each is drawn in a box of 100 by 100; `bg` is the cover showing
 * through, for the few details that are cut out.
 */
import type { EmblemId } from './model';
import { n } from './random';
import { starPoints } from './svg';

export interface Emblem {
  id: EmblemId;
  name: string;
  /** How a description names it: "a five-pointed star in a ring". */
  phrase: string;
  draw(fg: string, bg: string): string;
}

const polar = (cx: number, cy: number, r: number, degrees: number): [number, number] => {
  const a = (degrees * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
};

const pt = ([x, y]: [number, number]): string => `${n(x)},${n(y)}`;

const sun = (fg: string): string => {
  let rays = '';
  for (let i = 0; i < 12; i++) {
    const a = i * 30 - 90;
    rays += `<polygon points="${pt(polar(50, 50, 24, a - 7))} ${pt(polar(50, 50, 46, a))} ${pt(polar(50, 50, 24, a + 7))}"/>`;
  }
  return `<g fill="${fg}"><circle cx="50" cy="50" r="18"/>${rays}</g>`;
};

const wheel = (fg: string): string => {
  let spokes = '';
  for (let i = 0; i < 8; i++) {
    const a = i * 45;
    const [x1, y1] = polar(50, 50, 8, a);
    const [x2, y2] = polar(50, 50, 40, a);
    spokes += `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}"/>`;
  }
  return `<g fill="none" stroke="${fg}"><circle cx="50" cy="50" r="42" stroke-width="6"/><g stroke-width="4">${spokes}</g></g><circle cx="50" cy="50" r="9" fill="${fg}"/>`;
};

const wreath = (fg: string): string => {
  let leaves = '';
  for (const side of [-1, 1]) {
    for (let i = 0; i < 8; i++) {
      // From the foot of the wreath up each side.
      const a = 90 + side * (18 + i * 19);
      const [x, y] = polar(50, 52, 36, a);
      leaves += `<ellipse cx="${n(x)}" cy="${n(y)}" rx="10" ry="4.2" transform="rotate(${n(a + side * 55)} ${n(x)} ${n(y)})"/>`;
    }
  }
  return `<g fill="${fg}">${leaves}<circle cx="50" cy="89" r="4"/></g>`;
};

const compass = (fg: string, bg: string): string => {
  const long = starPoints(50, 50, 46, 9, 4);
  const short = starPoints(50, 50, 28, 9, 4, Math.PI / 4);
  return `<circle cx="50" cy="50" r="31" fill="none" stroke="${fg}" stroke-width="2.5"/><g fill="${fg}"><polygon points="${short}"/><polygon points="${long}"/></g><circle cx="50" cy="50" r="3.5" fill="${bg}"/>`;
};

export const emblems: readonly Emblem[] = [
  {
    id: 'star',
    name: 'Star in a ring',
    phrase: 'a five-pointed star in a ring',
    draw: (fg) => `<circle cx="50" cy="50" r="46" fill="none" stroke="${fg}" stroke-width="2.5"/><polygon points="${starPoints(50, 52, 33, 12.6, 5)}" fill="${fg}"/>`,
  },
  { id: 'sun', name: 'Sun', phrase: 'a sun with twelve rays', draw: sun },
  {
    id: 'tree',
    name: 'Tree',
    phrase: 'a tree',
    draw: (fg) =>
      `<g fill="${fg}"><circle cx="50" cy="34" r="24"/><circle cx="31" cy="50" r="16"/><circle cx="69" cy="50" r="16"/><path d="M45 52h10v30l8 8H37l8-8z"/></g>`,
  },
  {
    id: 'mountain',
    name: 'Mountain',
    phrase: 'two mountain peaks',
    draw: (fg, bg) =>
      `<g fill="${fg}"><polygon points="8,84 42,20 76,84"/><polygon points="50,84 72,44 94,84"/><rect x="6" y="86" width="88" height="4"/></g>` +
      `<polygon points="42,20 53,41 47,37 42,45 37,37 31,41" fill="${bg}"/>`,
  },
  {
    id: 'anchor',
    name: 'Anchor',
    phrase: 'an anchor',
    draw: (fg) =>
      `<g fill="none" stroke="${fg}" stroke-width="6" stroke-linecap="round"><circle cx="50" cy="17" r="7" stroke-width="4.5"/><path d="M50 25v60M34 38h32M20 60c2 18 16 26 30 26s28-8 30-26"/></g>` +
      `<g fill="${fg}"><polygon points="12,66 20,48 29,64"/><polygon points="71,64 80,48 88,66"/></g>`,
  },
  {
    id: 'lantern',
    name: 'Lantern',
    phrase: 'a lantern',
    draw: (fg) =>
      `<g fill="none" stroke="${fg}" stroke-width="4" stroke-linejoin="round"><path d="M41 22c0-13 18-13 18 0"/><rect x="34" y="32" width="32" height="42"/></g>` +
      `<g fill="${fg}"><polygon points="30,32 50,20 70,32"/><rect x="29" y="74" width="42" height="7" rx="2"/><rect x="38" y="81" width="24" height="5"/><path d="M50 40c8 10 6 24 0 24s-8-14 0-24z"/></g>`,
  },
  { id: 'wheel', name: 'Wheel', phrase: 'a wheel with eight spokes', draw: wheel },
  { id: 'wreath', name: 'Wreath', phrase: 'a wreath of leaves', draw: wreath },
  {
    id: 'crown',
    name: 'Crown',
    phrase: 'a crown',
    draw: (fg, bg) =>
      `<g fill="${fg}"><polygon points="22,64 17,34 34,48 50,26 66,48 83,34 78,64"/><rect x="20" y="67" width="60" height="11" rx="2"/><circle cx="17" cy="30" r="4.5"/><circle cx="50" cy="21" r="4.5"/><circle cx="83" cy="30" r="4.5"/></g>` +
      `<g fill="${bg}"><circle cx="34" cy="72.5" r="2.6"/><circle cx="50" cy="72.5" r="2.6"/><circle cx="66" cy="72.5" r="2.6"/></g>`,
  },
  {
    id: 'key',
    name: 'Key',
    phrase: 'a key',
    draw: (fg) =>
      `<g fill="none" stroke="${fg}" stroke-width="6" stroke-linecap="round"><circle cx="50" cy="24" r="14"/><path d="M50 38v50"/></g><g fill="${fg}"><rect x="52" y="68" width="15" height="6"/><rect x="52" y="80" width="11" height="6"/></g>`,
  },
  {
    id: 'ship',
    name: 'Ship',
    phrase: 'a ship under sail',
    draw: (fg) =>
      `<g fill="${fg}"><path d="M12 64h76L75 80H25z"/><polygon points="47,22 47,59 20,59"/><polygon points="53,28 53,59 79,59"/><polygon points="50,14 63,18.5 50,23"/><rect x="48.5" y="14" width="3" height="50"/></g>` +
      `<path d="M10 90q6.5-7 13 0t13 0t13 0t13 0t13 0t13 0" fill="none" stroke="${fg}" stroke-width="3" stroke-linecap="round"/>`,
  },
  { id: 'compass', name: 'Compass rose', phrase: 'a compass rose', draw: compass },
];

export const emblem = (id: string): Emblem => emblems.find((e) => e.id === id) ?? emblems[0]!;

/**
 * The chip symbol from the mock-up: a small mark on the cover that says the booklet holds a chip.
 * Ours is a simple drawing of our own, centred on (cx, cy).
 */
export function chipSymbol(cx: number, cy: number, width: number, colour: string): string {
  const h = width * 0.64;
  const stroke = Math.max(1.5, width * 0.055);
  return (
    `<g fill="none" stroke="${colour}" stroke-width="${n(stroke)}">` +
    `<rect x="${n(cx - width / 2)}" y="${n(cy - h / 2)}" width="${n(width)}" height="${n(h)}" rx="${n(width * 0.1)}"/>` +
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(h * 0.24)}"/></g>`
  );
}

/** The contact pad drawn on the back of a card: a generic gold square, not any real chip's layout. */
export function contactPad(x: number, y: number, width: number): string {
  const h = width * 0.8;
  const line = `stroke="#8a6d1f" stroke-width="1.2" fill="none"`;
  return (
    `<g><rect x="${n(x)}" y="${n(y)}" width="${n(width)}" height="${n(h)}" rx="${n(width * 0.12)}" fill="#d9b24c" stroke="#8a6d1f" stroke-width="1.2"/>` +
    `<rect x="${n(x + width * 0.34)}" y="${n(y + h * 0.3)}" width="${n(width * 0.32)}" height="${n(h * 0.4)}" rx="${n(width * 0.05)}" ${line}/>` +
    `<path d="M${n(x)} ${n(y + h * 0.5)}h${n(width * 0.34)}M${n(x + width * 0.66)} ${n(y + h * 0.5)}h${n(width * 0.34)}M${n(x + width * 0.5)} ${n(y)}v${n(h * 0.3)}M${n(x + width * 0.5)} ${n(y + h * 0.7)}v${n(h * 0.3)}" ${line}/></g>`
  );
}
