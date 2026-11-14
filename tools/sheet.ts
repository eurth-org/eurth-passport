/**
 * A contact sheet: every document, emblem, avatar, pattern and stamp on a few plain pages, to
 * look the drawings over before the site exists.
 *
 *   npm run sheet      then open preview/index.html
 *
 * It runs through Vitest only because that is the TypeScript runner this project already has.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { test } from 'vitest';
import { cleanDesign } from '../src/passport/clean';
import { coverColours } from '../src/passport/colours';
import { avatarIds, clothesIds, defaultDesign, emblemIds, hairIds, patternIds, skinIds, stampBorders, stampInkIds, stampMarks, stampShapes, type Design } from '../src/passport/model';
import { documentsOf, renderCardBack, renderCardFront, renderCover, renderDataPage, renderDocument, renderStamp, renderVisaPage } from '../src/passport/render';
import { templates } from '../src/passport/templates';

const page = (title: string, body: string): string =>
  `<!doctype html><meta charset="utf-8"><title>${title}</title><style>body{margin:16px;background:#e8e8e8;font:14px system-ui,sans-serif;color:#222}h2{margin:18px 0 8px}div.row{display:flex;flex-wrap:wrap;gap:12px;align-items:flex-start}figure{margin:0}figcaption{font-size:11px;margin-top:2px}svg{display:block;height:auto}</style><h1>${title}</h1>${body}`;

const fig = (svg: string, caption: string, width: number): string => `<figure style="width:${width}px">${svg.replace('<svg ', `<svg style="width:${width}px" `)}<figcaption>${caption}</figcaption></figure>`;

const tweak = (change: (d: Design) => void): Design => {
  const d = defaultDesign();
  change(d);
  return cleanDesign(d);
};

test('write the contact sheet', () => {
  mkdirSync('preview', { recursive: true });
  let id = 0;
  const next = (): string => `k${id++}`;

  const base = defaultDesign();
  let docs = '<div class="row">';
  for (const ref of documentsOf(base)) docs += fig(renderDocument(base, ref, { idPrefix: next() }), ref.kind, ref.kind === 'cover' || ref.kind === 'visaPage' ? 300 : ref.kind === 'stamp' ? 220 : 480);
  docs += '</div>';
  writeFileSync('preview/documents.html', page('Documents', docs));

  let covers = '<div class="row">';
  emblemIds.forEach((emblem, i) => {
    const d = tweak((x) => {
      x.cover.emblem = emblem;
      x.cover.colour = coverColours[i % coverColours.length]!.hex;
      x.cover.foil = (['gold', 'silver', 'white'] as const)[i % 3]!;
      if (i % 4 === 1) x.cover.titles = ['Passport', 'Reisepas'];
      if (i % 5 === 2) x.cover.chip = false;
    });
    covers += fig(renderCover(d, { idPrefix: next() }), emblem, 180);
  });
  covers += '</div>';
  writeFileSync('preview/covers.html', page('Covers and emblems', covers));

  let people = '<div class="row">';
  avatarIds.forEach((avatar, i) => {
    const d = tweak((x) => {
      x.papers.portrait = { avatar, skin: skinIds[i % skinIds.length]!, hair: hairIds[i % hairIds.length]!, clothes: clothesIds[i % clothesIds.length]! };
      x.papers.pattern = patternIds[i % patternIds.length]!;
      x.papers.paper = (['ivory', 'blue', 'green', 'rose', 'grey'] as const)[i % 5]!;
      x.papers.ink = (['blue', 'green', 'plum', 'brown', 'slate'] as const)[i % 5]!;
      x.papers.seed = i * 7 + 1;
    });
    people += fig(renderDataPage(d, { idPrefix: next() }), `${avatar} / ${d.papers.pattern}`, 380);
  });
  people += '</div>';
  writeFileSync('preview/pages.html', page('Data pages: avatars and patterns', people));

  let cards = '<div class="row">';
  avatarIds.slice(0, 4).forEach((avatar, i) => {
    const d = tweak((x) => {
      x.papers.portrait.avatar = avatar;
      x.papers.pattern = patternIds[(i + 1) % patternIds.length]!;
      x.papers.paper = (['blue', 'green', 'rose', 'grey'] as const)[i]!;
    });
    cards += fig(renderCardFront(d, { idPrefix: next() }), 'front', 380) + fig(renderCardBack(d, { idPrefix: next() }), 'back', 380);
  });
  cards += '</div>';
  writeFileSync('preview/cards.html', page('Identity cards', cards));

  let stamps = '<div class="row">';
  stampShapes.forEach((shape, i) => {
    stampBorders.forEach((border, j) => {
      const d = tweak((x) => {
        const s = x.stamps[0]!;
        s.shape = shape;
        s.border = border;
        s.ink = stampInkIds[(i + j) % stampInkIds.length]!;
        s.mark = stampMarks[(i + j) % stampMarks.length]!;
        s.wear = j % 4;
        s.rot = (j - 2) * 4;
        s.seed = i * 10 + j;
        s.kind = (['entry', 'exit', 'visa'] as const)[j % 3]!;
        s.label = (['Entry', 'Exit', 'Visa'] as const)[j % 3]!;
      });
      stamps += fig(renderStamp(d, 0, { idPrefix: next(), ground: 'paper' }), `${shape} / ${border} / wear ${j % 4}`, 200);
    });
  });
  const moon = tweak((x) => {
    x.stamps[2]!.place = 'Valid for the Moon';
  });
  stamps += fig(renderStamp(moon, 2, { idPrefix: next(), ground: 'paper' }), 'a visa for the Moon', 240) + fig(renderVisaPage(moon, { idPrefix: next() }), 'its page', 300);
  stamps += '</div>';
  writeFileSync('preview/stamps.html', page('Stamps', stamps));

  const long = tweak((x) => {
    x.state.name = 'Most Serene Federated Commonwealth of the Outer Brindle Isles';
    x.state.demonym = 'Outer Brindle Islander of the Commonwealth';
    x.cover.titles = ['Passport of the Commonwealth', 'Reispas van het Gemenebest'];
    x.card.titles = ['National identity card', 'Nationale identiteitskaart'];
    x.holder.given = 'Maximiliana Wilhelmina Theodora Anastasia';
    x.holder.surname = 'Featherstonehaugh-Cholmondeley-Marjoribanks';
    x.holder.birthplace = 'Llanfairpwll-on-the-Water-under-Wychwood';
    x.papers.authority = 'Ministry of Internal Affairs and Borders';
    x.papers.number = 'AB-1234567-Z';
    x.calendar = { months: [{ name: 'Month of the Long Lanterns', days: 40 }], era: 'AFTERFALL' };
    for (const s of x.stamps) {
      s.top = 'Outer Brindle Isles Commonwealth';
      s.place = 'Port of Saint Wilhelmina North';
      s.bottom = 'Immigration and Customs Office';
      s.label = 'Admitted today';
      s.dateStyle = 'long';
    }
  });
  let stress = '<div class="row">';
  for (const ref of documentsOf(long)) stress += fig(renderDocument(long, ref, { idPrefix: next(), ground: 'paper' }), ref.kind, ref.kind === 'cover' || ref.kind === 'visaPage' ? 300 : ref.kind === 'stamp' ? 220 : 480);
  stress += '</div>';
  writeFileSync('preview/long.html', page('Long text', stress));

  let sets = '';
  for (const t of templates) {
    sets += `<h2>${t.name}</h2><div class="row">`;
    for (const ref of documentsOf(t.design)) sets += fig(renderDocument(t.design, ref, { idPrefix: next(), ground: 'paper' }), ref.kind, ref.kind === 'cover' || ref.kind === 'visaPage' ? 170 : ref.kind === 'stamp' ? 130 : 270);
    sets += '</div>';
  }
  writeFileSync('preview/templates.html', page('Templates', sets));

  writeFileSync('preview/index.html', page('Passport: contact sheets', ['documents', 'covers', 'pages', 'cards', 'stamps', 'long', 'templates'].map((p) => `<p><a href="${p}.html">${p}</a></p>`).join('')));
});
