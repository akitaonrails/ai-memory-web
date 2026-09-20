// Makes a translated copy of a generated diagram by EDITING the English original, so the artwork stays the same
// and only the labels change.
//   GEMINI_API_KEY=... node scripts/localize-image.mjs <name> <locale> [--model gemini-3-pro-image]
//   GEMINI_API_KEY=... node scripts/localize-image.mjs --all <locale>      every image that has labels
// Labels come from src/i18n/locales/en/images.json and src/i18n/locales/<locale>/images.json.
// Output: src/assets/img/gen/<locale>/<name>.webp. The Figure component picks it up by itself.
// ALWAYS look at the result: check every label against images.json before committing it. See docs/i18n.md.
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const model = args.includes('--model') ? args[args.indexOf('--model') + 1] : 'gemini-3-pro-image';
const all = args.includes('--all');
const [first, second] = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--model');
const locale = all ? first : second;
const root = new URL('..', import.meta.url).pathname;
const languageName = JSON.parse(readFileSync(`${root}src/i18n/languages.json`, 'utf8'))[locale]?.english ?? locale;

const en = JSON.parse(readFileSync(`${root}src/i18n/locales/en/images.json`, 'utf8'));
const tr = JSON.parse(readFileSync(`${root}src/i18n/locales/${locale}/images.json`, 'utf8'));

async function localize(name) {
  const pairs = Object.keys(en[name] ?? {}).map((k) => [k, tr[name]?.[k]]).filter(([k, v]) => v && v !== k);
  if (!pairs.length) { console.log(`${name}: nothing to translate for ${locale}`); return; }
  const source = `${root}src/assets/img/gen/${name}.webp`;
  const png = `${root}src/assets/img/gen/.${name}.${locale}.src.png`;
  execFileSync('magick', [source, png]);

  const prompt = `Edit this diagram: translate its text labels into ${languageName}. Replace exactly these labels, and nothing else:
${pairs.map(([a, b]) => `- "${a}" becomes "${b}"`).join('\n')}

Rules:
- Every other pixel stays the same: same layout, shapes, icons, colors, glow, background and image size. Do not redraw, move or restyle anything.
- Each new label sits where the old one was, in the same color, weight and approximate size, in a clean sans-serif that supports ${languageName}. Shrink the text slightly if the translation is longer, so it never overlaps a shape or gets cut off.
- Copy the translated text exactly, character by character, including accents and punctuation. Do not add, drop or change any character.
- Leave every label that is not in the list exactly as it is (product names, file names, commands, numbers).
${locale === 'he' ? '- Hebrew is written right to left. Render each Hebrew label as correct right-to-left text. The diagram itself keeps its left-to-right flow.\n' : ''}${locale === 'ja' ? '- Use natural horizontal Japanese typesetting with a Japanese gothic (sans-serif) face.\n' : ''}${locale === 'ko' ? '- Use horizontal Korean typesetting in a clean Korean gothic (sans-serif) face, with correctly composed Hangul syllable blocks.\n' : ''}- No watermark, no border, no extra text.`;

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: 'image/png', data: readFileSync(png).toString('base64') } }] }],
      generationConfig: { responseModalities: ['IMAGE'], imageConfig: { imageSize: '2K' } },
    }),
  });
  rmSync(png);
  const json = await res.json();
  const img = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)?.inlineData;
  if (!img) { console.error(`${name}: ${JSON.stringify(json).slice(0, 500)}`); process.exitCode = 1; return; }

  const dir = `${root}src/assets/img/gen/${locale}`;
  mkdirSync(dir, { recursive: true });
  const tmp = `${dir}/.${name}.png`;
  writeFileSync(tmp, Buffer.from(img.data, 'base64'));
  // Same pixel size as the original, so the layout never shifts between languages.
  const size = execFileSync('magick', ['identify', '-format', '%wx%h', source]).toString();
  execFileSync('magick', [tmp, '-resize', `${size}!`, '-quality', '88', `${dir}/${name}.webp`]);
  rmSync(tmp);
  console.log(`${dir}/${name}.webp`);
}

const names = all ? Object.keys(en) : [first];
for (const name of names) {
  if (!existsSync(`${root}src/assets/img/gen/${name}.webp`)) { console.error(`no such image: ${name}`); process.exitCode = 1; continue; }
  await localize(name);
}
