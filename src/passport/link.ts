/**
 * A design lives in its link: the query string holds everything, so sharing papers is sharing a
 * link, and nothing is kept on a server. Only what differs from the opening design is written,
 * as compact JSON in base64url, behind a version number: ?p=1.eyJzdGF0ZSI6...
 *
 * Whatever arrives is checked and clamped before it is drawn: a link is someone else's input.
 */
import { cleanDesign } from './clean';
import { defaultDesign, defaultStamp, stampKinds, type Design, type StampKind } from './model';

export const LINK_VERSION = 1;
export const LINK_PARAM = 'p';
/** The profile's limit for a section's link; past this, the profile file carries the design itself. */
export const MAX_LINK_LENGTH = 4000;
export const SITE = 'https://passport.eurth.org/';
/** Nothing longer than this is even read. */
const MAX_INPUT = 24000;

type Bag = Record<string, unknown>;
const isBag = (value: unknown): value is Bag => typeof value === 'object' && value !== null && !Array.isArray(value);

function same(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((item, i) => same(item, b[i]));
  if (isBag(a) && isBag(b)) {
    const keys = Object.keys(a);
    return keys.length === Object.keys(b).length && keys.every((key) => same(a[key], b[key]));
  }
  return false;
}

/** What in `value` differs from `base`, or undefined when nothing does. */
function difference(value: unknown, base: unknown): unknown {
  if (same(value, base)) return undefined;
  if (!isBag(value) || !isBag(base)) return value;
  const out: Bag = {};
  for (const key of Object.keys(value)) {
    const d = difference(value[key], base[key]);
    if (d !== undefined) out[key] = d;
  }
  return out;
}

/** `patch` laid over `base`. Lists are taken whole. */
function overlay(base: unknown, patch: unknown): unknown {
  if (!isBag(base) || !isBag(patch)) return patch === undefined ? base : patch;
  const out: Bag = { ...base };
  for (const key of Object.keys(patch)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
    out[key] = overlay(base[key], patch[key]);
  }
  return out;
}

/** The design as the smallest plain object that brings it back: only what differs from the opening design. */
export function compactDesign(design: Design): Record<string, unknown> {
  const clean = cleanDesign(design);
  const base = defaultDesign();
  const out = (difference({ ...clean, stamps: undefined }, { ...base, stamps: undefined }) ?? {}) as Bag;
  delete out.stamps;
  if (!same(clean.stamps, base.stamps)) {
    out.stamps = clean.stamps.map((stamp) => ({ ...((difference(stamp, defaultStamp(stamp.kind)) as Bag | undefined) ?? {}), kind: stamp.kind }));
  }
  return out;
}

/** A design from its compact form (or from anything else: the result is always safe to draw). */
export function expandDesign(compact: unknown): Design {
  const patch = isBag(compact) ? compact : {};
  const merged = overlay(defaultDesign(), { ...patch, stamps: undefined }) as Bag;
  if (Array.isArray(patch.stamps)) {
    merged.stamps = patch.stamps.map((item) => {
      const kind: StampKind = isBag(item) && stampKinds.includes(item.kind as StampKind) ? (item.kind as StampKind) : 'entry';
      return overlay(defaultStamp(kind), item);
    });
  }
  return cleanDesign(merged);
}

const toBase64Url = (text: string): string => {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const fromBase64Url = (text: string): string => {
  const bin = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
  return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(bin, (ch) => ch.charCodeAt(0)));
};

/** The value of the link's parameter: the version, a full stop, and the design. */
export function encodeDesign(design: Design): string {
  return `${LINK_VERSION}.${toBase64Url(JSON.stringify(compactDesign(design)))}`;
}

/** A design from the parameter's value, or null when it isn't one this version can read. */
export function decodeDesign(value: string): Design | null {
  if (typeof value !== 'string' || value.length > MAX_INPUT) return null;
  const dot = value.indexOf('.');
  if (dot < 1 || value.slice(0, dot) !== String(LINK_VERSION)) return null;
  const body = value.slice(dot + 1);
  if (!/^[A-Za-z0-9_-]*$/.test(body)) return null;
  try {
    const parsed: unknown = JSON.parse(fromBase64Url(body));
    return isBag(parsed) ? expandDesign(parsed) : null;
  } catch {
    return null;
  }
}

/** The query string for a design: "?p=1.…", or an empty string for the opening design. */
export function toQuery(design: Design): string {
  const compact = compactDesign(design);
  return Object.keys(compact).length ? `?${LINK_PARAM}=${encodeDesign(design)}` : '';
}

/** The design a query string holds, or null when it holds none. */
export function fromQuery(search: string): Design | null {
  const value = new URLSearchParams(search.replace(/^\?/, '')).get(LINK_PARAM);
  return value ? decodeDesign(value) : null;
}

/** The whole link, and whether it is short enough to travel in a profile. */
export function designLink(design: Design, site: string = SITE): { url: string; fits: boolean } {
  const url = `${site}${toQuery(design)}`;
  return { url, fits: url.length <= MAX_LINK_LENGTH };
}

/** The design a link to Passport holds. A link to anywhere else is never read. */
export function fromLink(link: unknown, site: string = SITE): Design | null {
  if (typeof link !== 'string' || !link.startsWith(site) || link.length > MAX_INPUT) return null;
  const query = link.indexOf('?');
  if (query < 0) return null;
  return fromQuery(link.slice(query).split('#')[0]!);
}
