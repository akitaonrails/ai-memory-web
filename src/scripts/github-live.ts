// Build-time numbers are already in the HTML. Refresh them in the browser at most once an hour.
import { compact } from '@/data/format';
const KEY = 'gh-live-v1';
const REPO = 'akitaonrails/ai-memory';

async function load(): Promise<Record<string, number> | null> {
  try {
    const hit = JSON.parse(sessionStorage.getItem(KEY) ?? 'null');
    if (hit && Date.now() - hit.at < 3600_000) return hit.data;
    const repo = await fetch(`https://api.github.com/repos/${REPO}`).then((r) => (r.ok ? r.json() : null));
    if (!repo) return null;
    const data = { stars: repo.stargazers_count, forks: repo.forks_count };
    sessionStorage.setItem(KEY, JSON.stringify({ at: Date.now(), data }));
    return data;
  } catch { return null; }
}

if (document.querySelector('[data-gh]')) {
  load().then((data) => {
    if (!data) return;
    document.querySelectorAll<HTMLElement>('[data-gh]').forEach((el) => {
      const n = data[el.dataset.gh!];
      if (typeof n === 'number') el.textContent = el.dataset.ghFormat === 'full' ? n.toLocaleString('en-US') : compact(n);
    });
  });
}
