// Fetches the public numbers the site shows. Used at build time (src/data/github.ts)
// and by `npm run snapshot:github`. Set GITHUB_TOKEN to lift the 60 req/h anonymous limit.
export const REPO = 'akitaonrails/ai-memory';
const API = 'https://api.github.com';

async function gh(path) {
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'aimemory.io-build' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(`${API}${path}`, { headers, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res;
}

// GitHub has no "count" endpoint; ask for one item per page and read the last page number.
async function countVia(path) {
  const res = await gh(`${path}${path.includes('?') ? '&' : '?'}per_page=1`);
  const last = res.headers.get('link')?.match(/[?&]page=(\d+)>; rel="last"/);
  return last ? Number(last[1]) : (await res.json()).length;
}

const searchCount = async (q) =>
  (await (await gh(`/search/issues?per_page=1&q=${encodeURIComponent(`repo:${REPO} ${q}`)}`)).json()).total_count;

// CHANGELOG.md follows keepachangelog.com: "## [2.3.1] - 2026-09-17" then "### Added|Changed|Fixed" lists.
export function parseChangelog(md, limit = 12) {
  const entries = [];
  for (const chunk of md.split(/^## \[/m).slice(1)) {
    const head = chunk.match(/^([^\]]+)\](?: - (\d{4}-\d{2}-\d{2}))?/);
    if (!head || head[1].toLowerCase() === 'unreleased') continue;
    entries.push({ version: head[1], date: head[2] ?? null, body: chunk.slice(chunk.indexOf('\n') + 1).trim() });
    if (entries.length >= limit) break;
  }
  return entries;
}

export async function fetchGithub() {
  const [repo, contributors, commits, mergedPRs, closedIssues, people, releases] = await Promise.all([
    gh(`/repos/${REPO}`).then((r) => r.json()),
    countVia(`/repos/${REPO}/contributors`),
    countVia(`/repos/${REPO}/commits`),
    searchCount('is:pr is:merged'),
    searchCount('is:issue is:closed'),
    gh(`/repos/${REPO}/contributors?per_page=60`).then((r) => r.json()),
    gh(`/repos/${REPO}/releases?per_page=15`).then((r) => r.json()),
  ]);
  // The changelog as released: read it at the newest release tag, because a release can be cut from a release
  // branch before that branch is merged into main. Falls back to main.
  const newestTag = releases.find((r) => !r.draft)?.tag_name;
  const rawChangelog = (ref) => fetch(`https://raw.githubusercontent.com/${REPO}/${ref}/CHANGELOG.md`, { signal: AbortSignal.timeout(15000) }).then((r) => (r.ok ? r.text() : ''));
  const changelogMd = (newestTag && (await rawChangelog(newestTag))) || (await rawChangelog('main'));
  const published = new Set(releases.map((r) => r.tag_name.replace(/^v/, '')));
  return {
    fetchedAt: new Date().toISOString(),
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    openIssues: repo.open_issues_count,
    license: repo.license?.spdx_id ?? 'MIT',
    contributors,
    commits,
    mergedPRs,
    closedIssues,
    // Only versions that have a published release; main may already describe the next one.
    changelog: parseChangelog(changelogMd, 40).filter((e) => published.has(e.version)).slice(0, 12),
    people: people
      .filter((p) => p.type === 'User')
      .map((p) => ({ login: p.login, avatar: p.avatar_url, url: p.html_url, contributions: p.contributions })),
    releases: releases
      .filter((r) => !r.draft)
      .map((r) => ({
        tag: r.tag_name,
        name: r.name || r.tag_name,
        date: r.published_at,
        url: r.html_url,
        prerelease: r.prerelease,
        assets: r.assets.map((a) => ({ name: a.name, url: a.browser_download_url, size: a.size, downloads: a.download_count })),
      })),
  };
}
