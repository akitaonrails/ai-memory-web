# Deploying to Netlify

There are two ways to get this site onto Netlify. The repository supports both, and you can switch later without changing any file.

| | A. Netlify's GitHub integration | B. GitHub Actions deploys |
|---|---|---|
| Who builds | Netlify, on every push | GitHub Actions, then uploads `dist/` |
| Setup | Pick the repo in Netlify's "new project" screen | Create a Netlify token and two GitHub secrets |
| Pull request previews | Automatic, including from forks | Only for branches of this repo |
| Build minutes | Count against your Netlify plan | Count against GitHub Actions (free for public repos) |
| Daily refresh of stars and changelog | A Netlify build hook, called by the workflow | The workflow rebuilds and deploys |

**Start with A.** It is the option Netlify offers when you create a project, and it needs no tokens. `netlify.toml` already tells Netlify the build command (`npm run build`), the output folder (`dist`) and the Node version, so the form fills itself in.

In both modes `.github/workflows/deploy.yml` runs on every push and pull request. It builds the site and runs the color contrast check. What else it does depends on which secrets exist:

| Secrets present | What the workflow does |
|---|---|
| none | CI only: build and contrast check |
| `NETLIFY_BUILD_HOOK` | CI, plus it asks Netlify to rebuild once a day (mode A) |
| `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID` | CI, then deploys production and PR previews itself (mode B) |

## Put the code on GitHub first

```bash
git add -A
git commit -m "Initial site"
gh repo create akitaonrails/aimemory.io --private --source=. --push
```

Public or private both work. The name is up to you.

## Mode A: Netlify's GitHub integration

1. Sign in at https://app.netlify.com, then Add new project, Import an existing project, GitHub.
2. Authorize the Netlify GitHub App when asked. Give it access to this one repository. You do not need to grant all repositories.
3. Pick the repo. Netlify reads `netlify.toml` and shows:
   - Branch to deploy: `main`
   - Build command: `npm run build`
   - Publish directory: `dist`

   Leave them as they are and click Deploy.
4. Optional: Project configuration, General, change the project name to something like `aimemory`. That gives you `aimemory.netlify.app` until the domain is live.

From now on, every push to `main` deploys, and every pull request gets a Deploy Preview with a comment from Netlify.

### Recommended: a GitHub token for the build

The build asks the GitHub API for stars, contributors, releases and the changelog. Netlify's build machines share IP addresses, so the anonymous limit of 60 requests an hour is often used up by someone else. When that happens the build still succeeds, using the numbers saved in `src/data/github-snapshot.json`, but they may be stale.

To make it reliable:

1. GitHub, your avatar, Settings, Developer settings, Personal access tokens, Fine-grained tokens, Generate new token.
2. Name it `aimemory.io build`. Repository access: "Public repositories (read-only)". No other permissions. Pick an expiry and put a reminder in your calendar.
3. Netlify, Project configuration, Environment variables, Add a variable. Key `GITHUB_TOKEN`, value the token, scope "Builds", and mark it as secret.

### Recommended: the daily refresh

1. Netlify, Project configuration, Build & deploy, Build hooks, Add build hook. Name `daily refresh`, branch `main`. Copy the URL.
2. GitHub, the repo, Settings, Secrets and variables, Actions, New repository secret. Name `NETLIFY_BUILD_HOOK`, value the URL. Or:

```bash
gh secret set NETLIFY_BUILD_HOOK --body "https://api.netlify.com/build_hooks/..."
```

The workflow calls it every day at 06:17 UTC. Anyone with that URL can trigger builds, which is why it is a secret.

## Mode B: GitHub Actions deploys

Use this if you want one build log, in GitHub, or if you run out of Netlify build minutes.

1. Create the Netlify project without linking the repo: Add new project, Deploy manually, and drop in a `dist/` folder from `npm run build`. If the project is already linked from mode A, go to Project configuration, Build & deploy, Continuous deployment, Build settings, and choose "Stop builds". Otherwise every push deploys twice.
2. Collect two values:

| Value | Where to find it |
|---|---|
| `NETLIFY_SITE_ID` | Project configuration, General, Project information, "Project ID". It looks like a UUID. |
| `NETLIFY_AUTH_TOKEN` | Your avatar, User settings, Applications, Personal access tokens, New access token. Name it `github-actions-aimemory`. Netlify shows it once. |

   The token can do anything your Netlify account can. Store it only in GitHub secrets.

3. Add both as repository secrets:

```bash
gh secret set NETLIFY_SITE_ID     --body "<project id>"
gh secret set NETLIFY_AUTH_TOKEN  --body "<token>"
```

4. Push to `main`, or open Actions, "Build and deploy", Run workflow.

You do not create `GITHUB_TOKEN` in this mode. GitHub provides it to every run and the workflow passes it to the build. Pull requests get a preview at `https://pr-<number>--<site>.netlify.app` and a comment with the link. Pull requests from forks build but do not deploy, because GitHub hides secrets from them.

## After the first deploy

Follow [domain-godaddy.md](domain-godaddy.md) to attach `aimemory.io`, then [seo.md](seo.md).

## Settings that live in the repo

`netlify.toml` holds everything Netlify needs, in both modes:

- the build command, publish directory and Node version
- cache headers (hashed files under `/_astro/` are cached for a year)
- security headers, including a Content Security Policy
- the `www` to bare domain redirect
- `/github`, a short link to the repository

If you add a third-party script, font or image host, add it to the Content Security Policy in `netlify.toml` or the browser will block it.

## When something fails

| Symptom | Cause |
|---|---|
| Build log says "using snapshot" | The GitHub API refused the request. The site still deploys with saved numbers. Add `GITHUB_TOKEN` (mode A), and run `npm run snapshot:github` locally now and then to refresh the saved ones. |
| Netlify build fails on the Node version | Something overrides `NODE_VERSION` in the Netlify UI. Remove it there; `netlify.toml` sets 22. |
| Two deploys per push | Both modes are on. Remove the `NETLIFY_AUTH_TOKEN` secret (to stay on A) or stop builds in Netlify (to stay on B). |
| `Unauthorized` from netlify-cli | The Netlify token expired or was revoked. Create a new one and update the secret. |
| `Project not found` | `NETLIFY_SITE_ID` is wrong. It is the Project ID, not the site name. |
| `check:colors` fails | A color token changed and a pairing fell below its contrast target. The output names the pair. |

## Deploying from your machine

Useful before the repo exists or when something upstream is down:

```bash
npm run build
NETLIFY_AUTH_TOKEN=... NETLIFY_SITE_ID=... npx netlify-cli deploy --dir=dist --prod --no-build
```
