# Logo files

| File | What it is |
|---|---|
| `logo-hd-1761.png` | The master: 1761x1761, transparent background. Upscaled from the original with Gemini (`gemini-3-pro-image`), asked to reproduce the same artwork at higher fidelity, then cut out from its black ground. Use this for the GitHub README, slides or print. |
| `logo-original-768.png` | The original 768x768 logo, kept for reference. |
| `../../src/assets/img/logo.png` | What the site uses: the master at 1600px. Astro generates the sizes each screen needs. |

The favicon (`public/favicon.png`) and the share card (`src/assets/img/og.png`) are made from the site logo with ImageMagick; the commands are in the git history of this folder's commit.

An SVG version was considered and rejected: the artwork is painterly, with glows and gradients, and a vector trace would be either very large or visibly flattened.
