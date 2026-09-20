# aimemory.io

Marketing site for ai-memory. Astro, Tailwind 4, GSAP, six languages. Read `docs/design-system.md` and `docs/i18n.md` before changing pages.

## Text changes go to every language, in the same change

The site is published in en, pt-br, es, he, ja and ko. Whenever you add, reword or delete visible text:

1. Edit the English string in `src/i18n/locales/en/<namespace>.json`. No visible text lives in `.astro` files.
2. In the same change, update that key in all five other locale folders with a real translation that follows `docs/research/I18N-TRANSLATE-BRIEF.md` and `docs/i18n/glossary-<locale>.md`. Translate the new meaning; do not patch a word into the old sentence. New keys get translated too, never left to fall back to English.
3. If the text is a label inside a diagram (`images.json`), regenerate that diagram for each language with `scripts/localize-image.mjs` and look at the results.
4. Run `npm run i18n:stamp` to record which English text the translations were made from, then `npm run check:i18n`. It must report no errors and nothing "falling back to English".

`check:i18n` fails on STALE entries: English changed but a translation did not. Never silence it by stamping without translating. If you cannot translate a language well, say so instead of shipping a guess.

## After an ai-memory release

When the owner says a new ai-memory version is out, use the `sync-release` skill (`.claude/skills/sync-release/SKILL.md`). It starts with `npm run check:upstream`, which compares the site with the release tag and lists what changed since the last reviewed release. Hard numbers live in `src/data/facts.json`. Finish with `npm run check:upstream -- --record`.

## Other rules

- Writing: `docs/design-system.md`, section "Writing". Go straight to the point. No em dashes, no "not X but Y", no sentences about the documentation, no hype words.
- Facts come from the ai-memory repository (`~/Projects/ai-memory`). Do not invent numbers, features or quotes. Keep the honest "where ai-memory is behind" content.
- Structure (hues, hrefs, ids, commands) stays in code; words stay in catalogs. Use `withText()` to join them, `href()` for internal links, `date()` and `number()` for formatting.
- CSS uses logical properties so Hebrew mirrors. Terminals, diagrams and file trees get `dir="ltr"`.
- Shared patterns belong in `src/components`, `src/lib` or `src/styles/global.css`. Do not redefine a shared class in a page's `<style>`.
- Before pushing: `npm run check:colors && npm run check:i18n && npm run build`. Add `npm run check:upstream` when facts changed. `main` deploys to production through Netlify.
