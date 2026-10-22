import assert from 'node:assert/strict';
import test from 'node:test';
import { fetchGithub, REPO } from '../src/data/github-fetch.mjs';

const release = (tag, prerelease = false, draft = false) => ({
  tag_name: `v${tag}`, name: tag, prerelease, draft,
  published_at: '2026-10-20T00:00:00Z', html_url: `https://example.test/${tag}`, assets: [],
});
const changelog = (...versions) => versions.map((v) => `## [${v}] - 2026-10-20\n### Fixed\n- Fix in ${v}\n`).join('\n');

// Exercise the real collector without GitHub credentials or network requests.
function github(t, releases, files) {
  const requests = [];
  t.mock.method(globalThis, 'fetch', async (input) => {
    const url = new URL(input);
    if (url.hostname === 'raw.githubusercontent.com') {
      const path = url.pathname.slice(`/${REPO}/`.length);
      requests.push(path);
      return new Response(files[path] ?? '', { status: path in files ? 200 : 404 });
    }
    assert.equal(url.origin, 'https://api.github.com');
    if (url.pathname === `/repos/${REPO}`) return Response.json({ stargazers_count: 5, forks_count: 2, open_issues_count: 1 });
    if (url.pathname === `/repos/${REPO}/releases`) return Response.json(releases);
    if (url.pathname === '/search/issues') return Response.json({ total_count: 2 });
    if (url.pathname === `/repos/${REPO}/contributors` || url.pathname === `/repos/${REPO}/commits`) return Response.json([]);
    throw new Error(`Unexpected request: ${url}`);
  });
  return requests;
}

test('reads the newest stable tag even when a newer prerelease exists', async (t) => {
  const requests = github(t, [release('3.2.0-rc.1', true), release('3.1.0')], {
    'v3.2.0-rc.1/CHANGELOG.md': changelog('3.2.0-rc.1', '3.1.0'),
    'v3.1.0/CHANGELOG.md': changelog('3.1.0'),
  });
  const data = await fetchGithub();
  assert.equal(requests[0], 'v3.1.0/CHANGELOG.md');
  assert.deepEqual(data.changelog.map((e) => e.version), ['3.1.0']);
  // Keep preview metadata available to consumers; only the stable changelog is selected.
  assert.equal(data.releases[0].prerelease, true);
});

test('filters preview and unreleased entries when a missing stable file falls back to main', async (t) => {
  const requests = github(t, [release('3.2.0-rc.1', true), release('3.1.0')], {
    'main/CHANGELOG.md': changelog('Unreleased', '3.2.0-rc.1', '3.2.0', '3.1.0'),
  });
  const data = await fetchGithub();
  assert.deepEqual(requests.slice(0, 2), ['v3.1.0/CHANGELOG.md', 'main/CHANGELOG.md']);
  assert.deepEqual(data.changelog.map((e) => e.version), ['3.1.0']);
});

test('keeps the preview fallback when there are no stable releases', async (t) => {
  const requests = github(t, [release('4.0.0-draft', false, true), release('3.2.0-rc.1', true)], {
    'v3.2.0-rc.1/CHANGELOG.md': changelog('3.2.0-rc.1'),
  });
  const data = await fetchGithub();
  assert.equal(requests[0], 'v3.2.0-rc.1/CHANGELOG.md');
  assert.deepEqual(data.changelog.map((e) => e.version), ['3.2.0-rc.1']);
  assert.equal(data.releases.length, 1);
});

test('retains stable entries from archived changelogs at the selected release tag', async (t) => {
  const requests = github(t, [release('3.1.0'), release('2.6.5'), release('1.9.0')], {
    'v3.1.0/CHANGELOG.md': changelog('3.1.0'),
    'v3.1.0/docs/changelog/2.x.md': changelog('2.6.5'),
    'v3.1.0/docs/changelog/1.x.md': changelog('1.9.0'),
  });
  const data = await fetchGithub();
  assert.deepEqual(data.changelog.map((e) => [e.version, e.file]), [
    ['3.1.0', 'CHANGELOG.md'], ['2.6.5', 'docs/changelog/2.x.md'], ['1.9.0', 'docs/changelog/1.x.md'],
  ]);
  assert.ok(requests.every((path) => path.startsWith('v3.1.0/')));
});
