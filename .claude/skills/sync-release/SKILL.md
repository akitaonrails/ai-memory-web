---
name: sync-release
description: Bring aimemory.io up to date after a new ai-memory release. Use when the user says they released, tagged or published a new ai-memory version, asks to "update the site for X.Y.Z", "sync the website", or asks whether the site is stale. Compares the site with the release tag, updates facts and copy in all six languages, verifies, and publishes when the user confirms.
---

# Sync the site with an ai-memory release

The site must never state something the released software no longer does. The owner releases ai-memory, then asks for this. Work from the release tag, never from unreleased code in the checkout.

## 1. See what changed

```bash
git -C ~/Projects/ai-memory fetch --tags --quiet
npm run snapshot:github          # newest release, assets, stars into the committed fallback
npm run check:upstream           # add `-- --to vX.Y.Z` for a specific tag
```

The report has three parts:

1. **Changed upstream since the last review**: watched docs that changed, and the changelog entries in between. This is reading material and needs judgment.
2. **Hard facts**: checked mechanically. Every `MISMATCH` must be fixed.
3. **Where the numbers are quoted**: every catalog key that repeats a tracked number.

If the last reviewed release is more than one version back, read every changelog entry in between, not only the newest.

## 2. Decide what the site must change

Read each changed doc with `git -C ~/Projects/ai-memory diff <last>..<tag> -- <file>` and the changelog. Map changes to pages:

| Upstream change | Site location |
|---|---|
| New, removed or re-statused agent or OS | `src/data/support.ts` + `support.json` (note), homepage marquee follows automatically |
| New LLM or embedding provider | `support.json` (`llmProviders`, `embeddingProviders`) |
| Install, wiring or upgrade commands | `install.astro`, `advanced.astro`, `download.astro`, homepage quick start in `index.astro` |
| New release asset or package channel | `download.astro` + `download.json` |
| Benchmark re-run | `src/data/facts.json`, then every key listed under that number in part 3, and `competitors.json` comparisons |
| Throughput re-measured | `src/data/facts.json`, then part 3 keys |
| Crate added or removed | `src/data/facts.json`, crate tables in `architecture` and `contribute` catalogs, `contribute-crates` diagram |
| Security model, data handling, auth | `security.json`, `advanced.json` (tls, routing, sso) |
| Team and multi-user behaviour, limits | `teams.json`, the limits callouts in `install.json`, `security.json`, `compare.json` |
| A gap closed or a new gap ("where it is behind") | `compare.json` `behind`, `competitors.json` `theyWin`/`gain`, `research.json` `next` |
| Roadmap item shipped | `research.json` `next.recommended` |
| Headline feature worth selling | the page it belongs to; the homepage only if it changes the pitch |
| A doc file renamed or removed | links using `site.docs` (part 2 reports broken ones) |

Bug fixes and internals usually need nothing: the changelog on `/download/` updates itself at build time. Say so explicitly instead of inventing changes. Do not describe unreleased work.

## 3. Make the changes

Follow `CLAUDE.md`: English catalog first, then the same keys in pt-br, es, he, ja and ko with real translations (`docs/research/I18N-TRANSLATE-BRIEF.md`, `docs/i18n/glossary-*.md`), in the same change. Facts only from the repository at the tag. Keep the writing rules in `docs/design-system.md`.

- A number changed: edit `src/data/facts.json`, then every key part 3 lists for the old number, in all six languages.
- A diagram label changed or a diagram is now wrong: fix `scripts/prompts/<name>.txt` or `images.json`, regenerate with `scripts/gen-image.mjs`, then `scripts/localize-image.mjs <name> <locale>` for each language, and look at every result.
- A new agent: add the row to `support.ts`, the note to `support.json` in six languages, and check `/integrations/` shows the right install commands for it.

## 4. Verify

```bash
npm run i18n:stamp && npm run check:i18n     # no errors, nothing falling back to English
npm run check:upstream                       # no MISMATCH
npm run check:colors && npm run build
```

Preview the pages you touched with `npm run preview` (restart it after a build; a long-running dev server can serve stale modules). Check one right-to-left page (`/he/...`) if layout changed.

## 5. Record and publish

```bash
npm run check:upstream -- --record      # remembers the tag the site was reviewed against
```

Commit with a message that names the release ("Sync site with ai-memory vX.Y.Z") and lists what changed and what was deliberately left alone. Show the owner a short summary of the changes before pushing: `main` deploys to production through Netlify. Push when they confirm, or immediately if they already said to publish.

If nothing on the site needed changing, still run `--record`, commit `src/data/upstream-sync.json` and the refreshed snapshot, and tell the owner the site was already accurate.
