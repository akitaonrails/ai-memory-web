// Theme follows the system until the visitor picks one; "system" clears the choice.
const root = document.documentElement;
const media = matchMedia('(prefers-color-scheme: dark)');
const saved = () => { try { return localStorage.getItem('theme'); } catch { return null; } };

function apply(choice: string | null) {
  root.dataset.theme = choice === 'light' || choice === 'dark' ? choice : media.matches ? 'dark' : 'light';
  document.querySelectorAll<HTMLElement>('[data-theme-set]').forEach((el) =>
    el.setAttribute('aria-pressed', String((el.dataset.themeSet ?? 'system') === (choice ?? 'system'))),
  );
}

document.addEventListener('click', (e) => {
  const el = (e.target as HTMLElement).closest<HTMLElement>('[data-theme-set],[data-theme-toggle]');
  if (!el) return;
  const choice = el.dataset.themeSet ?? (root.dataset.theme === 'dark' ? 'light' : 'dark');
  try { choice === 'system' ? localStorage.removeItem('theme') : localStorage.setItem('theme', choice); } catch {}
  apply(choice === 'system' ? null : choice);
});
media.addEventListener('change', () => { if (!saved()) apply(null); });
apply(saved());
