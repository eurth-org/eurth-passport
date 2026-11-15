# Passport

> A friendly note: Passport is part of Eurth's advent calendar, and its door opens on 19 December 2026. The code is public, the site isn't yet. Please don't spoil the surprise before the door opens.

Passport designs papers for nations that don't exist: passport covers and data pages, identity cards, and visa, entry and exit stamps. It is one of the free worldbuilding tools by [Eurth](https://eurth.org), a worldbuilding and roleplay community since 2004, and will live at passport.eurth.org.

It is for fiction only. Every data page and card carries a SPECIMEN overprint that can't be switched off, portraits are drawings, real countries are turned away, and nothing it makes can be read by a machine.

Status: the engine and the words are built and tested; the site comes next. The plan, what's built, and exactly where work stands are in the [roadmap](roadmap.md).

## How it works

- The engine in `src/passport/` is plain TypeScript with no browser or framework in it: a set of papers is data, and one function per document draws it as SVG text. The editor to come, the downloads, the template pages and the tests all use those same functions.
- A design lives in its link (`?d=1.…`), which holds only what differs from the opening design, and in the Eurth profile file, where Passport owns the `passport` section. Nothing is stored anywhere else.
- Whatever arrives from a link or a file is checked and clamped before it is drawn.

## Fiction only

Four rules, none of them a setting, each held by its own tests in `tests/fiction.test.ts`:

1. **SPECIMEN** is drawn last on every data page and card. The model has no field for it.
2. **No photographs.** A portrait is one of our own drawings, picked by id. A profile's arms are used only if they are pure vector drawing.
3. **No real countries.** Not in the templates, and not as an issuing state, a title or a stamp's own line.
4. **Nothing a machine could read.** A decorative strip that says "FICTIONAL · NOT A TRAVEL DOCUMENT" stands where a real passport has its machine-readable zone, and no text field can hold a line that looks like one.

## Where things live

| What | Where |
| --- | --- |
| The model: a design and its closed lists | `src/passport/model.ts` |
| Cleaning whatever arrives | `src/passport/clean.ts` |
| The fiction-only rules | `src/passport/fiction.ts` |
| Real country names and codes (a snapshot) | `src/passport/realworld.ts`, made by `tools/make-realworld.mjs` |
| Colours, contrast, colour names | `src/passport/colours.ts` |
| Emblems, avatars, security patterns | `src/passport/emblems.ts`, `portraits.ts`, `patterns.ts` |
| Stamps | `src/passport/stamps.ts` |
| Drawing each document as SVG | `src/passport/render.ts`, `svg.ts` |
| Descriptions in words | `src/passport/describe.ts` |
| Dates in the world's calendar, holder names | `src/passport/dates.ts`, `names.ts`, `random.ts` |
| The link | `src/passport/link.ts` |
| The profile's `passport` section | `src/passport/profile.ts` |
| Templates, and the Moon | `src/passport/templates.ts`, `fun.ts` |
| Guide, glossary, sources | `src/content/` |
| Tests | `tests/` |

## Adding to it

- **An emblem, avatar, pattern, stamp shape, border or mark:** add its id to the list in `model.ts` and draw it in its module. Tests fail until every id has a drawing and a name.
- **A template:** add it to `src/passport/templates.ts`. A test keeps every name in it clear of the real world.
- **The real-world snapshot:** change `tools/make-realworld.mjs` and run it; don't edit `realworld.ts` by hand.

## Local development

Node 22 or newer.

```bash
npm install
npm run check    # TypeScript
npm test         # unit tests
npm run sheet    # draws every document, emblem, avatar, pattern and stamp to preview/index.html
```

## Credits

Made by Orioni for [Eurth](https://eurth.org). Every emblem, avatar and pattern is drawn by code written for Passport. The guide's sources are listed in `src/content/sources.ts`.

## Licence

Apache 2.0, see [LICENSE](LICENSE).
