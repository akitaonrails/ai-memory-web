// Copy buttons on code blocks.
document.addEventListener('click', async (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-copy]');
  if (!btn) return;
  const text = btn.closest('[data-code]')?.querySelector('pre')?.innerText ?? '';
  await navigator.clipboard.writeText(text.replace(/^\$ /gm, ''));
  const label = btn.querySelector('[data-copy-label]');
  if (!label) return;
  const idle = label.textContent;
  label.textContent = (label as HTMLElement).dataset.copied ?? idle;
  setTimeout(() => (label.textContent = idle), 1600);
});
