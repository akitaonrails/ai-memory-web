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
