# Roadmap

Passport designs papers for nations that don't exist: a passport cover and data page, a national identity card, and visa, entry and exit stamps, at passport.eurth.org. It is door 10 of Eurth's 2026 advent calendar and opens on 19 December 2026 at 00:00 Europe/Brussels.

Three parts: what comes next, what each release added (newest first), and what's not planned.

## Where to pick up

**15 November 2026.** The site is built and pushed, on top of @eurth/style (1.3.0 since 16 November) and @eurth/profile 1.0.0: four pages, the designer, the link, the profile file, downloads, sharing, the stamp's thump and the Moon's jacket. `npm run check`, `npm run build`, `npm test` (237 tests, the suite's own included) and `npm run axe` all pass. Checked in Chrome, Safari and Firefox. Nothing is deployed, and nothing will be until the launch workflow opens the door on 19 December 2026 at 00:00 in Brussels.

What is left is under "Next", in order. Start with the first item.

To run it: Node 22.23 or newer (`node -v`; on Stijn's Mac, Homebrew's is first with `export PATH="/opt/homebrew/bin:$PATH"`), then `npm run dev`.

Decided on the way (say if you'd rather otherwise):

- **A real country's name is refused, not just noted,** as the issuing state, as a document's title, as the authority and on a stamp's own lines, with the note "That is a real country. Passport only makes papers for invented ones." Whole names only: a holder may be called Jordan and be born in a town called Georgia. Demonyms ("French") are not checked.
- **Dates are picked in the world's own calendar** (its months, month lengths and era) when the profile has one. Nothing is converted from ours.
- **A profile's arms are used only if they are pure vector drawing.** An SVG that wraps a photograph, a link or a script is turned away and one of our emblems stands in.
- **The link is the suite's own form,** `?d=1.…`, so the shared helpers read and write it.
- **Documents are shown as pictures** (an `<img>` with the description as its alternative text), never as markup in the page. On the visa page each stamp is its own picture over a blank page, so it can be picked, dragged and thumped.
- **The header shows the yurt and the favicon is the yurt too;** Passport has no mark of its own yet.
- **The emblems and avatars stay as they are, drawn in code.** Stijn looked at all twenty-four on 15 November 2026 and kept them.

## Next

1. **Look at it with your own eyes.** `npm run dev`, then go through the five tabs, load `tests/fixtures/calderwyn.eurth.json` with Load profile (arms on the cover, dates in the Lantern Reckoning, a Calderwynian holder), save it again, and try the downloads. This has been checked by tests and in three browsers, not by a person.
2. **Safari and Firefox** were checked on 15 November 2026 (Safari 27, Firefox 159): every document draws into a PNG with the profile's arms on it, long names squeeze sensibly, and in Safari the tabs, the thump and the link work. Safari can't make WebP and hands back a PNG without saying so; the file is now named `.png` and a note says why, through `pictureFilename()` in @eurth/style 1.3.0, which was added for this on 16 November 2026. Flagwright uses the helper too since 16 November, in its open pull request for the shared shell (0.2.0); its live site keeps the fault until that is merged.
3. **The profile's `passport` section:** `title` and `svg` (the cover) are proposed in [eurth-org/eurth-profile#2](https://github.com/eurth-org/eurth-profile/pull/2), which also asks what to do about designs too big for a 4,000-character link (today those travel under a key the schema doesn't name, `design`, and pass the profile's own check). Follow what is decided there.
4. **Lighthouse** ran in CI on 15 November and its assertions passed on all four pages (accessibility, best practices and SEO at 100, performance at 95 or better). The start page carries the whole designer, so watch its weight as it grows.
5. **CI is green** on GitHub (check, build, test, axe, Lighthouse), and its deploy step holds back until the door, as it should.
6. **Before the door:** on 18 December the launch workflow starts at 22:30 UTC. If it hasn't started by 22:45 UTC, start it by hand. After the launch, delete `launch.yml`.

### After launch

- More papers: a visa sticker, a driving licence, a seafarer's book, a laissez-passer.
- More avatars and emblems, and a mark of Passport's own for the favicon.
- Random papers: one button for a whole invented state.
- Undo and redo.

## Releases

Nothing is live yet: the door opens on 19 December 2026. What is built so far, newest first.

### 15 November 2026: the site (Phase 2; built, not yet live)

- **Started from the starter template** of @eurth/style 1.0.1: Astro, the shared shell, the three workflows as thin callers, `LAUNCH_AT` at 19 December 2026, 00:00 in Brussels, no workers.dev address and no deploy before the door.
- **Four pages:** the designer, twelve templates (each a link into the designer, with its cover and a stamp drawn at build time), the guide (from `src/content/guide.md`, with its sources and the day it was last updated) and the glossary of 42 terms. Titles, descriptions, canonical links and structured data on each (WebApplication, FAQPage, Article, DefinedTermSet, BreadcrumbList).
- **The designer** (`src/ui/`): tabs for the cover, the data page, both sides of the card and the stamps; controls for everything the model holds; "New holder" for an invented person; a note, in plain words, when a real country is typed.
- **The visa page:** every stamp is its own picture over a blank page, exactly where the download draws it. Pick one, drag it, or move it with the arrow keys; up to twelve to a page.
- **Saving:** the link (`?d=1.…`) follows the papers in the address bar; Load profile and Save profile from @eurth/profile, writing only the `passport` section. A loaded profile brings its name, arms, names and calendar.
- **Downloads:** SVG, PNG and WebP of each document, as it is or set on a ground in the suite's six sharing sizes; the chosen stamp on its own on a clear ground. Copy link, Copy picture, Copy description and the Share dialog.
- **Delight:** a stamp thumps onto the page and the page takes the knock (with a low thud when sound is on, and nothing at all for reduced motion); a visa for the Moon gets a second stamp and the toast "Bring a jacket."; "Nice." on the position sliders.
- **A picture is named for what it is:** Safari answers a request for WebP with a PNG, so the download is called `.png` and a note says so; if a browser can't draw the picture at all, a plain message points to the SVG.
- **Checks:** 237 tests. Besides Phase 1's: the suite's own (contrast, security headers, privacy, no spoilers, pages, launch date), links read by the shared helpers, what Passport writes checked by @eurth/profile's own validator, stamps on screen where the download draws them, and SPECIMEN kept in every sharing size. axe finds nothing on five pages in both themes.

### 15 November 2026: the engine and the words (Phase 1; built, not yet live)

- **The model** (`model.ts`, `clean.ts`): the issuing state, cover, holder, papers, card, up to twelve stamps and an optional calendar. Everything from a link or a file is checked and clamped.
- **Fiction only** (`fiction.ts`, `realworld.ts`, `tools/make-realworld.mjs`): SPECIMEN drawn last on every data page and card with no field to switch it off; portraits by id only and arms only if pure vector; a snapshot of 377 real country names and 526 codes that presets stay clear of and the tool declines to print; a decorative strip in place of a machine-readable zone, and no text field able to hold a line that looks like one. 32 tests, over 300 seeded designs, every template and hostile input, with a checker for real zones kept in the tests only.
- **Drawing** (`emblems.ts`, `portraits.ts`, `patterns.ts`, `stamps.ts`, `render.ts`, `svg.ts`): twelve emblems, twelve avatars in six skin tones, five security patterns, stamps in six shapes with five borders and seeded wear, and the cover, data page, both sides of the card, each stamp and the visa page as SVG with a title and description inside.
- **Words** (`describe.ts`): every document in plain sentences, and a summary for the profile.
- **Saving** (`link.ts`, `profile.ts`): the design as `?d=1.…` holding only what differs from the opening design; the profile's `passport` section, read and written without touching anything else.
- **Holders and dates** (`names.ts`, `dates.ts`, `random.ts`): seeded invented holders, from the profile's names when it has them; dates in the profile's calendar.
- **Twelve templates** (`templates.ts`) and **the Moon** (`fun.ts`): a visa that names the Moon gets "Bring a jacket."
- **The guide, glossary and sources** (`src/content/`): about 2,600 words in seven sections, 42 terms, 12 sources checked on 14 November 2026.
- **Kit:** TypeScript, Vitest, a CI workflow that checks and tests, and a contact sheet of every drawing (`npm run sheet`).

Known limits, for Phase 2 or after:

- The guide's sources for a few claims are secondary (the railways and the nineteenth-century lull; the Safe Conducts Act 1414 rests on HM Passport Office's history page). Details that couldn't be checked were left out.
- Text can't be measured without a browser, so long lines are shrunk by estimate and then squeezed with `textLength`. The longest cases looked right in Chrome, Safari and Firefox on 15 November 2026.

## Not planned

- **Photo uploads.** Portraits are our own drawings. A real face on an identity document, even an invented one, is where fun stops.
- **Switching off SPECIMEN.** It is part of the drawing, not a setting.
- **A real machine-readable zone,** or anything a document reader would accept.
- **Real countries,** as templates, as issuing states, or on titles and stamps. Plenty of the world's passports are pictured elsewhere; this tool is for new ones.
- **Print-ready, actual-size output** (millimetre sizes, bleed, booklet imposition). Passport makes pictures for wikis, forums and stories.
- **Accounts, or designs kept on a server.** A design lives in its link or its file; nothing is stored.
- **AI-generated portraits or emblems.** Every shape is drawn by code or by a person.
