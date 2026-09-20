# Brief for building a detail page on aimemory.io

You are building pages for the marketing site of ai-memory (open source long-term memory for AI coding agents, https://github.com/akitaonrails/ai-memory). The project lives at /mnt/data/Projects/ai-memory-web (Astro 7, Tailwind 4, GSAP). The homepage, layout, nav, design tokens and shared components already exist. Your job is only the pages assigned to you.

## Read first, in this order
1. docs/design-system.md — the rules. Follow them exactly, including the Writing section.
2. src/pages/index.astro and src/components/*.astro — to see how components are used and the tone of the copy.
3. src/data/site.ts, src/data/support.ts, src/data/competitors.ts — shared data. Import from these; do not duplicate their content.
4. The research briefs named in your assignment, under docs/research/. They were extracted from the real repo docs and mark contradictions and things not to overclaim with FLAG. Respect every flag. If you need more detail, read the original docs in /home/akitaonrails/Projects/ai-memory (read-only; never modify that repo).

## Hard rules
- Facts only from the briefs or the repo. Invent nothing: no numbers, quotes, testimonials, customers, features. Commands must be copied verbatim from the docs.
- Do not hardcode the release version or GitHub numbers; use `getGithub()` from '@/data/github' if you need them.
- The published benchmark is LongMemEval-S hit@5 0.617 → 0.823 with local embeddings (0.668 FTS-only). It measures retrieval, not answer accuracy. agentmemory's like-for-like number is 0.952 (vendor reported).
- "Cross-machine" means one server that many machines reach. There is no automatic replication.
- Team use: accounts are not a tenancy boundary; every user sees every project on that server; one team per server. Say so where relevant, in a Callout.
- Do NOT edit: src/styles/global.css, src/layouts/*, src/components/*, src/data/*, src/pages/index.astro, package.json, or any other agent's pages. If you need page-specific styling, use a <style> block in your page. If you think a shared component needs a change, say so in your final report instead of changing it.
- No dense paragraphs. Short sections, lists, tables, tabs, diagrams. A visitor should be able to skim the page in a minute and still get the point. Do not copy the GitHub docs; summarize and link to them (`site.docs + '/file.md'`) for the full detail.
- Each page: PageHero, 3 to 6 Sections, at least 2 generated Figures, NextPages, CtaBand. Give each page a precise `title` and a 140 to 160 character `description` for SEO, use one h1, ordered h2/h3, descriptive link text, and meaningful `alt` text that states what the diagram says. Where a page answers common questions, pass a schema.org FAQPage object through Base's `schema` prop.
- Must work at 360px wide and in both light and dark themes. Use the color tokens (text-muted, bg-tint, data-hue, var(--hue)...), never raw hex colors.

## Writing rules (the site owner runs a "humanizer" pass; write it clean the first time)
No em or en dashes. No "not X, but Y" / "it's not X, it's Y" / "X rather than Y" for emphasis. No one-line closers that restate the point. No rows of dramatic fragments. No forced three-item lists. No "seamless, robust, powerful, unlock, effortless, key, crucial, landscape, delve, showcase, leverage, enhance". No "Let's", "Here's the thing". No bold labels followed by a colon in lists. No arrows or emoji in text. Sentence case headings. Use is/are/has. Vary sentence length. Every sentence adds a fact the reader did not have.

## Generating images
Diagrams are AI generated. For each image:
1. Write the prompt to scripts/prompts/<page>-<subject>.txt. Describe layout, objects, and the exact label texts in double quotes. Keep labels few (max ~8) and short (1 to 3 words); long text gets misspelled. Do not describe style; scripts/prompts/_style.txt is appended automatically and the logo is sent as a style reference. Look at scripts/prompts/how-it-works.txt and the result src/assets/img/gen/how-it-works.webp for a good example.
2. Run: `cd /mnt/data/Projects/ai-memory-web && node scripts/gen-image.mjs <page>-<subject>` (add `--aspect 4:3` or `--aspect 1:1` or `--aspect 21:9` if the layout wants it). Takes about 30 to 60 s. Output: src/assets/img/gen/<name>.webp.
3. LOOK at the result with the Read tool. Reject and regenerate (tweak the prompt, up to 3 tries) if any label is misspelled, extra gibberish text appears, the background is not the dark indigo, or the diagram says something untrue about the product. If it still fails after 3 tries, simplify the diagram (fewer labels) rather than shipping a wrong one.
4. Import it in the page and show it with the Figure component.
Use images for what is easier seen than read: architecture, data flow, topologies, ladders, comparisons of shape. Aim for 2 to 4 per page.

## Verifying
A dev server is already running at http://127.0.0.1:4321 (do not start another, do not run `npm run build`; other agents are working at the same time). After writing a page:
- `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:4321/<path>/` must be 200, and `curl -s http://127.0.0.1:4321/<path>/ | grep -ci 'astro-error\|An error occurred'` must be 0.
- Take screenshots with the agent-browser CLI using your own session so you don't collide with others: `agent-browser --session <yourname> set viewport 1440 900`, `agent-browser --session <yourname> open <url>`, `agent-browser --session <yourname> screenshot --full <file.png>` into /tmp/claude-1026/-mnt-data-Projects-ai-memory-web/06d7b915-ab10-4d79-a13c-4fdd03dd840a/scratchpad/shots/. Also check `set viewport 390 844` (mobile) and `set media light` / `set media dark`. Run `agent-browser --help` if a command fails. LOOK at the screenshots and fix what is broken: overflow, cramped text, unreadable contrast, walls of text, empty gaps. Note: scroll-driven elements (data-zoom, data-fill) look dimmed in full-page screenshots because they have not been scrolled into view; that is expected.
- Close your browser session when done: `agent-browser --session <yourname> close`.

## Final report (under 250 words)
List the files you created, the images you generated (and any you gave up on), any fact you were unsure about, and any shared-component change you recommend.
