# ai-memory 2.4 release brief

Source: `~/Projects/ai-memory`, ref `origin/release/2.4` (`e83ef8a4`), compared with tag `v2.3.2` (`eaec1177`). 88 commits. Read through git only. `Cargo.toml` on the branch still says `version = "2.3.2"` and the changelog section is still `[Unreleased]`, so 2.4 is not tagged yet.

Every statement below is from the cited file. Where I checked code to settle a doubt, it is marked "(code)".

---

## 1. Memory aging, the headline

Sources: `docs/design-memory-aging.md` (design of record), `CHANGELOG.md` `[Unreleased]`, `docs/ARCHITECTURE.md` diff, `docs/cookbook.md` diff, `README.md` diff.

### What "aging" means

How ai-memory treats old memory: decay, compression, consolidation and access-weighted retention. 2.4 adds three buckets on top of the forget-sweep that already existed: A (zero-LLM decay and compression), B (belief strength plus the LLM "dream" pass), C (access-weighted retention).

### What already existed before 2.4 (unchanged, still the default)

- Tiers: `working` / `episodic` / `semantic` / `procedural`. ARCHITECTURE tier table: Working = current session only; Episodic = "30d hot → 180d cold → evict (or tier-down, opt-in A2)"; Semantic = indefinite, no decay; Procedural = indefinite.
- Design doc: "semantic and procedural never decay", "pinned pages are exempt regardless of tier". Only unpinned episodic pages go through the decay pass.
- Retention formula (`crates/ai-memory-store/src/decay.rs`):
  `retention = salience·exp(−λ·age_days) + σ·ln(1+access_count)·exp(−μ·days_since_access)·breadth`
  with `breadth = 1 + breadth_weight·ln(1 + max(distinct_actors−1, 0))`.
- Defaults: `λ = 0.02` (about a 35-day half-life), `σ = 0.6`, `μ = 0.04`, `salience_default = 1.0`, `cold_threshold = 0.20`, `hard_delete_after_days = 180`, `breadth_weight = 0.0`. Salience clamped to `[0.25, 2.0]` in steps of `0.25`; `Stale`/`Wrong` feedback drops it to the floor.
- The retention score is used only by the forget-sweep and the curator. It never affects search ranking.
- Forget-sweep pass order: (1) TTL pass: frontmatter `expires_at` in the past is hard-deleted, file and rows, regardless of tier or pin; (2) 2.4 opt-in A2 compaction, before eviction; (3) episodic-only decay pass: retention `< cold_threshold` removes the Markdown file and turns the latest row into a decay tombstone; (4) hard-delete pass: tombstones and supersession ancestry older than `hard_delete_after_days` (180); (5) opt-in observation prune, last.
- Sweep triggers: on demand (`memory_forget_sweep`, `dry_run=true` previews) and on the server `[maintenance]` schedule.

### ZERO-LLM path

| ID | What it does | LLM | Default | Enable with | Trigger | Preserved / discarded |
|---|---|---|---|---|---|---|
| **C1** access reinforcement on all read paths (#798) | `memory_read_page`, its `include_related` walk (the walked neighbours too) and `memory_explore` now bump `access_count` + `last_accessed_at`, as `memory_query` and `memory_recent` already did. A page that is opened or reached through a link resists decay like a search hit. | No | **Always on**, nothing to configure | none | Every read. Async fire-and-forget on the single-writer actor, throttled to at most 1 per (page, operator) per minute, FTS-exempt | Strictly additive: only raises retention, never deletes, never changes response payloads. Cannot block TTL cleanup. |
| **A1** per-tier half-life curves (#807) | Replaces the single global λ with a per-tier half-life in days, `λ = ln(2) / days`. | No | **Off** (no table = byte-identical to single λ; upgrade changes no score, mass-evicts nothing) | `[decay.half_life_days]` with optional keys `working` / `episodic` / `semantic` / `procedural`. Omitted key falls back to `[decay] lambda`. Commented example in ARCHITECTURE: `working = 7`, `episodic = 365`, `semantic = 180`, `procedural = 90`. Shape borrowed from mcp-memory-service 365/180/90/30. | Forget-sweep | Pure math. No column, no migration. |
| **A2** extractive tier-down (#808) | Instead of evicting a cold episodic page, compact it: keep L0 frontmatter `abstract:`, L1 first-paragraph summary, L2 regex-mined keep-tokens (file paths, URLs, inline-code spans, error codes, `UPPER_SNAKE` constants, long identifiers). Drop the prose body. | No (regex only) | **Off** | `[decay] compact_cold_episodic = true` | Forget-sweep, before the eviction pass | Rewrite goes through the wiki layer and supersedes the old version. Full body stays in git history and the supersession chain; `restore-page` recovers it. Only unpinned episodic pages. New migration `V65` adds nullable `pages.compacted_at` (mirrored by frontmatter `compacted: true`); a compacted page is never re-compacted, re-evicted or re-reported as cold. Reported in `SweepReport`. |
| **A3** cold-cluster dedup (#812) | Clusters near-duplicate cold episodic pages by embedding (cosine-distance DBSCAN, adaptive k-distance eps, `minPts = 2`) and collapses each cluster to one survivor: the highest-retention member, body = extractive union of the cluster's keep-tokens. Other members are superseded with a merge note pointing at the survivor. | No generative LLM. Needs already-stored embeddings; with no embedder or no embeddings for the `(provider, model, dim)` triple it is a clean no-op | **Off** | `[decay] dedup_cold_clusters = true`; `dedup_min_pts` (default 2); `dedup_max_eps` (default cosine distance ≈ 0.15, a conservative ceiling that errs toward not merging) | Forget-sweep, over the bounded cold-episodic candidate set only (never O(N²) over the corpus) | No source hard-deleted. Members reachable through supersession chain and git, recoverable with `restore-page`. Merge provenance in `page_evidence`. Reported in `SweepReport`. No migration. |
| **A4** entropy / boilerplate pre-filter (#812) | Shannon-entropy plus boilerplate gate that skips low-information session pages (near-empty, whitespace, single-character, highly repetitive) before they reach the cross-session experience consolidation pass (before the LLM prompt, the eval gate and `apply_batch`). | The filter is zero-LLM. It guards an LLM pass that is itself off by default (`experience_every_sessions = 0`) | **Off** | `[auto_improve.scheduler.experience_entropy_filter] enabled = true`; thresholds `min_chars = 16`, `min_entropy_bits_per_char = 2.0`, `max_repetition_ratio = 0.7`, `repetition_min_tokens = 6` | When the experience consolidation pass runs | Advisory: a skipped page is not consolidated, never deleted. Tuned so a terse note with a file path and an error code is kept. Skip count surfaced in the experience report warnings. No schema. |
| **A5** contradiction detection (#814) | `memory_lint` flags pairs of cold knowledge pages (semantic / procedural) whose stored embeddings sit in the **0.4 to 0.75 cosine-similarity band** ("same topic, not a near-duplicate"; ≥ 0.75 is A3 territory, < 0.4 is unrelated). Emits an advisory `contradiction` finding naming both pages with newer-wins timestamp advice. | No. Reads existing embeddings only; no-op without an embedder | Runs whenever `memory_lint` runs (no flag), effective only when embeddings exist | none | User-invoked `memory_lint` (MCP and admin CLI) | Advisory only. Never deletes, edits or supersedes a page. Persists no edge (the `links` table's `contradicts` edges are body-derived and rewritten on every page write). No migration. Bounded, deterministic. |
| **B1** belief-strength confidence (#815) | Read-time `confidence` per page version derived from `page_evidence`: distinct supporting sessions (breadth, not raw count), recency of the newest sighting, live `contradicts` count. Bounded `[0.0, 0.95]`. | No | **Exposed, ranking-inert by default.** Folding into ranking is **Off** | Visible in `memory_query(explain=true)` as `confidence` + `evidence_count` (+ `belief_factor` when folding is on) and in `memory_status` as `evidence_rows`. To fold into ranking: `[retrieval] belief_authority_weight` (default `0.0`), one bounded factor inside the existing `[0.55, 1.50]` authority clamp | Read time | Nothing written. Anti-entrenchment guards: breadth by distinct sessions, recency shading, hard cap 0.95, and **a supersession always wins regardless of evidence**. Confidence never gates a write. Default-on gated on a positive R2 delta, "not yet performed". |

Notes:
- The design doc files B1 under bucket B ("touches ranking or LLM"), but the shipped B1 is zero-LLM. For the site: B1 is a zero-LLM signal that is off for ranking.
- **C2** (graph-degree boost) and **C3** (guards) are in the design doc only. C2 is not in the changelog and not shipped. C3 lists existing guards: pinned is sweep-exempt, `ln(1+access_count)` log-compression, access→retention and evidence→confidence stay separate axes, access never blocks TTL.

### LLM path: the "dream" pass, B2 + B3 + B4 (#816)

- **B2 rewrite/merge.** Takes the same cold clusters A3 finds (same `adaptive_eps` / `dbscan` math, same bounded cold set) and hands each cluster to the configured provider to be rewritten into ONE coherent page. A3 keeps facts; B2 adds prose coherence.
- **B3 scheduling.** Runs only after `[dream] idle_window_secs` with no client activity and cancels the moment the operator returns (a `DreamCancel` flag polled between clusters). Bounded to `max_clusters_per_run`.
- **B4 ordering.** Surprisal-first: clusters farthest in embedding space from the nearest existing (non-cold) page go first. Borrowed from Honcho's Dreamer.
- Needs an LLM: yes. Needs an embedder too.
- Default: **Off.** Runs only when `[dream] enabled = true` AND a provider AND an embedder are configured. A provider-less store keeps the zero-LLM A3 path.
- Config `[dream]`: `enabled = false`, `interval_secs = 3600` (how often the scheduler considers a run), `idle_window_secs = 300`, `min_pts = 2`, `max_eps = 0.15`, `max_clusters_per_run = 8`, `min_cold_pages = 2`. Env form `AI_MEMORY_DREAM__ENABLED=true` (code).
- Safety: never deletes a source. The highest-retention member is rewritten; every merged-away member is superseded with a merge-note stub pointing at it. Pre-merge bodies stay in the supersession chain and git; `restore-page` recovers them. `page_evidence` rows (`reconsolidation` + `b2_dream:<id>`) record which members fed each merge (the hallucinated-merge guard). Goes through `preflight_admission(Consolidate)` then `Wiki::apply_batch` on the single-writer actor. `dry_run` first (a dry run returns the plan and calls neither the LLM nor the writer). JSON-schema structured output only. Every run returns a `DreamReport` (clusters considered, merged, pages rewritten/superseded, skipped, cancelled).
- Gate: default-on requires a positive R2 quality delta. None has been run.
- No new migration, no new MCP tool.

### Safety properties to state

- Reversible: A2, A3 and B2 rewrite through the wiki layer, so each change is a supersession plus a git commit. `ai-memory restore-page` recovers the original.
- Provenance: A3 and B2 record merge sources in `page_evidence`.
- Supersede, never delete, for every 2.4 aging feature.
- Upgrade safety: every new behavior is off or identity by default ("an upgrade to 2.4 changes no scores and evicts nothing", cookbook). `serve` writes a pre-migration safety archive of the data dir before migrating. `V65` is an additive nullable `ADD COLUMN`, no backfill. An older binary opening a newer store fails closed with `StoreError::DataSchemaAhead`.
- What is still deleted, as before 2.4: TTL-expired pages (hard-delete, even if pinned or hot, "A TTL outranks pinning"); and with A2 off, a cold episodic page loses its Markdown file, becomes a tombstone, and its tombstone plus supersession ancestry is hard-deleted after `hard_delete_after_days = 180`. See section 9 about README's "Nothing is hard-deleted".
- Keep forever: pin the page. Semantic and procedural pages do not decay.

---

## 2. Two diagrams

### (a) Zero-LLM decay path

Left to right, one lane, with a loop on top.

1. Box **Page read** (query, read_page, related walk, explore). Arrow labelled **reinforces** up into box 2. Tag: "always on".
2. Box **Retention score**. Caption: `salience·e^(−λ·age) + access term`. Small side tag **per-tier half-life** (dashed, opt-in A1).
3. Arrow to decision diamond **Cold?** (`< 0.20`), fed by a **Forget-sweep** trigger box (schedule or on demand). Side exits before the diamond: **Pinned / semantic / procedural → exempt**, and **expires_at passed → deleted**.
4. From "cold", three branches:
   - solid (default): **Evict** → tombstone → hard-delete after **180 days**.
   - dashed (A2 opt-in): **Compact** → keeps **abstract + summary + keep-tokens**, drops prose.
   - dashed (A3 opt-in): **Dedup cluster** → **one survivor**, others **superseded**.
5. From Compact and Dedup, arrow down to a base strip **git + version chain**, with a return arrow labelled **restore-page**.
6. Separate small box off the lane: **memory_lint** → **contradiction flag** (0.4 to 0.75 similarity, advisory).

Labels (8): Page read · reinforces · Retention score · Forget-sweep · Cold? · Compact · One survivor · restore-page.

Truth constraints: draw default as solid and opt-in as dashed. The restore arrow must come only from Compact/Dedup, not from the 180-day hard-delete.

### (b) LLM dream pass

Left to right.

1. Gate box **Opt-in**: `[dream] enabled` + provider + embedder. Without it, an arrow drops to "zero-LLM dedup (A3)".
2. Box **Idle 5 min** (`idle_window_secs = 300`, checked every `3600 s`). Red return arrow from step 5 labelled **Activity → cancel**.
3. Box **Cold clusters** (same DBSCAN set as A3, max 8 per run).
4. Box **Most novel first** (surprisal ordering).
5. Box **Dry run → LLM rewrite** (JSON schema, admission gate).
6. Output: **One merged page**; side outputs **Sources superseded** (merge-note stub) and **Evidence recorded** (`page_evidence`).
7. Base strip **git + version chain** with **restore-page**, and a small output tag **DreamReport**.

Labels (8): Opt-in · Idle 5 min · Cold clusters · Most novel first · LLM rewrite · One merged page · Sources superseded · Activity cancels.

Add a footer badge "Off by default. Not yet eval-proven."

---

## 3. Other 2.4 features

Source: `CHANGELOG.md` `[Unreleased]`, `docs/ARCHITECTURE.md` tool table, `docs/competitive-parity.md` item 6. All opt-in with default behavior byte-identical. No new MCP tool for any of them.

- **Dialectic answer** (#782, from **Honcho**'s dialectic endpoint): `memory_query answer: true`. With a provider configured, returns `answer: { text, citations }` (citations are page paths), grounded in the retrieved snippets, JSON-schema output. With no provider: normal hits plus an `answer_unavailable` note, no error. Default off; no provider is touched. Single-project and `scopes` searches only; `global` and `as_of` ignore it. Stated caveat: "answer quality is not yet eval-validated", open the cited pages before acting.
- **Reasoning tier** (#783, from **Honcho**'s reasoning-effort ladder): `reasoning` on `memory_query` (answer path) and `memory_explore`. Enum `minimal` (default) / `low` / `medium` / `high` / `max`; unknown value rejected. Maps to a max-token budget, not a provider reasoning field: 1x / 1.5x / 2x / 3x / 4x of the base (answer 2 000, explore 16 000). Inert unless the LLM path runs.
- **Pin before search** (#780, from **LiquidLM**): `memory_query pin_first: true` prepends the project's pinned latest pages (newest first, cap 10), deduped by page id, marked `pinned: true`, re-truncated to the limit. Ignored on `scopes`, `global`, `as_of`. `memory_briefing` now carries a bounded `pinned` list (up to 10), omitted when the project has no pins. Zero-LLM.
- **Related-pages graph walk** (#775, from **basic-memory** `build_context` and **LiquidLM** `follow_references`/`get_related`): `memory_read_page include_related: true` adds a `related` array from a bounded BFS over links and back-links, `related_depth` default 1, hard cap 3, total-node cap 50, cross-project aware, cycle-safe. Each entry has path/title/kind/workspace/project plus `depth` and `direction` (`link`/`backlink`). Zero-LLM.
- **Show superseded** (#773; parity doc calls it the "hide superseded unless asked" knob from the LiquidLM list): `memory_query include_superseded: true` also returns older versions across the FTS/entity/vector/graph streams, each labelled `superseded: true`. `global=true` and `as_of` unaffected. Zero-LLM.
- **`memory_status` scope** (#757, #774): adds a `scope` object with `workspace`, `project`, `resolved_by` (`explicit`, `session`, `shared_slot`, `startup_seed`, `default`, `default_after_mismatch`). The server logs a warning when an unscoped MCP read is resolved by the startup seed or the default after a session mismatch. Always on. `memory_status` also reports `evidence_rows` (B1).
- **R2 eval harness** (#771, #772): A/B retrieval harness plus `--qa` LLM-as-judge mode. See section 5.
- **`GET /healthz`** (commit `8a976b68`, PR #779): unauthenticated liveness probe on the HTTP transport, reads no store, provider or auth state (code). It is on the branch but **not in the changelog and not in any doc**. See section 9.
- **`Ctrl+C` at the native-session chooser** (#795): cancels the acquired run and exits without Enter (`docs/managed-workstreams.md`).

---

## 4. Competitive changes

Sources: diffs of `docs/comparison.md`, `docs/competitive-parity.md`, `README.md`, `docs/research-2026-landscape.md`.

No new competitor and no star-count change in the `comparison.md` or `competitive-parity.md` diffs. (OpenViking "~37.5K stars" is pre-existing context text in the landscape doc, not a change.)

### Per competitor

- **mcp-memory-service**: now called at parity on its whole aging set: per-tier decay curves (365/180/90/30), extractive compression, DBSCAN cold-cluster dedup, access boosts, 0.4 to 0.75 contradiction band. ai-memory's difference: "zero-LLM by default, reversibly (supersede-not-delete + `restore-page`), and off by default". "The difference is posture, not mechanism: theirs runs autonomously; ours preserves the zero-LLM default path and evicts nothing on upgrade." Migration "give up" list is now only: cloud/multi-backend replication (Cloudflare/Milvus) and graph viz. Belief-strength and clustering consolidation "are no longer a give-up".
- **Hindsight**: ai-memory "now ships belief-strength `confidence` + an opt-in LLM 'dream' rewrite, both zero-LLM-default-preserving, off by default, and R2-gated before default-on". Still given up: their published headline accuracy, VLM/LLM extraction depth, "belief-strength that *actually moves ranking by default*". Designed against Hindsight's documented entrenchment failure.
- **OpenViking**: its L0/L1/L2 progressive tiers "map onto ai-memory's extractive tier-down (abstract + summary + keep-tokens)". Remaining R7 work: the tiered on-start brief.
- **agentmemory**: validates the exponential decay; its zero-LLM compression default is the grounding for A2. Table row "Extractive, zero-LLM compression": **BETTER** because reversible and off by default, "not a lossy in-place rewrite". Still ~13 points ahead on raw R@5 (they rerank).
- **Supermemory / LiquidLM**: pin-before-search and the related-pages walk now ship (opt-in). Supermemory's "dreaming" is cited as one source of the dream-pass shape.
- **basic-memory**: related-pages walk covers `build_context`. Still given up to them: "Local zero-cost reranking", real-time collaborative editing, Postgres backend, hosted mobile/web UX. (The row still lists "`build_context` graph-walk" as a give-up; it was not edited. See section 9.)
- **Zep/Graphiti, Mem0, Letta/MemOS, Claude Code built-in**: text unchanged.

### Honcho: shared versus different

- Shared now: opt-in dialectic **answer** (`memory_query answer=true`), the **reasoning** tier, and the Dreamer's **scheduling shape** (surprisal-first ordering, idle trigger, cancel-on-activity) used by the dream pass.
- Still different: comparison.md keeps "Different problem: it remembers the *user*, ai-memory remembers the *project*. Opaque Postgres, LLM-required (Deriver/Dreamer), multi-service stack", and adds "ai-memory borrowed the *conveniences*, not the engine". Deliberately out of scope: "Honcho's theory-of-mind user-modeling engine", LLM-mandatory ingestion, Postgres+Redis+worker weight.

### Parity table rows (competitive-parity.md)

- Retention-as-formula: BETTER, "2.4 adds opt-in per-tier half-life curves (identity default)".
- Per-tier retention curves: **SHIPPED (parity), better default**.
- Extractive, zero-LLM compression: **BETTER**.
- Cold-cluster dedup: **SHIPPED (parity), better safety**.
- Access-weighted retention: **SHIPPED (parity+), closed a real gap**.
- Contradiction detection (0.4 to 0.75): **SHIPPED (parity), advisory-only**.
- Surprisal-first + idle/cancel dream scheduling (Honcho Dreamer / Supermemory): **SHIPPED (parity), opt-in**.
- Typed relation edges: was "SHALLOW on retrieval", now **PARTLY SHIPPED**: `include_related` walks the link graph, "but retrieval **RANK weighting by edge type is still not done** (edge kind stays explain-only in `memory_query`)".
- Belief-strength consolidation: was "BEHIND" and "ranking-inert", now **SHIPPED, off by default (parity of mechanism, unproven)**.
- LLM merge/rewrite dream pass: **SHIPPED, opt-in/off (parity of mechanism, unproven)**.
- bi-temporal-lite: unchanged, **BEHIND by design**, "Ingestion-time only".

### "Where we're behind" in comparison.md, new wording

- "**Raw retrieval score, and no local reranker.** 0.823 hit@5 on LongMemEval-S is comparable to mcp-memory-service and below agentmemory's 0.967 (hybrid + reranking)... The only reranker is LLM-as-judge, so the zero-LLM default path has none; the opt-in `answer=true` dialectic synthesis (2.4) is likewise LLM-required, off by default, and its end-to-end QA-accuracy is early and small-sample... not a headline claim."
- New item: "**Belief-strength and the dream pass ship, but off — no proven win yet.** ... both are **off by default and gated on a recall eval (R2) that has not been run**. We claim parity of *mechanism* with Hindsight/mcp-memory-service here, not a measured recall or QA improvement; until R2 shows a positive delta the honest statement is 'shipped, opt-in, unproven,' and the default path is unchanged."
- Unchanged: headline benchmark comparability.

### Gap status

- Belief strength still ranking-inert? **By default, yes.** It is now computed and exposed, and can be folded into ranking with `belief_authority_weight`, default `0.0`.
- Local reranker? **Still none.** Parity doc item 2 (candle cross-encoder) unchanged; "no local zero-LLM reranker exists".
- Typed edges affect ranking? **No.** Still explain-only in `memory_query`. A `contradicts` authority cap is also not built ("A5 flags, it doesn't yet rank").
- R2 harness: was the missing meta-blocker, "now built (#771/#772)". Full-500 triple "still pending".
- Still unshipped list: MCP tool behavior hints on the 23-tool surface (parity doc wording; see section 9), typed-edge rank weighting, `contradicts` authority cap, read-only graph visualization in `/web`, first-class TS SDK.
- Bottom line in parity doc: "The honest weakness is still retrieval quality ... no local zero-LLM reranker exists, belief-strength is now wired but **default-off**, typed-edge **RANK** weighting is still not built, and the published *full-dataset* triple is still pending."

---

## 5. Benchmarks

Sources: `docs/benchmarks/retrieval-ab-r2.md` (new), `docs/benchmarks/README.md` diff.

- **Headline numbers did not change.** README table still: 0.823 (local embeddings, 2.0 default), 0.668 (zero-LLM, stopword-filtered FTS), 0.617 (pre-2.0 FTS), all LongMemEval-S dated 2026-09-01.
- `benchmarks/README.md` change: one new section "A/B comparisons (R2)" saying the harness can A/B two configs and report an accuracy + latency + context-tokens triple with a delta, and "Full-dataset A/B baselines are published there once run."
- `retrieval-ab-r2.md` methodology: two configs over the same LongMemEval-S question set. Triple = accuracy (`hit@k` / `recall@k`), latency (`memory_query` MCP round-trip p50/p95 ms), context tokens (estimated as **chars / 4** over each hit's `title` + `snippet`, "not a real tokenizer"). Optional `--qa`: an LLM answers from the retrieved context and an LLM-as-judge grades against the gold label; needs a provider key; off by default. Baseline-vs-baseline run is the determinism check.
- "Published A/B numbers": **"Not yet populated"**. Full 500-question matrix is a separately scheduled pass (dataset 278 MB).
- Illustrative smoke, `--sample 4`, explicitly NOT a baseline (accuracy figures "are noise"): hit@5 0.750 baseline (none) vs 0.500 candidate (local), delta −0.250; latency p50 2 → 31 ms (+29), p95 2 → 35 ms (+33); ctx tok mean 408.5 → 393.2 (−15.2); median 494.5 → 389.0 (−105.5). Hardware AMD Ryzen 9 7950X3D (32 threads).
- Illustrative `--sample 20`, NOT a baseline. Retrieval (zero-LLM): hit@1 0.750, hit@5 0.800, hit@10 0.800, recall@5 0.800, latency p50/p95 2/3 ms, ctx tok mean/median 330.2/386.5. QA-accuracy (Gemini `gemini-2.5-flash` answered and graded): 9/20 = 0.450, answer latency p50/p95 705/862 ms, answer tokens mean 453.9.
- The file says twice not to cite these as baselines. **Do not put any of these numbers on the site.** The only safe site claim: an A/B harness exists and the full run is pending. Safe qualitative point: zero-LLM query latency is single-digit ms on that hardware only if you are willing to cite an illustrative run; I would not.

---

## 6. Security and privacy fixes

Source: `CHANGELOG.md` `[Unreleased]` "Security" and "Fixed". The `docs/security.md` diff is **only relative-link fixes**, no content change.

- **rmcp 2.x (2.2.0)** (#794): resolves GHSA-9pj6-vhgr-3mwh (unauthenticated Streamable-HTTP session-table leak / DoS), GHSA-33f5-2c5q-wgwj (missing OAuth resource-field validation), GHSA-9g45-5xwm-f3wc (custom headers leaking to cross-origin redirect targets). Behavior-preserving; "the 23-tool MCP surface is unaffected".
- **JSON secret redaction** (#800): `{"db_password":"..."}` was stored verbatim while the YAML form was redacted; fixed. Also now redacts `Authorization: Basic <base64>` like `Bearer`, plus Azure `AccountKey=` and npm `_authToken=`.
- **Windows credential paths** (#805): privacy strip now redacts `C:\Users\…\.ssh`, `.aws`, `.kube`, `.gnupg`, `.config\gcloud`. The old patterns needed a POSIX `/`.
- **Terminal escapes** (#800): terminal escape sequences, NUL and bidi override characters are stripped from captured text. Tabs, newlines, carriage returns kept. Reason: `ai-memory read-page` and `ai-memory search` replay bodies to a terminal; a NUL also made the markdown file binary for `grep` and git diffs.
- **Case-insensitive page path refusal** (#799): a page write is refused when another live page in the same project differs only by case or Unicode normalization (one file on APFS and NTFS; the second write silently overwrote the first and lost content). Refusal names both paths, applies on every platform, leaves supersedes of an existing path alone. `reindex` skips such a pair, reports the count and logs each.
- Related, not a redaction: `Config::load` uses Windows `%USERPROFILE%` as home when `HOME` is unset, so the #103 guard against a home-directory project swallowing unrelated cwds works on native Windows (#804).
- `GET /healthz` is unauthenticated by design (code comment: a supervisor has no bearer token; it reads no store, provider or auth state). Worth one line on a security page only once upstream documents it.

---

## 7. Other user-visible changes

- **Install / upgrade commands**: `docs/install.md`, `docs/usage.md`, `docs/companion-crates.md`, `docs/macos.md`, `docs/windows.md` have **no diff** since v2.3.2. No new install or upgrade command on release/2.4. A native `ai-memory upgrade` command exists only in **open PR #802** (base `main`), not on release/2.4.
- **Providers**: `opencode` is now documented (#763), "has shipped since 1.x". `OPENCODE_API_KEY` only (no `LLM_API_KEY` fallback); default endpoint Go `https://opencode.ai/zen/go/v1`; Zen via `AI_MEMORY_LLM_BASE_URL=https://opencode.ai/zen/v1`; built-in default model `claude-sonnet-4-6`; `gpt-5.6-luna` goes through the Responses endpoint; aliases `opencode-zen`, `opencode_zen`. It is a docs addition, not a new provider.
- **Support matrix**: diff is only relative-link fixes on the rows macOS, Native Windows, Managed workstreams, Pool. No status change, no new row.
- **Windows fixes**: PowerShell Docker wrapper `bin/ai-memory.ps1` forwards `GEMINI_API_KEY` / `GOOGLE_API_KEY`, Copilot token, `OPENCODE_API_KEY`, `CLAUDE_CONFIG_DIR`, `AI_MEMORY_WORKSTREAM_ID` (#803); POSIX wrapper now forwards `OPENCODE_API_KEY`; drive-letter and UNC paths compared case-insensitively for handoff selection and cwd project matching (#806).
- **MCP tool count**: **23**, stated repeatedly ("no new MCP tool (still 23)"). ARCHITECTURE prose fixed from "the count is 17" to "the count is now 23".
- **Schema**: one new migration, `V65` (`pages.compacted_at`). Older binaries fail closed on a newer store.
- **Crates / companions**: no doc change. New code: `ai_memory_store::belief`, `ai-memory-consolidate::dream` (internal modules, not new crates as far as the docs say).
- **macOS**: nothing macOS-specific changed on release/2.4 except the case-colliding page path refusal (#799), which matters on APFS. The macOS menu bar companion app is **only in open PR #809** (`macos-app` → `release/2.4`), not merged. Do not announce it.

---

## 8. Stale-claims check

- **(a)** "Typed links between pages explain a result but carry no ranking weight, and evidence strength is recorded without affecting order." **Still true by default, but incomplete.** First half: unchanged, edge kind is still explain-only in `memory_query`; new in 2.4, links can be walked with `memory_read_page include_related`. Second half: still true by default, but evidence is now turned into a `confidence` score shown in `explain`, and an operator can fold it into ranking with `[retrieval] belief_authority_weight` (default `0.0`, not yet eval-proven). Suggested: "Typed links explain a result and can be walked from a page, but carry no ranking weight. Evidence strength is now a confidence score you can inspect; it only affects order if you turn it on, and that has not been measured yet."
- **(b)** "No local reranker: an LLM reranker exists and is off by default, a zero-cost local one does not exist yet." **Still correct.** comparison.md now headlines it: "Raw retrieval score, and no local reranker."
- **(c)** "Point-in-time search uses the time a fact was recorded (ingestion time only)." **Still correct.** Parity row unchanged: "BEHIND by design | Ingestion-time only". `as_of` ignores the new `answer`, `pin_first` and `include_superseded` arguments.
- **(d)** "decay and supersession, so stale notes stop ranking." **Was already imprecise and 2.4 docs make it explicit**: the retention score "is consumed only by the forget-sweep and curator, never by retrieval ranking". Decay removes (or in 2.4 compacts) cold episodic pages; it does not down-rank. Supersession does affect retrieval (latest-only by default; `include_superseded` is the new opt-in). Correct statement: "Superseded versions drop out of search, and cold session notes are evicted or, from 2.4, compacted to their durable facts. Pages you keep using decay slower."
- **(e)** "The default path makes zero LLM calls." **Still correct**, and reinforced: every LLM feature in 2.4 (`answer`, `reasoning`, dream pass) is off by default and inert without a provider; all other aging features are zero-LLM.
- **(f)** "23 MCP tools." **Still correct.** 2.4 adds arguments, not tools.
- **(g)** "Honcho: different problem, remembers the user while ai-memory remembers the project." **Still correct**, sentence kept verbatim in comparison.md. Add: ai-memory borrowed the dialectic answer, the reasoning tier and the Dreamer's scheduling shape (idle, cancel-on-activity, surprisal-first), all opt-in; the theory-of-mind engine stays out of scope.

Also check on the site: any "What you give up vs mcp-memory-service" text that lists belief-strength or clustering consolidation (no longer a give-up); any "R2 harness not built" text (now built, full run pending).

---

## 9. Open questions and contradictions

1. **"Nothing is hard-deleted" (README) versus the default sweep.** README's aging bullet says "Nothing is hard-deleted: the original stays in git and the version chain". That holds for compaction, dedup and the dream pass. The default path still evicts a cold episodic page (Markdown removed, tombstone) and hard-deletes tombstones plus supersession ancestry after 180 days, and TTL pages are hard-deleted at once. On the site, scope the claim: "compaction and merges never delete a source". Whether git history of the wiki repo still holds an evicted page after the 180-day hard delete is not stated in the docs I read.
2. **Procedural tier decay.** Design doc: "semantic and procedural never decay". ARCHITECTURE tier table: "Procedural | Indefinite | Frequency-decay if not re-observed". A1 also accepts `semantic` and `procedural` half-life keys, and the commented example sets `semantic = 180`, `procedural = 90`, while the decay pass is described as episodic-only. It is unclear what a semantic/procedural half-life changes. Do not claim per-tier curves make semantic pages expire.
3. **A5 design versus shipped.** Design doc says A5 records a `contradicts` edge; the changelog says it deliberately persists no edge and adds no migration. Follow the changelog. A5 also scans cold semantic/procedural pages, while A3 handles episodic pages.
4. **A5 "cold knowledge pages".** If semantic/procedural never decay, "cold" for them is a score threshold only. Not explained further in the docs.
5. **B1 bucket label.** Filed under "Bucket B, LLM dream pass" in the design doc but shipped as zero-LLM. README table groups it with Hindsight's LLM features. Present it as zero-LLM.
6. **comparison.md says "Hindsight's Dreamer".** The competitor grounding table attributes the Dreamer to Honcho, and lists no dream trigger for Hindsight. Attribute the scheduling shape to Honcho and Supermemory.
7. **comparison.md says "five retrieval conveniences"** and "Everything else here is zero-LLM, reversible, and off by default", yet C1 access reinforcement is always on (README: "Access-weighted retention is always on") and B1 confidence exposure is always on. Minor wording issue upstream; on the site say C1 is always on.
8. **Dream `dry_run`.** Docs say "`dry_run` first", but there is no MCP tool and I found no CLI subcommand for the dream pass (code: only `[dream]` config and the scheduler in `serve.rs`). How an operator requests a dry run is not documented. Do not show a command for it.
9. **Tool hints.** Parity doc lists "MCP tool behavior hints (readOnly/destructive/idempotent)" as still unshipped, while the ARCHITECTURE tool table already has a "Hint" column with `read-only` / `destructive`. Unclear whether those are doc labels or MCP annotations.
10. **basic-memory give-up row** still lists "`build_context` graph-walk" although `include_related` shipped. Not edited upstream.
11. **Changelog has a leftover merge-conflict marker**: line `||||||| 353841d9` between "Added" and "Docs" in `[Unreleased]`. Upstream cleanup needed before release.
12. **`GET /healthz`** (#779) is on the branch with no changelog entry and no doc mention. Confirm with the owner before mentioning.
13. **Version and date.** Branch is still 2.3.2 in `Cargo.toml` with an `[Unreleased]` changelog. Release date and final notes are not fixed; re-run this check against the `v2.4.0` tag.
14. **R2 gate wording.** Docs say the R2 gate is mandatory before default-on for A2/A3/A4 (no-regression) and B1/B2 (positive delta), and that "No R2 delta has been run". So nothing in 2.4 has a measured quality result. Do not imply the aging features improve recall.
15. **`interval_secs`/`idle_window_secs`** are per-server `[dream]` settings; A1 curves are documented in the cookbook as going in the project's `.ai-memory.toml`, while ARCHITECTURE shows `[decay]` in the server config block. Which file wins for `[decay]` is not stated in the diffs.
