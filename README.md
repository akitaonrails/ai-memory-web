# aimemory.io

The marketing site for [ai-memory](https://github.com/akitaonrails/ai-memory). Static, built with Astro, deployed to Netlify.

## Run it locally

You need Node 22 or newer.

```bash
npm install
npm run dev        # http://localhost:4321, reloads on save
```

To check the production build:

```bash
npm run build      # writes dist/
npm run preview    # serves dist/ on http://localhost:4321
```

The build asks the GitHub API for stars, contributors, releases and the changelog. Without a token you get 60 requests an hour, which is enough for normal work. If you hit the limit, the build falls back to `src/data/github-snapshot.json` and prints a warning. To avoid the limit:

```bash
GITHUB_TOKEN=$(gh auth token) npm run build
```

## Other commands

| Command | What it does |
|---|---|
| `npm run check:colors` | Measures WCAG contrast for every color pairing in `src/styles/global.css`. Fails if one misses its target. |
| `npm run check:i18n` | Compares every translation catalog with the English one. Fails on mismatched keys, placeholders or markup. |
| `npm run snapshot:github` | Refreshes the committed GitHub fallback data. |
| `node scripts/gen-image.mjs <name>` | Generates an illustration from `scripts/prompts/<name>.txt`. See [docs/images.md](docs/images.md). |

## Where things are

```
src/pages/[...locale]/   one file per page, rendered once per language
src/components/     Nav, Footer, PageHero, Section, Figure, CodeBlock, Tabs, Steps, BarChart, Continuity (the pinned scroll scene)
src/i18n/           languages.json, the message catalogs per language, and the lookup helpers
src/lib/            schema.org helpers
src/data/           site map, support matrix, competitors, GitHub data
src/scripts/        motion (GSAP ScrollTrigger), theme, copy buttons, live GitHub numbers
src/styles/         global.css: color tokens, type scale, shared classes
scripts/            image generation, contrast check, GitHub snapshot
docs/               how to deploy, set up the domain, and the design studies
```

## Docs

- [docs/deploy.md](docs/deploy.md): Netlify through its GitHub integration or through GitHub Actions, and the tokens each needs
- [docs/domain-godaddy.md](docs/domain-godaddy.md): pointing aimemory.io from GoDaddy to Netlify
- [docs/seo.md](docs/seo.md): what is in place and what to do after launch
- [docs/i18n.md](docs/i18n.md): the five languages, how detection works, changing text, translating diagrams
- [docs/analytics.md](docs/analytics.md): turning on Google Analytics, consent, and the events it records
- [docs/color-study.md](docs/color-study.md): the palette, derived from the logo, with measured contrast
- [docs/design-system.md](docs/design-system.md): type, layout, motion and the rules pages follow
- [docs/images.md](docs/images.md): how the diagrams are generated and how to redo one

© Fabio Akita. All rights reserved. The ai-memory software itself is MIT licensed; this site's content and design are not.
