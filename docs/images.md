# Memory Archive artwork and diagrams

Production diagrams now render through `Figure.astro` → `Diagram.astro`, with typed topology in `src/data/diagrams.ts` and SVG symbols in `CircuitIcon.astro`. Labels come directly from all six existing `images.json` catalogs. The brain logo and actual product screenshots retain their original pixels.

Each diagram is a set of lanes. Stages within a lane connect in order; nodes within one stage are parallel. Independent comparisons use no connectors. Optional paths use dashed outlines. Labels prefixed with `=` are technical identifiers that remain identical across languages (commands, filenames, product names). Every other label must exist in the catalog; missing labels fail the build.

Use graphite panels, copper connections and memory chips, teal terminal/folder symbols, violet retrieval/history symbols, and pale outlines for the remaining infrastructure. Labels stay at 20px, notes at 16px; narrow screens stack stages and rotate connectors. Diagram topology stays left to right; each label uses the locale's own text direction.

Check topology against the relevant product page and source before editing. Inspect desktop and mobile in light/dark themes, including Hebrew and Japanese. Run `npm run check:colors && npm run check:i18n && npm run build && npm run check:ui`.

## Archive environment

`src/assets/img/memory-archive-environment.png` is the approved generated architectural background from the disposable Stitch identity study (15 October 2026). It depicts worn graphite archive towers, smoked glass, copper conduits and sparse tungsten lighting, with negative space for the heading. It is decorative and contains no product claims or diagram labels.

`ArchiveBackdrop.astro` renders it with empty alt text and an accessibility-hidden wrapper. Astro builds responsive WebP sizes; the largest candidate is about 64 KB. Keep the dark overlay behind copy, mirror the composition for Hebrew, and use the lower-opacity variant in detail headers. The brain logo is a separate unchanged asset, never baked into the background.

The historical raster workflow below is retained for reference. It no longer drives production diagrams. Do not regenerate raster translations for native diagram text changes.

---

# Diagrams and illustrations

The diagrams are generated with Google's Gemini image model (`gemini-3-pro-image`), then checked by eye. A generated diagram can misspell a label or draw something the product does not do, so nothing ships unseen.

## Make or redo one

```bash
export GEMINI_API_KEY=...          # https://aistudio.google.com/apikey
$EDITOR scripts/prompts/security-ladder.txt
node scripts/gen-image.mjs security-ladder               # 16:9
node scripts/gen-image.mjs security-ladder --aspect 4:3  # also 1:1, 21:9, 3:2
```

The result is `src/assets/img/gen/security-ladder.webp`, 1920 px wide. Import it in a page and show it with `Figure`. Astro produces the responsive sizes at build time.

Every request gets two things added:

- `scripts/prompts/_style.txt`, the art direction: dark indigo ground, the green to rose spectrum running left to right, amber for anything that moves, short off-white labels. Change the look of the whole set there.
- The logo, as a style reference. Pass `--no-ref` to leave it out.

## Writing a prompt that works

- Describe the layout and the objects. Leave style to `_style.txt`.
- Put every label in double quotes and keep them to one to three words. Eight labels is about the limit before spelling slips.
- Say which way it reads: "left to right", "bottom to top".
- State the facts the picture must get right ("the dashed arrows are optional paths").

## Check before you commit

1. Every label is spelled correctly and no invented text appears.
2. The picture says nothing untrue about the product.
3. The ground is the dark indigo. It has to sit inside the `Figure` frame in both themes.
4. It is still readable at phone width.
5. The `alt` text says what the diagram says, in a sentence.

If it fails, change the prompt and run it again. If it fails three times, remove labels. The prompts are committed so any image can be reproduced or restyled later.

Generation costs a few cents per image and is not part of the build. Netlify and GitHub Actions never need the key.

## Screenshots

`src/assets/img/screens/` holds real screenshots of the web UI on demo data, taken from the pull requests that built each view (webp, version footer cropped). The UI speaks English in every language of the site. Replace them from a running server when a view changes. `web-search.webp` was refreshed on 2026-10-16 from the checksum-verified v3.1.0 Linux release, using four synthetic rate-limit pages in `demo/api`; it includes the Kind and Tier filters and the version footer.
