# Color study

The palette comes from the logo and is built in OKLCH, a color space where equal numeric steps look like equal steps. That is what lets five different hues sit next to each other at the same visual weight, and what makes the light and dark themes mirror images instead of two separate designs.

Tokens live in `src/styles/global.css`. Run `npm run check:colors` after changing any of them.

## 1. What the logo contains

Sampling `logo.png` gives two groups.

| Where in the logo | Sampled | OKLCH hue |
|---|---|---|
| Neural network, far left | `#085636`, `#09594B` | 155 to 175 (green) |
| Network, toward the center | `#326A74`, `#0C5072` | 205 to 235 (teal) |
| Upper lobe | `#0A4273`, `#385C94` | 250 to 260 (azure) |
| Circuit lobe | `#52245C`, `#9D6397` | 300 to 325 (violet) |
| Swirl, far right | `#CC6C81`, `#DA9E8E` | 355 to 30 (rose) |
| Chip and arrows | `#CE5E24`, `#EF9631`, `#F3D02D` | 50 to 95 (amber) |
| Outline | `#1D2657` | 275 to 285 (indigo) |

The spectrum runs left to right in hue order, green to rose, covering about 200 degrees of the wheel. Amber sits outside that arc, opposite the azure and violet middle. In the logo it is used for exactly one thing: what moves through the memory. The site keeps that meaning.

## 2. Decisions

**Five brand hues at fixed steps.** 155, 205, 252, 300, 355. Steps of roughly 50 degrees are far enough apart to tell subjects apart in a nav menu and close enough to read as one gradient.

**One lightness and one chroma per role.** In a given theme, all five text-safe hues share a lightness (0.47 light, 0.83 dark). No hue looks heavier than its neighbours, which sRGB hex picking cannot guarantee: a "pure" yellow and a "pure" blue at the same HSL lightness differ enormously in perceived brightness. Chroma is tuned per hue only to stay inside the sRGB gamut.

**Three tiers per hue.**

| Tier | Token | Use | Text-safe |
|---|---|---|---|
| Ink | `--violet` | text, links, icons | yes, 4.5:1 or better on every ground |
| Soft | `--violet-soft` | fills behind that hue's content | ground only |
| Vivid | `--v-violet` | rules, dots, glows, the gradient | never for text |

Vivid is the same in both themes, because it is the logo's own color. Ink and soft flip with the theme.

**Tinted neutrals.** Every neutral carries the outline's indigo (hue 282 to 285) at low chroma. Dark ground is `oklch(0.155 0.035 282)`, light ground is `oklch(0.985 0.006 285)`. Pure grey or black next to a saturated spectrum looks dead, and warm cream would fight the cool arc of the logo.

**Amber is reserved.** `--amber` `oklch(0.81 0.16 75)` with `--on-amber` text is the primary button in both themes. It also marks the flow dots in the scroll scene and the "what you gain" bullets. Because amber is the complement of the spectrum's middle, a single amber button is the most visible thing on any page without being large.

**One hue per subject.** Agents are violet, machines azure, teams teal, the wiki green, security rose, action amber. The mapping is in `src/data/site.ts` and applied with `data-hue`. A visitor who learns that teal means "team" on the homepage finds the team page, its nav entry and its diagrams in teal.

**The gradient is interpolated in OKLCH.** `linear-gradient(90deg in oklch, ...)` keeps the midpoints saturated. The same stops in sRGB go muddy between green and violet.

## 3. Light and dark

The themes are mirrors: text lightness 0.21 on ground 0.985 in light, 0.955 on 0.155 in dark. Accent ink flips from 0.47 to 0.83. Terminals, generated diagrams and the CTA band stay on the dark ink ground in both themes, the way a terminal does on a real desktop. That also means every diagram is generated once.

The theme follows the operating system until the visitor picks one. The choice is stored in `localStorage`, and the footer has a "System" option that clears it. An inline script in the head sets the theme before first paint, so there is no flash.

## 4. Measured contrast

WCAG 2.x ratios, computed from the tokens by `scripts/check-contrast.mjs`. Targets: 7:1 for body text (AAA), 4.5:1 for accents and muted text (AA). The deploy workflow runs this check and fails if any pairing drops below target.

### light

| Foreground | Background | Ratio | Target | |
|---|---|---|---|---|
| `text` #15152c | `bg` #f9fafe | 17.07 | 7 | pass |
| `text` #15152c | `surface` #ffffff | 17.83 | 7 | pass |
| `text` #15152c | `tint` #f0f0fb | 15.75 | 7 | pass |
| `muted` #525369 | `bg` #f9fafe | 7.17 | 4.5 | pass |
| `muted` #525369 | `surface` #ffffff | 7.49 | 4.5 | pass |
| `muted` #525369 | `tint` #f0f0fb | 6.62 | 4.5 | pass |
| `green` #006f38 | `bg` #f9fafe | 6.13 | 4.5 | pass |
| `green` #006f38 | `surface` #ffffff | 6.41 | 4.5 | pass |
| `green` #006f38 | `green-soft` #daf7e3 | 5.61 | 4.5 | pass |
| `teal` #006973 | `bg` #f9fafe | 6.27 | 4.5 | pass |
| `teal` #006973 | `surface` #ffffff | 6.56 | 4.5 | pass |
| `teal` #006973 | `teal-soft` #d8f5f8 | 5.72 | 4.5 | pass |
| `azure` #005bab | `bg` #f9fafe | 6.58 | 4.5 | pass |
| `azure` #005bab | `surface` #ffffff | 6.88 | 4.5 | pass |
| `azure` #005bab | `azure-soft` #e1f0ff | 5.96 | 4.5 | pass |
| `violet` #6e34b3 | `bg` #f9fafe | 7.20 | 4.5 | pass |
| `violet` #6e34b3 | `surface` #ffffff | 7.52 | 4.5 | pass |
| `violet` #6e34b3 | `violet-soft` #f2eaff | 6.45 | 4.5 | pass |
| `rose` #9d1e60 | `bg` #f9fafe | 7.20 | 4.5 | pass |
| `rose` #9d1e60 | `surface` #ffffff | 7.52 | 4.5 | pass |
| `rose` #9d1e60 | `rose-soft` #ffe7ef | 6.42 | 4.5 | pass |
| `amber-ink` #854a00 | `bg` #f9fafe | 6.75 | 4.5 | pass |
| `amber-ink` #854a00 | `surface` #ffffff | 7.05 | 4.5 | pass |
| `amber-ink` #854a00 | `amber-soft` #ffecc9 | 6.08 | 4.5 | pass |
| `on-amber` #260f00 | `amber` #fcb02b | 9.88 | 7 | pass |
| `on-amber` #260f00 | `amber-hi` #ffcc4f | 12.21 | 7 | pass |
| `line` #d7d8e6 | `bg` #f9fafe | 1.36 | 1.2 | pass |

### dark

| Foreground | Background | Ratio | Target | |
|---|---|---|---|---|
| `text` #efeff8 | `bg` #0a0a1b | 17.17 | 7 | pass |
| `text` #efeff8 | `surface` #131328 | 15.94 | 7 | pass |
| `text` #efeff8 | `tint` #1d1d35 | 14.32 | 7 | pass |
| `muted` #a8a9be | `bg` #0a0a1b | 8.45 | 4.5 | pass |
| `muted` #a8a9be | `surface` #131328 | 7.85 | 4.5 | pass |
| `muted` #a8a9be | `tint` #1d1d35 | 7.05 | 4.5 | pass |
| `green` #61e599 | `bg` #0a0a1b | 12.34 | 4.5 | pass |
| `green` #61e599 | `surface` #131328 | 11.45 | 4.5 | pass |
| `green` #61e599 | `green-soft` #062f19 | 9.28 | 4.5 | pass |
| `teal` #61dce9 | `bg` #0a0a1b | 12.06 | 4.5 | pass |
| `teal` #61dce9 | `surface` #131328 | 11.20 | 4.5 | pass |
| `teal` #61dce9 | `teal-soft` #002d32 | 9.12 | 4.5 | pass |
| `azure` #9dccff | `bg` #0a0a1b | 11.66 | 4.5 | pass |
| `azure` #9dccff | `surface` #131328 | 10.82 | 4.5 | pass |
| `azure` #9dccff | `azure-soft` #072747 | 8.97 | 4.5 | pass |
| `violet` #d1b9ff | `bg` #0a0a1b | 11.28 | 4.5 | pass |
| `violet` #d1b9ff | `surface` #131328 | 10.47 | 4.5 | pass |
| `violet` #d1b9ff | `violet-soft` #2d1b47 | 8.90 | 4.5 | pass |
| `rose` #fcaccb | `bg` #0a0a1b | 11.12 | 4.5 | pass |
| `rose` #fcaccb | `surface` #131328 | 10.32 | 4.5 | pass |
| `rose` #fcaccb | `rose-soft` #401528 | 8.79 | 4.5 | pass |
| `amber-ink` #fabb41 | `bg` #0a0a1b | 11.44 | 4.5 | pass |
| `amber-ink` #fabb41 | `surface` #131328 | 10.62 | 4.5 | pass |
| `amber-ink` #fabb41 | `amber-soft` #332305 | 8.84 | 4.5 | pass |
| `on-amber` #260f00 | `amber` #fcb02b | 9.88 | 7 | pass |
| `on-amber` #260f00 | `amber-hi` #ffcc4f | 12.21 | 7 | pass |
| `line` #32324c | `bg` #0a0a1b | 1.59 | 1.2 | pass |

## 5. Generated images

The image prompts in `scripts/prompts/_style.txt` name the same hex values, the same left-to-right hue order and the same rule for amber, and the logo is attached to every request as a style reference. That is why the diagrams look like they belong to the logo.
