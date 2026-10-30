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
| Quality counts on Contribute: rules and invariants in AGENTS.md, docs, unit and integration tests | `src/data/facts.json` under `quality`. `check:upstream` recounts them at the release tag: list items in the six rule sections of AGENTS.md, numbered items under "Cross-cutting invariants", markdown files in `docs/`, and test attributes under `crates/*/src` and `crates/*/tests`. When a count drifts, update the number, never the counting rule, unless AGENTS.md changed shape |
| Agents, platforms and their status | `src/data/support.ts`, with notes in the `support` catalogs |
| Competitor comparisons | the `competitors` catalogs |
| Everything else | the page catalogs under `src/i18n/locales/` |

Text changes follow the rule in [i18n.md](i18n.md): all six languages in the same change.

## v3.1.0 review — 2026-10-16

Reviewed the v3.0.0 → v3.1.0 watched-document diff and both intervening
changelogs (3.0.1 and 3.1.0), using the release tag rather than the working tree.
Updated all six locales for native Windows setup, setup previews, IBM Bob and
CodeBuddy support, bounded context recovery and local harness-switch history,
progressive briefs, admin-only MCP page recovery, optional ledger retention,
search filters and the opt-in management console. Corrected the team account
revocation claim: self-issued keys require separate revocation.

The current benchmark columns use the published 3.1 report, measured on candidate
`a288a1093550b096075087665319054c3ef598ba`; the report explains the later
non-retrieval changes. The October 12 stream decomposition remains explicitly
historical. Quality counts and the MCP tool list were refreshed. The search
screenshot was retaken from the checksum-verified v3.1.0 Linux release binary
on a temporary loopback server with four synthetic pages, without an LLM.

Deliberately left out of the landing-page pitch: the unsigned desktop installer
preview (not a release asset), the operator-decision messaging convention (not
a new server-enforced approval protocol), advanced opt-in verbatim residue, and
internal bug-fix details. Their released upstream docs and changelog remain the
reference. Existing manual Linux/macOS installation paths remain valid.

Validation: source checker reports no mismatches; all 2,428 catalog strings
are translated in every locale; contrast and build pass (102 pages). All 408
page/viewport/theme layout checks, 32 accessibility checks, six mobile Windows
tab checks, and the internal-link scan pass.

## v3.3.0 review — 2026-10-30

Reviewed the v3.2.1 → v3.3.0 tag range, including the intervening 3.2.2–3.2.10
patch notes. Refreshed the GitHub snapshot, release assets and checksum links,
benchmark and quality counts, support matrix and six translated catalogs.
OpenCode V1/V2 is one auto-detected entry; Qoder is supported. The download
summary covers the new dashboard, inbox, safe page patching, project-identity
repair and retrieval evidence. The Browse screenshots were retaken from the
checksum-verified v3.3.0 Linux binary with synthetic data. The top-ten local
benchmark movement remains explicitly linked to the upstream investigation.

The source checker, translation check, contrast check, tests, build and browser
checks were run before publication. Download asset names and their checksum
files were verified against the published release.
