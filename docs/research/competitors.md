# Competitor marketing-site research (for aimemory.io)

Visited 2026-09-19 with agent-browser at 1440x900. Screenshots in
`../competitors/` (`<site>-hero.png`, `<site>-full.png`, and half-scale slices `<site>-part-N.png`;
raw page text in `<site>.txt`). Quoted headlines are exact words from the pages.

Note on method: OpenViking and Graphiti full-page captures are native. Cognee scrolls `<body>` inside a
100vh `<html>`, so its full-page image is a stitch of 9 viewport shots (the sticky nav repeats in the stitch;
that is an artifact, not the design).

---

## 1. OpenViking — https://www.openviking.ai/

Owner: Volcengine / ByteDance. Repo `volcengine/OpenViking`.

### 1.1 Nav
Announcement bar: "Join the OpenViking community" + Lark / WeChat / Discord icons (dismissible).
Main: **Product | Integrations | Solutions | Developers | Enterprise** (all dropdowns).
Right: GitHub star pill "38.1K+", language switch (EN / zh), light/dark toggle, primary button **Playground**.
Footer reveals the dropdown content:
- Product: Context Database, Layered Context, Recursive Retrieval, OV Compile, Snapshots, Integrations, Pricing (-> /enterprise#pricing)
- Solutions: Engineering context, Multi-agent collab, Video production, Sales Agent, RecSys Diagnosis
- Developers: Documentation, Agent memory & context guides, Concepts, Quickstart, Benchmarks, Research, Blog, GitHub
- Company: Enterprise, OpenViking Context on Volcengine, MineContext, Contact sales

### 1.2 Section order (about 7000px, 6 sections — short)
1. Hero — eyebrow "OPENVIKING · OPEN SOURCE", H1 **"Context Database for AI Agents."**
2. Eyebrow "INTEGRATE" — **"Connect OpenViking in minutes"**
3. Eyebrow "CORE CAPABILITIES" — **"Context, organized like a file system"**
4. Eyebrow "MEASURED ADVANTAGE" — **"Benchmark results"**
5. Eyebrow "RESEARCH & PUBLICATIONS" — **"Research behind agent memory and retrieval"**
6. **"Teams already using OpenViking"** (stats + logo wall)
7. Footer — tagline "A contextual database for AI agents. Memory, resources, skills. Everything is a file."

No pricing, no testimonials, no FAQ, no closing CTA band.

### 1.3 Hero
- H1: "Context Database for AI Agents." (large serif, cream on near-black)
- Sub: "Memory, resources, and skills sprawl across vector stores, code, and modules. OpenViking organizes them into a navigable directory so context becomes a real, reusable asset for your agents."
- Inline metrics directly under the sub: "38.1K+ GitHub Stars", "3K+ Fork".
- CTAs: **Quickstart ->** (solid cream, anchors to the install section on the same page) and **Playground |>** (outline, hosted studio).
- Visual (right half): a vertically auto-scrolling column of agent chips (Claude Code, Codex, Cursor, OpenClaw, Hermes, TRAE, opencode, Pi, Manus, MCP) feeding into a pulsing logo hub, which connects to a code-style panel showing the `viking://` tree (`user/user_id/ memories/ resources/ sessions/ skills/ peers/peer_id/`, `resources/`). It is a one-glance architecture diagram: "many agents -> one store -> a file tree".

### 1.4 Social proof
- Star count appears 3 times (nav pill, hero, closing stat row). Closing row: Stars 38.1K+ / Forks 3K+ / Contributors 269, each linking to GitHub.
- Logo wall rendered as plain text wordmarks: ByteDance, Meituan, HuaSheng, Renmin University of China, CUHK-Shenzhen, Hermes Agent, SpoonOS.
- Academic credibility: three paper cards (VLDB 2026 "VikingMem", ICDE "Directory-Aware Query and Maintenance in Vector Databases", arXiv "VikingRAG") with author lists and PDF/arXiv links.
- No quotes, no tweets, no named customers' stories.

### 1.5 Quick start
Best install block of the three, and it is section 2, right under the hero.
- Left rail = agent picker with a one-line description each: Claude Code "Auto recall and capture", Codex "Hooks + built-in MCP", OpenClaw "Context engine plugin", OpenCode "Unified memory plugin", Hermes "Built-in OpenViking provider", MCP "TRAE / Cursor / Manus / ChatGPT", SDK "Python / LangChain / LangGraph".
- Toggle: "Self-hosted Server" vs "OpenViking Service" (hosted is the DEFAULT selection).
- Numbered steps with terminal blocks and "Copy command": "1 Connect Claude Code to OpenViking Service" (a `bash <(curl -fsSL .../install.sh) --harness claude` one-liner, then paste API key), "2 Restart and try it" (`claude`, then sample prompts "remember I am a frontend engineer working with React / Vite.").
- Reality from the docs: self-host = `uv tool install openviking`, `openviking-server init/doctor`, run the server, then `npm install -g @openviking/cli`, `ov config`. Requires an embedding model AND a VLM configured ("Volcengine (Doubao) models are recommended"). Two runtimes (Python + Node), a long-running server, and model API access.

### 1.6 Visual design
- Dark by default (near-black navy #0f1216-ish) with a faint square grid background; light mode toggle exists.
- Palette: cream/off-white text and buttons, a single teal/mint accent for eyebrows, chart highlight and links. Very restrained.
- Type: high-contrast serif for the H1 only; grotesque sans (Space Grotesk-like) for H2s; monospace for eyebrows, numbers, labels, code. Letter-spaced uppercase mono eyebrows on every section.
- Square corners, 1px borders, card-in-card panels; "developer tool / terminal" feel.
- Animation: hero agent list auto-scrolls, hub pulses. Otherwise static.
- Diagrams: the hero architecture, an interactive file-tree explorer with L0/L1/L2 badges (tabs Resources / User / Agent), two bar charts.
- Observed flaw: the right pane of the file-tree explorer rendered as a large empty box in my capture — dead space in a core section.

### 1.7 Differentiators and numbers
- Category claim: "Context Database", not "memory". Filesystem paradigm: "Everything is a file", `viking://` URIs, L0/L1/L2 layered context (.abstract.md / .overview.md / full file), directory-scoped recursive retrieval.
- Unifies three things: memory + resources + skills.
- Benchmarks (LoCoMo), shown as grouped bar charts with competitors named:
  - Claude Code Auto-Memory 57.21% -> + OpenViking 80.32%
  - Hermes Native Memory 33.38% -> + OpenViking 82.26%
  - OpenClaw: memory-core 24.2%, + Mem0 56.62%, + SuperMemory 42.99%, + Bailian 39.55%, + OpenViking 82.08%
  - Input tokens (M): Claude Code 353.31 -> 129.97; Hermes 79.23 -> 52.03; OpenClaw memory-core 392.56, Mem0 42.12, SuperMemory 88.3, Bailian 35.21, OpenViking 37.42
  - Summary callout: "OpenViking lifts Claude Code, Hermes, and OpenClaw to 80%+ long-term memory accuracy, while reducing input tokens by up to 63% against high-cost baselines."
- Note their own chart shows Mem0 and Bailian using about the same or fewer tokens than OpenViking; the "63%" is only against the worst baselines.

### 1.8 Weaknesses
- The default quickstart path is a hosted service on Volcengine (Beijing region endpoint `api.vikingdb.cn-beijing.volces.com`) requiring a console account and API key. For a Western developer that is a trust and friction problem, and the "open source" hero promise is immediately followed by a cloud sign-up.
- Self-hosting needs a server process, Python + Node, an embedding model and a VLM. LLM required; not zero-config.
- `curl | bash` installer from a raw GitHub URL.
- "Context Database" is abstract; the hero never says what changes for the user tomorrow morning. No before/after, no demo video, no sample session.
- "Solutions" (Video production, Sales Agent, RecSys Diagnosis) dilute the coding-agent focus.
- "Pricing" link goes to an Enterprise page; no public prices.
- No human voices at all (no testimonials), logo wall is mostly the parent company and Chinese institutions.
- Benchmark footnote admits figures are "from the LoCoMo evaluation sample"; no link to reproducible methodology on the homepage.
- Typo in the anchor id (`#conect`).

---

## 2. Graphiti (Zep) — https://www.getzep.com/platform/graphiti/

This is a product sub-page inside the Zep commercial site, not a standalone project site.

### 2.1 Nav
Announcement bar: "We're hiring! Come build with us ->".
Main: **Product** (mega-menu: Agent Memory, Context Lake, Konig, Graphiti, with a featured card) | **Enterprise** | **Pricing** | **Developers** (Documentation, API Reference, Blog) | **Resources** (Research, S&P Market Intelligence Report, Trust Center, Context Engineering, AI Agents Guides, Buy vs. Build: Agent Memory) | **Company** (About, Careers, Contact).
Right: GitHub "Stars 31k", Log in, **Book a demo** (outline), **Sign up** (solid purple).
Footer has a "Zep vs" column: Mem0, Letta, AWS AgentCore, Vertex AI Memory Bank, Cognee, Supermemory "Alternative" pages (SEO comparison pages).

### 2.2 Section order (about 7100px, 8 sections)
1. Hero — pill "OPEN SOURCE", H1 **"Graphiti. The Context Graph framework that powers Zep."**
2. Full-width animated graph band (no headline)
3. **"What Graphiti does."** (two-column: headline left, one paragraph right)
4. **"More accurate. Faster. Fewer tokens."** (two benchmark cards)
5. Eyebrow "WHY GRAPHITI" — **"What makes Graphiti different."** (2x2 cards: "Temporal by design", "Hybrid retrieval", "Dynamic updates", "Pluggable backends")
6. Eyebrow "MODEL CONTEXT PROTOCOL" — **"MCP Server."**
7. Eyebrow "POWERED BY ZEP" — **"Graphiti is the Context Graph framework. Zep is the Context Lake."** (open source vs commercial cards)
8. Eyebrow "COMMUNITY" — **"Build with the community."** ("Star the project", "Read the docs")
9. Eyebrow "CONTRIBUTING" — **"We welcome contributions from the community."** (numbered list 01-04)
10. Closing band: GitHub "Stars 31k" badge + **Read the docs ->**
11. Footer — "The Context Lake for AI agents."

### 2.3 Hero
- H1: "Graphiti. The Context Graph framework that powers Zep." — serif, with the product name in purple italic.
- Sub: "Open source and originated by Zep." (six words; says nothing about the benefit).
- CTAs: a GitHub "Stars 31k" badge and a text link "Read the docs ->". No solid button in the hero at all; the solid buttons are in the nav and sell Zep ("Book a demo", "Sign up").
- Visual: below the fold line, a beige band with a node-link graph (PERSON -knows-> PERSON -works at (until Mar 2025)-> COMPANY, "cares about" TOPIC, "uses" PRODUCT). The "until Mar 2025" edge label quietly demonstrates the temporal idea.

### 2.4 Social proof
- Star count only (nav, hero, closing band): "31k". No logos, no testimonials, no user counts on this page.
- Credibility is carried by benchmark numbers and the Zep brand (SOC 2, HIPAA, BYOC, S&P report, Trust Center in the nav).

### 2.5 Quick start
**There is none.** No `pip install`, no code block, no terminal anywhere on the page. Every path goes to "Read the docs". The MCP section is a diagram plus "Learn more about MCP". For an open-source developer tool this is the most striking omission of the three.

### 2.6 Visual design
- Light mode only. Warm off-white (#faf9f5-ish) alternating with beige/greige bands; white cards with 1px borders and generous radius.
- Single accent: deep purple (#4b2a7b-ish) for buttons, italic emphasis words, graph nodes.
- Type: elegant transitional serif for all headlines with one italic purple word per headline ("What Graphiti *does*.", "*Fewer tokens*.", "*different*.", "*Server*.", "*community*.", "*contributions*"); neutral sans for body; mono uppercase for eyebrows and chart labels. Every headline ends with a full stop.
- Feel: editorial / enterprise / "Anthropic-like", calm, lots of whitespace. Not hacker-ish.
- Diagrams: small bespoke mini-illustrations inside each feature card (VALID/INVALID timeline bar, three inputs merging into "ranked answer", struck-through `works_at("Acme Inc.")` vs valid `works_at("Globex Corp.")`, backend chips), and an MCP fan-in diagram (Claude / Cursor / ...MCP client -> MCP -> GRAPHITI). These are the best explanatory micro-diagrams of the three sites.
- Animation: subtle graph motion in the hero band only.

### 2.7 Differentiators and numbers
- Temporal knowledge graph: bi-temporal edges ("when a fact became valid, when it stopped being valid, when Graphiti learned about it, and when it learned it was no longer true"), point-in-time queries, fact invalidation instead of deletion.
- Hybrid retrieval: "Vector similarity, full-text search, and graph traversal in one ranked answer. No LLM-in-the-loop reranking, no orchestration layer to maintain."
- "New facts integrate immediately."
- Pluggable: Neo4j, FalkorDB, Amazon Neptune; OpenAI, Azure OpenAI, Gemini, Anthropic.
- Benchmarks: LoCoMo **94.7%** accuracy, 155 ms retrieval latency, 5,760 tokens context; LongMemEval **90.2%**, 162 ms, 4,408 tokens. Link: "See the methodology and full results".
- Careful wording: "Zep leads on all three" — the numbers are credited to Zep (the commercial product), not to self-hosted Graphiti.

### 2.8 Weaknesses
- The page is a funnel to the paid product. Nav CTAs are "Book a demo" / "Sign up"; a whole section explains that Graphiti is "One Context Graph per subject... Run it locally" while scale, governance, and the proprietary graph DB ("Konig") are commercial. A reader senses the open-source part is deliberately the smaller half.
- Requires a graph database (Neo4j / FalkorDB / Neptune) and an LLM provider — the page lists these as a feature ("Pluggable backends") but it means non-trivial infrastructure and per-ingest LLM cost. (Stated on the page; I did not re-verify setup steps in their docs.)
- No install command, no code, no demo, no screenshots of actual output.
- No social proof beyond stars.
- Jargon stack: "Context Graph", "Context Lake", "Konig", "temporal Context Graphs". Hero sub carries zero benefit.
- Not aimed at coding agents specifically; generic "agents". MCP is one small section.
- Two near-identical filler sections at the end ("Build with the community", "We welcome contributions") that repeat the same two links.
- Benchmarks presented without any comparison baseline on the page.

---

## 3. Cognee — https://www.cognee.ai/

Owner: Topoteretes UG (Berlin). Repo `topoteretes/cognee`.

### 3.1 Nav
Floating pill-shaped dark nav: **Product** (Company Brain, Cloud, Cognee SDK, Enterprise) | **Docs** (external) | **Resources** (Benchmarks, Case Studies, Cost Calculator, Blog, Newsroom, Academy, FAQ, Events, Community, Creator Program...) | **Company** (About Us, Partners, Careers...) | **Pricing**.
Right: GitHub "Star 30.8k", Log in, **Sign up** (lavender pill).
Footer adds comparison/migration SEO pages: Cognee vs Zep / mem0 / Supermemory; Migrating from Mem0 / Zep / Graphiti / Letta.
Cookie consent banner on first load (EU), plus a persistent green accessibility/feedback widget at right edge.

### 3.2 Section order (about 8100px, 12 sections — longest)
1. Hero — pill "NEW Cognee now runs free on local models ->", H1 **"Open Source Memory Platform for Agents"**
2. Eyebrow "THE PROBLEM" — **"Agents get lost in your complex systems."** with sub "Start wherever it hurts most." Three cards: "Knowledge is scattered" (For teams / CONNECTED), "Agent experience is discarded" (For agent builders / REMEMBERED), "Domain rules are guessed" (For enterprises / FOLLOWED). Floating red error chips: "Can't connect what you already know." "Can't remember what you just did." "Can't follow your rules."
3. Lavender strip "TRUSTED BY ENGINEERS FROM" (logo marquee)
4. **"Memory that improves"** (animated terminal demo)
5. Eyebrow "IN PRODUCTION" — **"From an AI chatbot to agentic research memory at Bayer."** (tabbed case-study carousel: Bayer, University of Wyoming, Rust Engine, BEAM, Cognee)
6. Eyebrow "COGNEE COMMUNITY" — six tweet cards (no headline)
7. Eyebrow "HOW WE BUILD" — **"Your company builds a shared company brain for agents."** Three cards by time: "5 min / Local — Give your agent durable memory", "1 day / Connect — Connect the data your agents should know", "1 week / Production — Ship agents that understand your domain"
8. Newsletter band — **"Stay in the loop"**
9. Eyebrow "USE COGNEE WITH" — **"Any agent. One memory API."**
10. Eyebrow "FROM THE FIELD" — customer testimonial carousel
11. Eyebrow "ASK AN AI" — **"Don't take our word for it."**
12. Lavender strip "BACKED BY" (Pebblebed, Vermilion Cliffs Ventures, 42CAP, Angel Invest...)
13. Eyebrow "GET STARTED" — **"Give your agents memory in 60 seconds."**
14. Footer

### 3.3 Hero
- H1: "Open Source Memory Platform for Agents" — huge thin geometric sans, centered, white on black.
- Sub: "Connect *Slack*, *GitHub*, *Linear* to Cognee and help agents recall what your company knows." (connector names italic + underlined). Micro-line: "Building a company brain? Start here ->".
- CTAs: **Start building** (lavender solid, goes to platform sign-up) and **Book a call** (outline).
- "WORKS WITH" strip: Claude Code, Codex, Skill, MCP, OpenClaw, Hermes (icons, marquee).
- Bottom edge of the hero: badge "GitHub Trending #1 Repository Of The Day", "5M+ SDK runs/month", "30.8k GitHub Stars", and at right "Part of Berkeley Xcelerator" with UC Berkeley wordmark.
- Visual: no product image. Black canvas with a fine grid and animated Tetris-like blocks (purple / grey) drifting and lighting up. Atmospheric, says nothing about the product.

### 3.4 Social proof
Heaviest of the three, six distinct layers: hero badges (trending #1, 5M+ runs/month, 30.8k stars, Berkeley), "Trusted by engineers from" logo marquee, Bayer case-study hero, six tweets from dev influencers (including "Been using cognee for over 7 months now after migrating from Graphiti. Great product."), six named customer quotes with photos and titles (Knowunity, SlideSpeak, Dynamo, Luccid, DeepMetis, Univ. of Wyoming), investor logos, and GDPR / EU AI Act compliance seals in the footer.
Novel device: **"Don't take our word for it."** — a prefilled prompt ("I'm evaluating cognee (cognee.ai)... how does it compare to Mem0, Zep and Letta...") with buttons "Ask ChatGPT", "Ask Perplexity", "Ask Claude", "Copy prompt". Confident, and cheap to build.

### 3.5 Quick start
- Animated fake terminal ("cognee@localhost:8000", status WAITING/RUNNING, Replay button) that types: `pip install cognee`, `await cognee.agents()`, `await cognee.remember("...")`, `await cognee.recall("...")` -> "search 40ms · answer assembled from relevant memories", `await cognee.improve({ feedback: ... })`. Footer counters: 3 Agents, 1,284 Docs, 6,418 Entities, 5 Citations. It teaches the four-verb API (remember / recall / improve) in about 15 seconds.
- "5 min / 1 day / 1 week" ladder, each card with a one-line command (`$ pip install cognee`, `$ cognee.add("github://your-org")`, `$ cognee.search("…") # cited answers`) and an audience tag ("Solo devs · Agent hackers", "Data + platform teams", "Product engineers · Vertical agents").
- Closing: "Give your agents memory in 60 seconds." + `$ pip install cognee · Open-source`.
- But the primary CTA "Start building" leads to the hosted platform sign-up, not to the install. There is no per-agent (Claude Code / Cursor) install snippet on the homepage.

### 3.6 Visual design
- Dark only: pure black and charcoal (#2b2b2b) bands, punctuated by full-bleed **lavender (#b8a0f5-ish)** bands for logos, case study, newsletter, investors. Lavender is also the button color. High contrast, very recognizable brand.
- Pixel / Tetris / mosaic motif used everywhere: hero animation, card footers (pixelated purple gradients), integrations section. Cohesive identity, but purely decorative.
- Type: light-weight neo-grotesque at very large sizes, with one italic underlined phrase per headline ("Agents *get lost* in...", "*One* memory API."); tiny mono uppercase eyebrows in lavender.
- Heavy motion: animated hero grid, marquees (works-with, logos, testimonials), typing terminal, carousel tabs. Body is the scroll container inside a fixed-height html, which broke the standard full-page screenshot and is a hint of scroll-jank risk.
- No architecture diagram anywhere on the homepage.

### 3.7 Differentiators and numbers
- Positioning has shifted up-market: "company brain", connectors (Slack, GitHub, Linear, Notion, Google Drive), ontologies ("Cognee generates the ontologies your agents follow"), citations/provenance, feedback loop ("Memory that improves"), permissions, BYOC.
- "Cognee now runs free on local models" (new; addressing the LLM-cost objection).
- Numbers: 30.8k stars, 5M+ SDK runs/month, "#1 Repository Of The Day", "search 40ms" (in the demo, not a benchmark), "POC done in 2 days on 40,000 students", "launched the first memory system within 30 days".
- **No benchmark numbers on the homepage** (a Benchmarks page exists in the footer).
- Pricing page (public, clear): Free $0 (1 workspace, 1M tokens, no card) / Standard $1.00 per 1M tokens + $5 per extra workspace / Enterprise BYOC engagement, contact sales. Notably, "Bi-temporal memory & conflict resolution" and "Provenance on every answer" are listed as Enterprise-only, and the enterprise runtime is described as "Proprietary Cognee runtime". Also: "Cognee is open source. Run the full memory engine locally or on your own stack — free, forever."

### 3.8 Weaknesses
- Tries to speak to three audiences at once (teams, agent builders, enterprises); a solo developer using Claude Code has to dig to find that they are the "5 min" card.
- Too long and too much social proof: two testimonial carousels, tweets, logos, investors, case study, newsletter — the actual product explanation is a single terminal animation.
- Hero visual is decoration; no diagram of how it works, what is stored, or where.
- Primary CTA goes to a hosted sign-up; second CTA is a sales call. Open-source path is the quiet third option.
- Open-core tension: the most interesting memory features (bi-temporal, conflict resolution, provenance) are Enterprise on the pricing page.
- Python library first (`await cognee...`), so it reads as something you build into an app, not something you drop into your coding agent. Knowledge-graph extraction implies an LLM on ingest (the "runs free on local models" banner confirms LLM dependence, just a cheaper one).
- Cookie banner + sticky widget + marquee motion = noisy first impression. Newsletter band interrupts mid-page.
- Vague verbs ("CONNECTED / REMEMBERED / FOLLOWED") and "company brain" buzzword.

---

## 4. Synthesis

### 4.1 Patterns common to all three (visitors will expect these)
1. **GitHub stars in the top nav** as a live pill, repeated in the hero and again near the bottom. All three sit at 30-38k, so a small project should not compete on the raw number — show the badge, but lead with something else.
2. **"Open source" eyebrow/pill directly above the H1.**
3. **H1 formula = category noun + "for (AI) Agents"**: "Context Database for AI Agents." / "The Context Graph framework..." / "Open Source Memory Platform for Agents". Each invents or claims a category word (Context Database, Context Graph, Memory Platform).
4. **"Works with" agent strip**: Claude Code, Codex, Cursor, OpenClaw, Hermes, MCP named on every site. MCP gets its own mention everywhere.
5. **Mono uppercase letter-spaced eyebrow above every H2**, and one emphasized word per headline (italic/colored).
6. **One accent color on a neutral base** (teal on navy; purple on cream; lavender on black). Two of three are dark with a faint grid background.
7. **Benchmark language is LoCoMo / LongMemEval accuracy + latency + tokens.** "Fewer tokens" is a universal claim.
8. **Two-CTA hero**: a developer action + a commercial/hosted action.
9. **Docs on a separate subdomain**; footer with comparison / "alternative" / "migrating from" SEO pages (Zep and Cognee both do this and name each other).
10. **An open-source core feeding a commercial cloud** — every one of these sites is ultimately a funnel to a hosted or enterprise product.

### 4.2 Gaps aimemory.io can exploit
1. **No funnel, no account.** All three push a hosted service, API key, demo call, or sign-up within the first screen. A site whose only CTAs are "Install" and "GitHub" — and that says "no account, no API key, no cloud" out loud — is instantly different.
2. **No infrastructure.** Graphiti needs Neo4j/FalkorDB/Neptune + an LLM; OpenViking needs a server + embedding model + VLM (Doubao recommended) or a Beijing-hosted service; Cognee needs an LLM for graph extraction. If ai-memory runs locally without a graph DB and without a mandatory LLM on ingest, put that in the hero or directly below it as a checklist ("No graph DB. No vector service. No LLM bill. Your data stays in plain files on your disk.") — verify each claim against the repo first.
3. **Coding agents specifically.** All three say "agents" generically and drift toward enterprise knowledge ("company brain", "Context Lake", "Sales Agent", "Video production"). Nobody owns "memory for your coding agent across sessions and across tools". Speak to one person: the developer in a terminal with Claude Code / Codex / Cursor.
4. **Show the actual experience.** None of them shows a real before/after session (agent forgets -> agent remembers, handoff from one agent to another). Cognee's typed terminal is the closest and is the most persuasive element across all three sites. A real recorded session (asciinema-style) or a two-pane "without / with" would beat all of them.
5. **Install in the hero.** Only OpenViking puts a copyable command high on the page, and it is a hosted-first curl|bash. Graphiti has no command at all. A one-line copyable install inside the hero, with a per-agent tab picker (copy OpenViking's left-rail pattern: agent name + one-line description of how it integrates), is the expected-but-unmet pattern.
6. **Plain words.** "Context Lake", "Konig", "ontologies", "L0/L1/L2", "company brain". A site that says what it does in a sentence a tired developer understands wins the first five seconds.
7. **Honest, reproducible numbers.** OpenViking's chart includes rows where it does not win and uses a "sample"; Zep gives numbers with no baseline on the page; Cognee gives none. If ai-memory has any measurement (tokens saved per session, recall latency, install time), present it with the command to reproduce it. If it has none, do not invent one — use concrete facts instead (single binary, N tools supported, size on disk, license).
8. **Short page.** OpenViking's 6-section structure (hero -> install -> how it's organized -> numbers -> proof -> footer) is the right length for a hot-site. Cognee's 12+ sections with two testimonial carousels is the cautionary example.
9. **Inspectable storage as a trust feature.** OpenViking's most memorable idea is "everything is a file" with a visible tree. If ai-memory stores human-readable pages (wiki/markdown), showing the actual on-disk tree and an actual page is both a diagram and a trust argument ("you can read, edit, and git-diff your agent's memory").
10. **Borrowable devices:** Graphiti's tiny per-feature diagrams inside cards (far better than icons); Cognee's "Ask ChatGPT / Perplexity / Claude about us" prompt block and its "5 min / 1 day / 1 week" ladder; OpenViking's hero "many agents -> one hub -> tree" diagram and hosted/self-hosted toggle (for ai-memory: per-agent tabs instead).

### 4.3 Things not to copy
- Decorative hero animation with no meaning (Cognee).
- Closing "community" + "contributing" filler sections that repeat the same two links (Graphiti).
- Benefit-free sub-headline ("Open source and originated by Zep.").
- Cookie banner, newsletter band, floating widgets on a single-page OSS site.
- Invented category jargon as the H1.
