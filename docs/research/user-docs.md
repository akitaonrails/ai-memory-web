# ai-memory — user-docs content brief (for aimemory.io)

Source repo: `/home/akitaonrails/Projects/ai-memory` (read-only). Researched 2026-09-19.
Everything in backticks/quotes is verbatim from the cited doc. Items marked **FLAG** are contradictions or unclear points — do not paper over them on the site.

One-liner (README.md): "Long-term memory for AI coding agents. Quit Claude Code mid-task, start OpenAI Codex in the same directory, continue without re-explaining the architecture, the failed approaches, or the open questions." License MIT. Rust badge `rust-1.95+`. Repo `github.com/akitaonrails/ai-memory`.

Pipeline (README "How it works"): `capture -> consolidate -> recall -> handoff` — hooks observe silently / session-end summaries as wiki pages / search + brief injection / next agent, any harness.

---

## 1. Quick start for an individual
Sources: `README.md` (Quick start), `docs/install.md`, `docs/macos.md`, `docs/windows.md`.

Common facts
- Default server address: `127.0.0.1:49374`, loopback-only, **no auth** by default ("on a single-user laptop nothing else can reach it").
- MCP endpoint is `http://127.0.0.1:49374/mcp`; hook URL is the bare origin.
- Wiring an agent is always the same two commands (swap the name per agent):
  ```bash
  ai-memory install-mcp   --client claude-code --apply
  ai-memory install-hooks --agent  claude-code --apply
  ```
- `ai-memory init` only creates the data dir; it does NOT start a server. `serve` must stay running; the CLI is "a thin HTTP client" that "never opens the wiki or SQLite directly".
- `ai-memory uninstall --apply` "removes everything ai-memory installed, and only what it installed. Install commands are idempotent and write timestamped backups next to any file they touch."
- Default data dirs: `~/.local/share/ai-memory` (Linux), `~/Library/Application Support/ai-memory` (macOS), `%LOCALAPPDATA%\ai-memory` (Windows). Override: `AI_MEMORY_DATA_DIR=/path`.
- `cargo install ai-memory` is NOT available (crate name taken on crates.io by an unrelated project).

Linux native — Arch/AUR (README + install.md)
```bash
yay -S ai-memory-bin    # prebuilt Linux x86_64/aarch64 binary
yay -S ai-memory        # builds from source
mkdir -p ~/.config/ai-memory ~/.local/share/ai-memory
ai-memory --data-dir ~/.local/share/ai-memory \
  --config ~/.config/ai-memory/config.toml init
systemctl --user enable --now ai-memory.service
ai-memory install-mcp --client claude-code --apply
ai-memory install-hooks --agent claude-code --apply
```
- Packages install `/usr/bin/ai-memory`, hook sources in `/usr/share/ai-memory/hooks/`, a system unit and a user unit, sysusers + tmpfiles entries, `/etc/ai-memory/config.toml`, `/etc/ai-memory/env`.
- User service: data `~/.local/share/ai-memory`, no sudo. System service: `/var/lib/ai-memory` + `/etc/ai-memory/`. Keep running after logout: `loginctl enable-linger "$USER"`.
- Verify: `curl http://127.0.0.1:49374/mcp` -> "Expect a JSON-RPC error, which means the server is reachable."

Any other Linux/macOS host without Docker (install.md "Running ai-memory without docker")
- `mise use -g github:akitaonrails/ai-memory` — downloads the matching release archive, verifies the `.sha256` sidecar. (mise may hold back the newest release ~a day; pin with `@<version>`.)
- Source build: `git clone https://github.com/akitaonrails/ai-memory ~/.ai-memory && cd ~/.ai-memory && cargo build --release --workspace`, then `./target/release/ai-memory init` and `./target/release/ai-memory serve --transport http --bind 127.0.0.1:49374`.

macOS — native release binary (docs/macos.md, "Recommended, No Toolchain")
```bash
mkdir -p ~/Applications/ai-memory && cd ~/Applications/ai-memory
curl -fsSL -O https://github.com/akitaonrails/ai-memory/releases/latest/download/ai-memory-macos-aarch64.tar.gz
tar -xzf ai-memory-macos-aarch64.tar.gz
./ai-memory init
./ai-memory serve --transport http --bind 127.0.0.1:49374
# second terminal
./ai-memory install-hooks --agent claude-code --apply
./ai-memory install-mcp --client claude-code --apply
```
- `aarch64` = Apple Silicon, `x86_64` = Intel. Browser downloads need `xattr -d com.apple.quarantine ./ai-memory`; curl downloads do not.
- Login service: LaunchAgent plist shipped at `packaging/launchd/com.github.akitaonrails.ai-memory.plist` (included in macOS tarballs); runs `ai-memory serve --transport http --enable-web`; installed with `launchctl bootstrap gui/$(id -u) ...`. A LaunchAgent stops at logout (no linger equivalent). Logs are not rotated.
- Docker wrapper is also supported on macOS (Scenario C).

Docker wrapper — Linux/macOS (README "Docker")
1. Install the wrapper (a small shell script; checksum-verified) from `https://github.com/akitaonrails/ai-memory/releases/latest/download/ai-memory-wrapper` (+ `.sha256`) to `~/.local/bin/ai-memory`.
2. Start the server:
   ```bash
   docker run -d --name ai-memory \
       --restart unless-stopped \
       -p 127.0.0.1:49374:49374 \
       -v ai-memory-data:/data \
       docker.io/akitaonrails/ai-memory:latest
   ```
   (README example also passes `-e AI_MEMORY_LLM_PROVIDER=anthropic -e ANTHROPIC_API_KEY=... -e AI_MEMORY_EMBEDDING_PROVIDER=openai -e OPENAI_API_KEY=...`; "Omit the LLM / EMBEDDING lines for zero-LLM mode".)
3. The two `install-mcp` / `install-hooks` commands.
- Image is multi-arch: `linux/amd64` + `linux/arm64` (no `--platform` needed on Apple Silicon).
- Podman: wrapper "automatically uses rootless Podman when Docker is not installed"; force with `AI_MEMORY_DOCKER=podman`.
- Upgrade: `ai-memory upgrade` (checksum-verified wrapper + image pull + hook restage). Wrapper checks Docker Hub "at most once every 24 hours"; silence with `AI_MEMORY_NO_VERSION_CHECK=1`.
- Compose alternative: `docker compose -f docker/docker-compose.yml up -d`.
- Caveat: the Docker wrapper's `posix` shell-script hooks do NOT enforce `[capture] ignore_paths`; native hooks do (macos.md, marker-file.md).

Windows (docs/windows.md) — "Pick the mode that matches where your agent CLI actually runs."
- Scenario A, WSL2 (status Supported): same as the Linux Docker-wrapper path, run inside WSL2; launch the agent from WSL2 too.
- Scenario B, native Windows + Docker Desktop: PowerShell wrapper assets `ai-memory-wrapper.ps1` + `ai-memory-wrapper.cmd` (checksum-verified) into `$HOME\bin`, same `docker run`, then the two install commands.
- Scenario C, native release zip (no toolchain): `ai-memory-windows-x86_64.zip` -> `$env:LOCALAPPDATA\ai-memory`, contains `ai-memory.exe` + `hooks/`.
- Scenario D, source build. Scenario E, keep the server running via **WinSW** service wrapper (ai-memory has no Windows Service dispatcher; `sc create`/`New-Service` directly will not work; do NOT use a Scheduled Task + `Start-Process`).
- Native Windows status is **Experimental**.

What `ai-memory run` does (README, docs/managed-workstreams.md, CHANGELOG 2.3.0)
- "If in doubt, start your harness with `ai-memory run`." First launch of a harness "auto-installs that harness's ai-memory hooks + MCP if they are missing", wires project scope, and "adds cross-harness *session* continuity on top of shared memory. Everything is idempotent and one-time per harness."
  ```bash
  ai-memory run claude
  ai-memory run codex --yolo   # later: same workstream, different harness
  ai-memory continue           # resume the newest managed checkout
  ```
- Opt out of auto-wiring: `ai-memory run --no-autowire` or `AI_MEMORY_RUN_AUTOWIRE=false` (or `run_autowire = false`). Auto-wire is best-effort: on failure it warns and still launches. Crush is skipped (no installer); Pi wires hooks but has no MCP client.
- Also on by default since 2.3.0: first session in an empty project imports existing local harness history once ("hard-capped (newest 25 sessions, 50k events)"); opt out `AI_MEMORY_BACKFILL_ON_START=false`; manual `ai-memory backfill [--dry-run]`.
- **FLAG**: README calls `run` "the preferred way to launch", while managed-workstreams.md "Do you need this?" says "Probably not at first — hooks alone already carry most continuity." Both are true (hooks = summary handoff; `run` = native session resume + exact tool-call history), but the tone differs. Suggest: "recommended launcher; optional — direct launches keep working".

---

## 2. Quick start for a team / multi-machine
Sources: `docs/install.md` ("Server on a different machine"), `docs/users.md`, `docs/deploy.md`, `docs/security.md`.

Run the shared server
```bash
TOKEN=$(ai-memory generate-auth-token)      # 32 bytes / 64 hex chars
docker run -d --name ai-memory \
    --restart unless-stopped \
    -p 0.0.0.0:49374:49374 \
    -v ai-memory-data:/data \
    -e AI_MEMORY_AUTH_TOKEN="$TOKEN" \
    -e AI_MEMORY_ALLOWED_HOSTS="<server-ip>,localhost,127.0.0.1" \
    akitaonrails/ai-memory:latest
```
- Native alternative: AUR system service with `bind = "0.0.0.0:49374"` + `allowed_hosts = [...]` in `/etc/ai-memory/config.toml`, token in `/etc/ai-memory/env`.
- "Unauthenticated non-loopback HTTP now fails closed." (Inside a container that check only warns — your `-p` spec is what matters.)
- Bearer auth "does not encrypt traffic" — put Caddy / Cloudflare Tunnel / nginx in front for LAN or remote (section 4).

Point clients at it
```bash
export AI_MEMORY_SERVER_URL="http://<server-ip>:49374"
export AI_MEMORY_AUTH_TOKEN="$TOKEN"
ai-memory install-mcp   --client claude-code --apply
ai-memory install-hooks --agent  claude-code --apply
```
- Client-only machine with no Docker: curl installer `ai-memory-install-hooks` (+ `.sha256`) from the latest release.
- Offline laptop: failed deliveries spool to `<data_dir>/hook-spool/` and drain when the server is reachable again (idempotency key per entry). `ai-memory status` shows `spool: pending / oldest / retries`.

Users and API keys (docs/users.md)
- Set root identity in `[auth]`: `bearer_token`, `token_pepper` (auto-generated by `ai-memory init`; "do not change it after issuing native API keys"), `root_username`, optional `root_email`/`root_name`.
- `ai-memory user add-human --username alice --email alice@home --name "Alice Smith"` — temp password printed exactly once; must change on next login; does NOT issue an API key. `--role root` for a second root.
- `ai-memory user list`, `ai-memory user disable <username>` / `enable`, `user reset-password`.
- `ai-memory api-key add --username alice --label codex-laptop` -> `aim_...` secret (shown once); `ai-memory api-key rotate <id>` / `revoke <id>`. "Rotation 401s the previous plaintext immediately."
- Wire a user's hooks: `ai-memory install-hooks --apply --agent claude-code --as-user alice --auth-token aim_...` (`--as-user` is metadata only).
- Tokens are stored in `<data_dir>/auth-token` and `<data_dir>/auth-header` (both `0600`), not on the hook command line.
- Human console login: username/password, `HttpOnly` `ai_memory_session` cookie + CSRF; passwords Argon2id, 12–1024 bytes. First root via one-shot `AI_MEMORY_AUTH__INITIAL_ROOT_PASSWORD`; break-glass via `AI_MEMORY_AUTH__RECOVERY_TOKEN` (>= 32 chars) + `POST /auth/recovery`.

The bearer ladder ("four resolution rungs", users.md; table actually has 5 rows)
- `0 — Anonymous`: no `[auth].bearer_token` set -> allowed, no identity.
- `1 — Root`: bearer matches `[auth].bearer_token`.
- `1b — Proxy-asserted user`: bearer matches distinct `[auth].actor_proxy_bearer_token`; identity from trusted `X-Memory-Actor-*` headers.
- `2 — DB user`: matches an active `api_credentials.token_hash` (`aim_` keys) — user-level only; `/admin/*` is root-only in multi-user mode.
- `3 — 401`: bearer present but matches nothing -> rejected.
- "The rungs are sticky: a request is matched at the first credential that applies, never escalates." Password login is NOT a bearer rung.

Team semantics
- "Knowledge is shared; batons are owned." Pages are readable by every operator; handoffs carry an owner. `shared: true` on `memory_handoff_begin` publishes a baton deliberately.
- "Concurrent edits supersede rather than collide." Version chain, no merge, nothing destroyed.
- Current-project pointer isolation is automatic since v1.39; startup line: `active-project isolation mode mode=PerActor session_ttl_secs=3600 max_entries=4096`. `PerActor` is default; `Single` is unsafe for shared servers.
- Optional `[slots] per_user` (default off) for per-operator memory slots.

Hard limits on the team claim — **must not be overclaimed**
- "Accounts are not a tenancy boundary." "Every authenticated user sees every page in every project in **every workspace on the server**." No per-page RBAC, no per-project ACL.
- "**If one server would hold work for more than one team, that is not a supported configuration yet.**" Run separate servers/data dirs. Per-project authorization tracked in issue #708.
- SECURITY.md: "ai-memory is a **single-tenant workstation/homelab service**."

One server per data directory (deploy.md)
- "Point two `ai-memory serve` processes at the same `data/` (a synced folder, an NFS mount, two containers on one volume) and they will each run their own writer and their own git handle on the wiki. SQLite survives it; the wiki and the in-process state do not. Run one server and let everyone connect to it." (2.0 added an exclusive `<data-dir>/.serve.lock`.)

Capacity numbers (deploy.md, measured via `cargo test -p ai-memory-store --test writer_throughput -- --ignored --nocapture`)
| concurrent writers | throughput | mean latency |
|---|---|---|
| 1 | 42/s | 23.9 ms |
| 8 | 295/s | 3.4 ms |
| 32 | 698/s | 1.43 ms |
| 128 | 700/s | 1.43 ms |
- "The ceiling is ~700 writes/second", reached around 32 writers; queue "bounded at 1024 with an awaiting send"; "Nothing is dropped". "~700/s is several hundred concurrently active agents".
- Caveats: "taken on a fast local disk"; network filesystems will be materially lower; "they measure the store, not the HTTP front door".
- Hook latency reference (install.md): one independent v1.29.0 eval on macOS aarch64: "about 145 ms per `posix-native` invocation (about 290 ms per completed tool call)" — "one host's measurements, not a benchmark". Shell hook `POST /hook` hard timeout 200 ms; handoff GET 1 s.
- Optional rate limit: `AI_MEMORY_HOOK_RATE_PER_SEC`, `AI_MEMORY_HOOK_RATE_BURST`.

---

## 3. Full support matrix
Source: `docs/support-matrix.md` (README has a compact copy).

Status meanings — **FLAG**: the doc never defines the statuses formally. Inferred from the row notes:
- Supported = first-party MCP config + lifecycle capture (hooks or generated plugin/extension).
- MCP-only = memory tools work; no lifecycle hooks, so no automatic capture.
- Hooks-only = capture works; no first-party `install-mcp` client.
- Managed-only = works only via `ai-memory run`; no hook installer.
- Community = third-party-maintained plugin, no first-party installer.
- Experimental = ships, but expect rough edges (native Windows).
- Opt-in = optional feature (managed workstreams).

Platforms
| Area | Status | One-line caveat |
|---|---|---|
| Linux | Supported | Primary Docker/server target and CI platform; images `linux/amd64` + `linux/arm64`; AUR packages with system + user systemd units |
| macOS | Supported | Native `ai-memory-macos-aarch64.tar.gz` / `-x86_64.tar.gz` with per-user launchd agent; native binary recommended on Apple Silicon |
| Windows via WSL2 | Supported | Use the Linux path inside WSL2 when the agent runs there |
| Native Windows | Experimental | `ai-memory-windows-x86_64.zip` (`ai-memory.exe`), Docker Desktop wrapper, or source build; PowerShell/Git Bash scripts are fallbacks |

Harnesses
| Harness | Status | One-line caveat |
|---|---|---|
| Claude Code | Supported | MCP + hooks; optional `install-mcp --session-aware`; optional `--capture-assistant` (double opt-in, off by default) |
| Codex | Supported | MCP + hooks; `SessionEnd` wired since Codex CLI 0.145.0; older Codex needs `ai-memory finalize-session --agent codex`; `--capture-assistant` supported |
| Command Code | Supported | `~/.commandcode/mcp.json` + four hook events; `Stop` is a turn boundary -> `finalize-session --agent command-code`; managed run adds native resume |
| Devin CLI | Supported | Uses `PostCompaction`; no subagent events |
| OpenCode | Supported | Remote MCP + generated TypeScript plugin |
| OpenCode 2 (`opencode2` beta) | Supported | `Plugin.define` plugin `ai-memory-opencode2.ts`; "Beta plugin API and schema — expect churn" |
| Cursor | Supported | MCP config + lifecycle hooks |
| Gemini CLI | Supported | MCP config + lifecycle hooks |
| Oh My Pi / OMP | Supported | `--client omp` / `--agent omp`; native `.omp` MCP + TypeScript extension |
| Pi | Supported | Generated `~/.pi/agent/extensions/ai-memory-pi.ts` gives capture + HTTP MCP bridge |
| OpenClaw | Supported | MCP config + native plugin lifecycle hooks |
| Antigravity CLI (`agy`) | Supported | No true session-end hook -> `finalize-session --agent antigravity-cli`; only invocation 0 consumes a handoff |
| Grok Build CLI | Supported | Capture works; ignores `SessionStart` stdout, so recover handoffs via `memory_handoff_list` + `memory_handoff_accept` |
| Zero | Supported | Capture incl. subagent events; discards `sessionStart` stdout -> recover handoffs via MCP |
| ZCode (z.ai) | Supported | Six triggers; no true session-end -> `finalize-session --agent zcode`; handoff injection works; no managed workstream claimed |
| Kimi Code | Supported | 10 hook events; handoffs inject via `UserPromptSubmit` stdout; `ai-memory run kimi` |
| Kiro CLI | Supported | v2 and incompatible v3 engines; no true SessionEnd -> `finalize-session --agent kiro-cli`; `ai-memory run kiro [--v3]` |
| Crush | Managed-only | `ai-memory run crush` only; no lifecycle-hook installer |
| Pool (Poolside) | Hooks-only | Prints a `hooks:` snippet to paste into `.poolside/settings.yaml`; no handoff injection; no MCP client; verified vs Poolside CLI v1.0.16 |
| Claude Desktop | MCP-only | Uses `mcp-remote`; no lifecycle hooks |
| Swival CLI | MCP-only | `.swival/mcp.json`; no stable session identifier |
| VS Code Copilot | MCP-only | `.vscode/mcp.json`; Copilot exposes no lifecycle hooks yet |
| Zed | MCP-only | `context_servers` in Zed `settings.json` |
| Muse Code | MCP-only | `~/.config/muse/settings.json`; writer adds `"schema_version": 1` and `"mode": "optional"` |
| Hermes Agent | Community | Community plugin `MrLuciano/ai-memory-hermes-plugin`; no first-party installer |
| Managed workstreams | Opt-in | `ai-memory run` covers Claude Code, Codex, OpenCode, OpenCode 2 beta, Pi, Crush, Kimi Code, Command Code, Kiro CLI (v2/v3), OMP, Grok Build CLI, Antigravity CLI |
| LLM/auth providers | Supported | Anthropic, OpenAI, OpenAI OAuth/Codex, GitHub Copilot, Gemini, OpenCode (Go and Zen), OpenAI-compatible, generic OIDC device auth for native hooks |
| Embedding providers | Supported | OpenAI, Voyage, Google Gemini, keyless OpenAI-compatible (Ollama, LM Studio, vLLM) |

- Counts: 25 harness rows (17 Supported, 5 MCP-only, 1 Managed-only, 1 Hooks-only, 1 Community). README says "Twenty-plus harnesses".
- **FLAG**: the matrix "Embedding providers" row omits `local` (the 2.0 default) and `copilot` (added 2.3.0), both documented in llm-providers.md.
- **FLAG**: ZCode row says both "`install-mcp --client zcode --apply` merges a native HTTP entry" and "No first-party `install-mcp` client ... claimed yet" — self-contradictory within one row.
- **FLAG**: windows.md says "Kiro v3 hook capture remains unsupported" while the matrix describes `--agent kiro-cli-v3`. Do not make Kiro v3 claims on Windows.

---

## 4. Security model
Sources: `docs/security.md`, `SECURITY.md`, `DATA_HANDLING.md`, `docs/users.md`, `docs/https-via-proxy.md`, `docs/sso.md`, `docs/airgapped-install.md`, `docs/marker-file.md`, `docs/lifecycle-ops.md`.

Hardening ladder (README Security + security.md)
1. Default: loopback-only `127.0.0.1:49374`, no auth.
2. Bearer token for the LAN: `AI_MEMORY_AUTH_TOKEN` (`ai-memory generate-auth-token`); constant-time comparison. Protects `/mcp`, `/hook`, `/handoff`, `/workstream/*`, and machine calls to `/admin/*` and `/api/v1/*`.
3. `AI_MEMORY_ALLOWED_HOSTS` Host-header allowlist vs DNS rebinding (default `127.0.0.1` and `localhost`; mismatches get 403). "the `Host` allowlist is not a substitute" for auth.
4. Per-user accounts + `aim_` API keys; first DB user makes every `/admin/*` route root-only.
5. OIDC device auth for hooks (`ai-memory auth login oidc-device`).
6. TLS via a reverse proxy; `AI_MEMORY_AUTH__SECURE_COOKIE=true` is required when human auth listens beyond loopback.
- Other bounds: request bodies capped at 10 MB; unauthenticated non-loopback HTTP fails closed (`--allow-insecure-no-auth` is the "intentional, dangerous exception").
- Unix perms: new data dirs `0700`, new config/SQLite/segment/backup files `0600`. "Existing installations are not chmodded automatically."
- "no additional encryption at rest is provided in v1."
- Supported versions: "Only the latest release receives security fixes." Vulnerabilities: GitHub private security advisory; response within 7 days, patch target 30 days.

Typed privacy boundary / sanitization
- README: "sanitized at a typed privacy boundary before anything is stored". ARCHITECTURE invariant: "`Sanitized<NewObservation>` has no other constructor than `sanitize()`."
- Since 2.2.0 redaction uses a typed marker: `[REDACTED:<kind>]` e.g. `[REDACTED:github_token]`, `[REDACTED:jwt]`, `[REDACTED:env_secret]`, `[REDACTED:custom]`. Older pages keep bare `[REDACTED]`.
- Honest limit (SECURITY.md): "the `Sanitizer` is a best-effort credential strip, not a guarantee". Operator `extra_patterns` run server-side only.
- Observations are "Sanitized, bounded lifecycle-hook projections", "not a complete native transcript". `PreToolUse` "never retains commands, arguments, paths, input bodies, or arbitrary tool names"; `PostToolUse` body capped at "2,000 UTF-8-safe bytes".
- Stored content is treated as untrusted: handoffs, briefs, workstream packets and LLM prompts "explicitly mark stored material as untrusted historical data".

Capture rules (docs/marker-file.md, docs/usage.md)
- Per-repo `.ai-memory.toml`: `[capture]` + `ignore_paths = ["private/**", "~/personal-notes/**"]`. Matching events are "**dropped locally** before spool, queue, network, transport logs, or server storage".
- Nearest marker wins; invalid policy invalidates the whole policy (fails to metadata-only, not partial). Bounds: 128 patterns, 1,024 chars each.
- "This is a lexical capture boundary, **not complete DLP**." No symlink resolution; shell commands and prompts are not path-attributable.
- Enforced by native `ai-memory hook` commands and generated OpenCode/OMP/Pi/OpenClaw integrations. "Legacy `.sh`/`.ps1` hooks and remote-only/Docker script bundles do **not** enforce it."
- Allowlist mode: `ai-memory install-hooks --apply --capture-mode allowlist` — "the presence of a `.ai-memory.toml` **is** the opt-in"; a repo without one "emits no lifecycle event at all". Not gated on raw script-fallback paths / Docker host wrapper.
- Dry-check a decision: `ai-memory hook --event ... --agent ... --check-capture`.
- Assistant final-turn capture is a double opt-in (`capture_assistant` on server + `install-hooks --capture-assistant`), global to the install, Claude Code and Codex only.

Audit log
- README: "An audit log of every mutation." ARCHITECTURE: `audit_log` table — "Every mutation, addressable by `at DESC`." users.md: "Attributed mutation audit rows carry `audit_log.author_id`". Admission webhooks receive actor identity and can reject ops with `failure_policy = "reject"`.
- **FLAG**: no user doc in the read set describes how to view/query the audit log (no CLI command surfaced). Avoid promising an audit-log UI.

OIDC / SSO (docs/sso.md)
- `ai-memory auth login oidc-device --issuer "https://issuer.example.com/realms/team" --client-id "ai-memory-cli"` — "any standards-compliant issuer (Keycloak, Okta, Entra ID, etc.)".
- Token used for native lifecycle-hook auth and thin-client commands when no static bearer is set.
- "It is **not** a login gate for the ai-memory server process itself." "ai-memory itself does not validate OIDC tokens against your IdP for server API access" — needs an OIDC-aware gateway that translates to static bearer / DB-user tokens, or the trusted-proxy path (`actor_proxy_bearer_token` + `X-Memory-Actor-*`).
- OIDC hook auth requires the native hook path; not the Docker wrapper's shell hooks.
- Marketing wording: say "OIDC device auth for hooks/CLI, SSO via a gateway", NOT "built-in SSO login".

TLS via proxy (docs/https-via-proxy.md)
- "ai-memory does **not** terminate TLS itself, by design."
- Not needed for: stdio MCP (`claude mcp add ai-memory -- ai-memory serve --transport stdio`), loopback-only single user, local dev. "Most ai-memory installs never need a proxy."
- Needed when: multi-user mode is on, bound beyond loopback, `/web` from another machine, exposed beyond the LAN.
- Paths: Caddy + public domain + Let's Encrypt; Caddy + internal CA (LAN-only, one-time root cert install per client); Cloudflare Tunnel ("zero open ports", free tier works); external cert files (Caddy or nginx); nginx.
- Templates: `docker/compose.tls.caddy.yml`, `docker/compose.tls.cloudflared.yml`. Subpath hosting: `--base-path` / `AI_MEMORY_BASE_PATH`.

Air-gapped install (docs/airgapped-install.md)
- Build needs no network beyond crates (SQLite bundled, libgit2 vendored; `cargo vendor` works). Prebuilt binaries with SHA-256 checksums can be carried in.
- Local embedding model: 3 files (`model.safetensors`, `tokenizer.json`, `config.json`), "~87 MB total, Apache-2.0", from `huggingface.co/sentence-transformers/all-MiniLM-L6-v2`, dropped into `<data_dir>/models/all-MiniLM-L6-v2/`; checksums pinned in source; "never touches the network".
- Updates in an air-gap are manual.

What leaves the machine and when (DATA_HANDLING.md)
- "ai-memory does not phone home. There is no analytics, crash reporting, or usage telemetry built into the binary."
- Three opt-in egress paths, all off by default:
  | path | what leaves the host |
  |---|---|
  | `embedding_provider = openai\|voyage\|google\|openai-compat` | the text of every stored page (NOT sanitized the same way; switching later backfills the existing corpus) |
  | `capture_assistant` (double opt-in) | the assistant's final-turn text (only if a cloud LLM is configured) |
  | `AI_MEMORY_RERANKER=llm` | each live query + up to 30 bounded page titles/snippets |
- Also implicit: configuring any cloud LLM provider sends consolidation/lint/bootstrap prompts to it.
- GDPR framing: self-hosted with no opt-ins -> "no third party in the data path"; a configured cloud provider becomes your processor; "This document does not constitute legal advice".
- **FLAG**: DATA_HANDLING.md heading says "three opt-in paths" but later text says "the two opt-in paths above are the only export mechanisms"; README docs table also says "the two opt-in external paths". Use three.
- **FLAG**: "no network calls unless you configure one" is not strictly true on a default install — since 2.0 the default `local` embedder "downloads in the background on the first start" (~87 MB from Hugging Face). No user data is sent, but it is an outbound request. Opt out with `embedding_provider = "none"` or pre-place the files.
- **FLAG**: the Copilot embedding provider is documented as untested against live Copilot ("treat it as needing a real-Copilot smoke test").
- **FLAG**: `anthropic-oauth` (Claude subscription) carries the doc warning "Unofficial and against Anthropic's usage policies — use at your own risk; it may get your account rate-limited or banned." Do not market it as a headline feature.

Deletion / purge semantics (docs/lifecycle-ops.md, DATA_HANDLING.md)
- "There is no built-in retention-expiry policy; data persists until removed." (Per-page `expires_at` TTL and the forget sweep exist for individual pages.)
- `ai-memory purge-session --workspace default --project my-app --session-id <uuid> --confirm`; `ai-memory purge-project --project experimental --confirm`; `POST /admin/delete-workspace`.
- It is a **logical delete**:
  | | default | `--compact` |
  |---|---|---|
  | Reachable through the API / MCP tools | no | no |
  | Returned by search (FTS) | no | no |
  | Live wiki Markdown file | no, best-effort | no, best-effort |
  | Bytes still present in `memory.sqlite` | **yes**, in free pages | no |
  | Text still in the wiki git history | **yes** | **yes** |
  | Present in backups taken before the purge | **yes** | **yes** |
- "**`--compact` is not forensic erasure.**" Purge is scope-contained: "A purge operation for project A cannot delete files that also belong to project B."
- Single-page undo: `ai-memory checkpoints` then `ai-memory restore-page --path notes/foo.md --from <rev>`.

---

## 5. Deploy / infra
Sources: `docs/deploy.md`, `docs/lifecycle-ops.md`, `README.md` (Architecture), `docs/MIGRATION-2.0.md`.

Topologies
- Laptop: loopback `127.0.0.1:49374`, no auth, native service (systemd user unit / launchd agent) or Docker container. Also pure stdio: `ai-memory serve --transport stdio`.
- Homelab / LAN box: `bin/deploy` pattern (templates `bin/deploy.env.example`, `docker/docker-compose.prod.yml.example`, `docker/.env.production.example`; live copies gitignored); binds `0.0.0.0:49374`; bearer token mandatory; container runs as uid 1000; healthcheck = embedded `ai-memory status`. Or AUR system service (`/var/lib/ai-memory`, `/etc/ai-memory/`).
- LAN with TLS: Caddy internal CA. Internet: Caddy + Let's Encrypt, or Cloudflare Tunnel (no open ports).
- "Hostile-Internet denial of service" is out of scope: "not designed for direct untrusted-Internet exposure".
- Graceful stop: handles SIGINT/SIGTERM, "bounds each wait in its shutdown path at five seconds"; no `tini` / `--init` needed.

Data directory layout (README)
```text
<data_dir>/
├── wiki/    # markdown source of truth, git-versioned
├── raw/     # immutable sanitized managed-workstream transcript segments
├── db/      # SQLite indexes, including FTS5, entities, and embeddings
├── models/  # reserved for local embedding models
└── logs/    # rolling tracing output
```
- Wiki on disk is UUID-keyed: `<wiki_root>/<workspace_id>/<project_id>/{concepts,decisions,gotchas,sessions,_rules}/...` plus `_meta.md` manifests so "a clean SQLite DB can be rebuilt from the UUID-keyed wiki tree alone". One git repo for all projects.
- **FLAG**: cookbook.md says the wiki lives at `<data_dir>/wiki/<workspace>/<project>/…` (names); lifecycle-ops.md says paths use UUIDs and "the mutable **project name** ... never appears in any disk path". Trust lifecycle-ops.
- **FLAG**: deploy.md still describes `models/` as "reserved for future local embedders" and `raw/` as "immutable session log archive" — stale vs README/local-embeddings.md.
- The wiki is natively an Open Knowledge Format (OKF v0.2) bundle since 2.0; `ai-memory export-okf --project myproject -o myproject-bundle.tar.gz`.

Backup / restore
- `ai-memory backup --to /tmp/ai-memory-backup.tar.gz` — safe with the server running; "uses SQLite's online backup API"; tarball = DB snapshot + wiki tree + `config.toml`.
- `ai-memory restore --from <tarball> --data-dir <path> --force` — **stop the server first**; refuses if another `ai-memory` process is alive.
- `ai-memory reset --confirm` (wipe `wiki/`, `db/`, `raw/`; keeps `config.toml`) and `ai-memory reindex` (rebuild DB from wiki; needs a clean DB) also require the server stopped.
- Wiki can additionally be backed up with rsync or `git push` to a remote (securing that remote is your job).
- Upgrades: migrations are automatic and forward-only; an older binary "will refuse to open that data dir" — take a backup before upgrading. The 1.x -> 2.0 migration is "automatic, backup-gated, and reversible": full archive to `~/ai-memory-backup-okf-v0.2-<date>.tar.gz` (containers: `/data/backups/`), and "If the backup cannot be written or verified, the migration aborts and the server refuses to start".
- Disk reclaim: `ai-memory compact --confirm` (blocks writes); "Do not schedule an unconditional nightly VACUUM"; `ai-memory status` shows reclaimable bytes.
- Rollback: re-pull an older image by digest.

Measured limits: see the capacity table in section 2 (~700 writes/s ceiling, queue 1024, fsync-bound). Other documented bounds: 10 MB request body; 256 pending messages per inbox; up to 10 entities per page, 64 chars each; LLM request timeout 300 s (`AI_MEMORY_LLM_TIMEOUT_SECS`); reranker max 30 candidates, 4 concurrent calls; managed-run lease 90 seconds.

---

## 6. Everyday use
Sources: `docs/usage.md`, `docs/cookbook.md`, `docs/use-cases.md`, `docs/managed-workstreams.md`, `docs/agent-messaging.md`.

- "Day to day, you mostly do not think about ai-memory. Hooks capture prompts, tool calls, and session boundaries; session end turns them into readable wiki pages; the next session starts with a handoff."
- Things you say to the agent -> MCP tool:
  - "Have we discussed X?" / "search memory for Y" -> `memory_query` (FTS5 + entity/graph/vector RRF; `explain: true` shows why a page ranked).
  - "Catch me up" / "I've been away" -> `memory_explore` (prose digest scaled to time away).
  - "Where did we leave off?" -> pending handoff block, or `memory_handoff_list` + `memory_handoff_accept`.
  - "Save context for the next session" -> `memory_handoff_begin`; undo with `memory_handoff_cancel`.
  - "Remember this permanently" -> `memory_write_page` (durable, git-versioned page; `pinned` exempts from decay).
  - "Remember this until Friday" -> `memory_write_page` with `expires_at` (RFC3339 or `YYYY-MM-DD`); "TTL outranks `pinned`".
  - "Always: never force-push" (all projects) -> `memory_write_page` with `scope: "global"`.
  - "That recalled page helped" / "this page is stale" -> `memory_feedback` (`helpful`, `not_helpful`, `stale`, `wrong`); "Feedback never deletes anything".
  - "Audit the wiki" -> `memory_lint`. "How big is the wiki?" -> `memory_status`, `memory_briefing`. "Delete this page" -> `memory_delete_page`. "Consolidate this session" -> `memory_consolidate`. "What did we learn?" -> `memory_auto_improve`.
  - MCP surface: 23 tools as of 2.3.0 (CHANGELOG).
- Handoffs: automatic at session end, consumed by the next session-start hook; "typed, owned, claimed exactly once"; manual handoffs outrank automatic ones; "Handoffs are next-session transfer, not a live message bus". CLI: `ai-memory handoffs`.
- Compaction recovery: `PreCompact` hook writes a fresh `sessions/<id>.md`; recover via `memory_recent`.
- Briefings: opt-in per repo `[briefing] inject_on_session_start = true` in `.ai-memory.toml` -> compiled brief of pinned / `_rules/` / `_slots/` pages + recent-page pointers prepended at session start (off by default because it costs tokens every start).
- Routing snippet + Agent Skills: say "Install ai-memory routing into this project." or run `ai-memory install-instructions` (`--target AGENTS.md`); `ai-memory install-skills`. "ai-memory never edits the rules file on its own."
- Web UI: `ai-memory serve --transport http --bind 127.0.0.1:49374 --enable-web`, open `http://<host>:49374/web`. "The web UI is read-only": project list, page tree, rendered markdown, metadata, FTS5 search, clickable `[[wiki links]]`; JSON API under `/api/v1`. Custom SPA via `--web-ui-dir`.
- Raw wiki: "plain markdown plus git history" — `docker cp ai-memory:/data/wiki ./my-ai-memory-wiki` and open in Obsidian; `git -C /data/wiki log --oneline`.
- Bootstrap an existing project: `ai-memory bootstrap --dry-run` then `ai-memory bootstrap`. Reads `git log`, root README, `docs/`, rule files, Rust module docs. "It requires an LLM provider on the server." Cost "well under $0.20 per run" (Kimi 2.6 via OpenRouter). Caveat: "A bootstrap run can produce plausible-but-wrong pages". `--resume` since 2.1.0.
- No-LLM alternative for history: `ai-memory backfill` (imports local harness transcripts into an empty project).
- `ai-memory doctor`: capture-coverage check — which harnesses ran here but were never captured, with the exact fix command.
- Managed workstreams: `ai-memory run <harness>`, bare `ai-memory run`, `ai-memory continue` ("Just put me back where I was"), `ai-memory resume` (picker), `ai-memory show` (project-first launcher with `+ New project`), `ai-memory workstreams`, `ai-memory rename-workstream --from ... --to ...`, `ai-memory run --fresh codex`, `--new NAME` / `--workstream NAME`. The full visible ledger is searchable: `ai-memory workstream-search "scope resolver decision"`. Adapters read native stores read-only; "Hidden reasoning and unsupported/private records are excluded". Multiple Claude accounts: any `claude*` name + `--executable`.
- Agent messaging (added in 2.3): cross-project claim-once inbox. Tools `memory_message_send` / `memory_message_list` / `memory_message_pop` / `memory_message_cancel`; CLI `ai-memory message send|list|pop|cancel`. Addressed to a project, recipient must already exist, 256 pending per inbox. Popped body is fenced untrusted input; session start only shows a count ("2 cross-project messages waiting").
- Housekeeping: `ai-memory curator` (no-LLM maintenance report), `ai-memory move-session`, `ai-memory status`.
- Works beside code-intelligence tools (LSP, SCIP): memory answers "why", structural tools answer "where"; "Neither side is an instruction channel."
- Migration from another memory tool: 12-step checklist in usage.md; companion importer at `companions/ai-memory-importer`.

---

## 7. LLM / embedding providers and the zero-LLM default
Sources: `docs/llm-providers.md`, `docs/local-embeddings.md`, `docs/install.md` ("LLM provider tiers").

Zero-LLM default
- "ai-memory runs without an LLM: hooks still capture sessions, search uses FTS5 + declared entities + graph neighbors, and summaries fall back to rule-based output." Cost `$0`.
- Session ends "always write a rule-based summary page + handoff either way". Needs an LLM: consolidation, richer linting, `bootstrap`, auto-improve, reranking.
- "You do not need a paid platform API key" — subscription-backed providers exist (below).

LLM providers (provider -> default model)
| Provider | Default | Note |
|---|---|---|
| `anthropic` | `claude-haiku-4-5` | "Recommended default." ~$0.01–0.05 / session |
| `anthropic-oauth` | `claude-sonnet-4-6` | Claude Pro/Max via `claude setup-token`. **Doc warns: unofficial, against Anthropic's usage policies** |
| `openai` | `gpt-5.4-mini` | cheaper/faster |
| `openai-oauth` | `gpt-5.5` | ChatGPT Plus/Pro via `ai-memory auth login openai-oauth` |
| `codex` | `gpt-5.6-luna` | reuses the Codex CLI's `auth.json` (added 2.3.0) |
| `copilot` | `gpt-5.5` | `ai-memory auth login copilot` or `COPILOT_GITHUB_TOKEN` |
| `gemini` | `gemini-3.5-flash` | "generous free tier" |
| `opencode` | `claude-sonnet-4-6` | OpenCode Go endpoint by default; Zen via base URL |
| `openai-compat` | no default | OpenRouter, Atlas Cloud, OrcaRouter, Ollama, vLLM, LM Studio |
- Ordered fallback chains `[[llm_fallbacks]]` since 2.1.0. Test with `ai-memory llm-test`.
- Not recommended: reasoning-mode models (hang or empty output on the strict-JSON consolidation prompt). Tip: use a Haiku/mini-class model on subscription backends.
- Reranking: `AI_MEMORY_RERANKER=llm`, off by default.

Embedding providers: `local` (default since 2.0: in-process `all-MiniLM-L6-v2`, 384-dim, pure-Rust candle, no key), `openai` (`text-embedding-3-small`, 1536-dim), `voyage` (`voyage-3`, 1024-dim), `google`/`gemini` (`gemini-embedding-001`, 768-dim), `openai-compat` (Ollama/LM Studio/vLLM, keyless), `copilot` (2.3.0, untested live), `none` (opt out).
- **FLAG**: local-embeddings.md contradicts itself — "As of 2.0 this is the default" vs later "Existing installs keep their configured provider; `local` is opt-in." Reading with MIGRATION-2.0.md: default for installs with NO embedding provider configured (new or existing); configured providers are untouched.
- **FLAG**: install.md's tier table still lists "+ Hybrid retrieval" as requiring `AI_MEMORY_EMBEDDING_PROVIDER=openai` and the README says adding a provider "enables semantic search" — both predate local-by-default. Accurate claim: hybrid (vector) search works out of the box with local embeddings, best-effort (after the model downloads; enabled "on the next restart").

---

## 8. Releases
Sources: `gh release list/view` (run 2026-09-19), `CHANGELOG.md`, `packaging/`, `flake.nix`.

- Latest: **v2.3.1**, published `2026-09-17T18:26:44Z`.
- Assets (each with a `.sha256` companion):
  - Linux: `ai-memory-linux-x86_64.tar.gz`, `ai-memory-linux-aarch64.tar.gz`
  - macOS: `ai-memory-macos-aarch64.tar.gz`, `ai-memory-macos-x86_64.tar.gz`
  - Windows: `ai-memory-windows-x86_64.zip`
  - Docker wrappers: `ai-memory-wrapper` (POSIX), `ai-memory-wrapper.ps1`, `ai-memory-wrapper.cmd`
  - Hooks: `ai-memory-hooks.tar.gz`, `ai-memory-install-hooks`
- Stable download URL pattern: `https://github.com/akitaonrails/ai-memory/releases/latest/download/<asset>`.
- Docker image: `akitaonrails/ai-memory:latest` (fully qualified `docker.io/akitaonrails/ai-memory:latest`), `linux/amd64` + `linux/arm64`.
- AUR: `ai-memory-bin` (prebuilt, x86_64/aarch64) and `ai-memory` (from source); published automatically by the release workflow on `v*.*.*` tags. (The in-repo PKGBUILD templates show `pkgver=0.3.2`; the workflow rewrites it — do not quote that number.)
- mise: `mise use -g github:akitaonrails/ai-memory`.
- Nix: `flake.nix` present at repo root (`nix build`, `nix run . -- --version`, `nix develop` with Rust 1.95). No `flake.lock` (inputs pinned inline). Not mentioned in README/install.md — **FLAG**: undocumented for users; present it as "a flake is included", not as a supported channel.
- `packaging/` contents: `aur/` (PKGBUILD, PKGBUILD-bin, ai-memory.install), `env/ai-memory.env`, `launchd/com.github.akitaonrails.ai-memory.plist`, `systemd/ai-memory.service` + `ai-memory-user.service`, `sysusers/ai-memory.conf`, `tmpfiles/ai-memory.conf`. No .deb/.rpm/Homebrew.
- No crates.io package. Release workflow does not emit artifact attestation / SLSA provenance (checksums only).

Recent versions (GitHub publish date; headline from CHANGELOG)
| Version | Date | Headline |
|---|---|---|
| v2.3.1 | 2026-09-17 | Added `DATA_HANDLING.md`, `docs/sso.md`, `docs/airgapped-install.md` for enterprise review; fixed `export-okf` refusing projects with captured observations |
| v2.3.0 | 2026-09-16 | `ai-memory run` auto-installs hooks + MCP; boot-time backfill of pre-hook history; `ai-memory doctor`; cross-project agent messaging (23 MCP tools); `codex` LLM provider; Copilot embeddings; Codex assistant capture |
| v2.2.2 | 2026-09-15 | Security: `rustls` 0.23.45 for RUSTSEC-2026-0285; ZCode session-id fix; Cursor double-capture fix; shell-hook spool performance fix |
| v2.2.1 | 2026-09-12 | Shell hooks now spool instead of dropping events when the server is unreachable; 200 ms hook timeout; `restore` accepts GNU-sparse backups |
| v2.2.0 | 2026-09-12 | Typed redaction markers `[REDACTED:<kind>]`; `memory_handoff_list`; typed-edge `explain`; page ingestion windows; `claude*` harness names; Muse Code client; `install-instructions --compact` |
| v2.1.2 | 2026-09-11 | Fix release: `serve` stops cleanly on Ctrl-C/SIGTERM; purge-session and restart-read fixes; AUR source build fixes |
| v2.1.1 | 2026-09-08 | Fix release: marker/capture fixes, allowlist-mode fix, wiki auto-commit performance |
| v2.1.0 | 2026-09-06 | LLM fallback chains `[[llm_fallbacks]]`; `bootstrap --resume`; OpenCode 2 beta support; Codex `SessionEnd` hook; `AI_MEMORY_LLM_HEADERS`; Podman wrapper fix |
- Earlier: 2.0.0 (2026-09-02) — OKF v0.2 wiki format, local embeddings + hybrid retrieval on by default, macOS launchd agent, typed relation edges, LongMemEval benchmark, `.serve.lock`. 1.39.0 (2026-09-01) — per-caller project isolation.
- **FLAG**: CHANGELOG dates 2.1.1 as 2026-09-07; GitHub published it 2026-09-08T15:59Z.
- Cadence observation: 8 releases in 12 days (2026-09-06 to 2026-09-17).
- `[Unreleased]` already holds fixes (#762, #776, #781, #785, #786) — a 2.3.2 is likely soon; avoid hardcoding the version on the site.

---

## 9. Contributing
Source: `CONTRIBUTING.md`, `SECURITY.md`.

- Issues/PRs: `https://github.com/akitaonrails/ai-memory`. Security: private advisory at `https://github.com/akitaonrails/ai-memory/security/advisories/new` — "do not open a public GitHub issue".
- Dev setup:
  ```bash
  git clone https://github.com/akitaonrails/ai-memory
  cd ai-memory
  cargo build --workspace
  cargo test --workspace --all-targets
  ```
  "Rust 1.95 is required (pinned in `rust-toolchain.toml`)." Self-contained build: bundled SQLite, vendored libgit2; "No system libraries need installing beyond a standard C toolchain."
- Required gates (the acceptance bar; CI and `bin/release` enforce them):
  ```bash
  cargo fmt --all -- --check
  git diff --check
  cargo clippy --workspace --all-targets -- -D warnings
  cargo tf                            # every test (alias: cargo nextest run -P full)
  cargo deny check                    # dependency policy
  ```
- Everyday loop: `cargo t` ("all but the slow tier, ~20s warm"), `cargo t -p ai-memory-store`, `cargo t -E 'test(/purge/)'`. Pre-push hook: `scripts/install-git-hooks.sh`.
- "CHANGELOG is a merge gate": every user-facing change adds an entry under `## [Unreleased]`; a missing entry is **blocking**.
- Ground rules (condensed from `AGENTS.md`, the canonical rules file): work milestone by milestone; "No dead code, no half-built features"; "Write tests before claiming done"; "Do not refactor outside the milestone"; "Comments explain *why*, never *what*."
- Invariants: all SQLite writes through the single writer actor (`WriterHandle`); config read once at startup; atomic file writes (tmp + rename + fsync); every page namespaced by `(workspace_id, project_id)`; the CLI is always a thin HTTP client.
- Commit attribution: use a GitHub-verified email; history is not rewritten, `.mailmap` fixes aliases.
- SemVer: patch = fixes, minor = additive (new harness/provider/client ships in the next minor), major = breaking. Deprecations removed "no sooner than the following major release".
- Adding a managed harness: `docs/managed-harness-contributions.md` (protocol + acceptance bar). README acknowledgement: built collaboratively with Claude Code.
