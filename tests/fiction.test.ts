/**
 * Fiction only, always. These tests hold Passport to its four rules:
 * SPECIMEN on every data page and card, no picture kept (and SPECIMEN across any photograph a
 * visitor adds), no real countries, and nothing a machine could read as a travel document.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { cleanDesign, cleanStateName, cleanText } from '../src/passport/clean';
import { SPECIMEN_RED, contrast, mix, papers } from '../src/passport/colours';
import {
  ARMS_NOTE,
  MAX_PICTURE_LENGTH,
  captionOf,
  MAX_RUN,
  MAX_SVG_LENGTH,
  REAL_COUNTRY_NOTE,
  SPECIMEN_WORD,
  STRIP_CAPTION,
  STRIP_TEXT,
  breakLongRuns,
  hasMachineReadableRun,
  isRealCode,
  isRealCountry,
  normaliseName,
  ownPicture,
  photoSpecimen,
  specimenOverprint,
  stripUnsafe,
  vectorOnly,
} from '../src/passport/fiction';
import { describeDocument } from '../src/passport/describe';
import { compactDesign, decodeDesign, designLink, encodeDesign, expandDesign } from '../src/passport/link';
import { DEFAULT_STATE_NAME, defaultDesign, defaultStamp, type Design } from '../src/passport/model';
import { generateHolder, generateNumber, givenNames, places, surnames } from '../src/passport/names';
import { designFromProfile, nextSection, passportSection, readProfile, withPassport } from '../src/passport/profile';
import { alpha2, alpha3, countryNames, travelCodes } from '../src/passport/realworld';
import { armsUsed, describing, ownEmblemUsed, photoUsed, renderCardBack, renderCardFront, renderCover, renderDataPage, renderDocument, renderShare, sizes } from '../src/passport/render';
import { templates } from '../src/passport/templates';
import { drawAll, everyTextField, problems, randomDesign, specimenKinds } from './helpers/designs';
import { ICAO_SPECIMEN_TD3, checkDigit, mrzFindings, mrzShape, mrzValid, textsOf } from './helpers/mrz';

const calderwyn = JSON.parse(readFileSync(new URL('./fixtures/calderwyn.eurth.json', import.meta.url), 'utf8')) as { arms: { svg: string } };
const SEEDS = Array.from({ length: 300 }, (_, i) => i + 1);
const asLink = (value: unknown): string => `1.${Buffer.from(JSON.stringify(value)).toString('base64url')}`;

const specimenDocs = (design: Design): { name: string; svg: string; w: number; h: number }[] => [
  { name: 'data page', svg: renderDataPage(design), ...sizes.data },
  { name: 'card front', svg: renderCardFront(design), ...sizes.card },
  { name: 'card back', svg: renderCardBack(design), ...sizes.card },
];

describe('rule 1: SPECIMEN on every data page and card, and no way to switch it off', () => {
  it('is the last thing drawn on every data page and card, for 300 designs and every template', () => {
    for (const design of [...SEEDS.map(randomDesign), ...templates.map((t) => t.design)]) {
      for (const doc of specimenDocs(design)) {
        expect(doc.svg.endsWith(`${specimenOverprint(doc.w, doc.h)}</svg>`), doc.name).toBe(true);
        expect(doc.svg.match(/data-fiction="specimen"/g), doc.name).toHaveLength(1);
      }
    }
  });

  it('reads SPECIMEN, large, across the middle of the document', () => {
    expect(SPECIMEN_WORD).toBe('SPECIMEN');
    for (const { w, h } of [sizes.data, sizes.card]) {
      const mark = specimenOverprint(w, h);
      expect(textsOf(mark)).toEqual([SPECIMEN_WORD]);
      expect(Number(/textLength="([\d.]+)"/.exec(mark)![1])).toBeGreaterThanOrEqual(w * 0.8);
      expect(Number(/font-size="([\d.]+)"/.exec(mark)![1])).toBeGreaterThanOrEqual(w * 0.15);
      expect(Number(/ x="([\d.]+)"/.exec(mark)![1])).toBe(w / 2);
      expect(mark).toContain('text-anchor="middle"');
    }
  });

  it('takes the size of the document and nothing else', () => {
    expect(specimenOverprint.length).toBe(2);
    expect(specimenOverprint(500, 352)).toBe(specimenOverprint(500, 352));
  });

  it('can be told from every paper: its outline is 3:1 or better against each tint', () => {
    for (const paper of papers) {
      const outline = mix(paper.hex, SPECIMEN_RED, 0.8);
      expect(contrast(outline, paper.hex), paper.name).toBeGreaterThanOrEqual(3);
    }
  });

  it('has no field in the model, so there is nothing to set', () => {
    const everything = JSON.stringify([defaultDesign(), ...templates.map((t) => t.design)]).toLowerCase();
    for (const word of ['specimen', 'overprint', 'watermark']) expect(everything).not.toContain(word);
  });

  it('ignores every attempt to switch it off, from an object, a link or a profile', () => {
    const off = { specimen: false, overprint: false, showSpecimen: false, fiction: false };
    const hostile = { ...off, state: { name: 'Teland Two', ...off }, papers: { ...off, specimen: 'none' }, card: { ...off }, cover: { ...off }, holder: { ...off } };
    const designs = [
      cleanDesign(hostile),
      expandDesign(hostile),
      decodeDesign(asLink(hostile))!,
      designFromProfile({ meta: { schema: 1, nation: 'Teland Two' }, passport: { design: hostile, ...off } }).design,
    ];
    for (const design of designs) {
      expect(design.state.name).toBe('Teland Two');
      expect(JSON.stringify(design).toLowerCase()).not.toContain('specimen');
      for (const doc of specimenDocs(design)) expect(doc.svg.endsWith(`${specimenOverprint(doc.w, doc.h)}</svg>`), doc.name).toBe(true);
    }
  });

  it('cannot be pushed out of the drawing by text that looks like markup', () => {
    const design = cleanDesign(everyTextField('</text></g></svg><svg><!-- "\'&'));
    for (const doc of specimenDocs(design)) {
      expect(problems(doc.svg), doc.name).toEqual([]);
      expect(doc.svg.endsWith(`${specimenOverprint(doc.w, doc.h)}</svg>`), doc.name).toBe(true);
      expect(doc.svg).not.toContain('<!--');
    }
  });

  it('is drawn by renderDocument too: there is no other way to draw these documents', () => {
    const design = defaultDesign();
    for (const kind of specimenKinds) expect(renderDocument(design, { kind })).toContain('data-fiction="specimen"');
  });
});

// A picture as the tool itself makes one from a visitor's file: tiny, but shaped like the real thing.
const PHOTO = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/yQALCAABAAEBAREA/8wABgAQEAX/2gAIAQEAAD8A0s8g/9k=';
const LOGO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const visitors = { emblem: LOGO, photo: PHOTO };

describe('rule 2: no picture is kept', () => {
  it('draws no picture element in any document of 300 designs when the visitor brings none', () => {
    for (const seed of SEEDS) {
      for (const { ref, svg } of drawAll(randomDesign(seed))) {
        expect(svg, ref.kind).not.toMatch(/<(?:image|img|foreignObject|object|embed|iframe|script|use)\b/);
        // The only addresses are the SVG namespace and references to ids inside the drawing.
        expect(svg.replace(/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/g, ''), ref.kind).not.toMatch(/(?:https?:)?\/\/|data:/);
      }
    }
  });

  it('has no place in a design for a picture: a portrait there is one of its own drawings, by id', () => {
    const tries = ['data:image/png;base64,iVBORw0KGgo=', 'https://example.org/me.jpg', '<image href="x"/>', '../photo.png', 42, null, { src: 'x' }];
    for (const avatar of tries) {
      const design = cleanDesign({ papers: { portrait: { avatar, photo: avatar, src: avatar, image: avatar, href: avatar } }, holder: { photo: avatar, portrait: avatar } });
      expect(design.papers.portrait).toEqual(defaultDesign().papers.portrait);
      expect(Object.keys(design.papers.portrait).sort()).toEqual(['avatar', 'clothes', 'hair', 'skin']);
      expect(Object.keys(design.holder).sort()).toEqual(['birthplace', 'born', 'given', 'surname']);
      expect(renderDataPage(design)).not.toMatch(/<image\b|base64|example\.org/);
    }
  });

  it('shows an address typed into a text field as text, never as something to load', () => {
    const design = cleanDesign(everyTextField('https://example.org/a.png'));
    for (const { ref, svg } of drawAll(design)) {
      expect(svg, ref.kind).not.toMatch(/(?:href|src)="(?!#)/);
      expect(svg, ref.kind).not.toMatch(/<image\b/);
    }
  });

  it('accepts arms that are pure vector drawing', () => {
    expect(vectorOnly(calderwyn.arms.svg)).toBe(true);
    expect(
      vectorOnly(
        '<?xml version="1.0"?>\n<!-- arms -->\n<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 10 10"><defs><linearGradient id="g"><stop offset="0"/></linearGradient><path id="p" d="M0 0h10v10z"/></defs><rect width="10" height="10" fill="url(#g)"/><use href="#p"/><use xlink:href="#p"/></svg>',
      ),
    ).toBe(true);
  });

  it('turns away arms that hold a picture, a link, a script or a disguise', () => {
    const wrap = (inner: string, attrs = ''): string => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"${attrs}>${inner}</svg>`;
    const bad: Record<string, unknown> = {
      'an embedded photograph': wrap('<image href="data:image/jpeg;base64,/9j/4AAQ" width="10" height="10"/>'),
      'a linked photograph': wrap('<image xlink:href="https://example.org/face.jpg"/>'),
      'a spaced-out image tag': wrap('< image href="#a"/>'),
      'an upper-case image tag': wrap('<IMAGE href="x.png"/>'),
      'a filter image': wrap('<filter id="f"><feImage href="face.png"/></filter>'),
      'foreign content': wrap('<foreignObject><img src="face.jpg"/></foreignObject>'),
      'a script': wrap('<script>alert(1)</script>'),
      'a style block': wrap('<style>rect{fill:url(face.png)}</style>'),
      'a background picture in a style attribute': wrap('<rect style="fill:url(https://example.org/p.png)"/>'),
      'a quoted outside pattern': wrap('<rect fill="url(\'face.svg#p\')"/>'),
      'a use of an outside file': wrap('<use href="other.svg#face"/>'),
      'an unquoted outside reference': wrap('<use href=other.svg#face />'),
      'a link': wrap('<a href="#x"><rect/></a>'),
      'an event handler': wrap('<rect onload="x()"/>'),
      'an event handler on the root': wrap('<rect/>', ' onload="x()"'),
      animation: wrap('<rect><animate attributeName="href" to="face.png"/></rect>'),
      'a set element': wrap('<set attributeName="href" to="face.png"/>'),
      'a doctype with entities': `<!DOCTYPE svg [<!ENTITY i "<image href='face.png'/>">]>${wrap('&i;')}`,
      'character references': wrap('<rect fill="&#117;rl(face.png)"/>'),
      'a CDATA section': wrap('<![CDATA[<rect/>]]>'),
      'a data address anywhere': wrap('<rect fill="red" id="data:image/png"/>'),
      'an outside address anywhere': wrap('<text>https://example.org/</text>'),
      'a javascript address': wrap('<rect fill="javascript:alert(1)"/>'),
      'an import': wrap('<rect style="@import x"/>'),
      'something that is not SVG': '<html><svg/></html>',
      'text before the drawing': `hello ${wrap('<rect/>')}`,
      'an empty text': '',
      'a number': 7,
      nothing: null,
      'a drawing that is too large': wrap('<rect/>'.repeat(Math.ceil(MAX_SVG_LENGTH / 7))),
    };
    for (const [what, svg] of Object.entries(bad)) expect(vectorOnly(svg), what).toBe(false);
  });

  it('puts usable arms on the cover as one picture the browser draws but never runs', () => {
    const design = cleanDesign({ cover: { arms: true } });
    const cover = renderCover(design, { arms: calderwyn.arms.svg });
    expect(armsUsed(design, { arms: calderwyn.arms.svg })).toBe(true);
    expect(cover.match(/<image\b/g)).toHaveLength(1);
    expect(cover).toMatch(/<image href="data:image\/svg\+xml;charset=utf-8,%3Csvg/);
    expect(problems(cover)).toEqual([]);
    // The arms' own markup is never written into the document as markup.
    expect(cover).not.toContain('aria-label="Arms of Calderwyn"');
  });

  it('falls back to its own emblem when arms hold a photograph, or when the design does not ask for arms', () => {
    const photo = '<svg xmlns="http://www.w3.org/2000/svg"><image href="data:image/jpeg;base64,/9j/4AAQ"/></svg>';
    const asks = cleanDesign({ cover: { arms: true } });
    expect(armsUsed(asks, { arms: photo })).toBe(false);
    for (const { ref, svg } of drawAll(asks, { arms: photo })) expect(svg, ref.kind).not.toMatch(/<image\b|base64/);
    const doesNotAsk = cleanDesign({ cover: { arms: false } });
    expect(renderCover(doesNotAsk, { arms: calderwyn.arms.svg })).not.toMatch(/<image\b/);
  });

  it('accepts arms as Arms writes them: a credit line with a licence’s address is words, not a link', () => {
    const arms = (desc: string): string =>
      `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 600 720" role="img" aria-label="Azure, a lion Or"><title>Azure, a lion Or</title>${desc}<defs><symbol id="lion" viewBox="0 0 10 10"><path d="M0 0h10v10z"/></symbol></defs><use href="#lion" xlink:href="#lion"/></svg>`;
    const credited = arms('<desc>A blue shield with a gold lion. &quot;Lion&quot; by Sodacan, from Wikimedia Commons, CC BY-SA 3.0 (https://creativecommons.org/licenses/by-sa/3.0/), recoloured.</desc>');
    expect(vectorOnly(credited)).toBe(true);
    expect(readProfile({ meta: { schema: 1, nation: 'Teland' }, arms: { svg: credited } })).toMatchObject({ arms: credited, notes: [] });
    // The credit travels with the arms: the whole drawing, caption and all, is what goes on the cover.
    const href = /<image href="data:image\/svg\+xml;charset=utf-8,([^"]+)"/.exec(renderCover(cleanDesign({ cover: { arms: true } }), { arms: credited }))![1]!;
    expect(decodeURIComponent(href.replace(/&#39;/g, "'"))).toContain('CC BY-SA 3.0 (https://creativecommons.org/licenses/by-sa/3.0/)');
    // And it can be read out, as plain words, to show beside the papers.
    expect(captionOf(credited)).toBe('A blue shield with a gold lion. "Lion" by Sodacan, from Wikimedia Commons, CC BY-SA 3.0 (https://creativecommons.org/licenses/by-sa/3.0/), recoloured.');
    expect(captionOf(arms(''))).toBeNull();
    expect(captionOf(arms('<desc>&lt;b&gt;bold&lt;/b&gt; &amp; plain</desc>'))).toBe('‹b›bold‹/b› & plain');
    expect(captionOf('<svg xmlns="http://www.w3.org/2000/svg"><desc>x</desc><image href="face.jpg"/></svg>')).toBeNull();
    expect(captionOf(LOGO)).toBeNull();
    // Only plain words are let through. Markup in a caption is judged like markup anywhere.
    expect(vectorOnly(arms('<desc><image href="https://example.org/face.jpg"/></desc>'))).toBe(false);
    expect(vectorOnly(arms('<desc>fine</desc><title><a href="https://example.org/">x</a></title>'))).toBe(false);
    expect(vectorOnly(arms('<desc>fine</desc><text>https://example.org/</text>'))).toBe(false);
    expect(vectorOnly(arms('<desc>fine</desc>').replace('aria-label="Azure, a lion Or"', 'aria-label="https://example.org/"'))).toBe(false);
  });

  it('knows a picture of the visitor’s own by its shape: a PNG, JPEG or WebP written out in full, and nothing else', () => {
    for (const good of [PHOTO, LOGO, 'data:image/webp;base64,UklGRhIAAABXRUJQVlA4TAYAAAAvQWxvAGs=']) expect(ownPicture(good), good.slice(0, 30)).toBe(true);
    const bad: Record<string, unknown> = {
      'a web address': 'https://example.org/me.jpg',
      'an address without its scheme': '//example.org/me.jpg',
      'a file name': 'me.jpg',
      'an SVG': 'data:image/svg+xml;base64,PHN2Zy8+',
      'an SVG as text': 'data:image/svg+xml;charset=utf-8,%3Csvg%2F%3E',
      'a page': 'data:text/html;base64,PGI+',
      'a picture with something after it': `${LOGO}" onload="x()`,
      'a picture with a space in it': LOGO.replace('iVBOR', 'iVB OR'),
      'a picture with markup in it': `${LOGO}<script>`,
      'a picture with a setting': 'data:image/png;charset=utf-8;base64,iVBORw0KGgo=',
      'a picture that is not base64': 'data:image/png,%89PNG',
      'a script': 'javascript:alert(1)',
      'a blob': 'blob:https://example.org/1234',
      'an empty text': '',
      'a number': 7,
      'an object': { src: LOGO },
      nothing: null,
      'a picture that is too large': `data:image/png;base64,${'A'.repeat(MAX_PICTURE_LENGTH)}`,
    };
    for (const [what, value] of Object.entries(bad)) expect(ownPicture(value), what).toBe(false);
  });

  it('draws a visitor’s photograph on the data page and the card front, each with SPECIMEN across it', () => {
    const design = defaultDesign();
    const boxes = { data: [20, 48, 120, 150], cardFront: [20, 68, 112, 140] } as const;
    for (const kind of ['data', 'cardFront'] as const) {
      const svg = renderDocument(design, { kind }, { photo: PHOTO });
      expect(svg.match(/<image\b/g), kind).toHaveLength(1);
      expect(svg, kind).toContain(`<image href="${PHOTO}"`);
      const [x, y, w, h] = boxes[kind];
      // The word comes straight after the photograph, over it, and in its box.
      expect(svg, kind).toContain(`preserveAspectRatio="xMidYMid slice"/>${photoSpecimen(x, y, w, h)}`);
      expect(svg.match(/data-fiction="photo-specimen"/g), kind).toHaveLength(1);
      expect(svg, kind).not.toContain('viewBox="0 0 100 125"');
      expect(problems(svg), kind).toEqual([]);
    }
    expect(photoSpecimen(20, 48, 120, 150)).toContain(`>${SPECIMEN_WORD}</text>`);
    expect(photoSpecimen.length).toBe(4);
    // No other document shows the holder, so none shows the photograph.
    for (const kind of ['cover', 'cardBack', 'visaPage'] as const) expect(renderDocument(design, { kind }, { photo: PHOTO }), kind).not.toMatch(/<image\b|photo-specimen/);
    expect(renderDocument(design, { kind: 'stamp', index: 0 }, { photo: PHOTO })).not.toMatch(/<image\b/);
  });

  it('keeps the page’s own overprint last and whole when a photograph is there, in every size', () => {
    for (const design of [...SEEDS.slice(0, 40).map(randomDesign), ...templates.map((t) => t.design)]) {
      for (const kind of ['data', 'cardFront', 'cardBack'] as const) {
        const { w, h } = kind === 'data' ? sizes.data : sizes.card;
        const svg = renderDocument(design, { kind }, visitors);
        expect(svg.endsWith(`${specimenOverprint(w, h)}</svg>`), kind).toBe(true);
        expect(svg.match(/data-fiction="specimen"/g), kind).toHaveLength(1);
      }
    }
    const share = renderShare(defaultDesign(), { kind: 'data' }, { width: 1080, height: 1080 }, '#002b36', visitors);
    expect(share).toContain('data-fiction="specimen"');
    expect(share).toContain('data-fiction="photo-specimen"');
  });

  it('falls back to its own drawing when what is offered as a photograph is anything else', () => {
    const design = defaultDesign();
    const plain = renderDataPage(design);
    for (const photo of ['https://example.org/me.jpg', 'data:image/svg+xml;base64,PHN2Zy8+', `${PHOTO}" onload="x()`, 'javascript:alert(1)', '', null, undefined, 7 as unknown as string]) {
      expect(photoUsed({ photo })).toBe(false);
      expect(renderDataPage(design, { photo })).toBe(plain);
      expect(renderCardFront(design, { photo })).toBe(renderCardFront(design));
    }
  });

  it('puts a visitor’s own emblem where the emblem goes, as one picture the browser draws but never runs', () => {
    const design = cleanDesign({ cover: { arms: true } });
    const vector = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path d="M0 0h10v10z" fill="#c00"/></svg>';
    for (const emblem of [LOGO, vector]) {
      expect(ownEmblemUsed({ emblem })).toBe(true);
      const cover = renderCover(design, { emblem, arms: calderwyn.arms.svg });
      expect(cover.match(/<image\b/g)).toHaveLength(1);
      expect(cover).toContain(emblem === LOGO ? `<image href="${LOGO}"` : '<image href="data:image/svg+xml;charset=utf-8,%3Csvg');
      // It stands in place of the arms as well as of our emblem.
      expect(armsUsed(design, { emblem, arms: calderwyn.arms.svg })).toBe(false);
      expect(cover).not.toContain('pp-foil-e');
      expect(problems(cover)).toEqual([]);
      expect(describeDocument(design, { kind: 'cover' }, describing(design, { emblem }))).toContain('an emblem of the maker’s own in the middle');
    }
    // Stamped in foil: the picture is only a mask, and the foil shows through its outline.
    const stamped = renderCover(design, { emblem: LOGO, emblemFoil: true });
    expect(stamped).toMatch(/<mask id="pp-own" mask-type="alpha"[^>]*><image href="data:image\/png;base64,[^"]+"[^>]*\/><\/mask><rect [^>]*fill="url\(#pp-foil\)" mask="url\(#pp-own\)"\/>/);
    expect(problems(stamped)).toEqual([]);
  });

  it('falls back to the arms or its own emblem when what is offered as an emblem is anything else', () => {
    const design = cleanDesign({ cover: { arms: true } });
    const bad = ['https://example.org/logo.png', 'data:image/svg+xml;base64,PHN2Zy8+', '<svg xmlns="http://www.w3.org/2000/svg"><image href="face.jpg"/></svg>', '<svg xmlns="http://www.w3.org/2000/svg"><script>x()</script></svg>', `${LOGO}"/><script>`, '', null];
    for (const emblem of bad) {
      expect(ownEmblemUsed({ emblem })).toBe(false);
      expect(renderCover(design, { emblem, emblemFoil: true })).toBe(renderCover(design));
      expect(renderCover(design, { emblem, arms: calderwyn.arms.svg })).toBe(renderCover(design, { arms: calderwyn.arms.svg }));
    }
  });

  it('keeps a visitor’s pictures out of everything that is saved: the link, the profile and the design', () => {
    const design = defaultDesign();
    const everywhere = { ...visitors, arms: calderwyn.arms.svg, emblemFoil: true } as Record<string, unknown>;
    const kept = [
      JSON.stringify(compactDesign(design)),
      designLink(design).url,
      encodeDesign(design),
      JSON.stringify(passportSection(design, everywhere)),
      JSON.stringify(nextSection({}, design, everywhere)),
      JSON.stringify(withPassport({ meta: { schema: 1, nation: 'Teland' } }, design, everywhere)),
      JSON.stringify(cleanDesign({ ...design, photo: PHOTO, emblem: LOGO, cover: { ...design.cover, emblem: LOGO, own: LOGO, logo: LOGO }, papers: { ...design.papers, photo: PHOTO } })),
    ];
    for (const text of kept) expect(text).not.toMatch(/base64|data:image\/(?:png|jpeg|webp)/);
    // The cover saved in the profile is the design's own: our emblem, or the profile's arms, never the visitor's picture.
    expect(String(passportSection(design, everywhere).svg)).toBe(renderCover(design, { arms: calderwyn.arms.svg, idPrefix: 'cover' }));
  });

  it('says in words when a photograph or an emblem of the maker’s own is on a document', () => {
    const design = defaultDesign();
    const told = describing(design, visitors);
    expect(told).toEqual({ armsUsed: false, ownEmblem: true, photo: true });
    for (const kind of ['data', 'cardFront'] as const) expect(describeDocument(design, { kind }, told)).toContain('The portrait is a photograph the maker added, with SPECIMEN across it.');
    expect(describeDocument(design, { kind: 'data' })).toContain('a drawing, not a photograph');
    expect(renderDataPage(design, visitors)).toContain('<desc>Passport data page of the Republic of Teland, overprinted SPECIMEN.');
    expect(renderDataPage(design, visitors)).toContain('a photograph the maker added, with SPECIMEN across it');
  });

  it('tells the person, kindly, when a profile’s arms cannot be used', () => {
    const facts = readProfile({ meta: { schema: 1, nation: 'Teland' }, arms: { svg: '<svg xmlns="http://www.w3.org/2000/svg"><image href="face.jpg"/></svg>' } });
    expect(facts.arms).toBeNull();
    expect(facts.notes).toContain(ARMS_NOTE);
    expect(readProfile({ meta: { schema: 1, nation: 'Teland' }, arms: { svg: calderwyn.arms.svg } }).notes).toEqual([]);
  });
});

describe('rule 3: no real countries', () => {
  it('keeps a snapshot of the real world to check against', () => {
    expect(alpha2).toHaveLength(249);
    expect(alpha3).toHaveLength(249);
    expect(new Set(alpha2).size).toBe(249);
    expect(new Set(alpha3).size).toBe(249);
    expect(countryNames.length).toBeGreaterThan(330);
    const known = new Set(countryNames.map(normaliseName));
    for (const name of ['France', 'Japan', 'Brazil', 'Nigeria', 'New Zealand', 'Turkiye', 'Cote d Ivoire']) expect(known.has(normaliseName(name)), name).toBe(true);
    for (const code of ['FR', 'JP', 'FRA', 'JPN', 'D', 'UTO', 'XXA', 'fr', ' jpn ']) expect(isRealCode(code), code).toBe(true);
    for (const code of ['QQ', 'TEL', 'B', 'L', '']) expect(isRealCode(code), code).toBe(false);
    expect(travelCodes).toContain('UNO');
  });

  it('knows a real country by its everyday name, its formal name, and its name in other dress', () => {
    const real = [
      'France', 'france', '  FRANCE ', 'Republic of France', 'French Republic', 'The Netherlands', 'Kingdom of the Netherlands', 'Holland',
      'United States', 'United States of America', 'USA', 'U.S.A.', 'U S A', 'America', 'United Kingdom', 'UK', 'Great Britain', 'England',
      'Côte d’Ivoire', "Cote d'Ivoire", 'Ivory Coast', 'Türkiye', 'Turkey', 'Republic of Türkiye', 'Democratic People’s Republic of Korea', 'North Korea',
      'Republic of Korea', 'Federated States of Micronesia', 'Russian Federation', 'Russia', 'St. Lucia', 'Saint Lucia', 'Bosnia & Herzegovina',
      'Bosnia and Herzegovina', 'People’s Republic of China', 'Federal Republic of Germany', 'Deutschland', 'Commonwealth of Australia', 'State of Israel',
      'Democratic Republic of the Congo', 'Republic of the Congo', 'United Republic of Tanzania', 'Islamic Republic of Iran', 'Grand Duchy of Luxembourg',
      'Principality of Monaco', 'Sultanate of Oman', 'Soviet Union', 'USSR', 'Yugoslavia', 'Holy See', 'Vatican City', 'Georgia', 'Jordan', 'Chad',
      'Myanmar', 'Burma', 'Hong Kong', 'Taiwan', 'Kosovo', 'Palestine', 'São Tomé and Príncipe', 'Sao Tome & Principe',
    ];
    for (const name of real) expect(isRealCountry(name), name).toBe(true);
  });

  it('leaves invented names alone, including ones that only sound real', () => {
    const invented = [
      'Teland', 'Republic of Teland', 'Kingdom of Calderwyn', 'New Francia', 'Georgia Minor', 'Outer Jordan Isles', 'Franceland', 'Chadwick', 'Kingdom of the Two Rivers',
      'United Provinces of Brindle', 'Free City of Brackwater', 'People’s Republic of Dravenhold', 'Republic of', 'Kingdom', '', '   ', 'Eurth', 'Orioni',
    ];
    for (const name of invented) expect(isRealCountry(name), name).toBe(false);
  });

  it('has no real country and no real code anywhere in its presets', () => {
    const lineIsCode = (text: string): boolean => /^[A-Za-z]{1,3}$/.test(text.trim()) && isRealCode(text);
    for (const t of templates) {
      const d = t.design;
      const lines = [t.name, d.state.name, d.state.demonym, ...d.cover.titles, ...d.card.titles, d.holder.given, d.holder.surname, d.holder.birthplace, d.papers.authority, ...d.stamps.flatMap((s) => [s.top, s.label, s.place, s.bottom])];
      for (const line of lines) {
        expect(isRealCountry(line), `${t.id}: ${line}`).toBe(false);
        expect(lineIsCode(line), `${t.id}: ${line}`).toBe(false);
      }
      // The letters that open a document number, where a real document has its country's code.
      const prefix = /^[A-Z]+/.exec(d.papers.number)?.[0];
      if (prefix) expect(isRealCode(prefix), `${t.id}: ${d.papers.number}`).toBe(false);
    }
    const opening = defaultDesign();
    for (const line of [opening.state.name, ...opening.stamps.map((s) => s.top), ...[defaultStamp('visa'), defaultStamp('entry'), defaultStamp('exit')].map((s) => s.top)]) expect(isRealCountry(line), line).toBe(false);
    for (const name of [...givenNames, ...surnames, ...places]) {
      expect(isRealCountry(name), name).toBe(false);
      expect(lineIsCode(name), name).toBe(false);
    }
  });

  it('generates holders and numbers that are clear of the real world too', () => {
    for (let seed = 0; seed < 200; seed++) {
      const holder = generateHolder(seed, { issued: { d: 1, m: 1, y: 2026 } });
      for (const line of [holder.given, holder.surname, holder.birthplace]) expect(isRealCountry(line), line).toBe(false);
      expect(generateNumber(seed)).toMatch(/^[0-9]{7}$/);
    }
  });

  it('declines to print a real country as the issuing state, however it arrives', () => {
    expect(cleanStateName('France')).toBe(DEFAULT_STATE_NAME);
    expect(cleanStateName('Kingdom of Spain')).toBe(DEFAULT_STATE_NAME);
    expect(cleanStateName('Kingdom of Calderwyn')).toBe('Kingdom of Calderwyn');
    expect(cleanDesign({ state: { name: 'Federal Republic of Germany' } }).state.name).toBe(DEFAULT_STATE_NAME);
    expect(expandDesign({ state: { name: 'Japan' } }).state.name).toBe(DEFAULT_STATE_NAME);
    expect(decodeDesign(asLink({ state: { name: 'United States of America' } }))!.state.name).toBe(DEFAULT_STATE_NAME);
    // Even a design object built by hand cannot carry one through the encoder.
    const byHand = { ...defaultDesign(), state: { name: 'Canada', demonym: 'Canadian' } };
    expect(decodeDesign(encodeDesign(byHand))!.state.name).toBe(DEFAULT_STATE_NAME);
  });

  it('declines a real country wherever the issuer speaks: titles, the authority, a stamp’s own lines', () => {
    for (const name of ['France', 'United States of America', 'Kingdom of Sweden', 'Italy']) {
      const design = cleanDesign(everyTextField(name));
      const base = defaultDesign();
      expect(design.state.name).toBe(DEFAULT_STATE_NAME);
      expect(design.cover.titles).toEqual(base.cover.titles);
      expect(design.card.titles).toEqual(base.card.titles);
      expect(design.papers.authority).toBe(base.papers.authority);
      for (const stamp of design.stamps) {
        const fresh = defaultStamp(stamp.kind);
        expect([stamp.top, stamp.label, stamp.bottom]).toEqual([fresh.top, fresh.label, fresh.bottom]);
      }
      // So the cover shows the name nowhere at all.
      const cover = renderCover(design);
      expect(cover.toUpperCase()).not.toContain(name.toUpperCase());
    }
    // A holder may still be called Jordan, and be born in a town called Georgia.
    const person = cleanDesign({ holder: { given: 'Jordan', surname: 'Chad', birthplace: 'Georgia' } });
    expect(person.holder).toMatchObject({ given: 'Jordan', surname: 'Chad', birthplace: 'Georgia' });
  });

  it('tells the person, kindly, when a profile is a real country’s, and uses no name from it that is real', () => {
    const profile = { meta: { schema: 1, nation: 'France' }, identity: { officialName: 'French Republic', commonName: 'France' } };
    const facts = readProfile(profile);
    expect(facts.stateName).toBeNull();
    expect(facts.commonName).toBeNull();
    expect(facts.notes).toContain(REAL_COUNTRY_NOTE);
    const { design } = designFromProfile(profile);
    expect(design.state.name).toBe(DEFAULT_STATE_NAME);
    for (const stamp of design.stamps) expect(isRealCountry(stamp.top)).toBe(false);
  });
});

describe('rule 4: nothing a machine could read', () => {
  it('has a checker that knows a real machine-readable zone when it sees one', () => {
    // The standard's own worked example, so we know the checker would catch the real thing.
    expect(checkDigit('L898902C3')).toBe(6);
    expect(checkDigit('740812')).toBe(2);
    expect(checkDigit('120415')).toBe(9);
    expect(checkDigit('ZE184226B<<<<<')).toBe(1);
    expect(mrzShape(ICAO_SPECIMEN_TD3)).toBe('TD3');
    expect(mrzValid(ICAO_SPECIMEN_TD3)).toBe(true);
    expect(mrzValid([ICAO_SPECIMEN_TD3[0], ICAO_SPECIMEN_TD3[1].replace('L898902C36', 'L898902C37')])).toBe(false);
    expect(mrzFindings(ICAO_SPECIMEN_TD3).length).toBeGreaterThan(0);
    expect(mrzFindings(['P<TELAND'])).toHaveLength(1);
    expect(mrzFindings(['A'.repeat(30)])).toHaveLength(1);
    expect(mrzFindings(['Port of Selun', '19 DEC 2026', 'REPUBLIC OF TELAND'])).toEqual([]);
  });

  it('draws a strip of words where a real document has its zone', () => {
    expect(STRIP_TEXT).toContain('FICTIONAL');
    expect(STRIP_TEXT).toContain('NOT A TRAVEL DOCUMENT');
    expect(STRIP_TEXT).toContain(' ');
    expect(STRIP_TEXT).not.toContain('<');
    expect([30, 36, 44]).not.toContain(STRIP_TEXT.length);
    expect(mrzFindings([STRIP_TEXT])).toEqual([]);
    expect(hasMachineReadableRun(STRIP_TEXT)).toBe(false);
    expect(STRIP_CAPTION).toBe('Decorative strip. Not machine readable.');
    const design = defaultDesign();
    for (const svg of [renderDataPage(design), renderCardBack(design)]) {
      expect(svg.match(/data-fiction="strip"/g)).toHaveLength(1);
      expect(textsOf(svg)).toContain(STRIP_TEXT);
      expect(textsOf(svg)).toContain(STRIP_CAPTION);
    }
  });

  it('draws nothing that looks like a machine-readable zone, in any document of 300 designs and every template', () => {
    for (const design of [...SEEDS.map(randomDesign), ...templates.map((t) => t.design)]) {
      for (const { ref, svg } of drawAll(design)) expect(mrzFindings(textsOf(svg)), ref.kind).toEqual([]);
    }
  });

  it('removes the filler character from everything typed, and breaks any run long enough to be a line', () => {
    expect(cleanText('P<UTOERIKSSON<<ANNA', 60)).toBe('PUTOERIKSSONANNA');
    expect(stripUnsafe('a<b>c')).toBe('abc');
    expect(cleanText('A'.repeat(60), 60)).toBe('A'.repeat(MAX_RUN));
    expect(breakLongRuns(`${'A1'.repeat(30)} ok ${'b'.repeat(40)}`)).toBe(`${'A1'.repeat(12)} ok ${'b'.repeat(24)}`);
    expect(MAX_RUN).toBeLessThan(30);
    expect(hasMachineReadableRun('L898902C36UTO7408122F1204159ZE184226B')).toBe(true);
    expect(hasMachineReadableRun('P<TELAND')).toBe(true);
    expect(hasMachineReadableRun('Port of Selun')).toBe(false);
  });

  it('cannot be made to draw a zone by typing one into every field', () => {
    const attempts = [
      ICAO_SPECIMEN_TD3[0],
      ICAO_SPECIMEN_TD3[1],
      ICAO_SPECIMEN_TD3[1].replace(/</g, '0'),
      'L898902C36UTO7408122F1204159ZE184226B1234510',
      'I<UTOD231458907<<<<<<<<<<<<<<<',
      '7408122F1204159UTO<<<<<<<<<<<6',
      'l898902c36uto7408122f1204159ze184226b1234510',
      'ERIKSSON<<ANNA<MARIA<<<<<<<<<<',
    ];
    for (const attempt of attempts) {
      const design = cleanDesign(everyTextField(attempt));
      for (const { ref, svg } of drawAll(design)) {
        const texts = textsOf(svg);
        expect(mrzFindings(texts), `${ref.kind}: ${attempt}`).toEqual([]);
        for (const text of texts) {
          expect(text, ref.kind).not.toContain('<');
          expect(/[A-Z0-9]{25,}/.test(text.toUpperCase()), `${ref.kind}: "${text}"`).toBe(false);
        }
        expect(problems(svg), ref.kind).toEqual([]);
      }
    }
  });

  it('cannot be made to draw a zone through a link or a profile either', () => {
    const raw = everyTextField(ICAO_SPECIMEN_TD3[1]);
    const fromLink = decodeDesign(asLink(raw))!;
    const fromProfile = designFromProfile({
      meta: { schema: 1, nation: ICAO_SPECIMEN_TD3[1] },
      identity: { officialName: ICAO_SPECIMEN_TD3[0], commonName: ICAO_SPECIMEN_TD3[1], demonym: ICAO_SPECIMEN_TD3[1], capital: ICAO_SPECIMEN_TD3[1] },
      names: { people: [ICAO_SPECIMEN_TD3[0]], surnames: [ICAO_SPECIMEN_TD3[1]], places: [ICAO_SPECIMEN_TD3[1]] },
      calendar: { months: [{ name: ICAO_SPECIMEN_TD3[1], days: 30 }], era: ICAO_SPECIMEN_TD3[1] },
    }).design;
    for (const design of [fromLink, fromProfile]) {
      for (const { ref, svg } of drawAll(design)) expect(mrzFindings(textsOf(svg)), ref.kind).toEqual([]);
    }
  });

  it('uses only the device’s ordinary fonts: no reader’s typeface is named anywhere', () => {
    for (const { svg } of drawAll(defaultDesign())) {
      const families = [...svg.matchAll(/font-family="([^"]+)"/g)].map((m) => m[1]);
      expect(families.length).toBeGreaterThan(0);
      for (const family of families) expect(['system-ui, Arial, sans-serif', 'ui-monospace, Menlo, monospace']).toContain(family);
    }
  });

  it('keeps all knowledge of the real format out of the tool itself', () => {
    // The checker lives in tests/helpers/mrz.ts. Nothing that draws computes a check digit.
    for (const file of ['fiction', 'render', 'clean', 'stamps']) {
      const source = readFileSync(new URL(`../src/passport/${file}.ts`, import.meta.url), 'utf8');
      expect(source, file).not.toMatch(/checkDigit|check digit|TD3|\[7, ?3, ?1\]/i);
    }
  });
});
