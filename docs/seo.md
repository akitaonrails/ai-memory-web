# SEO

## What is already in place

| Item | Where |
|---|---|
| A unique `<title>` and meta description per page | the `title` and `description` props of `src/layouts/Base.astro` |
| Canonical URL on every page, always with a trailing slash | `Base.astro`, `trailingSlash: 'always'` in `astro.config.mjs` |
| Open Graph and Twitter card tags with a 1200x630 image | `Base.astro`, `src/assets/img/og.png` |
| Structured data (JSON-LD): WebSite, Person, SoftwareApplication with version, license and price 0, WebPage, BreadcrumbList | `Base.astro`. Pages add more through the `schema` prop: FAQPage on `/compare/`, HowTo on `/install/` |
| `sitemap-index.xml`, generated at build | `@astrojs/sitemap` |
| `robots.txt` that allows everything and names the sitemap | `public/robots.txt` |
| `llms.txt`, a plain-text map of the site for AI assistants | `src/pages/llms.txt.ts` |
| `www` redirects to the bare domain with a 301, so one host collects the links | `netlify.toml` |
| The 404 page is `noindex` | `src/pages/404.astro` |
| Static HTML, no client rendering. Content is readable without JavaScript | Astro |
| Fonts are self-hosted, images are responsive WebP with width and height set, hashed assets are cached for a year | `@fontsource`, `astro:assets`, `netlify.toml` |
| One `h1` per page, ordered headings, descriptive link text, `alt` on every diagram | page templates |
| Fresh content: the site rebuilds daily with the current release, changelog and GitHub numbers | `.github/workflows/deploy.yml` |

## What you have to do after launch

1. **Google Search Console.** Add `aimemory.io` as a Domain property. It gives you a TXT record to add where your DNS lives (Netlify DNS or GoDaddy, see [domain-godaddy.md](domain-godaddy.md)). Then submit `https://aimemory.io/sitemap-index.xml`.
2. **Bing Webmaster Tools.** Import the site from Search Console. Bing's index also feeds DuckDuckGo and ChatGPT search.
3. **Link to the site from places that already rank.** This matters more than anything on the page:
   - the GitHub repository's "Website" field and the top of its README
   - Docker Hub and the AUR package pages
   - your blog posts about ai-memory, in both languages
4. **Check the share card.** Paste the URL into https://www.opengraph.xyz or a private Slack or Discord message.
5. **Run Lighthouse** on the live URL (Chrome DevTools, Lighthouse tab, mobile). Performance, accessibility, best practices and SEO should all be above 90. If performance drops, look at image sizes first.

## When you add a page

- Give it a `title` under 60 characters and a `description` of 140 to 160 characters that says what the visitor gets. Both show up in search results.
- Add it to `nav` in `src/data/site.ts` so it is linked from every page and listed in `llms.txt`.
- Use words people search for in the `h1` and the first paragraph: "memory for Claude Code", "share context between coding agents", "Mem0 alternative", "self-hosted".
- Link to it from at least one other page with descriptive text.

## Ideas that would bring search traffic

- One page per agent ("ai-memory for Cursor", "ai-memory for Codex") with that agent's two commands and caveats. The data is already in `src/data/support.ts`.
- One page per alternative ("ai-memory vs Mem0"). The data is in `src/data/competitors.ts`, and `/compare/` already has an anchor per tool.
- The site is already in six languages (see [i18n.md](i18n.md)). Submit the sitemap once; it lists every language with `hreflang`.
