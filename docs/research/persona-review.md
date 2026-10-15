# Signal Bureau reader review — 15 October 2026

Three isolated agents reviewed the redesign before seeing one another’s findings: an engineer learning AI tooling, a nontechnical company manager, and a parent concerned about AGI and jobs. These are simulated reader perspectives, not research with human participants. The parent perspective tested whether an unfamiliar reader could understand the product and its data boundaries; the site remains aimed at people using coding agents.

## Consensus and changes

All three found contradictory access-control claims, overly absolute privacy language, and an introductory explanation buried below advanced features. The changes:

- Explain saved project notes in the hero; link directly to how it works. Move the basic workflow and audience paths ahead of the feature directory.
- Add an early collection/defaults guide, including history import, cross-project preferences, the coding agent’s separate provider settings, and links to controls and suitability guidance.
- Explain hooks and MCP before the integration matrix. Move individual suitability guidance earlier and add team pilot costs and operating responsibilities.
- Reconcile project permissions across Security, Teams, Install, Browse, Profile and Compare. Projects are open by default; database-user grants restrict whole projects. Root bypasses these checks, while trusted-proxy deployments depend on proxy authorization. Scope markers organize default storage/search and do not grant or revoke access.
- Qualify credential redaction as best effort and distinguish ai-memory’s local defaults from a coding agent’s provider connections. Remind readers to verify saved notes against their sources.
- Correct project identity, retrieval stream and crate descriptions against the released source. Explain retention eviction and checkpoint recovery accurately, including the limits of restoring database-only state.
- Translate the changes into Brazilian Portuguese, Spanish, Hebrew, Japanese and Korean.

We did not add general AGI predictions or job-safety assurances, invent a corporate compliance promise, or promise that stored notes are authoritative. Operational detail remains on the technical pages, with earlier links for readers who need it.

## Source checks

Claims were checked against ai-memory tag `v3.0.0` (`dbe928e3b`), rather than unreleased working-tree changes:

- `docs/users.md`: database users, open/restricted projects, read/write grants, root and trusted-proxy behavior.
- `docs/auto-scope.md`: Git remote identity and directory fallback.
- `crates/ai-memory-store/src/retrieval_tuning.rs` and retrieval reader/tests: five streams, including observations and optional vectors.
- Workspace `Cargo.toml`: ten shipped product crates, including the web crate.
- Retention lifecycle tests, `wiki.rs` restore implementation and `docs/lifecycle-ops.md`: recovering an evicted page from a retained Git checkpoint while the project exists; database-only sessions, observations and handoffs are not restored.

## Accessibility work

The initial axe-core scan found repeated unnamed complementary landmarks where pages contained multiple callouts. Each callout now has an accessible name from its translated title. Pointer testing also exposed a dropdown opening on hover and immediately closing on click; clicking with a mouse now keeps its links available, while keyboard/touch toggling remains supported.

The phone-width scan also found scrollable tables without keyboard access. Table wrappers now accept focus so keyboard users can scroll them.

## Verification

- Translation check: all five translated locales cover 2,426 strings; no missing translations or stale fingerprints.
- Build: 102 pages. Color-token contrast checks and the released-source consistency check pass.
- Layout: 408 combinations (102 pages × 1440px/360px × light/dark), with no page overflow, broken images, diagram overflow or connector overlap, text below 14px, or incorrect H1 counts.
- Internal links and fragment targets resolve across all 102 pages.
- Interaction checks: keyboard menus and Escape, pointer dropdown opening, keyboard tabs, persistent theme choice, modal drawer lock/expanded state, and same-page Hebrew language switching pass.
- axe-core: 408 page/viewport/theme scans (including localized error pages), zero violations.
- Open-state axe scans: desktop navigation, second install tab, mobile drawer, expanded FAQ and filtered integrations have no violations.

Automated checks use Chromium through agent-browser and cached axe-core 4.8.2, with reduced motion during the accessibility sweep. Screenshots cover desktop/phone, light/dark and representative non-Latin pages. This is not a screen-reader user study or a Safari/Firefox compatibility pass. No deployment or push was performed.

## Follow-through: finding information and starting a pilot

A second implementation pass evaluated the remaining reader concerns against the existing changes. The copy fixes above were retained; this pass changes the reading and action paths.

| Finding | Decision and implementation |
|---|---|
| Readers reach advanced detail before knowing what to do next | Move homepage setup immediately after the introductory guidance and audience paths, before the advanced feature sections. |
| The homepage repeats the same explanations | Keep two directory entries for agent support and measured evidence. Remove the four cards repeated by the workflow, profile, setup and aging sections, plus the repeated problem statement. Detailed explanations remain available. |
| A manager needs operating responsibilities before deployment commands | Replace the homepage team command block with the reviewed pilot requirements and cost explanation, linking to full team setup and security. Keep team commands in their canonical Install section. |
| Access limitations appear after an action has already been suggested | Move the Install team callouts before its topology and commands, with a link to security limits. |
| Privacy guidance is accurate but difficult to navigate | Add direct Security links to capture exclusions, data egress, deletion and access limits. The homepage controls link now lands at this index rather than bypassing capture controls. |
| Installation needs an observable success criterion | Keep the earlier two-session decision/source-page check and expose it directly from the Install hero. |
| An unfamiliar reader might want broader AGI or jobs guidance | Do not expand scope. Keep the concrete audience, collection boundaries and suitability guidance; avoid speculative social assurances. |
| Less technical readers may prefer every term removed | Keep precise terms on technical pages, with the existing first-use explanations and direct routes to the relevant detail. |

All labels and pilot text reuse the reviewed six-language catalogs. No new product claims or translations were needed. Verification for this pass targets the three changed routes in every locale, their anchors and team-tab state; unchanged routes retain the preceding full-site evidence.

Follow-through verification: the three changed routes pass 72 layout and 72 axe combinations across all six languages, both themes and desktop/phone widths. A final homepage rescan after enlarging wrapped-link hit areas passes all 24 combinations. The open team pilot tab also passes axe. Twelve browser journeys (six locales × two widths) verify the earlier setup position, keyboard team-tab selection, privacy-index navigation and exact fragment landing below the fixed header, plus access limits before team commands. Build, translation, contrast and all-site link checks pass. No browser errors were recorded.

## Memory Archive repeat review — 15 October 2026

The same three simulated personas independently reviewed the live Memory Archive deployment (`6888dc6`): an engineer learning AI tooling, a nontechnical company manager considering a team pilot, and a concerned parent unfamiliar with coding agents. They formed initial impressions before reading this earlier report and did not see one another's findings. Browser journeys used Chromium at 1440×1000 and 360×800, both themes, with menus, install tabs and security anchors. This remains simulated reader feedback, not research with human participants.

### Is it an improvement?

All three found the archive background, capture/recall apparatus and restrained accents more distinctive. Body copy remained readable; no blocking visual regression, page-wide horizontal overflow or broken journey was found in the sampled pages. The two nontechnical perspectives associated the server-room artwork with more infrastructure than the product requires. That is a subjective association, not a reason to discard the approved art or evidence that the product is unsafe.

The comparison must distinguish two baselines. The earlier persona-driven content fixes substantially improved comprehension, privacy boundaries and pilot planning. Those fixes already existed in `9926d0c`. Between that commit and `6888dc6`, the English catalog change was only emphasis markup around the homepage title. The latest improvement is principally visual; content order and most usability strengths were retained. An older screenshot supplied for visual comparison predates some corrected copy, so committed source was used for the content baseline.

### Confirmed remaining issues, in priority order

These findings are recorded for the next implementation pass, not silently treated as fixed by this review.

| Priority | Finding and evidence | Recommended action |
|---|---|---|
| Medium | **Remote setup orders TLS too late.** `/security/#hardening` says “Stop at the one that matches yours,” but second-machine and team scenarios need the later “Anything beyond loopback” TLS requirement too. `/install/#team` instructs remote HTTP/key use before its TLS step. All three personas flagged the ordering. | Present all applicable requirements, and configure encrypted transport before sending credentials from another machine. Keep optional corporate identity separate from mandatory transport protection. |
| Medium | **Team shell instructions mix root and user credentials.** `TOKEN` is created as root and passed into Docker, but the next host CLI calls have no shown export. Later the same variable name is expected to mean the user's `aim_` key. The comment explains the intention without making the sequence copyable. | Show operator configuration explicitly; use distinct root/user variables and an explicit assignment for the issued user key. |
| Medium | **Fresh-install diagnostic promises the wrong response.** `/install/#check` pairs unauthenticated `curl http://127.0.0.1:49374/mcp` with “A JSON-RPC error is the right answer.” A fresh token-authenticated install returns 401 `auth required`. | Use an authenticated status check, or describe `curl -i` as reachability only and document the expected unauthenticated 401. Keep the later decision/source-page check. |
| Medium | **Some absolute promises survived the earlier wording pass.** The homepage's default comparison tab says “Synced across your machines,” while team setup correctly says one shared server and no replication. The solo-install diagram description still says “Nothing leaves the laptop,” despite the agent's separate provider connections. | State shared-server reachability instead of sync, and qualify diagram descriptions with the same data boundary as the main prose. Also review the unqualified “no API key” audience-card wording. |
| Medium | **Keyboard focus is faint in light mode.** Root verification used actual Tab navigation on the live header. The author-defined ring is `#dbad82` on `#e4e7e3`: 1.63:1, below the 3:1 requirement for a focus-state indicator against its adjacent surface. The previous palette also failed at 1.80:1; this is inherited and slightly worsened, not a new class of bug. | Use a theme-aware focus token on reading surfaces, retain a high-contrast override on dark panels, and add focus pairs to the contrast check. Inspect the integration-row custom focus style too. |
| Medium usability | **Important mobile choices remain too far down.** At 360×800, the homepage workflow begins around y=1921, collection guide y=4364, audience paths y=5300, and setup y=6900. Teams' early pilot block starts near y=807 but its detailed sharing limits near y=10241. Navigation and direct hero links mitigate this; content is present. | Add immediate links to collection controls and audience paths; shorten the phone roster or move concise choices above the tall diagram. Put the sharing default and a limits link in the team pilot block. Preserve readable type sizes. |
| Medium usability | **Mobile egress information requires two kinds of scrolling.** `/security/#egress` puts a tall diagram before a roughly 798px-wide table inside a 318px wrapper. Settings and defaults start offscreen. The wrapper is keyboard-focusable and the document does not overflow. | Give each outbound path a stacked phone layout, or expose a direct table jump plus a clear horizontal-scroll cue. Do not confuse this with a broken responsive layout. |
| Low | **Deletion instructions render literal markup.** `/security/#audit` visibly prints `<code>--confirm</code>` because `audit.deletion.text` is interpolated as plain text in `security.astro`. Confirmed in live DOM and the built English page; the same renderer serves every locale. | Render the existing trusted catalog markup consistently with adjacent paragraphs. No copy rewrite is needed. |

The focus criterion is documented in [W3C's explanation of non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html), including its focus-indicator examples. The prior zero-violation axe results did not establish compliance for untested focus states or every composited background.

Other lower-priority suggestions: clarify the profile headings “Forget, and it stays forgotten” and “Client and NDA work stays out” so their conditions are apparent when skimmed; explain hit@5 briefly where it first appears; reconcile two-command versus install/setup/launch phrasing. These do not justify broadening the site into AGI/job-safety reassurance or claiming corporate compliance. Keep the approved artistic direction and accurate detailed limitations.

### Evidence and cleanup

Root checked the setup/auth finding against ai-memory release `v3.0.0` (`dbe928e3b`): `commands/setup.rs` documents fresh-install token creation; `crates/ai-memory-mcp/src/auth.rs` defines the unauthenticated 401 and tests it with `missing_header_returns_401_with_www_authenticate`. No product server or account was created for this review. `npm run check:upstream` reports no structured release-fact mismatches, which does not validate the prose and command ordering issues above.

The prototype directories, raw Stitch responses, generated comparison screenshots and preview server had already been removed. This follow-up removed the empty prototype parent directory, two unused carousel components, and their obsolete accessibility/slide labels in all six locales. Production artwork, native diagrams, historical design reasoning and current verification evidence were retained.

Cleanup validation: translation stamps reflect only deleted unused keys; `check:i18n`, `check:colors`, the 102-page production build, and `git diff --check` pass. No live content or behavior was changed by cleanup. The reviewed defects remain open; this is a review and cleanup pass, not their implementation.

Raw independent reports are local at `/tmp/persona-engineer-v2.md`, `/tmp/persona-manager-v2.md`, and `/tmp/persona-parent-v2.md`. Findings and recommendations are preserved here so the temporary reports are not required. Limitations: targeted English journeys, Chromium only, no real screen-reader study, no all-page accessibility rerun, no product installation, and no new benchmark or exhaustive security audit.
