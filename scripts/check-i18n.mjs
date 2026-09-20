// Checks every translation catalog against the English one.
//   node scripts/check-i18n.mjs            all locales
//   node scripts/check-i18n.mjs pt-br ja   only these
// Errors (exit 1): a key English does not have, a different array length, a {placeholder} or HTML tag that
// does not match, changed <code> contents, invalid JSON, and STALE translations: the English text changed after
// the translation was written. Each language keeps <locale>/.source.json, a fingerprint of the English string every
// translation was made from. After updating the translations, record the new fingerprints:
//   node scripts/check-i18n.mjs --stamp            (all locales)   or   --stamp pt-br ja
// Stamp only what you really re-translated. Stamping without translating hides the problem this check exists to catch.
// Warnings: keys not translated yet (the site shows English for those) and values identical to English.
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const root = new URL('../src/i18n/locales/', import.meta.url);
const stamp = process.argv.includes('--stamp');
const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const fingerprint = (text) => createHash('sha1').update(text).digest('hex').slice(0, 10);
const locales = readdirSync(root).filter((l) => l !== 'en' && (!only.length || only.includes(l)));
const namespaces = readdirSync(new URL('en/', root)).filter((f) => f.endsWith('.json'));

const flat = (node, prefix = '', out = {}) => {
  if (typeof node === 'string') out[prefix] = node;
  else if (Array.isArray(node)) { out[`${prefix}.#`] = node.length; node.forEach((v, i) => flat(v, `${prefix}.${i}`, out)); }
  else for (const [k, v] of Object.entries(node)) flat(v, prefix ? `${prefix}.${k}` : k, out);
  return out;
};
const bag = (s, re) => [...s.matchAll(re)].map((m) => m[0]).sort().join(' ');
const placeholders = (s) => bag(s, /\{\w+\}/g);
const tags = (s) => bag(s.replace(/\s(href|class)="[^"]*"/g, (m) => m), /<\/?[a-z][^>]*>/gi);
const code = (s) => bag(s, /<code[^>]*>[\s\S]*?<\/code>/gi);
// Strings that are legitimately the same in every language: commands, paths, names, numbers.
const untranslatable = (s) => !/[a-z]{4,}\s+[a-z]{3,}/i.test(s.replace(/<code[^>]*>[\s\S]*?<\/code>/gi, '')) || /^[>~$●✓✗?|]/.test(s) || /^[\w./@:+-]+$/.test(s);

let errors = 0, warnings = 0;
for (const locale of locales) {
  let missing = 0, same = 0, total = 0, stale = 0;
  const sourcePath = new URL(`${locale}/.source.json`, root);
  const recorded = existsSync(sourcePath) ? JSON.parse(readFileSync(sourcePath, 'utf8')) : {};
  const current = {};
  for (const file of namespaces) {
    const en = flat(JSON.parse(readFileSync(new URL(`en/${file}`, root), 'utf8')));
    const path = new URL(`${locale}/${file}`, root);
    if (!existsSync(path)) { console.log(`warn  ${locale}/${file}: file missing, whole namespace falls back to English`); warnings++; const n = Object.values(en).filter((v) => typeof v === 'string').length; missing += n; total += n; continue; }
    let tr;
    try { tr = flat(JSON.parse(readFileSync(path, 'utf8'))); } catch (e) { console.log(`ERROR ${locale}/${file}: ${e.message}`); errors++; continue; }
    const err = (key, msg) => { console.log(`ERROR ${locale}/${file} ${key}: ${msg}`); errors++; };
    for (const key of Object.keys(tr)) if (!(key in en)) err(key, 'key does not exist in English');
    for (const [key, source] of Object.entries(en)) {
      if (typeof source === 'number') { if (key in tr && tr[key] !== source) err(key, `array has ${tr[key]} items, English has ${source}`); continue; }
      total++;
      const target = tr[key];
      if (target === undefined || target === '') { missing++; continue; }
      const id = `${file.replace('.json', '')}:${key}`;
      current[id] = fingerprint(source);
      if (!stamp && recorded[id] && recorded[id] !== current[id]) { stale++; err(key, `STALE: English changed since this was translated. Now: "${source.slice(0, 90)}"`); }
      if (placeholders(source) !== placeholders(target)) err(key, `placeholders differ: "${placeholders(source)}" vs "${placeholders(target)}"`);
      if (tags(source) !== tags(target)) err(key, 'HTML tags differ from English');
      if (code(source) !== code(target)) err(key, '<code> contents must stay exactly as in English');
      if (target === source && !untranslatable(source)) same++;
    }
  }
  if (missing) warnings++;
  if (stamp) writeFileSync(sourcePath, JSON.stringify(current, null, 0).replace(/","/g, '",\n"') + '\n');
  console.log(`${locale}: ${total - missing}/${total} translated${missing ? `, ${missing} falling back to English` : ''}${same ? `, ${same} identical to English (check they are meant to be)` : ''}${stale ? `, ${stale} STALE` : ''}${stamp ? ' (stamped)' : ''}`);
}
console.log(errors ? `\n${errors} error(s)` : '\nno errors');
process.exit(errors ? 1 : 0);
