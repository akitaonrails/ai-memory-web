# Brief: move a page's strings into an i18n catalog

The site (Astro 7, /mnt/data/Projects/ai-memory-web) is becoming multilingual: English (default, no URL prefix), pt-br, es, he (right to left), ja. The i18n core is done. Your job is to convert the pages assigned to you so that **no human-readable English remains in the .astro file**. Translation into other languages is NOT your job; you only produce the English catalog and the converted page.

## Read first
1. `src/i18n/index.ts` and `src/i18n/config.ts`: the API (`useI18n`, `t`, `raw`, `href`, `date`, `number`, `localePaths`).
2. `src/pages/[...locale]/index.astro` + `src/i18n/locales/en/home.json`, and `src/pages/[...locale]/download.astro` + `src/i18n/locales/en/download.json`: finished examples. Copy their conventions.
3. `src/components/Continuity.astro`: example of keeping structure (ids, hues, hrefs, kinds) in code and words in the catalog.
4. `src/i18n/locales/en/common.json`: shared strings (nav, footer, CTA, "Copy", stats labels). Reuse these keys; do not duplicate them.
5. `src/data/competitors.ts` + `src/i18n/locales/en/competitors.json` and `src/data/support.ts` + `src/i18n/locales/en/support.json`: the data modules no longer hold text. `statusMeaning`, `llmProviders`, `embeddingProviders`, `moat` and the `note`/`name`/`kind`... fields moved into those catalogs (`statusHue` and `slug()` are the new helpers in support.ts). Pages that used the old exports must read the catalog: `useI18n(Astro, 'compare', 'competitors')` then `raw<CompetitorText>('items.' + id)`, `raw<MoatText[]>('moat')`, `raw('status.' + slug(status))`, etc.

## How to convert a page
- Each page already has `import { useI18n, localePaths } from '@/i18n'; export const getStaticPaths = localePaths;` at the top. Add `const { t, raw, href, date, number, locale } = useI18n(Astro, '<namespace>');` (add `'competitors'` or `'support'` as extra namespaces if the page needs them).
- Create `src/i18n/locales/en/<namespace>.json`. Namespace = page name: `install`, `advanced`, `security`, `architecture`, `research`, `contribute`, `compare`, `integrations`, `individuals`, `teams`.
- Move EVERY string a visitor can read or a screen reader or search engine can see: headings, paragraphs, list items, button and link text, table headers and cells, badge text, `alt`, `aria-label`, `title`, captions, the Base `title` and `description`, FAQ/HowTo schema text, NextPages items, CtaBand overrides, Callout titles, tab labels, CodeBlock `title`, text built in the frontmatter (arrays of items), and text inside page `<script>` blocks (pass it through `data-*` attributes, as `CodeBlock` does with `data-copied`).
- Keys: nested, grouped by section, camelCase, named for meaning (`hero.title`, `team.steps`, `faq`), never for position or English wording. Use arrays for lists of like items (`raw<Item[]>('solo.steps')`) and keep non-text fields (hue, href, id, code) in the .astro file, merged by index or id exactly as index.astro does with `pathMeta`.
- Variables: `{name}` placeholders, `t('key', { n: 5 })`. Never concatenate sentence fragments; a full sentence is one message, because word order differs by language. Avoid building plurals from pieces; write the message so a number fits ("Contributors: {n}" or "{n} people have...").
- Inline markup (`<code>`, `<strong>`, `<a>`): keep it inside the message and render with `set:html={t('key', {...})}`. For links inside a message, pass the URL as a placeholder: `"...follow the <a class=\"underline\" href=\"{href}\">quick setup</a>."` with `{ href: href('/install/') }`. Keep class attributes short.
- Every internal link goes through `href('/path/')` so it stays in the visitor's language. Anchors alone (`#team`) and external URLs stay as they are.
- NOT translated, stay in the .astro file: shell commands, flags, env var names, file paths, config snippets, URLs, product and agent names (Claude Code, Codex, Mem0...), crate names, version numbers, numbers from data. In code blocks, only the `# comment` lines are translatable: build the block with a template literal and `# ${t('...')}` like index.astro does.
- Dates and numbers: use `date(iso)` and `number(n)` from `useI18n`, not `toLocaleDateString('en-US')`.
- Generated diagrams: replace `import x from '@/assets/img/gen/NAME.webp'` + `<Figure src={x} ...>` with `<Figure name="NAME" alt={t('...')} caption={t('...')} />`. The component picks a translated image when one exists. Screenshots that are not generated keep `src`.

## Right-to-left (Hebrew) safety, in your page's own <style> and classes
- Use logical properties: `margin-inline-start`, `padding-inline-end`, `inset-inline-start`, `border-inline-start`, `text-align: start`. Tailwind: `ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`, `text-start`, `border-s-*`, `rounded-s-*`. Replace every `ml-`, `mr-`, `pl-`, `pr-`, `left-`, `right-`, `text-left`, `text-right`, `border-l-`, `border-r-` unless it is truly about the physical side.
- Arrow icons that mean "forward" get `class="flip-rtl"`. Terminal-like or diagram-like blocks that must read left to right get `dir="ltr"` (CodeBlock and Figure already do).
- HTML/CSS charts (bars): fine to leave growing from the inline start.

## Tighten the copy while you are in there (the site owner asked for this)
- Delete sentences that talk about the source instead of stating the fact: "The design document says it in those words.", "the docs say so", "The docs state it plainly:", "The docs call it...". Say the fact and stop. Always go straight to the point.
- No em or en dashes, no "not X, but Y" for emphasis, no one-line closers that restate, no fragment rows, no forced triads, no "seamless, robust, powerful, unlock, effortless, key, crucial, landscape". Do not add facts. Do not change meaning, numbers or commands.

## Do not touch
`src/i18n/index.ts`, `src/i18n/config.ts`, `common.json`, `home.json`, `download.json`, `competitors.json`, `support.json` (if one of the last two is missing a string your page needs, add keys to YOUR page namespace instead and say so in your report), `src/layouts/*`, `src/components/*`, `src/styles/*`, other agents' pages, `package.json`, `astro.config.mjs`. Do not run `npm run build` (others are working in parallel). Do not create files under any locale except `en`.

## Verify
A dev server runs at http://127.0.0.1:4321. For each page, all five URLs must return 200 with no Astro error overlay: `/<path>/`, `/pt-br/<path>/`, `/es/<path>/`, `/he/<path>/`, `/ja/<path>/` (they all show English text for now; that is expected):
`for l in "" pt-br/ es/ he/ ja/; do curl -s -o /dev/null -w "%{http_code} " http://127.0.0.1:4321/${l}<path>/; done` and `curl -s http://127.0.0.1:4321/he/<path>/ | grep -ci 'astro-error\|An error occurred\|\[i18n\]'` must be 0.
Then prove nothing is left: `curl -s http://127.0.0.1:4321/<path>/` before and after should read the same (apart from the copy you tightened), and grep your .astro file for leftover English: look at every `>` text node, every quoted prop, every string in the frontmatter. Take one screenshot of `/he/<path>/` with `agent-browser --session <yourname>` (viewport 1440x900) into /tmp/claude-1026/-mnt-data-Projects-ai-memory-web/06d7b915-ab10-4d79-a13c-4fdd03dd840a/scratchpad/shots/ and LOOK at it: the layout should mirror cleanly (text right aligned, nothing overlapping, code blocks still left to right). Fix what is broken. Close your browser session when done.
Validate the JSON: `node -e "JSON.parse(require('fs').readFileSync('src/i18n/locales/en/<ns>.json','utf8'))"`.

## Final report (under 200 words)
Files changed, number of keys per namespace, any string you deliberately left in the .astro file and why, sentences you removed or rewrote under "tighten the copy", and RTL problems you could not fix.
