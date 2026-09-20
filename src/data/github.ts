import snapshot from './github-snapshot.json';
// @ts-ignore plain JS module shared with scripts/
import { fetchGithub } from './github-fetch.mjs';

export type Github = typeof snapshot;
let cached: Promise<Github> | undefined;

/** Live numbers at build time; the committed snapshot if GitHub can't be reached. */
export function getGithub(): Promise<Github> {
  cached ??= fetchGithub().catch((err: Error) => {
    console.warn(`[github] using snapshot from ${snapshot.fetchedAt}: ${err.message}`);
    return snapshot;
  });
  return cached;
}

/** The newest stable release, or the newest of any kind if every release is a prerelease. */
export async function getLatestRelease() {
  const gh = await getGithub();
  return gh.releases.find((r) => !r.prerelease) ?? gh.releases[0];
}

export { compact } from './format';
