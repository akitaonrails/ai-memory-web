# Google Analytics

The site supports Google Analytics 4. It is off until you set one build variable, `PUBLIC_GA_ID`. Without it, no Google script is loaded and no consent notice appears. That is also why local development and forks never send data to your property.

## Turn it on

1. In https://analytics.google.com: Admin, Create, Property. Name it `aimemory.io`. Use a new property, separate from your blog, so the numbers do not mix.
2. Add a data stream: Web, URL `https://aimemory.io`. Leave "Enhanced measurement" on. It records scrolls, outbound clicks and file downloads for you.
3. Copy the Measurement ID. It looks like `G-XXXXXXXXXX`.
4. Give it to the build:
   - **Netlify builds the site (mode A):** Project configuration, Environment variables, Add a variable. Key `PUBLIC_GA_ID`, value the ID, scope "Builds". Under deploy contexts, set it for Production only, so deploy previews do not count as traffic. It is not a secret. It is visible in the page source of any site that uses GA.
   - **GitHub Actions deploys (mode B):** repo Settings, Secrets and variables, Actions, the Variables tab, New repository variable `PUBLIC_GA_ID`. Or `gh variable set PUBLIC_GA_ID --body "G-XXXXXXXXXX"`.
5. Trigger a deploy. Open the site, accept the notice, and watch Reports, Realtime in GA. Your visit should show up within a minute.

To test locally:

```bash
PUBLIC_GA_ID=G-XXXXXXXXXX npm run build && npm run preview
```

Use a throwaway stream ID if you do not want your own visits in production data.

## What visitors see

A small notice at the bottom of the page asks once. The choice is kept in `localStorage` under `analytics-consent`, and the "Cookie settings" link in the footer brings the notice back.

| Visitor | What GA receives |
|---|---|
| Has not answered, or declined | Cookieless pings with no identifier. GA sets no cookies and uses the pings only for modelled totals. |
| Accepted | Normal GA4 measurement with first-party cookies. |
| Sends Global Privacy Control or Do Not Track | Treated as declined. The notice is not shown. |

This is Google's Consent Mode v2. `analytics_storage` starts as `denied` and changes only when someone accepts. `ad_storage`, `ad_user_data` and `ad_personalization` are always `denied`, because the site runs no ads. GDPR and LGPD both expect consent before analytics cookies are set, and this setup gives them that.

If you want the cookieless pings gone as well for people who decline, change `src/components/Analytics.astro` to load Google's script only after consent is granted.

Accepted visits will be a fraction of real traffic. Developers block analytics more than most audiences do, so read the numbers as trends. Netlify's own Analytics add-on is paid, runs on the server and uses no cookies, so it counts everyone if you ever need exact figures.

## Events

Besides page views and enhanced measurement, the site sends two events:

| Event | When | Parameters |
|---|---|---|
| `github_click` | A click on any link to the ai-memory repository | `link_url`, `link_text` |
| `copy_command` | A click on a code block's Copy button | `page_path`, `block` (the terminal's title) |

`copy_command` on `/install/` is the closest thing the site has to a conversion. In GA: Admin, Events, mark `copy_command` and `github_click` as key events. To see the parameters in reports, register `link_text` and `block` under Admin, Custom definitions.

## Where the code is

| File | What it does |
|---|---|
| `src/components/Analytics.astro` | The loader, consent defaults, the notice, and the two events |
| `src/layouts/Base.astro` | Includes the component on every page |
| `src/components/Footer.astro` | The "Cookie settings" link |
| `netlify.toml` | The Content Security Policy entries that let Google's script load and report |

If you move to Google Tag Manager or add another Google product, add the new hosts to the Content Security Policy in `netlify.toml`. Otherwise the browser blocks them and shows no visible error.
