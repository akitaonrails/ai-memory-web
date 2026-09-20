// Generates a site illustration with Gemini and stores it as a 1920px WebP.
// Usage: GEMINI_API_KEY=... node scripts/gen-image.mjs <name> [--aspect 16:9] [--model gemini-3-pro-image] [--no-ref]
// The prompt is read from scripts/prompts/<name>.txt; scripts/prompts/_style.txt is appended to every prompt,
// and the project logo is sent as a style reference so the whole set stays in one visual family.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const [name, ...rest] = process.argv.slice(2);
const opt = (flag, fallback) => (rest.includes(flag) ? rest[rest.indexOf(flag) + 1] : fallback);
const aspect = opt('--aspect', '16:9');
const model = opt('--model', 'gemini-3-pro-image');
const root = new URL('..', import.meta.url).pathname;
const prompt = `${readFileSync(`${root}scripts/prompts/${name}.txt`, 'utf8').trim()}\n\n${readFileSync(`${root}scripts/prompts/_style.txt`, 'utf8').trim()}`;

const parts = [{ text: prompt }];
if (!rest.includes('--no-ref')) {
  parts.push({ inlineData: { mimeType: 'image/png', data: readFileSync(`${root}src/assets/img/logo.png`).toString('base64') } });
}

const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
  body: JSON.stringify({
    contents: [{ parts }],
    generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: aspect, imageSize: '2K' } },
  }),
});
const json = await res.json();
const img = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)?.inlineData;
if (!img) { console.error(JSON.stringify(json).slice(0, 800)); process.exit(1); }

const tmp = `${root}src/assets/img/gen/${name}.src.png`;
const out = `${root}src/assets/img/gen/${name}.webp`;
writeFileSync(tmp, Buffer.from(img.data, 'base64'));
execFileSync('magick', [tmp, '-resize', '1920x>', '-quality', '88', out]);
execFileSync('rm', [tmp]);
console.log(out);
