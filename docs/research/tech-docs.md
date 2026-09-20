# ai-memory tech-docs brief (for aimemory.io)

Source repo: `/home/akitaonrails/Projects/ai-memory` (read-only). All paths below are under `docs/` unless noted.
Repo state at research time: `Cargo.toml` workspace version **2.3.1** (released 2026-09-17), branch `main`, CHANGELOG has an `[Unreleased]` section. 2.0.0 was released **2026-09-02**.
Conventions: "quote" = verbatim from the doc. **[STALE]** / **[CONFLICT]** = do not publish without checking. Section 9 collects every flag.

---

## 1. Architecture
Sources: `ARCHITECTURE.md`, `architecture-overview.svg`, `design-decisions.md`, `vector-backend-policy.md`, `prior-art-implementation-findings.md`, `deploy.md` (perf), `install.md` / `windows.md` (hook latency).

### One-paragraph definition (verbatim-safe)
- "ai-memory is a single Rust binary that gives the coding agents ... long-term memory shared across CLIs. Quit one mid-task; open another in the same directory; continue. No manual `write_note` ceremony, no copy-pasting summaries between sessions."
- The artifact is "a **Karpathy-style LLM wiki**: a git-versioned tree of markdown pages on disk that gets *compiled* over time". "A companion SQLite index gives FTS5 + lexical entity + link-neighbor retrieval, with optional vectors; the markdown stays the source of truth."
- SVG subtitle (good tagline): "Hooks capture automatically; markdown is the source of truth; SQLite is the derived search/index layer."

### End-to-end data flow (the "steady-state loop")
1. **Hooks.** Agent CLI emits a lifecycle hook (SessionStart, UserPromptSubmit, PreToolUse, PostToolUse, PreCompact, Stop, SessionEnd, Notification...). Shell hooks `curl` JSON to `POST /hook`; native `ai-memory hook --event ...` commands **spool events locally with a per-entry idempotency key** and a detached `hook-drain` helper delivers them. "Agent hot paths never block on the network; saturated servers return HTTP 429 instead of queueing unbounded work." Server returns **202** immediately. Invariant: hook scripts hard-timeout at **<=200 ms**.
   - Optional client-side capture exclusions: nearest `.ai-memory.toml` `[capture] ignore_paths` drops recognized file-tool events *before* spool/transport/logs/storage.
2. **Server `/hook` router -> sanitize.** "sanitises the payload (the only path from untrusted text into the store)", assigns an `ObservationKind` (closed set of 10: `session-start`, `user-prompt`, `pre-tool-use`, `post-tool-use`, `pre-compact`, `post-compaction`, `notification`, `stop`, `session-end`, `other`), enqueues a `WriteCmd` to the writer actor. Content caps: user prompts + post-compaction summaries **16 KiB**; notification and tool excerpts **2 KB**; 16 KiB backstop on every durable observation body after redaction; HTTP request limit 10 MiB. Redactions are typed labels `[REDACTED:<kind>]` (shipped 2.2.0, per `design-hindsight-borrowings.md`).
3. **Observations.** Stored in SQLite `sessions` / `observations` ("an operational audit trail, not a complete native transcript"). A log line `## [YYYY-MM-DDTHH:MM:SSZ] <event> | <title>` is appended (see flag on `log.md` vs `log-YYYY-MM.md`).
4. **SessionEnd (zero-LLM).** Server "synthesises a `sessions/<id>.md` summary page (rule-based, no LLM) and opens a `Handoff` row for the next agent", in one SQLite transaction; auto-commits the wiki to git. Sessions containing only start/end boundaries produce no artifacts. Clients without a true session-end hook use `ai-memory finalize-session --agent <name>`.
5. **Consolidation (opt-in LLM).** With `AI_MEMORY_LLM_PROVIDER` set, `memory_consolidate` rewrites the summary into a richer page or fans out a multi-page batch under `concepts/`, `decisions/`, `gotchas/` (also `_rules/`, `procedures/`), with path-based wikilinks, preserving the source's natural language. SessionEnd LLM work is a durable retryable queue outside hook latency (`AI_MEMORY_CONSOLIDATE_ON_SESSION_END`, off by default).
6. **Auto-improvement (opt-in LLM, background).** Scheduler (default `interval_secs = 3600`, `max_sessions_per_tick = 1`) reviews newly completed sessions, validates proposals (JSON schema, `min_confidence = 0.75`, size caps, optional executable eval gate), stages them in the pending-writes audit trail (`_pending/auto-improve`), **auto-approves by default**; `[auto_improve] require_approval = true` holds them for a human (recommended for shared/team servers). Never runs on a zero-LLM install. Optional cross-session "experience" pass (section 8).
7. **Wiki pages + index.** Every page write goes through the wiki layer (atomic tmp + rename + fsync), commits to git, and updates SQLite rows + FTS5 **in the same transaction**. A file watcher reconciles outside edits (Obsidian/vim).
8. **Retrieval: `memory_query`.** See fusion details below.
9. **Briefing / handoff.** `memory_briefing` = structured zero-LLM snapshot (counts, 7d/30d activity, rules, slots, recent pages, pending handoffs; opt-in `settled_first: true` leads with up to 8 highest-standing rule/decision pages). `memory_explore` = LLM prose digest over the briefing, "degrading to JSON without a provider". On SessionStart the next agent's hook fetches the open handoff for the cwd.
10. **Forgetting.** Forget sweep (on demand + daily schedule): hard-deletes pages past frontmatter `expires_at` TTL; evicts episodic pages with `retention < cold_threshold` (leaves a tombstone); purges tombstones older than `hard_delete_after_days` (180). Semantic / pinned / freshly-touched pages survive. Optional raw-observation pruning is off by default (`observation_retention_days = 0`).
11. **Backups.** `ai-memory backup --to <tarball>` uses SQLite's online backup API (server stays writable); `ai-memory restore` reverses. "Or: `git push` the wiki dir + `rsync` the data dir."
- Optional **managed-workstream loop**: `ai-memory run <harness>` opens a lease for the repo/worktree, creates/resumes the harness's native session, imports the visible transcript tail + a Git checkpoint on exit into an append-only portable ledger; SessionStart injects a bounded unseen event range. Native stores are opened read-only; hidden reasoning is excluded.

### What the SVG depicts (`architecture-overview.svg`, 1400x920, light theme)
- Top row "CLIENTS": **Agent CLIs** (Claude Code, Codex, OpenCode, Cursor, Gemini, Antigravity, Grok, OpenClaw, OMP); **Terminal and automation** (CLI thin clients: bootstrap, search, backup, lint, embed, forget-sweep); **Browser and API clients** (`/web` wiki browser, `/admin`, `/api/v1`); **Optional providers** (LLM consolidation and lint, scheduled review + approval, embedding vector backfill), drawn orange as external.
- Middle band "ai-memory serve - one Rust binary": `/hook router` (fire-and-forget capture, sanitizes) -> `MCP server` (stdio and HTTP `/mcp`) -> `Web, admin, API` -> `Scope, auth, admission` (workspace/project resolution, capability gates + webhooks; amber "boundary" box). Below: **Writer actor** (green; "single mpsc queue, one rusqlite writer, WAL mode, batch transactions"), **Read pool and retrieval** (blue; "FTS5 + entity + graph RRF, optional vector + authority + raw fallback"), **Lifecycle and scheduled jobs** (purple; session summary + handoff, auto-improve scheduler, consolidate/lint/embed/sweep).
- Bottom "DURABLE STATE": **Markdown wiki** (source of truth, git commits, restore-page, editable by humans/tools), **SQLite memory.sqlite** (derived index and audit store), **Backups and checkpoints**.
- Arrows: blue = client requests / reads; green = writes (writer -> wiki and SQLite); dashed = "watcher reconciliation" (wiki <-> SQLite) and "LLM and embedding calls" (jobs -> providers). Legend: "Solid arrows show request, read, and write paths. Dashed arrows show background reconciliation or provider-backed maintenance."

### Crate layout (9 crates, verbatim)
```
ai-memory-core/        domain types, errors, ids. NO IO.
ai-memory-store/       SQLite + writer actor + reader pool + decay math.
ai-memory-wiki/        atomic markdown writes, file watcher, git.
ai-memory-mcp/         rmcp transport + tool router.
ai-memory-hooks/       payload schemas, sanitiser, /hook ingress.
ai-memory-llm/         provider auth boundary + LlmProvider / Embedder traits.
ai-memory-consolidate/ Karpathy ingest / lint / sweep / auto-improve pipeline.
ai-memory-workstream/  read-only native transcript + launch adapters.
ai-memory-cli/         `ai-memory` binary entry point + thin HTTP subcommands.
```
"Each crate has a single responsibility and exposes a typed API. No circular deps." (Docs also mention an `ai-memory-web` crate for `/web` and an `ai-memory-eval` / `evals/` crate for the benchmark harness; not in the layout block.)

### Data-directory layout
- `<data_dir>/wiki/` - markdown source of truth, owned by a `git2` repo. On-disk shape `wiki/<workspace_id>/<project_id>/<page-path>` (renames don't move files). Page families: `sessions/`, `concepts/`, `decisions/`, `gotchas/`, `procedures/`, `notes/`, `runbooks/`, `_rules/`, `_slots/` (auto-pinned tiny editable slots; `slot_kind: state|invariant`), `_lint/`, `_pending/`, `_prompts/`; per-project `index.md` (OKF) and `_meta.md` (identity manifest).
- `<data_dir>/db/memory.sqlite` - derived index. WAL mode. One writer actor; cloneable read-only pool.
- `<data_dir>/raw/` - immutable sanitized managed-workstream JSONL segments.
- `<data_dir>/logs/` - rolling daily `tracing` output.
- `<data_dir>/models/` - local embedding model (~87 MB `all-MiniLM-L6-v2`, sha256-pinned). [ARCHITECTURE still says "reserved" - STALE]
- `<data_dir>/config.toml` (all values overridable by `AI_MEMORY_*` env); `<data_dir>/client-projects.json` (client-local checkout links); `<data_dir>/auth.json` (OAuth refresh token).
- Default bind `127.0.0.1:49374`. Docker: `docker run -v ai-memory-data:/data -p 49374:49374 ai-memory`.

### The single-writer rule
- Invariant 2: "**Single-writer SQLite actor.** All writes go through one `mpsc` channel to one dedicated OS thread. (cognee #2717.)" Reads use a read-only pool. Queue bounded at **1024** with an awaiting send: bursts slow producers, "Nothing is dropped, and nothing grows without limit" (`deploy.md`).
- Why: avoids `database is locked`, the parallel-SQLite deadlocks (cognee) and concurrent-writer index corruption (MemPalace Chroma/HNSW).

### Key invariants (15 listed; each cites the prior-art bug it prevents)
1. One config-read path (`Config::load()` once). 2. Single-writer actor. 3. **Indexes commit in the same transaction as the data.** 4. **Typed 3-tuple identity** `(workspace_id, project_id, path)` on every row. 5. **Hooks are fire-and-forget** (<=200 ms; 202 or 429). 6. **Privacy strip is a typed boundary**: `Sanitized<NewObservation>` has no constructor other than `sanitize()`. 7. JSON-schema structured outputs only (no XML, no Instructor). 8. `{provider, model, dim}` stored next to every embedding; stale vectors ignored. 9. Live-process check before direct-disk lifecycle ops. 10. Atomic file writes (tmp + rename + fsync). 11. Absolute canonical data dir, logged at startup. 12. No global singletons. 13. **Zero-LLM default path** ("The system works without any provider configured"). 14. Provider auth resolves before provider construction. 15. Tracing subscribers filter their own module.
- An "invariant #16" (multi-user: "pages are shared per project while handoffs stay owned") is referenced in comparison/parity/hindsight docs but is NOT in ARCHITECTURE's numbered list (lives in AGENTS.md). [FLAG]
- Trust boundary: all retrieved memory, handoffs, briefs are treated as "untrusted data rather than instructions" in every LLM prompt and injected packet.

### Retrieval fusion (`memory_query`)
- Candidate streams, fused with **Reciprocal Rank Fusion (k=60)**:
  1. **FTS5** full-text over `pages_fts (title, body)` (2.0 added stopword filtering on bare-query OR-joins).
  2. **Entity match** - lexical noun index (`entities`, `entity_page_links`) derived from frontmatter `entities:` + `tags:`; weighted by inverse page-frequency; "an empty index contributes no candidates or score."
  3. **Graph / link-neighbour** - one-hop expansion over the `links` table (wikilinks, markdown links, typed edges, cross-project links `[[project:path.md]]`, `[[workspace/project:path.md]]`). No graph DB: SQL tables.
  4. **Vector cosine** over `page_embeddings` when an embedder is configured - **default since 2.0 is the in-process local embedder** (pure-Rust candle, `all-MiniLM-L6-v2`, 384-dim, no API key, no egress; `embedding_provider = "none"` opts out). Brute-force cosine over packed vectors in SQLite; `sqlite-vec` deliberately deferred.
  5. Optional 5th stream: `[retrieval] abstract_vectors` over per-page `abstract:` line embeddings (off by default, 2.2.0).
- **Source authority**: post-fusion "bounded authority multiplier" using page kind, tier, `pinned`, and tags (`canonical`, `active`, `source-of-truth`, `superseded`, `historical`, `test-fixture`, `do-not-answer-from`). "It favors maintained rules, decisions, procedures, and gotchas in close contests while keeping episodic, historical, lint, and test evidence searchable. No query-intent regex or hard exclusion participates." (Session pages carry a combined x0.77 kind/tier penalty per CHANGELOG 2.2.0; opt-in `query_intent` cancels it for "last time..." queries.)
- **Optional LLM rerank**: `AI_MEMORY_RERANKER=llm`, up to 30 bounded titles/snippets, one call per query, four in flight; any failure preserves local order. There is **no local/zero-LLM reranker** (acknowledged gap).
- **Raw fallback**: if compiled wiki pages miss entirely, bounded FTS over raw `observations_fts` returns `raw_hits`. "compile first, but keep a bounded escape hatch for exact details."
- Scopes: default = current project + reserved `_global` preferences scope; `scopes` = named sibling projects; `global=true` = every project (FTS-only ranker). `explain=true` returns per-stream ranks, RRF contributions, matched entities, typed edge kind, evidence count, authority multiplier. `as_of` = historical lookup (section 7). Snippets are ~24 words; `memory_read_page` returns full body.
- Reinforcement: page hits bump `access_count` / `last_accessed_at` (throttled to once per page per minute); `memory_feedback` (`helpful`/`not_helpful`/`stale`/`wrong`) adjusts salience.
- Memory tiers: Working (session only) / Episodic (30d hot -> 180d cold -> evict; decay formula `salience * exp(-lambda*dt) + sigma * log(1+access_count) * exp(-mu * days_since_access) * (...)`, defaults lambda 0.02, sigma 0.6, mu 0.04, cold_threshold 0.20) / Semantic (indefinite, only supersedeable) / Procedural (indefinite, frequency-decay). Pinned pages exempt from all decay.

### MCP surface
- **23 tools** (heading + table in ARCHITECTURE; parity doc also says "23-tool surface"). Families: query/recent/read_page/read_session_observations/status/briefing/explore; handoff begin/list/accept/cancel; message send/list/pop/cancel (cross-project inbox, claim-once); consolidate/feedback/auto_improve/write_page/delete_page/forget_sweep/lint/install_self_routing. Positioning: "narrow on purpose" vs basic-memory ~25 and agentmemory 53.

### Measured performance numbers (all with provenance)
- **Writer throughput** (`deploy.md`, reproducible: `cargo test -p ai-memory-store --test writer_throughput -- --ignored --nocapture`):
  | concurrent writers | throughput | mean latency |
  |---|---|---|
  | 1 | 42/s | 23.9 ms |
  | 8 | 295/s | 3.4 ms |
  | 32 | 698/s | 1.43 ms |
  | 128 | 700/s | 1.43 ms |
  "The ceiling is ~700 writes/second", flat past ~32 writers; single-writer latency "dominated by `fsync`, not CPU". Doc's own capacity read: "~700/s is several hundred concurrently active agents". **Caveat (doc's own):** taken on a fast local disk; network/slow volumes "will be materially lower". Hardware not stated in that section.
- **Hook latency** (`install.md`): "one independent v1.29.0 evaluation on native macOS aarch64 measured about 145 ms per `posix-native` invocation (about 290 ms per completed tool call) and about 172 ms per legacy `.sh` invocation." Doc: "one host's measurements, not a benchmark or performance guarantee."
- **Windows hooks** (`windows.md`): native path "roughly 3-5x faster per hook (measured ~735 ms shell -> ~150-205 ms native on an i7-6700HQ)".
- NOT measured / not published: `memory_query` latency (the `150-250ms` p95 in `vector-backend-policy.md` is a *trigger threshold* for adopting sqlite-vec, not a measurement), context-token savings. Do not invent.

### Diagram candidates (7)
1. **End-to-end pipeline (hero diagram).** Left-to-right boxes: `Agent CLI` -> `lifecycle hook (spool, <=200 ms, fire-and-forget)` -> `POST /hook (202 / 429)` -> `sanitize() typed boundary (redact secrets, 2 KB / 16 KiB caps)` -> `writer actor` -> `observations (SQLite)` -> `SessionEnd: rule-based sessions/<id>.md + Handoff row` -> `[optional LLM] consolidate -> concepts/ decisions/ gotchas/ procedures/ _rules/` -> `markdown wiki (git commit)` <-> `SQLite index (FTS5, entities, links, embeddings)` -> `memory_query` -> `briefing / handoff injected at next SessionStart`. Mark the LLM boxes as dashed/optional and label everything else "zero-LLM".
2. **Two layers, one source of truth.** Two stacked stores: `wiki/ (markdown + YAML, git)` labelled "truth" and `db/memory.sqlite` labelled "derived, rebuildable". Arrows: `writer actor` writes both in one path; `file watcher` dashed arrow from wiki to SQLite ("outside edits from Obsidian/vim reconciled"); `reindex` arrow wiki -> SQLite ("rebuild from files"); side arrows out of wiki to `grep`, `Obsidian`, `git push`, `rsync`, `export-okf`.
3. **Retrieval fusion.** Query box fans out to 4 parallel lanes: `FTS5`, `Entity match (inverse page-frequency)`, `Graph neighbours (links table)`, `Vector cosine (local all-MiniLM-L6-v2, optional)`; all converge into `RRF (k=60)` -> `Authority multiplier (kind, tier, pinned, tags)` -> `[optional] LLM rerank (<=30 candidates, 1 call)` -> `Top-k hits`. A separate dashed branch from Query: "if wiki misses entirely -> raw observation FTS -> raw_hits".
4. **Single-writer actor.** Many producers (`/hook`, `MCP tools`, `CLI/admin`, `scheduled jobs`) -> one `bounded mpsc queue (1024)` -> one `writer thread (one rusqlite connection, WAL)` -> SQLite; separately a `read-only pool` with many readers hitting SQLite directly. Annotate "~700 writes/s ceiling, backpressure not drops" and "429 when saturated".
5. **Cross-agent handoff (claim-once protocol).** Sequence diagram: `Claude Code` SessionEnd -> server writes `Handoff{state=open, cwd, owner}`; user quits; `Codex` SessionStart in same cwd -> server matches by path-boundary cwd (`/repo` -> `/repo/api` yes, `/repo-other` no) -> atomic claim `open -> accepted` -> handoff text injected into Codex; a second agent asking gets nothing. Show manual `memory_handoff_begin` taking precedence over the automatic one.
6. **Memory tiers and lifecycle.** Four columns Working / Episodic / Semantic / Procedural with lifetimes (session only; 30d hot -> 180d cold -> evict; indefinite-supersedeable; indefinite-frequency-decay), arrows: observations -> session summary (episodic) -> consolidation -> semantic/procedural pages; supersession chain (`v1 <- v2 <- v3`, `is_latest`); a "forget sweep" arrow to tombstone -> hard delete after 180 days; "pinned / `_slots/`" shield icon exempt from decay.
7. **Deployment topology / one binary.** One box `ai-memory serve` (bundled SQLite, vendored libgit2, in-process embedder) on a laptop/homelab/LAN server; several machines and 20+ harnesses pointing hooks + MCP at it; multiple users with the auth ladder (root -> DB-user tokens -> OIDC); contrast inset of what competitors need (Postgres + Redis + worker, Neo4j, sidecar engine, vector DB). Keep the honest caveat: one shared server, no automatic replication.
   (8, optional) **Bi-temporal-lite `as_of`.** Timeline with page versions v1 (June, "postgres") and v2 (August, "sqlite"); a vertical `as_of = 2026-07-01` cursor selecting v1 via two streams (entity timeline + version-filtered FTS).

---

## 2. OKF (Open Knowledge Format)
Sources: `okf.md`, `research-2026-landscape.md` section 1, `ROADMAP-2.0.md` item 2, `MIGRATION-2.0.md`, `comparison.md`.

- **What it is:** Google Cloud's Open Knowledge Format: "organizational knowledge as a plain directory of markdown files with YAML frontmatter, one concept per file, a single required frontmatter field (`type`), no SDK, no runtime, vendor-neutral." Landscape doc calls it "an explicit formalization of Karpathy's 'LLM wiki'" and "the interop layer that makes agent memory portable across tools". Published **June 12, 2026 as v0.1**.
- **Version targeted:** **OKF v0.2**. Spec: `GoogleCloudPlatform/knowledge-catalog`, `okf/SPEC.md` "(verified 2026-09-01)". v0.2 breaking changes vs v0.1: `timestamp` -> `generated: {by, at}`; the `# Citations` body section -> `sources` frontmatter; plus additive trust/lifecycle/provenance families.
- **Conformance requires:** every non-reserved `.md` has parseable YAML frontmatter with non-empty `type`; bundle root `index.md` declares `okf_version: "0.2"`; reserved names `index.md` / `log.md` follow spec when present; consumers must tolerate unknown keys.
- **How the wiki maps:** "natively an Open Knowledge Format bundle from 2.0 on ... the wiki files *are* the OKF files - no export step forks the truth". **One project scope directory = one bundle.** Each project dir gets a generated `index.md`; `_meta.md` stays ai-memory's identity record; "`log.md` is not adopted: git is the log"; per-month raw ledger `log-YYYY-MM.md` is dropped from exports.
- **Field mapping:**
  | OKF key | ai-memory source |
  |---|---|
  | `type` (required) | path family: `sessions/` -> `Session Summary`, `_rules/` -> `Rule`, `gotchas/` -> `Gotcha`, `decisions/` -> `Decision`, `procedures/` -> `Procedure`, `concepts/` -> `Concept`, `notes/` -> `Note`, `runbooks/` -> `Runbook`, `_slots/` -> `Invariant`/`State`, `_lint/` -> `Lint Report`, `_pending/` -> `Pending Note`; `kind:` frontmatter wins when present |
  | `title` | already written |
  | `description` | existing `summary` |
  | `tags` | already written |
  | `generated.by` | `process:ai-memory/<version>` (zero-LLM writers), `<provider-model>` e.g. `openai-compat/qwen3:32b` (LLM pages), `human:<user>` (watcher-attributed edits) |
  | `generated.at` | page version's `updated_at` |
  | `sources` | `[{resource: "ai-memory://session/<uuid>", author: "<agent>"}]` |
  | `stale_after` | existing `expires_at` TTL |
  | `status` | `deprecated` when TTL-expired but retained; else omitted (spec default `stable`) |
  Extension fields kept verbatim: `tier`, `kind`, `slot_kind`, `entities`, `pinned`, `consolidated`, `session_id`, `agent`, `summary`, `expires_at`.
- **Enforcement:** one choke point, `ops::upsert_page_in_tx` runs deterministic `okf::conform_frontmatter`; "touches nothing already present, invents nothing non-derivable."
- **User value (portability):** `ai-memory export-okf --project myproject -o myproject-bundle.tar.gz`. "Hand a project bundle to a teammate who runs a *different* OKF-aware tool - or no tool at all - and they read your decisions, gotchas and procedures as ordinary markdown with standard metadata". "Nothing is held hostage: the export is a validated copy of the files ai-memory already lives on." Export fails on a non-conformant page. **Import has no dedicated command by design**: unpack the bundle into the project's wiki dir and let the watcher / `reindex` ingest it.
- **1.x -> 2.0 migration:** automatic, backup-gated (full data-dir tarball in `$HOME`, verified, **migration aborts if backup fails**), in-place frontmatter rewrite (same page id, same version row, body + `updated_at` untouched; one git commit "okf-migration"), idempotent, downgrade guard (`NewerWikiFormat`), homepage notice until archive deleted.
- Positioning line from roadmap: "the server-grade implementation of the standard Google published".

---

## 3. Karpathy LLM Wiki
Source: `research-karpathy-llm-wiki.md`.

- **Origin:** Andrej Karpathy's April 2026 gist `llm-wiki.md` (https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f), which he calls an "idea file" - "explicitly *not* a library or app". X thread April 2, 2026; gist two days later. He links it to Vannevar Bush's 1945 Memex.
- **Core argument (verbatim from the gist as quoted in the doc):**
  - "Most people's experience with LLMs and documents looks like RAG ... the LLM is rediscovering knowledge from scratch on every question. There's no accumulation."
  - "the LLM **incrementally builds and maintains a persistent wiki** - a structured, interlinked collection of markdown files that sits between you and the raw sources ... The knowledge is compiled once and then *kept current*, not re-derived on every query."
  - "The wiki is a persistent, compounding artifact. The cross-references are already there. The contradictions have already been flagged."
  - "LLMs don't get bored, don't forget to update a cross-reference, and can touch 15 files in one pass."
  - "Obsidian is the IDE; the LLM is the programmer; the wiki is the codebase."
- **Principles:** (1) **Compilation, not retrieval**; (2) three layers: raw sources (immutable) / wiki (LLM-maintained markdown) / schema (CLAUDE.md / AGENTS.md); (3) three operations **Ingest / Query / Lint** (one ingest touches "10-15 wiki pages"); (4) cross-linking is the synthesis; (5) `index.md` + `log.md`; (6) human curates, LLM does the bookkeeping. Gist notes `index.md` is enough at "~100 sources, ~hundreds of pages"; bigger -> hybrid search (he names `qmd`).
- **Honest caveat the doc makes:** tiers (episodic/semantic), "sleep-like" consolidation, confidence scoring, Ebbinghaus decay and supersession are NOT in Karpathy's gist - they come from Rohit Ghumare's "LLM Wiki v2" gist / agentmemory. Don't attribute them to Karpathy.
- **What ai-memory took:** markdown files in a git repo as the human-inspectable artifact ("Every memory the agent has must be openable in Obsidian, diff-able in git, and explainable in prose"); compile-at-ingest consolidation with page fan-out; wikilinks as the graph; lint (contradictions, stale pages, orphans, duplicate titles); a schema block installed into CLAUDE.md / AGENTS.md (`memory_install_self_routing`); "Vectors are a retrieval *aid* over markdown, not the source of truth"; cross-agent shared artifact ("The MCP server is the gatekeeper; the markdown is the contract. No vendor lock.").
- **What it changed:**
  - Karpathy's pattern is human-curated, one source at a time; "A coding agent ingests *continuously and unsupervised* from tool calls." So ai-memory adds **ambient hook capture** and a **lifecycle layer** (tiers, decay, supersession, TTL, feedback) so the wiki doesn't fill with stale residue.
  - **Zero-LLM default**: rule-based session summaries; LLM compilation is opt-in (Karpathy's pattern assumes an LLM does all maintenance).
  - Coding-specific page types: gotchas, decisions (ADR-style), procedures, `_rules/`, failed approaches - "exactly what gets dropped on context compaction."
  - Retrieval is a fused FTS5/entity/graph/vector index rather than reading `index.md` first.
  - Adds multi-agent handoffs, multi-user, per-project 3-tuple scoping, OKF conformance.

---

## 4. Research and rationale
Sources: `design-decisions.md`, `prior-art-implementation-findings.md`, `vector-backend-policy.md`, `research-*.md`, `issues-cognee.md`, `design-hindsight-borrowings.md`, `competitive-parity.md`.

### Key decisions and why
- **Markdown in git as source of truth (Option B of three surveyed; section 3).** "Backup/move story is trivial - `git clone` or `rsync` a directory"; "Karpathy's pattern *is* the wiki on disk. Faking it with an export step loses the inspect-in-Obsidian property"; "DB is rebuildable from files - corruption is recoverable"; "any agent that reads `~/.ai-memory/wiki/*.md` works without an MCP integration." Mitigations for basic-memory's watcher pain: server owns writes, watcher is a safety net with heartbeat + 30s reconciliation. Honest consistency contract: "There is no real cross-resource transaction between the filesystem and SQLite"; crash windows resolved by reindex.
- **Single SQLite file (section 4).** "one SQLite file with FTS5, packed-vector embeddings, and SQL tables for graph edges." Why not Postgres/pgvector: cognee #2717, basic-memory #830/#831 - "v1 ships embedded." Why not LanceDB (cognee #2702/#2720 file-format drift), Kuzu/Ladybug (cognee #2098/#2768, upstream archived), CozoDB (bus factor), SurrealDB (heavy). `tantivy` not used: FTS5 "sufficient at the corpus sizes we expect (hundreds to low-thousands of pages per project)".
- **No graph DB.** "**The graph is just SQL tables.**" Recursive CTEs + `links` table; "Avoids the entire 'embedded graph DB' footgun cognee fell into." Bi-temporal-lite on SQLite "covers the useful part".
- **Zero-LLM default.** "**Off by default** ... Without a provider, the system still works: synthetic compression (rule-based)". Lesson from agentmemory #138/#143 (default-on LLM token bills, context-injection token burn). No LiteLLM-equivalent: "Native HTTP per provider" because cognee's tracker showed "silent-kwarg-drop in a generic gateway is the #1 source of provider bugs." JSON-schema structured outputs, never XML.
- **One binary.** "Single binary, statically-linked where possible. Distroless Docker image." agentmemory's separate `iii-engine` sidecar was "the largest pain cluster"; cognee needs 3 stores + 40+ Python deps and an 8 GB RAM compose floor. Bundled SQLite, vendored libgit2, pure-Rust candle embedder (chosen over ONNX/`ort` to avoid a native C++ runtime per target).
- **Vectors optional / brute-force.** Embeddings were off by default in v1; since 2.0 local embeddings are default-on best-effort, still never required. `sqlite-vec` "deferred intentionally, not rejected"; add only when latest embedded pages per project exceed "roughly `5k-10k`", or p95 exceeds "roughly `150-250ms`" due to vector scoring, or evals show vectors add "`+5-10% recall@5`". "Do not add `sqlite-vec` just because vector databases are conventional".
- **Handoffs as a typed claim-once protocol (section 9).** `Handoff { from_agent, to_agent, project_id, cwd, summary, open_questions, files_touched, next_steps, model, created_at }`. "agentmemory has this informally (`/handoff` skill); we make it explicit from day one because every research report flagged cross-agent as the v0.1 weak spot." cwd matched by path boundary; manual beats automatic; owner-scoped on multi-user servers (`shared=true` publishes; root-only `any_owner=true` recovers); accepting atomically expires older automatic candidates. "Handoffs are a next-session transfer rather than live inter-agent messaging." (Cross-project messaging is a separate claim-once inbox, V64.)
- **Narrow MCP surface.** "basic-memory has ~25 tools, agentmemory has 53. Both have user confusion as a result."
- **3-tuple identity from day one** (basic-memory's v0.20 retrofit trauma).
- **Portable ledger, not transcript conversion** (section 15): rejected converting Claude transcripts into fake Codex rollouts; adapters read native stores read-only.

### Borrowed from each prior-art project
- **agentmemory** (rohitg00, TypeScript; "keep the *ideas*, replace the *substrate*"): automatic hook capture; four tiers; versioned supersession (`is_latest` + `supersedes`); retention-as-formula; triple-stream RRF (BM25 + vector + graph); slots (pinned editable blocks -> `_slots/`); synthetic zero-LLM compression default; privacy strip at the boundary; git-as-snapshot. Rejected: iii-engine sidecar, JSON-in-KV, XML parsing, 53 tools / 124 endpoints, broad context injection.
- **basic-memory** (Python): files as source of truth + derived index; unresolved forward links; narrow param aliases (`query|q|search`); project resolution chain; MCP behaviour hints. Rejected: manual `write_note` ceremony (11-parameter signature), append-only no-lifecycle, LLM-authored markdown grammar.
- **cognee** (Python): task-pipeline shape, provenance stamping, feedback-weighted improve (-> `memory_feedback`). Rejected: LiteLLM/Instructor gateway, three-store sync (`issues-cognee.md` calibration: those two are "the deepest source of correctness bugs"), 40+ deps.
- **MemPalace**: bounded raw/verbatim fallback recall, deterministic IDs, transparent benchmark culture. Rejected: Chroma/HNSW, verbatim-everything with no decay, destructive repair tooling. Cautionary tale: ~47K stars on a claimed 96.6% R@5 that an audit showed "reproduces with a minimal ChromaDB default setup with the palace architecture inactive" (issue #29, arXiv:2604.21284).
- **mcp-memory-service** (doobidoo): local all-MiniLM embeddings by default, typed edges `causes`/`fixes`/`contradicts`, honest published numbers.
- **Zep/Graphiti**: bi-temporal validity -> bi-temporal-lite (`as_of`).
- **Hindsight**: typed redaction labels `[REDACTED:<kind>]` (P1), `page_evidence` substrate + `evidence_count` (P2, ranking-inert), typed edge kind in explain (P3, ranking unchanged), opt-in `settled_first` briefing (P4), "use the subscription you already pay for" docs (P5) - all shipped 2.2.0, rank activations deferred.
- **OpenViking**: L0 abstract embeddings (`abstract_vectors`, opt-in); L1/L2 progressive-disclosure brief still a recommendation.
- **Hermes Agent**: the auto-improvement loop design.
- **OKF / Letta "Is a Filesystem All You Need?"**: external validation of file-first.

---

## 5. Competitive comparison
Sources: `comparison.md` (public, "fair pitch"), `competitive-parity.md` (internal self-critical audit, Sep 2026), `research-2026-landscape.md`, per-project research docs. Star counts "as of 2026-09-18", approximate GitHub raw figures.

**Evidence legend:** [BENCH] = backed by ai-memory's own reproducible harness; [VENDOR] = competitor's self-reported number, not reproduced by ai-memory; [CODE] = parity doc says verified against code; [SRC] = from competitor repo/docs as read by the researchers; [OPINION] = doc judgment, no measurement.
**Global rule:** the only ai-memory numbers with a harness are LongMemEval-S hit@5 0.823 / 0.668 / 0.617 and writer throughput. **No head-to-head benchmark was run by ai-memory against any competitor.** All "better" claims are architectural/qualitative.

ai-memory's "verified moat" (parity doc, [CODE]): zero-LLM default path; files as source of truth; one self-contained binary; cross-harness lifecycle capture across "20+ harnesses"; typed claim-once handoffs + cross-project messaging; multi-user shared-within-project with no paid tier; "A single honest, reproducible benchmark". "None of the competitors below has more than one or two of these; none has all."

| Competitor | What it is | Shared with ai-memory | ai-memory better/extra | Where the competitor wins (honest) | Migration verdict (parity doc) |
|---|---|---|---|---|---|
| **Mem0** (~65.6k stars) | Fact extractor: LLM extracts atomic facts per turn; app/end-user personalization; managed cloud | automatic capture | readable editable pages vs opaque fact rows; FTS+entity+graph+vector fusion vs vector-only; zero-LLM; per-repo; no API spend. Pages-over-facts backed by TriMem arXiv:2605.19952 [OPINION + paper] | SDK/integration ecosystem, managed cloud personalization, biggest mindshare | "Mostly no - different buyer" |
| **LangMem** (~1.7k) | Fact extractor in the LangChain camp, PyPI-only | same camp as Mem0 | same as Mem0 | cheap per-turn personalization | not individually assessed; grouped with Mem0 |
| **Zep / Graphiti** (~31.0k) | Temporal knowledge graph; bi-temporal edges (arXiv:2501.13956); needs graph DB (Neo4j) + LLM | supersede-don't-delete; temporal queries | one binary on SQLite, zero-LLM, files, coding-harness native, supported self-host (doc says Zep "Community Edition is discontinued") [SRC] | "True bi-temporal (world vs observed time), Cypher/BFS graph queries, custom entity/edge types, `minRating`". ai-memory is "BEHIND by design": ingestion-time only | Yes for self-hosting coders; no for enterprise graph queries |
| **Letta / MemGPT** (~24.8k), MemOS, MIRIX | Memory OS: agent self-edits tiered memory; owns the agent loop; ADE | tiers; off-hot-path consolidation ("sleep-time compute") | additive memory under your existing harness, zero-LLM, no runtime adoption; self-editing is "token-expensive" [OPINION] | ADE + agent framework; long-horizon episodic coherence. Letta's own post: plain files scored **74.0% on LoCoMo** [VENDOR] - cited as validation of file-first | No if building on Letta; yes if you only want your coding agent to remember |
| **cognee** (~30.8k) | KG + vector + relational "memory control plane"; ECL/cognify pipeline; 14-16 retrieval modes; broad integrations | provenance, feedback weighting, hook plugin for Claude Code | no 3-store sync, no LLM-per-chunk cost ("A 100-chunk document easily generates 200+ LLM calls"), no 8 GB RAM floor, one binary [SRC] | retrieval-mode breadth, ontology grounding, multi-format ingestion (PDF/CSV/code/web), integration matrix, temporal graph pipeline | grouped under temporal-KG camp; "still heavy for a homelab" |
| **Hindsight** (Vectorize, ~23.9k, MIT) | Postgres/pgvector-primary, LLM-required; four tiers topped by "mental models" = living markdown pages; preprint arXiv:2512.12818 | pages-over-facts; background rewrite loop; RRF over multiple streams; sanitizer ("Memory Defense", 45 patterns) | zero-LLM capture (Hindsight has none), files you own, one binary, in-project team sharing vs strict per-bank isolation [SRC] | **LongMemEval 91.4% accuracy, LoCoMo 89.61%** [VENDOR; preprint; "reproduced by the collaborating labs", not arms-length; accuracy != hit@5]; belief-strength consolidation that actually moves ranking; cross-encoder rerank; causal-graph retriever; 60+ integrations; 25+ providers; K8s/SaaS | Yes for self-hosted/offline/team; no if you need their accuracy and accept LLM-required cloud |
| **OpenViking** (ByteDance/Volcengine, ~38.0k, AGPLv3 core) | "self-evolving context database"; VLM + embeddings required; `viking://` virtual FS; L0/L1/L2 progressive loading | document/directory-scoped memory, background extract/merge, "compile" into wikis | zero-LLM, files, permissive single binary, no AGPL/SaaS weight [SRC] | L0/L1/L2 tiers with reported **34-91% input-token reduction** and LoCoMo lifts 24->82%, 33->83%, 57->80% [VENDOR, in-house, vs stateless/simple-RAG baselines, papers unreviewed]; directory-scoped TrieHI index; broad integrations | different buyer - not a migration target |
| **Supermemory** (~30.1k, MIT repo, hosted API) | Hybrid: chunk-RAG + LLM "dreaming" pass into a temporal vector-graph + per-user profiles; cloud-first | supersede-don't-delete; batch consolidation | data ownership, zero-LLM, offline, lifecycle-hook capture (theirs is turn-batch polling), handoffs, per-project team sharing [SRC] | managed connectors (Drive, Gmail, Notion, OneDrive, S3, GitHub, crawler), multimodal, metadata/`containerTag` filters, user profiles, open MemoryBench harness; "95% LongMemEval_s at Recall@15 ... sub-300ms p50" [VENDOR] | different buyer |
| **basic-memory** (~4.0k) | Local-first markdown knowledge graph over MCP; manual `write_note` | files as truth + derived index; wikilinks; forward links | ambient capture (no ceremony), full lifecycle (decay/supersession), handoffs/messaging, git-versioned truth, published numbers [SRC] | **local zero-cost cross-encoder reranking**, real-time collaborative editing, Postgres backend, `build_context` graph-walk / `memory://` URIs, hosted mobile/web UX, Teams tier | Yes for multi-harness coding continuity; no for a personal Obsidian KB with live co-edit |
| **mcp-memory-service** (doobidoo, ~2.0k) | "Closest sibling (fact-row twin)": SQLite(+vec), local ONNX MiniLM, hook capture (Claude-Code-centric), typed KG, scheduled consolidation | local embeddings, hooks, typed edges, honest numbers | files-as-truth vs fact rows, handoffs, cross-project messaging, `as_of`; "a marginally better + reproducible number" (0.823 vs **0.804 R@5 turn-level; 0.860 session-level**) [BENCH vs VENDOR - note their session-level 0.860 is higher than 0.823] | belief-strength + DBSCAN clustering consolidation, Cloudflare/Milvus multi-backend replication, graph visualization | Yes if you liked hook capture + typed edges + honest numbers |
| **agentmemory** (rohitg00, ~28.6k) | The ideological ancestor: TS MCP server on `iii-engine`, JSON-in-KV, 53-54 tools | almost all concepts (tiers, supersession, decay, RRF, slots, hooks) | self-contained binary (no sidecar), real SQL indexes committed in-txn, files-as-truth, typed handoffs, Windows parity, fuller auth; supersession/decay/git-snapshot rated "BETTER" [CODE] | **~13 pts raw R@5**: LongMemEval-S **0.952 R@5** [VENDOR] vs 0.823 (they rerank); P2P mesh-sync; larger tool surface; 1,900 tokens/session claim [VENDOR] | Yes for operability + data ownership |
| **Claude Code built-in auto-memory** (default-on v2.1.59) | Agent keeps `MEMORY.md` + topic files per project, loads first 200 lines each session | "remember my project" convenience; markdown + `type` frontmatter | cross-machine, cross-harness, team sharing, tool-lifecycle capture, real search [SRC: third-party guides] | **zero setup - already on, no server to run** ("our one honest structural disadvantage for the solo case") | Yes for teams / multi-machine / multi-harness; "not obviously" for a solo dev on one machine in Claude only. "Native memory is the funnel, not the competitor." |
| **Honcho** (Plastic Labs, ~7.2k, AGPL-3.0) | User-modeling / theory-of-mind: models what each "peer" knows; Postgres + Redis + worker; LLM-required | MCP/plugin delivery | file-first, zero-LLM, single binary, per-project scoping | reasoning engine (Deriver/Dreamer/Dialectic oracle); LongMemEval-S 90.4% / 92.6%, LoCoMo 89.9% [VENDOR, user-recall on chat transcripts] | "No - different problem": "Honcho remembers the *user*; ai-memory remembers the *project*" |
| **LiquidLM** (closed-source SaaS, solo maker) | Hosted "second brain" vaults, multimodal RAG, 8 MCP tools | supersedes signals, pinned knowledge | data ownership, zero-LLM, self-host, hook capture | multimodal ingestion, polished web app + grounded chat, GitHub sync, out-of-box rerank. No benchmarks published | "Weak - different job" |
| **mempalace** | Spatial-metaphor memory; ~47K stars in two weeks | raw fallback idea | durability (single writer), decay | virality; headline number was debunked | cautionary tale only |
| Adjacent, not competing | **codebase-memory-mcp** (DeusData, ~42K stars; indexes the *codebase*, not the session); **ECC** (~247K stars; agent-harness OS) | - | - | - | "adjacent, not competing" |

**Honest "where we're behind" list (from `comparison.md` + parity doc) - safe to publish, and the site should:**
- Raw retrieval score below the reranking leaders; **no local/zero-LLM reranker** ("The single most-cited weakness").
- Typed edges are "SHALLOW on retrieval" (explain-only; no rank weight); belief-strength `page_evidence` is "ranking-inert" ("BEHIND"); bi-temporal is ingestion-time only ("BEHIND by design").
- "No VLM fact extraction"; "Not a graph database"; "Single server, not SaaS" - no hosted tier, no enterprise console.
- **Cross-machine is overstated in `comparison.md`**: parity doc says "'cross-machine *by construction*' is overstated - it's one shared server + manual git/rsync, with **no automatic replication**". Suggested framing: "one server, many machines".
- Setup friction vs Claude built-in for the solo user.
- Experience pass is LLM-required and off by default.
- Field validation claims (Google OKF, Letta post, Hindsight paper, OpenViking, TriMem) are convergence arguments, not endorsements of ai-memory. Don't imply Google/Letta endorse the project.

---

## 6. Benchmarks
Sources: `benchmarks/README.md`, `benchmarks/longmemeval-s-2026-09-01{,-fts,-local}.md`, `ROADMAP-2.0.md` item 1, CHANGELOG 2.2.0 (secondary numbers).

### Methodology
- Dataset: **LongMemEval-S (v1)**, `longmemeval_s`, sha256 `08d8dad4be43ee20...`. **470 questions scored (30 abstention questions excluded)** of 500.
- Why v1 not V2 (roadmap, "verified 2026-09-01"): LongMemEval-V2 is "WebArena/ServiceNow-style *web-agent* histories, not coding sessions", and competitors publish against v1, so v1-S was chosen "for cross-project comparability".
- Harness in-repo, reproducible: `cargo build --release -p ai-memory-cli` then `cargo run --release -p ai-memory-eval -- retrieval --fetch` (`--embeddings local` for the hybrid row). Ingests through the real hook-shaped path and queries the real retrieval stack.
- Hardware: **AMD Ryzen 9 7950X3D 16-Core Processor (32 threads)**. Date: **2026-09-01**.
- Metrics: "hit@k = any evidence session in top k (the 'Recall@k' most systems publish); recall@k = fraction of evidence sessions found." Session attribution via `sessions/<id>.md` pages and raw observation hits; "unattributable pages never score."
- Retrieval-only: this measures whether the right session is retrieved, **not end-to-end QA accuracy**. No LLM judge, no answer generation.

### Headline table
| mode | commit | hit@1 | hit@3 | hit@5 | hit@10 | recall@5 | recall@10 |
|---|---|---|---|---|---|---|---|
| **local embeddings (2.0 default)** | `0ac0dcf8f89a...` | 0.536 | 0.726 | **0.823** | 0.889 | 0.680 | 0.812 |
| zero-llm, stopword-filtered FTS | `0ac0dcf8f89a...` | 0.534 | 0.647 | **0.668** | 0.696 | 0.538 | 0.566 |
| zero-llm (pre-2.0 FTS) | `496e419ff60e...` | 0.449 | 0.566 | **0.617** | 0.713 | 0.472 | 0.570 |

"The 2.0 retrieval work moved overall hit@5 from **0.617 -> 0.823** (+20.6 points; hit@1 0.449 -> 0.536, recall@5 0.472 -> 0.680) in two measured steps": stopword drop (+5.1 hit@5, +8.5 hit@1), then the local embedder; "the pooling fix alone was worth ~6.6 points over a padded-attention implementation".

### Per-slice hit@5 (n) - pre-2.0 / FTS / local
- knowledge-update (72): 0.708 / 0.764 / **0.903**
- multi-session (121): 0.570 / 0.579 / **0.876**
- temporal-reasoning (127): 0.598 / 0.661 / **0.780**
- single-session-assistant (56): 0.804 / 0.804 / **0.821**
- single-session-preference (30): 0.600 / 0.533 / **0.767**
- single-session-user (64): 0.484 / 0.688 / **0.750**
- overall (470): 0.617 / 0.668 / **0.823**
- Local mode hit@10 per slice: 0.944 / 0.950 / 0.866 / 0.839 / 0.867 / 0.812. Note the FTS step *lowered* single-session-preference hit@5 (0.600 -> 0.533) and overall hit@10 (0.713 -> 0.696) - a regression the docs don't call out.

### Caveats (publish these)
- "mode: zero-llm" = "the deterministic floor (`embedding_provider = "none"`...): FTS5 + entity/graph only". "local embeddings" still uses **no API key and no LLM**; it is an in-process model. So 0.823 is a no-API-key number, but it is not the "FTS-only" number. `comparison.md` wording: "0.823 (local-embeddings default; 0.668 zero-LLM)".
- **2 KB privacy cap cost**: "excerpts are bounded at the 2 KB privacy boundary, so evidence deep inside one long turn is genuinely out of reach of the index. That cost is real and deliberate - the benchmark measures the shipped system, not an idealised retriever."
- Competitor context numbers are their self-reports over raw chat logs: mcp-memory-service **0.804 R@5** (turn-level; 0.860 session-level); agentmemory - see conflict below.
- **[CONFLICT] agentmemory number.** `benchmarks/README.md` and `comparison.md` say "agentmemory 0.967 R@5 ... on this dataset". `competitive-parity.md` item 7 says that is wrong: 0.967 is agentmemory's in-house `coding-agent-life-v1` benchmark (635 requests / 888K tokens / 35 hours, per landscape doc); "the like-for-like LongMemEval-S is 0.952 vs our 0.823". `research-agentmemory.md` also says 95.2% R@5 on LongMemEval-S (86.2% BM25-only). **Use 0.952 for LongMemEval-S; never 0.967.**
- Hindsight 91.4% and Honcho 90.4/92.6% are QA **accuracy**, not hit@5 - not comparable. Supermemory's 95% is Recall@15.
- LongMemEval is chat-assistant history, not coding sessions; a coding-native companion eval (V2's five-ability taxonomy) is planned but **not built**.
- Benchmark is dated 2026-09-01 on pre-2.0.0 commits; not re-published for 2.3.1. Roadmap's cut criteria said numbers would be "re-run and published for the final tree" - no later file exists in `benchmarks/`.
- **[CONFLICT] "R2 harness".** `competitive-parity.md` and `design-hindsight-borrowings.md` say the "R2 reproducible eval harness ... does not yet exist" and "there is no published comparable number", while `benchmarks/` exists and publishes LongMemEval-S. Best reading: the v1-S *retrieval* harness exists; the LongMemEval-V2 / coding-native harness with an accuracy/latency/context-tokens triple does not. Avoid claiming a "full eval suite".

### Secondary numbers (CHANGELOG 2.2.0, #672 - not in `docs/benchmarks/`, private corpus, not reproducible by readers)
- Opt-in `query_intent` + `abstract_vectors`: "Measured on a 138-query golden set over a production two-year wiki (FTS5 + entity + vector + graph, mis-tei Qwen3-Embedding-8B): hit@1 0.609 -> 0.746 (+22%), NDCG@10 0.782 -> 0.879 (+12%)"; cross-check on an independent 99-query set: hit@1 0.556 -> 0.626, NDCG@10 0.712 -> 0.779 (+9.4%). Both signals are off by default; appears to be a contributor's store. Use cautiously or skip.

---

## 7. Temporal features and typed edges

### Temporal validity - "bi-temporal-lite" (`temporal.md`)
1. `memory_query` accepts `as_of` (ISO-8601) to answer "what did we know about X as of June" - for "audits and post-mortems"; ordinary queries answer "what do we know NOW" and are "the right call 99% of the time".
2. **Ingestion time only**: records "when ai-memory *learned* and *replaced* a fact, not when it was true in the world." World-time (Graphiti-style) is deliberately deferred because "it requires trusting an LLM to date facts, and our zero-LLM default path could never populate it."
3. Two grains: entity links (`entity_page_links.valid_from` / `superseded_at`, shipped 2.0) and page versions (`pages.valid_from` / `valid_to`, V62, shipped 2.2.0); every retire path closes both in one transaction; existing stores are backfilled automatically.
4. `as_of` fuses two streams with RRF (k=60) + authority: the entity timeline and version-filtered FTS. Vectors, graph neighbours, raw fallback, rerank and access bumps stay out of audit mode.
5. Caveats: "it does not reproduce the ranking a search would have returned at T" (BM25 stats come from the current index); purged pages take their timeline with them. Worked example: June "we use postgres" superseded in August by "we migrated to sqlite"; `as_of: 2026-07-01` returns the June version.

### Typed relation edges (`typed-edges.md`)
1. Frontmatter `relations:` with a **closed** vocabulary: `causes`, `fixes`, `contradicts`; unknown keys are skipped with a warning ("a typo cannot mint a new edge kind").
2. Plain `[[wikilinks]]` remain the default; typed edges "earn their keep in one specific loop - **contradictions you want lint to chase**".
3. `contradicts` feeds `memory_lint` with zero LLM: "the declaration IS the signal"; reported until reconciled. `fixes` makes a gotcha's history show what resolved it.
4. They join the retrieval graph "as ordinary edges. No relation-specific ranking weight is applied - the LongMemEval harness showed no basis for one yet"; since 2.2.0 `explain=true` names the edge kind.
5. Written by you (edit markdown) or sparingly by the LLM consolidator (JSON-schema constrained); stored in the existing `links.link_type` column, so no migration.

---

## 8. Roadmap
Sources: `ROADMAP-2.0.md` (a *plan* dated 2026-09-01, not a status page), `CHANGELOG.md` (actual status), `competitive-parity.md`, `research-2026-landscape.md`, `ARCHITECTURE.md` "Future work".

### Shipped in 2.0.0 (2026-09-02) - all eight roadmap items landed
1. **Retrieval evaluation harness** + published LongMemEval-S baselines.
2. **OKF conformance (the 2.0 headline)** - native, shipped as **v0.2** (roadmap text still says v0.1), with the backup-gated in-place migration and `export-okf`.
3. **Typed relation edges** (`causes`/`fixes`/`contradicts`) - via frontmatter `relations:` on `links.link_type` (roadmap proposed a `links.relation` column; not what shipped).
4. **Temporal validity / `as_of`** on entity links.
5. **Local embeddings default-on** - candle, not ONNX/`ort` as first planned; `all-MiniLM-L6-v2`, 384-dim, ~87 MB model fetched once, sha256-pinned, offline drop-in supported.
6. **Cross-session "experience" pass** - opt-in, off by default, LLM-required; `experience_every_sessions = 5`, `experience_sessions = 10`; evidence must span >= 2 sessions.
7. **`status` truthfulness audit** (wiki-format line, embedding triples, typed-edge counts, write-queue depth gauge).
8. Docs why/when pass. Also in 2.0.0: macOS launchd agent.

### Shipped after 2.0 (CHANGELOG)
- **2.1.0 (2026-09-06):** ordered LLM fallback chains `[[llm_fallbacks]]` with 30s circuits; `bootstrap --resume`; OpenCode 2.0 beta support.
- **2.2.0 (2026-09-12):** page-grain ingestion windows + second `as_of` stream; typed edge in `explain`; Hindsight borrowings P1-P5 (`[REDACTED:<kind>]`, `page_evidence`, `settled_first` briefing); opt-in `[retrieval] query_intent` and `abstract_vectors`.
- **2.3.0 (2026-09-16):** `ai-memory run <harness>` auto-wires hooks + MCP on first launch; **boot-time backfill** of pre-hook local history (newest 25 sessions, 50k events cap); `ai-memory doctor` capture-coverage check. Cross-project agent messaging (V64) also in the 2.x line.
- **2.3.1 (2026-09-17)** current; `[Unreleased]`: `memory_consolidate` with omitted `session_id`, transient-error retry.

### What's next (documented recommendations - "nothing here is scheduled")
1. **R2 eval harness** (LongMemEval-V2 / coding-native, accuracy + latency + context-tokens triple) - "the meta-blocker".
2. **Zero-LLM local reranker** (candle cross-encoder), gated on R2.
3. **Activate dormant substrate**: `page_evidence` confidence into authority (belief-strength); typed-edge rank weighting + `contradicts` cap.
4. **Cross-machine story**: reframe, or design a bounded `ai-memory sync` over the git wiki.
5. **Onboarding vs Claude built-in**: one-line `ai-memory run claude` quickstart; "coming from Claude built-in?" importer.
6. Smaller: graph-walk MCP tool (`follow_references`/`get_related`), graph visualization in `/web`, DBSCAN-style dedup, TS SDK, optional dialectic/oracle query, pin-before-search, "hide superseded" knob, metadata/tag filters on `memory_query`, L1 overview tier / tiered session brief, f16 embeddings (evaluate only).
7. ARCHITECTURE "Future work": `sqlite-vec` when criteria hit; scheduled consolidation queue; richer curator actions; richer *read-only* web UI (diff/history/graph) - "It stays read-only by design"; world-time "Phase B" deferred; per-project authorization (#708) design exists (`design-per-project-authz.md`).
- Explicitly not planned: memory-OS self-editing, a graph database, spatial/metaphor architectures, chasing tool count, cloud connectors / LLM-required extraction in core, theory-of-mind user modeling.

---

## 9. Contradictions and stale content (check before publishing)
1. **agentmemory 0.967 vs 0.952** (section 6). `benchmarks/README.md` + `comparison.md` still carry the misattribution the parity audit flagged. Use 0.952 for LongMemEval-S.
2. **MCP tool count**: ARCHITECTURE heading says "23 tools" and the table has 23, but its prose ends "the count is 17, not 10", and `prior-art-implementation-findings.md` says "current 17-tool surface"; `design-decisions.md` section 10 lists 18. **23 is current.**
3. **OKF version**: `ROADMAP-2.0.md` and landscape R1 say v0.1; shipped target is **v0.2** (`okf.md`, `MIGRATION-2.0.md`, `comparison.md`).
4. **OKF backup filename**: `okf.md` says `~/ai-memory-backup-pre-2.0-<date>.tar.gz`; `MIGRATION-2.0.md` says `~/ai-memory-backup-okf-v0.2-<date>.tar.gz`. Migration guide is likelier current.
5. **OKF CLI**: `okf.md` intro shows `ai-memory export-okf --project ... -o ...` (matches CLI subcommand list) but also mentions "an `export --okf` / `import --okf` pair still exists", while later saying "Import has no dedicated command by design". Use `export-okf`; don't promise an import command.
6. **`log.md`**: ARCHITECTURE + `design-decisions.md` say events append to `log.md` and mention `index.md`/`log.md` Karpathy-style; `okf.md` says "`log.md` is not adopted: git is the log" and the hooks write `log-YYYY-MM.md`. Treat the per-month ledger as current.
7. **ARCHITECTURE "Future work" is stale** on two items that shipped: "M9.5 - local embeddings via `ort`" (shipped 2.0 via candle, default-on) and "Real LongMemEval-S harness ... requires the dataset" (shipped; `--fetch`). Also `models/` "reserved" is stale. `design-decisions.md` section 5 also still says embeddings are "off by default" and local is "future work"; section 13 "No LongMemEval-style benchmark harness in v1" is labelled historical.
8. **"R2 harness does not exist" vs published benchmarks** (section 6).
9. **"Cross-machine by construction"** in `comparison.md` is called "overstated" by the parity audit: one shared server, no automatic replication.
10. **Invariant #16** is cited widely but absent from ARCHITECTURE's 15-item list.
11. **agentmemory tool counts**: research doc says 53 tools / 124 endpoints; parity audit says now 54 / 130. `research-basic-memory.md` understates basic-memory's shipped cross-encoder reranking + Teams tier; its closing advice ("keep the DB primary") was **not** adopted - markdown is primary.
12. **Harness count**: "20+ harnesses" in comparison/parity; the SVG names 9; the authoritative list is README Support Matrix / `support-matrix.md` (not read for this brief) - verify before quoting a number.
13. **Star counts**: mcp-memory-service 1.9K (landscape prose) vs ~2.0k (tables); Hindsight ~23.5K vs 23.9k; OpenViking ~37.5K vs 38.0k; Zep "20K+" vs 31.0k. Tables dated 2026-09-18 are newer. Stars move; prefer not quoting them.
14. `design-decisions.md` section 8 names `memory_ingest`, and section 12 names `ai-memory export/import`, `memory_diagnose`, `memory_heal`, `sqlx::migrate!` - none are in the current tool/CLI list (migrations use refinery). Historical; don't cite.
15. Benchmarks were not re-run for the 2.3.x tree (or at least not published).
