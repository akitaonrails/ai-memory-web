# ai-memory identity studies

15 October 2026. Historical record of the three initial English art-direction studies. The disposable prototypes, generators and screenshots were removed after the later Memory Archive direction was approved. See [the final implementation record](2026-10-15-memory-archive-implementation.md) for the current design.

## Brief

Keep the existing brain logo intact. Build a distinctive technological identity with cyberpunk influences, without a neon wash, green CRT, illegible HUD, or generic AI landing-page furniture. The logo already contains vivid color; let it be the most colorful object. Carry its neural-to-circuit transition into diagrams, its chip into framing, and its arrows into navigation.

## What we reused from ai-jail-web

Inspected commits `823f5b1` (three prototypes), `e4bdcac` (direction chosen), and `517cb05` (full redesign), plus its design study, CLAUDE.md, package.json, and `scripts/check-ui.mjs`.

- Static HTML/CSS studies before changing the Astro site.
- `agent-browser` for real Chromium desktop/mobile renders and overflow/image checks.
- SVG diagrams drawn in code, rather than generated illustration. The production redesign can feed labels from the existing catalogs.
- Central palette variables and explicit contrast checks.
- Screenshot comparison sheets so the owner can choose a direction.
- Fonts separated by job: display, reading, technical labels. Google Fonts are exploratory; self-host the selected faces through @fontsource for production, as ai-jail-web does.

ai-jail-web also used an image-generation/style-transfer workflow for its woodcut logo. That is unnecessary here because the original brain is being preserved. Its cordel visual language is not being copied. No new plugin, dependency, or global configuration is needed. The installed agent-browser's `skills get core` returned “Skill not found”; its existing documented command interface was used.

## Research

These are design interpretations, not replicas of film interfaces or licensed artwork.

- [Territory Studio's Blade Runner 2049 concept reel](https://vimeo.com/243707276): screen graphics can evoke a future through instrumentation and the handling of information. Use deliberate frames and restrained color, while removing film-prop illegibility.
- [Design Week on the Blade Runner 2049 graphics](https://www.designweek.co.uk/issues/30-april-6-may-2018/graphic-design-blade-runner-2049-film-dad-festival/): the production's emphasis on brutality, scale, and power suggests weight and material rather than decorative neon.
- [032c's interview on Ghost in the Shell architecture](https://www.032c.com/blogs/design-architecture/anime-architecture-ghost-shell-built): the layering of an existing city and a new city suggests useful visual history, infrastructure, and institutional surfaces. Applied here as indexing and archival structure, not a city illustration.
- [WipEout: Futurism, the publisher's page](https://vol.co/products/wipeout-futurism): its fictional branding and graphic world offer a second technological vocabulary beyond terminal green. Borrow clarity of identity and wayfinding; omit faux Japanese, excessive microtype, and racing decoration.
- [The Designers Republic portfolio](https://www.thedesignersrepublic.com/?lang=en): typography and graphic systems can carry the identity themselves.

## A. Mnemonic Foundry

Charcoal, copper, and bone. Barlow Condensed display, IBM Plex Sans prose, IBM Plex Mono labels. A large compressed headline balances the original brain in a hardware-like plate; ruled specifications replace cards. The logo's copper chip sets the action color.

Strongest cyberpunk atmosphere. Good for an assertive developer product. Risk: density and a military-instrument feeling if the frames spread to every paragraph. Keep long-form documentation more open.

## B. Civic Archive

Mineral paper, dark ink, oxide red. Space Grotesk headings, Source Serif 4 reading and an italic editorial headline, IBM Plex Mono indexing. A wide title, narrow directory, and central brain specimen make it feel like a public knowledge archive.

Strongest separation from dark AI landing pages; strongest long-form reading identity. Risk: the science-fiction influence is subtle and may feel more institutional than desired. The serif is intentional: human memory alongside machine memory.

## C. Signal Bureau

Blue-grey enamel, deep slate, pale mineral blue. Chakra Petch display, Manrope prose, IBM Plex Mono labels. A clipped signal panel, orbital lines, and an explicit session-to-session route echo the neural and circuit halves of the logo.

Best balance of technological identity and approachable navigation. Risk: geometric display type can drift toward gaming. Limit it to headlines, use calm prose, and avoid decorative dashboards.

## Shared constraints and verification

The original logo is referenced directly, with no filters or new generated effects. The main explanation is taken from the current English homepage. Additional explainer text summarizes existing capture/wiki/handoff behavior; prototype annotations are not proposed product claims. Actions link to actual production pages. The SVG illustrates a concept, not a real-time monitor or product screenshot.

Check 1440px and 360px layouts, image loading, horizontal overflow, keyboard focus, font loading, and essential text contrast. Keep decorative diagram details out of the accessibility tree when they have no meaning. No automatic animation; reduced-motion preference disables smooth anchor scrolling.

The initial study preceded implementation across six languages and both themes. Its findings are retained below as historical context.

## Result

All three directions passed Chromium checks at 1440px and 360px: no page overflow, missing images, or broken local anchors; web fonts loaded. Essential foreground/background token pairs pass 4.5:1 contrast. Browser inspection caught and fixed an overflowing rotated orbit in C; B's phone layout was reordered so the product explanation and installation action precede the large brain. Desktop and mobile comparison sheets and full-page captures were reviewed during the study and removed with the disposable prototypes.


## Selected direction: C (15 October 2026)

The owner prefers Signal Bureau and flagged small typography. Refined C accordingly: 18px body copy (20px desktop hero), 16px navigation and buttons, and a 14px floor for HTML labels, captions, metadata, and footer. The diagram's smallest labels render at least 14.4px at its minimum width. Phone navigation wraps into two columns and the session route stacks vertically instead of shrinking its text. Preserve these reading sizes when moving the identity into production; geometric display type stays in headings, with Manrope for reading. A and B remain comparison references. This selection does not deploy the prototypes or migrate the production site.

### C diagram refinement

Replaced the generic outline boxes with agent terminals and a copper memory chip, borrowing the chip and handoff color from the existing brain logo. The dark diagram field, solid copper arrows, connection ports and packet markers separate the flow from page structure. The session handoff now uses connected-device shapes and a contrasting memory node. On phones, the diagram stacks vertically without shrinking its labels or requiring horizontal scrolling. Desktop and 360px mobile renders checked; new diagram text colors exceed 4.5:1 contrast.

## Initial production implementation (superseded by Memory Archive)

Direction C now supplies the shared website styles, self-hosted Chakra Petch/Manrope/IBM Plex Mono fonts, slate panels and copper connections. The brain logo is unchanged. The hero is fixed; former carousel content is an always-visible feature directory. Continuity examples are static and readable without scroll pinning.

Production diagrams now use typed topology, native SVG symbols and the existing translated HTML labels. Original screenshots remain images. Existing raster diagrams remain as historical references; the disposable prototypes were subsequently removed. The approved headline is translated in all six catalogs.

Validation: color checks and translation checks pass; Astro builds 102 pages. The agent-browser sweep passes 408 combinations (102 pages × desktop/360px phone × light/dark), checking overflow, broken images, diagram overlap, minimum 14px text and one H1 per page. Internal links and anchors resolve. Keyboard menus/tabs, mobile drawer scroll lock and expanded state, persistent theme selection and same-page Hebrew switching were exercised. Representative English, Hebrew and Japanese screenshots were reviewed, including reduced-motion rendering. Browser automation uses Chromium; no separate Safari/Firefox pass was performed. No production deployment was made.

The initial redesign had no persona-based proofreading pass. A subsequent three-persona review and accessibility pass is documented in [persona-review.md](persona-review.md).
