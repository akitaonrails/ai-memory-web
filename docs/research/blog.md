# Blog research: "AI-MEMORY 2.0 - The Best Memory System for Agents and Teams"

- PT: https://akitaonrails.com/2026/09/02/ai-memory-2-0-melhor-sistema-memoria-agentes-e-times/
- EN (exists, different slug; all quotes below are from it verbatim): https://akitaonrails.com/en/2026/09/02/ai-memory-2-0-best-memory-system-for-agents-and-teams/
- Author: Fabio Akita. Published 2026-09-02. Tags: ai-memory, coding-agents, open-source.
- Previous post referenced (July, v1.17.1, introduced `ai-memory run`): https://akitaonrails.com/en/2026/07/20/whats-new-ai-memory-switch-agents-without-losing-session/
- Release notes: https://github.com/akitaonrails/ai-memory/releases/tag/v2.0.0
- Contributing guide: https://github.com/akitaonrails/ai-memory/blob/main/CONTRIBUTING.md

## 1. Images (article body has exactly 2; no diagrams, no video)

Saved in `/mnt/data/Projects/ai-memory-web/research-assets/blog/`.

| File | Dimensions | Shows | Marketing quality |
|---|---|---|---|
| `webui-project-list-okf-backup-notice.png` (634 KB) | 1843x1899 | Web UI "Projects" index in dark navy theme: brain logo + "ai-memory" header, search box, amber banner "This is LLM-optimised memory, not hand-curated documentation" (mentions memory_query / memory_recent / memory_explore), blue banner about the pre-migration OKF backup (862.5 MB tar.gz), then a 2-col grid of project cards (the author's own projects, names omitted here). | Sharp, retina-grade, usable. Caveats: two large notice banners dominate the top half (the migration banner is transient, not the normal look), shows the author's private project names, tall near-square aspect. Best use: crop to the project-card grid, or reshoot without the migration banner. Source: https://new-uploads-akitaonrails.s3.us-east-2.amazonaws.com/20260902132131_screenshot-2026-09-02_13-20-02.png |
| `okf-migration-dialog-backup-rollback.png` (406 KB) | 1278x1218 | Modal dialog "Your memory was upgraded to the 2.0 format": OKF v0.2 migration timestamp, verified backup path and size, "If something looks wrong" 3-step rollback box, "Do not show me again" checkbox, "Got it" button. Cropped tight; blurred page text bleeds in at the edges. | Sharp and legible, but a cropped modal with ragged background edges. Good as a small supporting image for a "safe upgrades / honest infrastructure" point, not as a hero. Source: https://new-uploads-akitaonrails.s3.us-east-2.amazonaws.com/20260902131952_screenshot-2026-09-02_13-16-17.png |

No og:image or other article-specific art was found in the page.

## 2. Key points (English)

### Pitch
- "ai-memory is a long-term memory server for your coding agents. It captures what happened in the session, consolidates it into Markdown pages, and hands the right context to the next agent, whatever the harness or the machine."
- TL;DR: 2.0 ships the open OKF format, local embeddings on by default, and real support for several agents and a whole team on the same project in parallel.
- Thesis: "the model and the harness are rented, the project's memory is yours."
- Web UI is positioned as an audit/browse tool: "handy for auditing what the agents wrote and for browsing between projects"; each project is separate with its own page count, "all of it coming out of real sessions."

### Why "2.0" (versioning story)
- 1.x went from 1.1 to 1.39 "in a little over two months"; July post was at 1.17.1.
- 2.0 bundles the few breaking changes into one major; from now on real SemVer (fix = patch, feature = minor, format/contract break = major, always with warning). Rule is written into the contributing guide.
- Main break = new on-disk format. First 2.0 start auto-migrates the wiki. Before touching anything it compresses the entire data dir into a verified, dated backup. If the backup cannot be written and checked, migration aborts and the server refuses to start. "No 'trust me'."
- One-time notice shows backup location, size, rollback steps; delete the backup and the reminder disappears. (Screenshot: 862.5 MB backup; frontmatter rewritten in place, bodies/timestamps/version history untouched.)

### What's new in 2.0
- OKF native: the wiki is natively an Open Knowledge Format bundle ("the open format Google published in 2026"). Every page is a valid OKF file (plain Markdown + standardized metadata). No export step producing a divergent copy: "The wiki files already are the OKF files."
  - Read with grep, open in Obsidian, version in Git, hand the bundle to a coworker on another OKF tool.
  - `ai-memory export-okf` packages a whole project into a validated tarball.
- Local embeddings, on by default: in-process, pure Rust, all-MiniLM-L6-v2. No API key, no external server, no GPU, nothing leaves the box. First run downloads the model (~87 MB, pinned checksum) in the background; hybrid search turns on at next restart. Off switch: `embedding_provider = "none"`.
  - Benchmark: LongMemEval-S hit@5 goes 0.617 (full-text only) -> 0.779 (with local embeddings).
  - Chose `candle` deliberately instead of the native runtime competitors use; that native layer "is exactly what caused a recurring kind of crash in other memory projects."
- Several agents at once on one project (Claude in one tab, Codex in another, OpenCode in a third):
  - Each memory call resolves its project from the session's directory.
  - "Current project" pointer is per actor.
  - Project identity comes from the checkout name, not the absolute path, so laptop and desktop land in the same place.
  - Concurrent writes to the same page: the second creates a new latest version; the previous stays in the version chain. Identical write = no new version. Single writer with queue and backpressure, "so a burst doesn't corrupt anything."
  - Acceptance test calls Claude, Codex, OpenCode, Pi, Crush and others for real inside one workstream (leases, session adoption, cross-harness context handoff).
- Whole team on one server:
  - Someone brings up a container in a homelab/LAN box; everyone points agents at that URL; optional HTTPS via reverse proxy; still a single SQLite.
  - Everyone sees the same pages; each new session gets a project-state briefing.
  - Honest about "real time": shared central store with immediate reads + briefing at open. A coworker's note is visible to anyone's next query or next session; a running session is not interrupted mid-flight.
  - Attribution on every write, audit log, UI shows "edited by so-and-so". Free, in the box.
  - No per-page permissions, on purpose: anyone authenticated can write; history tracks who.
  - Shared vs personal: pages belong to everyone; a handoff is a baton with one owner (exactly one session takes it, a second accept cannot steal it, a coworker never receives or consumes your pending handoff); "what I'm working on right now" slots are per person and do not leak into the team briefing.
  - Real concurrency test battery: simultaneous writes, per-actor isolation under load, un-stealable handoff baton, non-leaking personal slots.
- Also new (gap-closing list): reproducible LongMemEval benchmark run against the actual server; typed links between pages (causes, fixes, contradicts) that also feed a contradiction check with no LLM spend; `as_of` queries ("what we knew about a subject on a given date"); optional "experience" pass reviewing several sessions to find patterns that only show across the set.

### Comparisons to other tools (as characterized by the author)
- agentmemory: TypeScript MCP server tied to a native sidecar, "a giant surface of dozens of tools."
- basic-memory: Python, Markdown on disk, but manual capture ("you have to ask it to remember").
- cognee: graph + vector + relational in a heavy pipeline "that wants several gigs of RAM."
- MemPalace: "went viral with almost 50,000 stars in two weeks over a benchmark number that, once audited, turned out to be inflated", plus corruption when two writes happen together.
- Zep (temporal graphs), Letta / ex-MemGPT ("memory OS"), Mem0 (fact extractors): named as categories.
- Claude Code native memory (now on by default): "the funnel that introduces the category to people"; limited: one machine, one agent, no real search, no team history.
- Six differentiators (same list as the README's "Why"): across agents (20+ harnesses, typed claim-once handoff), across machines, team (auth, attribution, audit free), plain Markdown in Git with rebuildable derived index, silent capture with zero LLM calls by default, single binary ("No sidecar, no three databases to sync") with a measured write ceiling. "That design is exactly what avoided the concurrent-write corruption that took the others down."
- "No competitor delivers this set. Some have one piece or another. ai-memory has the whole package."

### Numbers
- Versions: 1.1 -> 1.39 in a little over two months; July post at 1.17.1; 2.0 shipped 2026-09-02.
- Contributors with a merged PR: 15 in July -> "around seventy" now.
- "more than 1,500 commits, 371 merged pull requests, and 181 closed issues."
- Djalma Junior: 50+ merged PRs. Samir Hanna Verza: 20+.
- LongMemEval-S hit@5: 0.617 -> 0.779. Model download ~87 MB.
- 20+ harnesses. MemPalace: ~50,000 stars in two weeks (competitor figure).
- From screenshots: author's own store backup was 862.5 MB; ai-memory project 124 pages, akitaonrails-hugo 145 pages.
- NOT in the article: ai-memory's own GitHub star count, user counts, latency/throughput figures (the write ceiling is mentioned but not quantified here; README says ~700/s).

### Community / credits
- "This stopped being a weekend project a long time ago."
- Named contributors: Djalma Junior (djalmajr), Samir Hanna Verza (samirhvbr), lhzapata, pedrofjr, mrpaiva, lucasliet, lihuiyang1024, Murillofilho86, Matheus Rodrigues (matheus-rodrigues00), plus "a long tail of dozens".
- Contributing guide rewritten: env setup, CI gates, CHANGELOG rule, versioning policy. Bug fix ships in next patch; small feature (new harness/provider) in next minor; starter-tagged issues exist.
- Install: AUR, Homebrew, release binaries. After updating, let the migration take the backup; managed-mode users reinstall hooks.

### Quotable lines (Fabio Akita, EN version verbatim)
- "For me, the first digit of a version carries a commitment."
- "If the backup can't be written and checked, the migration aborts and the server refuses to start. No 'trust me'."
- "This is the change that made me happiest." (on OKF)
- "your memory stopped being a hostage of my project."
- "the model and the harness are rented, the project's memory is yours. Now the format backs that up in writing."
- "I preferred not to inherit the problem." (on candle vs native runtime)
- "This isn't theory."
- "I'll be honest about the term 'real time'."
- "No competitor delivers this set."
- "1.x proved the idea worked. 2.0 is the version I'd recommend without an asterisk for someone else to put on a team."
- "Semantic search runs local, so you don't pay and you don't leak."
- "the single-binary, single-writer design is what avoids exactly the problems that sank half the competition."
- "The LLM and the subscription I keep renting from whoever's best that month. The project's memory stays with me, with the team, and now in a format nobody can take away from me."

## 3. In the article but NOT in the README

(README = /home/akitaonrails/Projects/ai-memory/README.md. It only links OKF, benchmarks and MIGRATION-2.0 docs in the docs table without explaining them.)

- The whole 2.0 narrative: why a major, 1.1 -> 1.39 in ~2 months, the SemVer commitment.
- Backup-gated migration detail: verified dated tar.gz of the whole data dir, server refuses to start if backup fails, one-time dialog + banner, rollback steps.
- OKF explained: Google's 2026 open format, pages ARE OKF files (no divergent export), `ai-memory export-okf` tarball, the anti-lock-in framing.
- Local embeddings ON BY DEFAULT in 2.0: in-process pure Rust, all-MiniLM-L6-v2, candle, ~87 MB pinned-checksum download, no key/GPU/server, `embedding_provider = "none"`. (README still frames vectors as optional/opt-in and lists only remote embedding providers; `models/` dir is "reserved". Possible README staleness worth flagging.)
- Benchmark number: LongMemEval-S hit@5 0.617 -> 0.779. README has no figures.
- candle-vs-native-runtime rationale (crash class avoided).
- Concurrency semantics: checkout-name project identity, version chain on concurrent page writes, identical write = no version, queue + backpressure.
- Real multi-harness acceptance test (Claude, Codex, OpenCode, Pi, Crush...) and the concurrency test battery.
- Honest "real time" definition for teams; no per-page permissions by design; per-person "working on now" slots; "edited by" in the UI.
- Typed links (causes / fixes / contradicts) and the zero-LLM contradiction check; optional cross-session "experience" pass. (README only mentions "typed edges" and `as_of` in the comparison table.)
- Competitor characterizations absent from README: MemPalace (50k stars, inflated audited benchmark, write corruption), Letta/MemGPT, cognee RAM weight, agentmemory's sidecar + tool sprawl, Claude Code native memory as "the funnel".
- Community numbers and names: ~70 contributors (from 15 in July), 1,500+ commits, 371 merged PRs, 181 closed issues, top contributors.
- Homebrew as an install path (README quick start shows AUR and Docker only).
- All the author quotes above, and both screenshots (README has only the logo).

Conversely, README-only facts the article lacks: ~700 writes/s measured ceiling, full support matrix, provider list, OIDC/SSO, air-gapped install, agent messaging.
