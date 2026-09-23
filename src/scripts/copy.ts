// Copy buttons on code blocks.
document.addEventListener('click', async (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-copy]');
  if (!btn) return;
  const text = (btn.closest('[data-code]')?.querySelector('pre')?.innerText ?? '').replace(/^\$ /gm, '');
  let ok = false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      ok = true;
    }
  } catch {}
  if (!ok) {
    try {
      const area = document.createElement('textarea');
      area.value = text;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      ok = document.execCommand('copy');
      document.body.removeChild(area);
    } catch {}
  }
  if (!ok) return;
  const label = btn.querySelector('[data-copy-label]');
  if (!label) return;
  const idle = label.textContent;
  label.textContent = (label as HTMLElement).dataset.copied ?? idle;
  setTimeout(() => (label.textContent = idle), 1600);
});
