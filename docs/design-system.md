# Design system

How pages on aimemory.io are put together. Read this before adding or changing a page.

## The idea

The logo is a brain that is half neural network and half circuit board. An amber arrow goes in on the left, through a copper chip, and out on the right. The site takes three things from it:

1. The spectrum (green, teal, azure, violet, rose) is the brand. Each subject owns one hue and keeps it everywhere.
2. Amber means action and handoff: buttons, the flow dots, "what you gain" markers. Nothing else is amber.
3. "In, through the memory, out" is the shape of the homepage scroll scene and of most diagrams.

The ground is a deep indigo in dark mode and a faintly violet white in light mode. Neither is grey. See [color-study.md](color-study.md).

## Subject hues

| Subject | Hue | `data-hue` |
|---|---|---|
| Agents, individuals, research | violet | `violet` |
| Machines, architecture, infrastructure | azure | `azure` |
| Teams, contributing | teal | `teal` |
| The wiki, how it works, downloads | green | `green` |
| Security | rose | `rose` |
| Action, migration, quick setup | amber | `amber` |

Put `data-hue="teal"` on any element and its children can use `var(--hue)` (text-safe), `var(--hue-soft)` (fill) and `var(--hue-vivid)` (rules, dots, glows; never text).

## Type

| Role | Family | Notes |
|---|---|---|
| Headings | Bricolage Grotesque (variable) | weight 640, optical size 96 for h1/h2 |
| Body and UI | Instrument Sans (variable) | width 96 |
| Code only | Commit Mono | never for labels or decoration |

Sizes are Tailwind utilities backed by tokens: `text-4xl` (page h1), `text-3xl` (section h2), `text-2xl`, `text-xl` (h3), `text-lg` (lede), `text-base`, `text-sm`. The three largest are fluid.

Rules:

- Sentence case everywhere. No all-caps labels.
- Do not color or italicize one word of a headline. A headline is one color, or the whole thing is `spectrum-text` (home hero only).
- Lines of body text stay under about 70 characters (`max-w-[40em]` or the `.lede` class).
- Numbers in steps only when the content is a real sequence.

## Layout

- `.wrap` is the 76rem page column. `.wrap-narrow` is 52rem for reading.
- `.band` is the vertical rhythm between sections. Add `bg-tint` for an alternate ground. Do not alternate every section; use it to mark a change of subject.
- Content is left aligned. Nothing is centered except the CTA band.
- Prefer open layouts (a rule on top, whitespace) over boxes. Cards are for things you click.
- Mobile first. Every grid collapses to one column. Tables scroll sideways inside `.table-wrap`.

## Components (`src/components`)

| Component | Use |
|---|---|
| `Base` (layout) | Every page. Props: `title`, `description` (write a real one, 140 to 160 characters), `schema` (extra JSON-LD objects). |
| `PageHero` | Top of every detail page. Props: `hue`, `kicker` (the nav group, e.g. "Solutions"), `title`, `lede`. Slot: one or two buttons. |
| `Section` | A band with an h2. Props: `title`, `lede`, `hue`, `id`, `tint`, `narrow`, `fill` (scroll-lit lede). |
| `FeatureGrid` | Two to six short points. Props: `items[{title,text,hue,href,link}]`, `cols`. |
| `Steps` | A numbered procedure with terminal blocks. Props: `steps[{title,text,code,codeTitle}]`. `text` accepts inline HTML. |
| `CodeBlock` | A terminal with a copy button. Props: `code`, `title`. Lines starting with `#` dim as comments. |
| `Tabs` | Props: `id`, `labels[]`. Panels are slots named `"0"`, `"1"`... |
| `Figure` | A generated diagram. Props: `name` (file name in `src/assets/img/gen/`; the translated copy is used when one exists), or `src` for a screenshot, `alt` (describe what the diagram says), `caption`, `zoom`. |
| `BarChart` | Horizontal bars in plain HTML. Props: `bars[{label,note,value (0 to 1),display,detail,tone}]`, `label`, `axis`. `tone` is `strong`, `soft` or `other` (someone else's number, hatched). |
| `SceneCard` | One window of the homepage scroll scene: terminal lines, people, chips or a file tree. |
| `Faq` | The page's questions as an accordion, fed by the same list as its `faqPage()` structured data. Props: `items`, `title`, `hue`. |
| `Callout` | Limits and caveats. Props: `title`, `hue`. |
| `GithubStats` | The four live numbers. |
| `NextPages` | Two or three onward links at the bottom of a detail page. |
| `CtaBand` | The closing call to action. Props: `title`, `text`. |

CSS classes, all in `src/styles/global.css`: `btn btn-primary`, `btn btn-ghost`, `card`, `lede`, `badge` (with `data-hue`), `table-wrap` + `table-site`, `prose-site`, `spectrum-rule`, `ticks` (list with a short bar), `dotlist` (list with a dot), `gain` (amber marker), `pick` (pill toggle for tabs and filters), `link` (links inside catalog messages). Inline `<code>` in running text is styled globally, including text injected with `set:html`. A page's own `<style>` is for what only that page has.

Helpers:

| Helper | Where | Use |
|---|---|---|
| `useI18n`, `withText`, `languageLinks` | `src/i18n` | Messages, joining structure with words, the language menu |
| `faqPage`, `siteGraph` | `src/lib/schema.ts` | schema.org data. A page with questions passes `schema={[faqPage(faq)]}` to `Base` |
| `getGithub`, `getLatestRelease`, `compact` | `src/data/github.ts` | Build-time GitHub numbers |

A detail page is: `PageHero`, three to six `Section`s with at least two `Figure`s, `NextPages`, `CtaBand`.

## Motion

All scroll motion comes from `src/scripts/motion.ts` and is declared in markup:

| Attribute | Effect |
|---|---|
| `data-fill` | Words light up as the paragraph crosses the viewport. One per page, on the sentence that matters most. |
| `data-zoom` | Media grows from 86% to full size as it enters. `Figure` does this by default. |
| `data-parallax="0.15"` | The element drifts against the scroll. |
| `data-reveal` / `data-reveal="children"` | Settles in once. Use on grids, not on every section. |
| `data-count="459"` | Counts up once. |
| `data-draw` | On an inline SVG, strokes draw themselves with the scroll. |
| `data-focus-list` | Children get `data-state="ahead"`, `"active"` or `"past"` as they cross the reading line. Style the states in the page (the security ladder does). Use it for a sequence the reader moves through, one per page. |

Motion is scrubbed to the scroll position where possible, so it reads as the page responding to the reader and never plays on its own schedule. Everything is off under `prefers-reduced-motion`, and the content is complete without JavaScript. The pinned scene on the homepage (`Continuity.astro`) is the one big moment; do not add a second pin to the same page.

## Writing

The reader is a developer deciding whether to install something. Tell them what it does and what it costs them.

- Short. A section is a heading, one or two sentences, and something to look at. If a paragraph passes three sentences, it wants to be a list, a table or a diagram.
- Plain verbs, second person, active voice. A button says what it does.
- Claims come from the ai-memory repository. Numbers keep their caveats. Competitor numbers are labelled as the vendor's own.
- Say where the project is behind. The repository's own comparison does, and it is the most persuasive thing on the site.
- No em dashes or en dashes. No "not X, but Y" constructions. No three-item lists for rhythm. No closing one-liners that restate the section. No "seamless", "robust", "powerful", "unlock", "effortless", "key", "crucial", "landscape". No arrows or emoji in text.
- Say a thing fully in one place and link to it from the others. Canonical homes: throughput numbers on Architecture (and the operator table on Advanced), the "where it is behind" list on Compare, team setup commands on Install, the benchmark method on Research. Short limits that people must see before acting (team limits, open-internet warning) may repeat.
- Do not claim: multi-tenant or enterprise readiness, automatic cross-machine sync (it is one server that many machines reach), forensic deletion, endorsement by Google, Anthropic or anyone else.

## Languages

Every visible string lives in `src/i18n/locales/`, never in an `.astro` file, and CSS uses logical properties so Hebrew mirrors. See [i18n.md](i18n.md).

## Images

Diagrams and illustrations are generated, then checked by a person. See [images.md](images.md).
