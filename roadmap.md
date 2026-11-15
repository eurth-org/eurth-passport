# Roadmap

Passport designs papers for nations that don't exist: a passport cover and data page, a national identity card, and visa, entry and exit stamps, at passport.eurth.org. It is door 10 of Eurth's 2026 advent calendar and opens on 19 December 2026 at 00:00 Europe/Brussels.

Three parts: what comes next, what each release added (newest first), and what's not planned.

## Where to pick up

**15 November 2026.** Phase 1 is done and pushed: the engine in `src/passport/`, the guide, glossary and sources in `src/content/`, and 158 tests, all passing (`npm run check`, `npm test`). There is no site yet. **@eurth/style 1.0.0 and @eurth/profile 1.0.0 are both released**, so the next step is Phase 2, step 14: read HANDBOOK.md in eurth-style and start the site from its starter template.

To look the drawings over before the site exists: `npm run sheet`, then open `preview/index.html`.

Decided on the way (say if you'd rather otherwise):

- **A real country's name is refused, not just noted,** as the issuing state, as a document's title, as the authority and on a stamp's own lines, with the note "That is a real country. Passport only makes papers for invented ones." Whole names only: a holder may be called Jordan and be born in a town called Georgia. Demonyms ("French") are not checked.
- **Dates are picked in the world's own calendar** (its months, month lengths and era) when the profile has one. Nothing is converted from ours.
- **A profile's arms are used only if they are pure vector drawing.** An SVG that wraps a photograph, a link or a script is turned away and one of our emblems stands in.
- **The profile section** holds `link`, `summary`, `colour`, and two keys the schema doesn't name yet, `title` and `svg` (the cover). A design too big for a 4,000-character link travels in the section under `design`. To do: propose `title` and `svg` to eurth-profile as a pull request, and ask there about `design`.

## Next

### Phase 2: the site

14. Start from the starter template in eurth-style; read HANDBOOK.md first, and where it differs from this plan, the handbook wins.
15. Pages: Designer, Guide, Glossary, Templates, with titles ("Passport: free online fictional passport maker for worldbuilders"), descriptions, canonical links, JSON-LD, sitemap.xml, robots.txt, llms.txt and Open Graph images.
16. The designer, as a Svelte 5 island: a document picker, the controls for each document, the document on a stage, a "New holder" button, and the stamps laid on a visa page (drag to place).
17. Save and load: the link, and the profile file (file picker and drag and drop, from @eurth/profile).
18. Exports: SVG, PNG and WebP of each document, alone and in the handbook's sharing sizes; stamps also on a clear background; Copy link, Copy picture, Copy description, and the Share dialog. Check early that the profile's arms survive the trip into PNG in Safari.
19. Delight: a stamp thumps onto the page with a tiny shake; "Bring a jacket."; the suite's own touches from @eurth/style. Nothing for reduced motion.
20. Offline, install, security headers, axe and Lighthouse checks, as the handbook asks.
21. CI, and the launch workflow: `LAUNCH_AT` is `2026-12-19T00:00:00+01:00`, the scheduled run starts at 22:30 UTC on 18 December, and it also runs by hand. No custom domain and no workers.dev deploy before then.
22. README (use, development, deployment), docs/feedback-log.md, and the handbook's checklist.

### After launch

- More papers: a visa sticker, a driving licence, a seafarer's book, a laissez-passer.
- More avatars and emblems.

## Releases

Nothing is live yet: the door opens on 19 December 2026. What is built so far, newest first.

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
- Text can't be measured without a browser, so long lines are shrunk by estimate and then squeezed with `textLength`. Check the longest cases in real browsers.
- The profile's arms go on the cover as a picture inside the SVG. Check early that they survive the trip into PNG in Safari.

## Not planned

- **Photo uploads.** Portraits are our own drawings. A real face on an identity document, even an invented one, is where fun stops.
- **Switching off SPECIMEN.** It is part of the drawing, not a setting.
- **A real machine-readable zone,** or anything a document reader would accept.
- **Real countries,** as templates, as issuing states, or on titles and stamps. Plenty of the world's passports are pictured elsewhere; this tool is for new ones.
- **Print-ready, actual-size output** (millimetre sizes, bleed, booklet imposition). Passport makes pictures for wikis, forums and stories.
- **Accounts, or designs kept on a server.** A design lives in its link or its file; nothing is stored.
- **AI-generated portraits or emblems.** Every shape is drawn by code or by a person.
