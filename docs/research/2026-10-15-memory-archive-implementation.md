# Memory Archive implementation

The owner approved the atmospheric Archive Terminal prototype with restrained logo-derived accents on 15 October 2026. This applies that direction to the production Astro components; the disposable studies and raw Stitch artifacts were removed after approval. The production artwork and this design record are retained.

## What changed

- Full-width archive environment and open circuit framing around the unchanged brain logo.
- Graphite dark theme and mineral-paper light theme, retaining system preference and the saved theme choice.
- Chakra Petch headings, IBM Plex Sans body, and JetBrains Mono technical labels, all self-hosted. Locale-specific Hebrew, Japanese and Korean fallback faces also cover technical labels.
- Teal capture/input accents, violet recall/history accents, and copper memory/action accents. Shared diagrams retain their topology and translated HTML labels.
- Detail headers use a quieter version of the same environment. Closing CTA panels, navigation, reading surfaces and tables use the shared palette.
- Existing reviewed copy and product facts preserved. The only catalog change adds emphasis around the memory clause of the homepage title in every language; translation stamps were updated after all six catalogs matched.

The generated decorative image is local. Astro emits responsive WebP candidates of roughly 13–64 KB. No Stitch runtime, Google Fonts request, or generated HTML dependency is introduced into production.

## Verification

`npm run check:colors`, `npm run check:i18n`, and `npm run build` passed (102 built pages). Contrast checks now cover the fixed capture/recall colors as well as the existing palette.

The full `check:ui` sweep passed 408 route/viewport/theme combinations across all six languages at 1440 and 360 pixels: no page overflow, broken images, diagram connector/label collisions, text below 14px, or missing/duplicate h1. The Hebrew/Japanese/Korean subset was repeated after refining their technical-label fallback fonts.

Browser checks covered desktop menu keyboard opening and Escape, persistent theme switching, keyboard tabs, the mobile dialog and scroll lock, and switching to the same page in Hebrew. All passed.

Axe 4.8.2 checks covered every English content page in both themes, plus translated homepages and tablet layouts. The completed checks reported no WCAG A/AA or best-practice violations. The audit uses the actual theme control and waits for repaint before measuring; immediate style mutation produced transient mixed-theme measurements. Screenshots were inspected for the homepage, detail headers, diagrams, mobile layouts, and Hebrew directionality.

Browser audit output and screenshots are local at `node_modules/.cache/archive-review/`; the route sweep writes `node_modules/.cache/signal-review/checks.json`. Automated accessibility checks do not replace manual assistive-technology testing.

The owner authorized pushing the implementation and removing disposable artifacts after verification.
