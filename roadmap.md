# Roadmap

Passport designs papers for nations that don't exist: a passport cover and data page, a national identity card, and visa, entry and exit stamps, at passport.eurth.org. It is door 10 of Eurth's 2026 advent calendar and opens on 19 December 2026 at 00:00 Europe/Brussels.

Three parts: what comes next, what each release added (newest first), and what's not planned.

## Where to pick up

**14 November 2026.** The brief is saved, the repository exists, and this plan is written. Nothing is built. The plan is waiting for Stijn's go-ahead; the next step is Phase 1, step 1.

Waiting on others:

- **@eurth/style 1.0.0** is not released: eurth-style holds only its brief (no HANDBOOK.md, starter template or tag). Phase 2 can't start until it is: check `gh release list -R eurth-org/eurth-style`. Until then this plan follows the handbook rules as written in that brief.
- **@eurth/profile 1.0.0** is written but not tagged. Its `passport` section exists already, with `link`, `summary`, `updated` and `colour` (the cover colour), and it allows extra keys. So no pull request is needed to begin. Once the model in step 1 is settled, propose two more fields there as a pull request: `title` (the document's name as printed on the cover) and `svg` (the cover as a picture, for Card and Wiki to show).

Questions for Stijn:

1. **A real country typed as the issuing state.** The brief rules real countries out of the presets. Proposed: the tool also declines to print a real country's name as the issuing state, with a kind note ("That one exists. Passport is for countries that don't."), matching whole names only so that invented names stay free. Say if a note without the refusal is enough.
2. **Dates.** With a profile calendar, a date is picked as day, month and year from that calendar's own months and era. Nothing is converted from our calendar. Without one, plain day, month and year.

## Next

### Phase 1: the engine and the words (needs nothing from @eurth/style)

Plain TypeScript in `src/passport/`, tests in `tests/`, as Flagwright keeps its engine in `src/flag/`. Only TypeScript and Vitest are installed. Commit and push after each step.

1. **Model** (`model.ts`, `clean.ts`): a design is the issuing state, a cover, a data page, an identity card and a list of stamps.
   - Seven documents: passport cover, passport data page, identity card front, identity card back, visa stamp, entry stamp, exit stamp.
   - Cover: colour (burgundy, navy, black and green from the mock-up, or any colour), foil colour (gold, silver, white), the state's name, an emblem (the profile's arms, or one of ours), the document's title in up to two languages, a chip symbol on or off.
   - Data page and card: a fictional holder (given names, surname, nationality, place and date of birth), document number, issue and expiry dates, issuing authority, a portrait picked from our avatars, a security pattern.
   - Stamp: kind (visa, entry, exit), shape, border, lines of text, date, a transport mark (ship, aircraft, train, road), ink, rotation and wear.
   - Everything that arrives from a link or a file is checked and clamped: text lengths capped, colours and ids checked against closed lists, at most 24 stamps, unknown keys dropped.
2. **Fiction only** (`fiction.ts`, `realworld.ts`): the rules as code, each with its own tests.
   - **SPECIMEN.** The drawing functions for the data page and both sides of the card always lay the overprint on last. The model has no field for it, so no link, file or setting can remove it. Tests draw several hundred seeded designs, and designs carrying hostile keys (`specimen: false` and friends), and find the overprint on top every time.
   - **No photographs.** A portrait is an id from a closed list of our avatars; no field anywhere takes an image or an address. The profile's arms are used only if they are pure vector drawing (no embedded images, no outside addresses, no foreign content); otherwise the tool falls back to one of our emblems and says so.
   - **No real countries.** `realworld.ts` is a snapshot of real country names, their two and three-letter codes and the extra codes travel documents use. Tests hold every preset, template, example and built-in name list clear of it.
   - **No machine-readable zone.** Where a real passport has one, ours has a decorative strip that reads as words: "FICTIONAL · NOT A TRAVEL DOCUMENT", with ornaments, captioned "Decorative strip. Not machine readable." It is never two or three lines, never 30, 36 or 44 characters long, has no filler chevrons and no check digits. The `<` character is removed from every text field, so one can't be typed in either. Tests run every drawn document through a checker written from ICAO Doc 9303 (line shapes and check digits) and require that nothing ever passes.
3. **Random** (`random.ts`) and **holder names** (`names.ts`): a seeded generator, so the same seed always gives the same holder. Names come from the profile's `names` section when it has people and surnames, otherwise from our own invented lists.
4. **Dates** (`dates.ts`): day, month and year in the profile's calendar (its month names, month lengths and era) or plainly; expiry worked out from the issue date and a validity in years.
5. **Emblems and portraits** (`emblems.ts`, `portraits.ts`): about a dozen simple emblems drawn for Passport (the mock-up's star in a ring, sun, tree, mountain, anchor, lantern, wheel, wreath, crown, bird, key, ship), the chip symbol, and about a dozen flat illustrated avatars built from parts (hair, clothing, glasses, headwear) with skin and hair tints. Each avatar has a description in words.
6. **Security patterns** (`patterns.ts`): guilloche rosettes, wave lines, lattices, rings and a microtext line, drawn from a seed as plain paths, bounded in size.
7. **Stamps** (`stamps.ts`): shapes (circle, oval, rectangle, rounded rectangle, hexagon, shield), borders (single, double, dashed, dotted, toothed), text along the curve, named inks, a rotation of a few degrees, and wear drawn as seeded shapes (so it looks the same on screen and in every download).
8. **Drawing** (`render.ts`): one function per document, from a design to SVG text with a title and description. Device fonts only. The editor, the downloads, the template pages and the tests all use the same functions.
9. **Description** (`describe.ts`): each document in plain words, for Copy description and screen readers.
10. **Saving** (`link.ts`, `profile.ts`): a compact, versioned form for the link's query string, holding the whole design; and the profile's `passport` section (link, summary, colour, and the fields proposed above). It reads `identity`, `arms`, `names` and `calendar`, writes only `passport`, and leaves every other section and unknown key alone. Tested against the three example profiles.
11. **Templates** (`templates.ts`): about twelve sets of papers for invented states, starting with the mock-up's Republic of Teland and the profile examples' Calderwyn, Vantmoor and Hesperwick.
12. **The Moon** (`fun.ts`): a visa whose destination is the Moon gets the extra stamp "Bring a jacket."
13. **Guide and glossary** (`src/content/`):
    - How passports and identity cards are laid out and what each feature is for (the cover, the data page, the machine-readable zone, the chip, guilloche, microprint, watermarks, colour-shifting ink, laminates, perforated numbers; card sizes; stamps and visas).
    - The history of the passport: safe conducts, the nineteenth-century lull, the First World War, the League of Nations conference of 1920 and the booklet, the Nansen passport, ICAO and machine-readable documents, chips.
    - Designing papers for a fictional state: what the state wants to say, languages, colour, emblem, calendar, who may travel, stamps as storytelling.
    - Why Passport is fiction only, said kindly.
    - Sources checked and listed (ICAO Doc 9303, ISO/IEC 7810, Torpey's *The Invention of the Passport*, Lloyd's *The Passport*, the EU's PRADO glossary, the League of Nations papers), with a last-updated date.
    - A glossary of about 40 terms.

### Phase 2: the site (only once @eurth/style 1.0.0 is released)

14. Start from the starter template in eurth-style; read HANDBOOK.md first, and where it differs from this plan, the handbook wins.
15. Pages: Designer, Guide, Glossary, Templates, with titles ("Passport: free online fictional passport maker for worldbuilders"), descriptions, canonical links, JSON-LD, sitemap.xml, robots.txt, llms.txt and Open Graph images.
16. The designer, as a Svelte 5 island: a document picker, the controls for each document, the document on a stage, a "New holder" button, and the stamps laid on a visa page.
17. Save and load: the link, and the profile file (file picker and drag and drop, from @eurth/profile).
18. Exports: SVG, PNG and WebP of each document, alone and in the handbook's sharing sizes; stamps also on a clear background; Copy link, Copy picture, Copy description, and the Share dialog. Check early that the profile's arms survive the trip into PNG in Safari.
19. Delight: a stamp thumps onto the page with a tiny shake; "Bring a jacket."; the suite's own touches from @eurth/style. Nothing for reduced motion.
20. Offline, install, security headers, axe and Lighthouse checks, as the handbook asks.
21. CI, and the launch workflow: `LAUNCH_AT` is `2026-12-19T00:00:00+01:00`, the scheduled run starts at 22:30 UTC on 18 December, and it also runs by hand. No custom domain and no workers.dev deploy before then.
22. README (use, development, deployment), docs/feedback-log.md, and the handbook's checklist.

### After launch

- More papers: a visa sticker, a driving licence, a seafarer's book, a laissez-passer.
- A whole visa page of stamps as one picture.
- More avatars and emblems.

## Releases

None yet.

## Not planned

- **Photo uploads.** Portraits are our own drawings. A real face on an identity document, even an invented one, is where fun stops.
- **Switching off SPECIMEN.** It is part of the drawing, not a setting.
- **A real machine-readable zone,** or anything a document reader would accept.
- **Real countries,** as templates or as issuing states. Plenty of the world's passports are pictured elsewhere; this tool is for new ones.
- **Print-ready, actual-size output** (millimetre sizes, bleed, booklet imposition). Passport makes pictures for wikis, forums and stories.
- **Accounts, or designs kept on a server.** A design lives in its link or its file; nothing is stored.
- **AI-generated portraits or emblems.** Every shape is drawn by code or by a person.
