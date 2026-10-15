# Design system

How pages on aimemory.sh are put together. Read this before adding or changing a page.

## The idea: Signal Bureau

Direction C was selected on 15 October 2026. The unchanged brain logo supplies the copper chip, handoff arrows and neural connections. The surrounding interface uses mineral blue-grey enamel and dark slate, squared controls, fine structural rules and occasional clipped panel corners. Copper identifies memory and movement. No ambient rainbow gradients, neon glows, floating cards or scrolling marquees.

The default follows the system theme and keeps the existing theme switcher. Light mode uses a mineral ground with dark diagram and hero panels; dark mode uses the same panels against a deeper slate ground. Colors live in `src/styles/global.css`; `npm run check:colors` checks both themes, including the fixed dark panels.

## Subject hues

The existing `data-hue` API remains: green for knowledge, teal for teams, azure for infrastructure, violet for agents, rose for security and amber for actions. These are subdued slate-compatible tints, not the saturated spectrum. Use `--hue` for text, `--hue-soft` for fills and `--hue-vivid` for decoration. Dark panels use `--panel-text`, `--panel-muted`, `--panel-line` and `--amber` regardless of theme.

## Type

Fonts are self-hosted through Fontsource. Chakra Petch (500/600) supplies angular headings; Manrope is the reading face; IBM Plex Mono is for code and short technical labels. Hebrew retains Rubik/Heebo; Japanese and Korean retain their Noto faces, loaded only for those languages.

Body text is 18px. Navigation and controls are at least 16px; secondary labels are at least 14px. Diagram labels are 20px with 16px notes and reflow vertically on small screens instead of shrinking. Headings are fluid; translated headings can wrap. Do not lower text opacity for scroll effects.

Sentence case, no spectrum-filled headlines. Keep paragraphs around 40em. Use angular display text for headings and short labels, never long prose.

## Layout

- `.wrap` is the 76rem page column. `.wrap-narrow` is 52rem for reading.
- `.band` is the vertical rhythm between sections. Add `bg-tint` for an alternate ground. Do not alternate every section; use it to mark a change of subject.
- Content is left aligned. Nothing is centered except the CTA band.
- Prefer open layouts (a rule on top, whitespace) over boxes. Cards are for things you click.
- Mobile first. Every grid collapses to one column. Tables scroll sideways inside `.table-wrap`.
- Test at 360px wide, in the longest languages (Portuguese, Spanish) and in Japanese. The page must never scroll sideways: `document.documentElement.scrollWidth` has to equal the viewport width. Buttons wrap, grid and flex children can shrink (`min-width: 0` is set globally), and long commands scroll inside their code block.

## Components (`src/components`)

| Component | Use |
|---|---|
| `Base` (layout) | Every page. Props: `title`, `description` (write a real one, 140 to 160 characters), `schema` (extra JSON-LD objects). |
| `PageHero` | Top of every detail page. Props: `hue`, `kicker` (the nav group, e.g. "Solutions"), `title`, `lede`. Slot: one or two buttons. |
| `Section` | A band with an h2. Props: `title`, `lede`, `hue`, `id`, `tint`, `narrow`, `fill` (scroll-lit lede). |
| `FeatureGrid` | Two to six short points. Props: `items[{title,text,hue,href,link}]`, `cols`. |
| `Steps` | A numbered procedure with terminal blocks. Props: `steps[{title,text,code,codeTitle}]`. `text` accepts inline HTML. |
| Homepage | A fixed brain hero, introductory workflow and controls, audience paths, then setup. The compact directory links to agent support and evidence without repeating the detailed sections. No auto-advancing content. |
| `Transcript` | A terminal session as the reader sees it: a typed command, log lines, a warning, questions with answers. Props: `title`, `lines[{kind,text,answer}]`, `hue`. |
| `CodeBlock` | A terminal with a copy button. Props: `code`, `title`. Lines starting with `#` dim as comments. |
| `Tabs` | Props: `id`, `labels[]`. Panels are slots named `"0"`, `"1"`... |
| `Figure` | A native diagram selected by `name`, or an original product screenshot passed as `src`. Supports `alt` and `caption`. |
| `Diagram` + `CircuitIcon` | Typed topology in `src/data/diagrams.ts`, inline SVG symbols, translated HTML labels from `images.json`. Sequential stages connect; nodes inside one stage are parallel. Optional paths use dashed outlines. |
| `BarChart` | Horizontal bars in plain HTML. Props: `bars[{label,note,value (0 to 1),display,detail,tone}]`, `label`, `axis`. `tone` is `strong`, `soft` or `other` (someone else's number, hatched). |
| `SceneCard` | Readable terminal, people, observation or file-tree content in the static continuity examples. |
| `Faq` | The page's questions as an accordion, fed by the same list as its `faqPage()` structured data. Props: `items`, `title`, `hue`. |
| `Callout` | Limits and caveats. Props: `title`, `hue`. |
| `StatList` | A row of stand-out numbers that count up, each a link. Props: `stats[{n,label,hue,href}]`. |
| `GithubStats` | The four live GitHub numbers, a `StatList`. |
| `NextPages` | Two or three onward links at the bottom of a detail page. |
| `CtaBand` | The closing call to action. Props: `title`, `text`. |

CSS classes, all in `src/styles/global.css`: `btn btn-primary`, `btn btn-ghost`, `card`, `lede`, `badge` (with `data-hue`), `table-wrap` + `table-site`, `prose-site`, `spectrum-rule`, `ticks` (list with a short bar), `dotlist` (list with a dot), `gain` (amber marker), `pick` (pill toggle for tabs and filters), `kicker` (small hue label above a heading), `link` (links inside catalog messages). Inline `<code>` in running text is styled globally, including text injected with `set:html`. A page's own `<style>` is for what only that page has.

Helpers:

| Helper | Where | Use |
|---|---|---|
| `useI18n`, `withText`, `languageLinks` | `src/i18n` | Messages, joining structure with words, the language menu |
| `faqPage`, `siteGraph` | `src/lib/schema.ts` | schema.org data. A page with questions passes `schema={[faqPage(faq)]}` to `Base` |
| `getGithub`, `getLatestRelease`, `compact` | `src/data/github.ts` | Build-time GitHub numbers |

A detail page is: `PageHero`, three to six `Section`s with at least two `Figure`s, `NextPages`, `CtaBand`.

## Motion

Content remains readable without JavaScript and under reduced motion. Small position-only reveals and count animations may enhance the page. Never scale diagrams or fade text as the reader scrolls. Continuity examples are static and fully visible, without pinning. Navigation, tabs, copy buttons and theme choices retain their existing behavior.

## Writing

The reader is a developer deciding whether to install something. Tell them what it does and what it costs them.

- Short. A section is a heading, one or two sentences, and something to look at. If a paragraph passes three sentences, it wants to be a list, a table or a diagram.
- Plain verbs, second person, active voice. A button says what it does.
- Do not promise how long something takes ("in 5 minutes"). Say what the reader does: "three commands", "five steps".
- Claims come from the ai-memory repository. Numbers keep their caveats. Competitor numbers are labelled as the vendor's own.
- Say where the project is behind. The repository's own comparison does, and it is the most persuasive thing on the site.
- No em dashes or en dashes. No "not X, but Y" constructions. No three-item lists for rhythm. No closing one-liners that restate the section. No "seamless", "robust", "powerful", "unlock", "effortless", "key", "crucial", "landscape". No arrows or emoji in text.
- Say a thing fully in one place and link to it from the others. Canonical homes: throughput numbers on Architecture (and the operator table on Advanced), the "where it is behind" list on Compare, team setup commands on Install, the benchmark method on Research. Short limits that people must see before acting (team limits, open-internet warning) may repeat.
- Do not claim: multi-tenant or enterprise readiness, automatic cross-machine sync (it is one server that many machines reach), forensic deletion, endorsement by Google, Anthropic or anyone else.

## Languages

Every visible string lives in `src/i18n/locales/`, never in an `.astro` file, and CSS uses logical properties so Hebrew mirrors. See [i18n.md](i18n.md).

## Images

Diagrams use native SVG symbols and translated HTML text. See [images.md](images.md). Existing raster files and prompts remain as historical references; product screenshots and the brain logo stay unchanged.
