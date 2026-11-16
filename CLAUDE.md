You're building Passport (passport.eurth.org), a designer for fictional passports and identity papers, one of Eurth's free worldbuilding tools. Eurth (eurth.org) is a worldbuilding and roleplay community since 2004. The attached repo is eurth-org/eurth-passport.

Working order (Foundations and many other tools are being built at the same time tonight):
1. Save this brief as CLAUDE.md.
2. If the repo named above doesn't exist on GitHub yet, create it as a public, empty repo in eurth-org with the gh CLI and connect this folder; if you can't, ask me.
3. Read what already exists of github.com/eurth-org/eurth-style (HANDBOOK.md) and github.com/eurth-org/eurth-profile; they may still be in progress. Write the plan and show it to me.
4. Build the tool's core logic as plain TypeScript modules with thorough tests, and its content and data (guide text, presets, examples, data snapshots). None of that needs eurth-style.
5. Only once @eurth/style 1.0.0 is released (check the releases of github.com/eurth-org/eurth-style), start the site from its starter template and carry on to the end of this brief. Until then, don't scaffold the site, pages or styles.
6. Commit and push after every finished step, and keep roadmap.md up to date with exactly where to pick up, so a new session can continue if this one stops.

Background for every step: Read HANDBOOK.md in github.com/eurth-org/eurth-style and start from its starter template; read the profile schema in github.com/eurth-org/eurth-profile (if it has no "passport" section yet, propose one as a pull request there first); look at github.com/eurth-org/eurth-flag, the reference build. The handbook wins over this brief on everything shared. Then write a plan and show it to me before you build.

Mock-up: the passport cover on the "bank.eurth.org, banknotes" board on https://claude.ai/artifact/32RKDdVTtCfHsL6Qc6LxV6.

Pages: Designer, Guide, Glossary, Templates.

The designer, v1
- Documents: passport cover, passport data page, national identity card front and back, visa stamp, entry and exit stamps.
- Cover: colour, the nation's name and emblem (arms from the profile, or a simple emblem of our own), the document title in up to two languages, a chip symbol.
- Data page: a fictional holder with generated name (from the profile's names section if present), illustrated portrait (a choice of our own drawn avatars; no photo uploads), dates, background security pattern.
- Stamps: shapes, borders, dates in the world's calendar if the profile has one, ink colours, a slight rotation and smudge.

Fiction only, always: a fixed "SPECIMEN" overprint on every data page and card that can't be switched off; no photo uploads; no real country names or codes in presets; no machine-readable zone in the real ICAO format (a decorative strip clearly marked fictional instead). Say why in the guide, kindly.

Guide: how passports and ID cards are laid out and what each feature is for, the history of the passport, designing papers for a fictional state, with sources.

Profile section "passport": the cover and data-page design. It reads identity, arms, names and calendar.

Exports: SVG, PNG and WebP of each document; Copy description.

Signature touch: a stamp thumps onto the page with a tiny shake. Easter egg: a visa for the Moon gets the stamp "Bring a jacket."

Done when the handbook's checklist passes and the fiction-only rules are tested.

## Changes to this brief

Stijn's later decisions. Where one of these and the brief above disagree, the later one stands.

**16 November 2026, after his first look at the designer:**

- Visitors may put **their own photograph** on the data page and the card, and crop and move it; and **their own emblem** on the cover (arms made in Arms included). This replaces "no photo uploads" above. Neither picture is stored: not on a server, not in the browser, not in the link, not in the profile file. They are handed to the drawing beside the design, for the visit only. (Added while building it, and his to overrule: a photograph always has SPECIMEN across it, besides the page's own overprint.)
- The rest of "Fiction only, always" stands as written: the fixed SPECIMEN overprint, no real country names or codes, no machine-readable zone.
- The cover looks like a real booklet: a square spine on the left and round corners only where it opens, a slight wrinkle, lettering and emblem in foil that catches the light, and the chip symbol drawn as on real passports. The pages inside keep four round corners.
- The preview leans towards the pointer and catches the light. A Random button makes a whole set of papers.
