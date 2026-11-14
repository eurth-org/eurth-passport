/**
 * The words: the guide, the glossary and the list of sources. They are data for the pages to
 * come, so they are held to a shape, to the house style, and to what the tool really does.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { glossary } from '../src/content/glossary';
import { sources } from '../src/content/sources';
import { SPECIMEN_WORD, STRIP_CAPTION, STRIP_TEXT } from '../src/passport/fiction';

const raw = readFileSync(new URL('../src/content/guide.md', import.meta.url), 'utf8');
const front = /^---\n([\s\S]*?)\n---\n/.exec(raw)!;
const meta = Object.fromEntries(
  front[1]!.split('\n').map((line) => {
    const colon = line.indexOf(':');
    return [line.slice(0, colon).trim(), line.slice(colon + 1).trim().replace(/^"|"$/g, '')];
  }),
) as Record<string, string>;
const body = raw.slice(front[0].length);
const headings = [...body.matchAll(/^## (.+)$/gm)].map((m) => m[1]!);
const lastSection = body.slice(body.lastIndexOf('\n## '));
const plain = (text: string): string => text.toLowerCase().replace(/[^a-z0-9]/g, '');

describe('the guide', () => {
  it('has a title, a short description and the date it was last updated', () => {
    expect(meta.title!.length).toBeGreaterThan(10);
    expect(meta.description!.length).toBeGreaterThan(50);
    expect(meta.description!.length).toBeLessThan(160);
    expect(meta.updated).toMatch(/^2026-\d{2}-\d{2}$/);
    expect(Number.isNaN(Date.parse(meta.updated!))).toBe(false);
  });

  it('covers what the brief asks for, in order', () => {
    expect(headings).toEqual([
      'How a passport is laid out',
      'Security features and what they are for',
      'Identity cards',
      'Stamps and visas',
      'A short history of the passport',
      'Designing papers for a fictional state',
      'Why Passport is for fiction only',
    ]);
    // The page supplies the main heading.
    expect(body).not.toMatch(/^# /m);
    const words = body.replace(/[#*_>`-]/g, ' ').split(/\s+/).filter(Boolean).length;
    expect(words).toBeGreaterThan(1800);
    expect(words).toBeLessThan(3200);
  });

  it('says why Passport is for fiction only, with the tool’s own four rules and its own words', () => {
    expect(lastSection).toContain(SPECIMEN_WORD);
    expect(lastSection).toContain('cannot be switched off');
    expect(lastSection).toMatch(/no photo uploads/i);
    expect(lastSection).toMatch(/no real countries/i);
    expect(lastSection).toMatch(/no machine-readable zone/i);
    expect(lastSection).toContain(STRIP_TEXT.split(' · ').slice(0, 2).join(' · '));
    expect(lastSection).toContain(STRIP_CAPTION);
    expect(lastSection).toMatch(/Real identity documents protect real people/);
  });

  it('explains what a machine-readable zone is for without saying how to make one', () => {
    expect(body).toMatch(/machine-readable zone/i);
    expect(body).not.toMatch(/check digit|<<|\b(30|36|44) characters|\bTD[123]\b|OCR-B/i);
  });

  it('keeps to the house style: British spelling, sentence-case headings, no dashes for commas, no emoji', () => {
    expect(body).not.toMatch(/\bcolor\b|\bcolors\b|\bcenter\b|\bgray\b|\borganiz|\brecogniz|\bcatalog\b|\btraveler|\blicense\b/i);
    expect(raw).not.toMatch(/[—\u{1F300}-\u{1FAFF}]/u);
    for (const heading of headings) {
      const capitals = heading.split(' ').slice(1).filter((word) => /^[A-Z]/.test(word));
      expect(capitals.filter((word) => word !== 'Passport'), heading).toEqual([]);
    }
  });

  it('tells its history with dates the sources carry', () => {
    for (const year of ['1414', '1920', '1922', '1980', '1998']) expect(body, year).toContain(year);
    expect(body).toMatch(/League of Nations/);
    expect(body).toMatch(/Nansen/);
  });
});

describe('the glossary', () => {
  it('defines about forty terms, each once', () => {
    expect(glossary.length).toBeGreaterThanOrEqual(40);
    expect(glossary.length).toBeLessThanOrEqual(60);
    expect(new Set(glossary.map((t) => t.id)).size).toBe(glossary.length);
    expect(new Set(glossary.map((t) => t.term.toLowerCase())).size).toBe(glossary.length);
  });

  it('is in alphabetical order, with an anchor made from each term', () => {
    const order = glossary.map((t) => plain(t.term));
    expect(order).toEqual([...order].sort());
    for (const t of glossary) {
      expect(t.id, t.term).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(plain(t.id), t.term).toBe(plain(t.term));
    }
  });

  it('defines each in one to three plain sentences', () => {
    for (const t of glossary) {
      expect(t.definition.length, t.term).toBeGreaterThan(40);
      expect(t.definition.length, t.term).toBeLessThan(520);
      expect(t.definition, t.term).toMatch(/^[A-Z].*[.”)]$/s);
      expect(t.definition, t.term).not.toMatch(/[<>*_`\[\]—]|https?:/);
      const sentences = t.definition.split(/(?<=[.!?])\s+(?=[A-Z“])/).length;
      expect(sentences, t.term).toBeLessThanOrEqual(4);
    }
  });

  it('points only to terms that exist, and never to itself', () => {
    const ids = new Set(glossary.map((t) => t.id));
    for (const t of glossary) {
      for (const see of t.see ?? []) {
        expect(ids.has(see), `${t.term} → ${see}`).toBe(true);
        expect(see, t.term).not.toBe(t.id);
      }
      expect(new Set(t.see ?? []).size, t.term).toBe((t.see ?? []).length);
    }
  });

  it('covers the words the tool itself uses', () => {
    const ids = new Set(glossary.map((t) => t.id));
    for (const id of ['specimen', 'machine-readable-zone', 'guilloche', 'data-page', 'cover', 'visa', 'entry-stamp', 'exit-stamp', 'identity-card', 'chip-symbol', 'portrait', 'overprint', 'security-pattern', 'microprint']) expect(ids.has(id), id).toBe(true);
  });
});

describe('the sources', () => {
  it('lists eight to fourteen, each with a title, an author and what the guide takes from it', () => {
    expect(sources.length).toBeGreaterThanOrEqual(8);
    expect(sources.length).toBeLessThanOrEqual(14);
    expect(new Set(sources.map((s) => s.id)).size).toBe(sources.length);
    for (const s of sources) {
      expect(s.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(s.title.length, s.id).toBeGreaterThan(8);
      expect(s.author.length, s.id).toBeGreaterThan(2);
      expect(s.note.length, s.id).toBeGreaterThan(20);
      expect(s.note, s.id).toMatch(/\.$/);
      if (s.year !== undefined) {
        expect(s.year, s.id).toBeGreaterThanOrEqual(1900);
        expect(s.year, s.id).toBeLessThanOrEqual(2026);
      }
    }
  });

  it('links over https, or not at all', () => {
    const urls = sources.map((s) => s.url).filter((url): url is string => url !== undefined);
    expect(urls.length).toBeGreaterThanOrEqual(6);
    expect(new Set(urls).size).toBe(urls.length);
    for (const url of urls) {
      expect(url).toMatch(/^https:\/\/[a-z0-9.-]+\.[a-z]{2,}\/\S*$/);
      expect(() => new URL(url)).not.toThrow();
    }
  });

  it('includes the standards the guide leans on', () => {
    const ids = sources.map((s) => s.id);
    expect(ids).toContain('icao-doc-9303');
    expect(ids).toContain('iso-iec-7810');
    expect(ids).toContain('prado-glossary');
    expect(sources.some((s) => /Torpey/.test(s.author))).toBe(true);
  });
});
