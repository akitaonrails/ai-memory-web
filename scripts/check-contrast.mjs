// Reads the color tokens straight out of src/styles/global.css and reports
// WCAG 2.x contrast for every pairing the site actually uses.
// Run: npm run check:colors   (exits 1 if any pairing misses its target)
import { readFileSync } from 'node:fs';
import { parse, wcagContrast, formatHex } from 'culori';

const css = readFileSync(new URL('../src/styles/global.css', import.meta.url), 'utf8');

function block(selector) {
  const out = {};
  const re = new RegExp(`${selector}\\s*\\{([^}]*)\\}`, 'g');
  for (const m of css.matchAll(re)) {
    for (const d of m[1].matchAll(/--([\w-]+):\s*(oklch\([^)]*\))/g)) out[d[1]] = d[2];
  }
  return out;
}

const root = block(':root');
const themes = { light: root, dark: { ...root, ...block("\\[data-theme='dark'\\]") } };
const hues = ['green', 'teal', 'azure', 'violet', 'rose', 'amber-ink'];

let failed = 0;
const md = process.argv.includes('--md');
for (const [name, t] of Object.entries(themes)) {
  const rows = [
    ['text', 'bg', 7], ['text', 'surface', 7], ['text', 'tint', 7],
    ['muted', 'bg', 4.5], ['muted', 'surface', 4.5], ['muted', 'tint', 4.5],
    ...hues.flatMap((h) => [[h, 'bg', 4.5], [h, 'surface', 4.5], [h, `${h.replace('-ink', '')}-soft`, 4.5]]),
    ['on-amber', 'amber', 7], ['on-amber', 'amber-hi', 7],
    ['line', 'bg', 1.2],
  ];
  console.log(md ? `\n### ${name}\n\n| Foreground | Background | Ratio | Target | |\n|---|---|---|---|---|` : `\n== ${name} ==`);
  for (const [fg, bg, target] of rows) {
    const ratio = wcagContrast(parse(t[fg]), parse(t[bg]));
    const ok = ratio >= target;
    if (!ok) failed++;
    const line = md
      ? `| \`${fg}\` ${formatHex(parse(t[fg]))} | \`${bg}\` ${formatHex(parse(t[bg]))} | ${ratio.toFixed(2)} | ${target} | ${ok ? 'pass' : '**FAIL**'} |`
      : `${ok ? 'ok  ' : 'FAIL'} ${ratio.toFixed(2).padStart(5)} (>=${target})  ${fg} on ${bg}`;
    console.log(line);
  }
}
process.exit(failed ? 1 : 0);
