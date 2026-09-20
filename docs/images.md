# Diagrams and illustrations

The diagrams are generated with Google's Gemini image model (`gemini-3-pro-image`), then checked by eye. A generated diagram can misspell a label or draw something the product does not do, so nothing ships unseen.

## Make or redo one

```bash
export GEMINI_API_KEY=...          # https://aistudio.google.com/apikey
$EDITOR scripts/prompts/security-ladder.txt
node scripts/gen-image.mjs security-ladder               # 16:9
node scripts/gen-image.mjs security-ladder --aspect 4:3  # also 1:1, 21:9, 3:2
```

The result is `src/assets/img/gen/security-ladder.webp`, 1920 px wide. Import it in a page and show it with `Figure`. Astro produces the responsive sizes at build time.

Every request gets two things added:

- `scripts/prompts/_style.txt`, the art direction: dark indigo ground, the green to rose spectrum running left to right, amber for anything that moves, short off-white labels. Change the look of the whole set there.
- The logo, as a style reference. Pass `--no-ref` to leave it out.

## Writing a prompt that works

- Describe the layout and the objects. Leave style to `_style.txt`.
- Put every label in double quotes and keep them to one to three words. Eight labels is about the limit before spelling slips.
- Say which way it reads: "left to right", "bottom to top".
- State the facts the picture must get right ("the dashed arrows are optional paths").

## Check before you commit

1. Every label is spelled correctly and no invented text appears.
2. The picture says nothing untrue about the product.
3. The ground is the dark indigo. It has to sit inside the `Figure` frame in both themes.
4. It is still readable at phone width.
5. The `alt` text says what the diagram says, in a sentence.

If it fails, change the prompt and run it again. If it fails three times, remove labels. The prompts are committed so any image can be reproduced or restyled later.

Generation costs a few cents per image and is not part of the build. Netlify and GitHub Actions never need the key.
