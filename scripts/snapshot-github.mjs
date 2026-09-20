// Refreshes the committed fallback used when the GitHub API is unreachable during a build.
import { writeFileSync } from 'node:fs';
import { fetchGithub } from '../src/data/github-fetch.mjs';

const data = await fetchGithub();
writeFileSync(new URL('../src/data/github-snapshot.json', import.meta.url), JSON.stringify(data, null, 2) + '\n');
console.log(`snapshot: ${data.stars} stars, ${data.contributors} contributors, ${data.mergedPRs} merged PRs, latest ${data.releases[0]?.tag}`);
