# The domain: aimemory.sh

The site is served by Netlify and reached at `https://aimemory.sh`. The DNS for the domain answers from Cloudflare with the proxy on, and `www.aimemory.sh` redirects to the apex (`netlify.toml`). The `.netlify.app` address redirects there too, so there is one public URL and one canonical.

`aimemory.io` was the first choice and never completed its transfer. It does not resolve; nothing on the site refers to it.

## What depends on Netlify's edge

The language redirects (`_redirects`, one rule per English page and language) and the `nf_lang` cookie are evaluated by Netlify, and the edge cache is keyed with `Netlify-Vary`. A cache in front of Netlify does not understand that header. Today Cloudflare passes the HTML through uncached (`cf-cache-status: DYNAMIC`), which is what the site needs. If a Cloudflare cache rule ever starts caching HTML, the redirects will leak between languages the way the edge bug in September 2026 did. Keep HTML uncached at Cloudflare, or turn the proxy off for the Netlify records.

## Check it

```bash
dig +short aimemory.sh
curl -sI https://aimemory.sh | grep -iE 'cf-cache-status|cache-status|x-nf-request-id'
curl -sI https://www.aimemory.sh | grep -i location          # https://aimemory.sh/
curl -sI https://aimemorybr.netlify.app | grep -i location   # https://aimemory.sh/
curl -s -o /dev/null -w '%{redirect_url}\n' -H 'Accept-Language: ko' https://aimemory.sh/install/   # /ko/install/
```

## After a domain change

`astro.config.mjs` (`site`), `src/data/site.ts` (`domain`), `public/robots.txt`, `netlify.toml` and the six `notfound.json` catalogs carry the domain. Canonical URLs, `hreflang`, the sitemap and Open Graph image URLs follow `site`. Google Analytics and Search Console are configured on Google's side and need the new URL added by hand ([analytics.md](analytics.md), [seo.md](seo.md)).
