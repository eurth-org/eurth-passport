# Passport

> A friendly note: Passport is part of Eurth's advent calendar, and its door opens on 19 December 2026. The code is public, the site isn't yet. Please don't spoil the surprise before the door opens.

Passport designs papers for nations that don't exist: passport covers and data pages, identity cards, and visa, entry and exit stamps. It is one of the free worldbuilding tools by [Eurth](https://eurth.org), a worldbuilding and roleplay community since 2004, and will live at passport.eurth.org.

It is for fiction only. Every data page and card carries a SPECIMEN overprint that can't be switched off, no picture of yours is kept, real countries are turned away, and nothing it makes can be read by a machine.

Status: built, waiting for its door. What's built, what's next and what's not planned are in the [roadmap](roadmap.md).

## Using it

- **Pick a document** with the tabs: the cover, the data page, the card's front or back, or the stamps.
- **Name your state** and change what you like, or press **Random** for a whole invented one. "New holder" invents a person. The portrait is one of Passport's own drawings, or a photograph of your own that you crop and move; the cover takes one of our emblems, your nation's arms from its profile, or an emblem of your own (arms made in Arms work as they are). Your own pictures stay in the browser for the visit.
- **Stamps:** add a visa, entry or exit stamp, pick one on the page to change it, and drag it (or use the arrow keys) to place it.
- **Keep it:** the link in the address bar holds all the papers. Download each document as SVG, PNG or WebP, or save your nation's profile file, which the other Eurth tools read. Loading a profile brings its name, arms, names and calendar.

## How it works

- A static site built with Astro; the designer is a Svelte component that wakes up in the browser. There is no account and no server-side code.
- The engine in `src/passport/` is plain TypeScript with no browser or framework in it: a set of papers is data, and one function per document draws it as SVG text. The designer, the downloads, the template pages (at build time), the sharing image and the tests all use those same functions.
- A design lives in its link (`?d=1.…`), which holds only what differs from the opening design, and in the Eurth profile file, where Passport owns the `passport` section. Nothing is stored anywhere else.
- Whatever arrives from a link or a file is checked and clamped before it is drawn. Documents are shown as pictures, never put into the page as markup.
- The look, the header and footer, sharing, offline use and the checks come from [@eurth/style](https://style.eurth.org); its handbook is in `node_modules/@eurth/style/HANDBOOK.md`.

## Fiction only

Four rules, none of them a setting, each held by its own tests in `tests/fiction.test.ts`:

1. **SPECIMEN** is drawn last on every data page and card. The model has no field for it.
2. **No picture is kept.** A portrait in a design is one of our own drawings, picked by id, and a profile's arms are used only if they are pure vector drawing. A visitor's own emblem or photograph is handed to the drawing beside the design for the visit, never inside it, so no link or profile can hold one. A photograph has SPECIMEN across it too unless the visitor switches that one mark off; the page's own overprint is rule 1 and has no switch.
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
| Random: a whole invented state | `src/passport/invent.ts` |
| The holder's signature, written from their name | `src/passport/signature.ts` |
| The link | `src/passport/link.ts` |
| The profile's `passport` section | `src/passport/profile.ts` |
| Templates, and the Moon | `src/passport/templates.ts`, `fun.ts` |
| Guide, glossary, sources | `src/content/` |
| The designer: state, link, profile, downloads | `src/ui/Designer.svelte` |
| Controls for the cover, the papers and a stamp | `src/ui/CoverControls.svelte`, `PapersControls.svelte`, `StampControls.svelte` |
| A visitor's own emblem and photograph: reading the file, cropping | `src/ui/pictures.ts`, `PhotoControls.svelte` |
| An on/off pill with the suite's tick; holding still when motion is off | `src/ui/Toggle.svelte`, `motion.ts` |
| The visa page on screen: picking and dragging stamps | `src/ui/VisaPage.svelte` |
| Pages: designer, templates, guide, glossary, 404 | `src/pages/` |
| Name, address, title, pages | `eurth.config.mjs` |
| The door's time | `LAUNCH_AT` |
| Icons and the sharing image | `tools/make-images.mjs` |
| Tests | `tests/` |

## Adding to it

- **An emblem, avatar, pattern, stamp shape, border or mark:** add its id to the list in `model.ts` and draw it in its module. Tests fail until every id has a drawing and a name.
- **A template:** add it to `src/passport/templates.ts`. A test keeps every name in it clear of the real world.
- **The real-world snapshot:** change `tools/make-realworld.mjs` and run it; don't edit `realworld.ts` by hand.

## Local development

Astro 7 needs Node 22.23 or newer.

```bash
npm install
npm run dev      # dev server on http://localhost:4321
npm run check    # Astro and TypeScript checks
npm run build    # static build into dist/, with the security headers and the service worker
npm test         # unit tests, and the suite's checks of the built site (build first)
npm run axe      # accessibility checks on every built page, in both themes
npm run preview  # the built site as Cloudflare serves it, headers included
npm run images   # remake the icons and the sharing image (needs Google Chrome)
npm run sheet    # draws every document, emblem, avatar, pattern and stamp to preview/index.html
```

## Deployment

The site will run as the `eurth-passport` Worker (static assets only) on the Cloudflare account that holds the eurth.org zone; the custom domain in `wrangler.jsonc` owns the `passport.eurth.org` DNS record.

- **Before the door** (19 December 2026, 00:00 in Brussels) nothing is deployed anywhere: pushes to `main` are checked, built and tested, and that is all.
- **The launch workflow** (`.github/workflows/launch.yml`) starts at 22:30 UTC on 18 December, builds the site as it will be at the door's time, waits for `LAUNCH_AT` and deploys. If it hasn't started by 22:45 UTC, start it by hand from the Actions tab. Once the site is live, delete that file.
- **After the door** every green push to `main` deploys, and the nightly run takes in new 1.x releases of `@eurth/style` and `@eurth/profile`.
- Deploying uses `CLOUDFLARE_API_TOKEN`, an organisation secret; without it the deploy step is skipped with a warning.

## Releasing

1. In the same commits as the work, update [roadmap.md](roadmap.md): move finished items out of Next, and add or extend the release's dated section.
2. Run `npm run check`, `npm run build`, `npm test` and `npm run axe`.
3. Bump the version in `package.json`, merge to `main`, and tag it.

## Credits

Made by Orioni for [Eurth](https://eurth.org). Every emblem, avatar and pattern is drawn by code written for Passport. The guide's sources are listed in `src/content/sources.ts`.

## Licence

Apache 2.0, see [LICENSE](LICENSE).
