# Brief: localize the diagrams for one language

Project: /mnt/data/Projects/ai-memory-web. Read the "Images with text" section of `docs/i18n.md` first.

For your locale, produce a translated copy of every diagram listed in `src/i18n/locales/en/images.json`, using the translations in `src/i18n/locales/<locale>/images.json`.

1. For each image name in `en/images.json`, run (GEMINI_API_KEY is already in the environment):
   `cd /mnt/data/Projects/ai-memory-web && node scripts/localize-image.mjs <name> <locale>`
   It takes 30 to 60 seconds and writes `src/assets/img/gen/<locale>/<name>.webp`. You may run up to 4 at a time in the background to save time. If it prints "nothing to translate", that image keeps the English original; move on.
2. LOOK at every result with the Read tool, next to the English original `src/assets/img/gen/<name>.webp`, and check it against `images.json`:
   - every translated label is present and spelled exactly, character by character (accents, Hebrew letters, kanji and kana);
   - labels that were not in the list are unchanged (product names, paths, commands);
   - nothing else in the drawing changed: same layout, icons, colors, dark indigo background; no label overlaps a shape or is cut off; no stray or duplicated text.
3. If a result fails, run it again (results vary between runs). Up to 3 tries per image. If a label is too long to fit, you may shorten that translation in `src/i18n/locales/<locale>/images.json` (keep the meaning, keep it natural) and try again. If it still fails after 3 tries, delete the bad file so that language falls back to the English diagram, and report it.
4. Do not touch anything else: no pages, no other catalogs, no English images, no `npm run build`.

Final report (under 150 words): how many images succeeded on which try, which ones fell back to English and why, and any label you shortened (old and new text).
