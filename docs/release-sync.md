# Keeping the site in step with ai-memory releases

The site quotes facts from the ai-memory repository: which agents are supported, install commands, benchmark and throughput numbers, security behaviour, limits. After each ai-memory release, the site is reviewed against that release. This is a manual step: release ai-memory, then ask Claude Code in this repository to "sync the site with vX.Y.Z". The procedure it follows is the `sync-release` skill in `.claude/skills/sync-release/SKILL.md`.

## What updates by itself

The version number, release date, download links, changelog, stars and contributor counts are fetched when the site builds. They need a rebuild, not an edit. A push to `main` rebuilds, and so does the daily build hook if you set it up (see [deploy.md](deploy.md)).

## What needs a review

Everything written as prose or kept as data in this repository. `npm run check:upstream` does the mechanical part. It needs a local checkout of ai-memory at `~/Projects/ai-memory` (or `AI_MEMORY_REPO=/path`) and reads the release tag through git, so unreleased work in that checkout never leaks onto the site.

```bash
git -C ~/Projects/ai-memory fetch --tags
npm run check:upstream                  # against the newest tag
npm run check:upstream -- --to v2.4.0   # against a specific one
```

| Part of the report | What it tells you |
|---|---|
| 1. Changed upstream | Docs that changed and changelog entries since the release the site was last reviewed against |
| 2. Hard facts | Checked for you: support matrix against the README, benchmark against `docs/benchmarks/README.md`, throughput against `docs/deploy.md`, crates against `Cargo.toml`, every command, flag and environment variable shown on the site, every link into the repository's docs, and the download file names |
| 3. Where the numbers are quoted | Every catalog key that repeats a tracked number, so a changed figure is updated everywhere |

It exits with an error when a hard fact is out of date. After the site is updated:

```bash
npm run check:upstream -- --record
```

That writes `src/data/upstream-sync.json` with the tag and commit the site was reviewed against. The next report starts from there.

## Where the facts live

| Fact | File |
|---|---|
| Benchmark, throughput, crate list | `src/data/facts.json` (pages read the numbers from here) |
| Agents, platforms and their status | `src/data/support.ts`, with notes in the `support` catalogs |
| Competitor comparisons | the `competitors` catalogs |
| Everything else | the page catalogs under `src/i18n/locales/` |

Text changes follow the rule in [i18n.md](i18n.md): all six languages in the same change.
