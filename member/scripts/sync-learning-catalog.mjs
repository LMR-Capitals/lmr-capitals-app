import { readFile, writeFile } from "node:fs/promises";
const source = JSON.parse(
  await readFile(
    new URL("../../design/handoff/terminology.json", import.meta.url),
    "utf8",
  ),
);
const terms = new Map(source.terms.map((t) => [t.id, t]));
const checkpoints = source.sections.map((s, i) => ({
  chapter: i + 1,
  questions: s.terms.slice(0, 2).map((id, q) => {
    const term = terms.get(id),
      choices = s.terms.slice(0, Math.min(4, s.terms.length));
    const shift = (i + q + 1) % choices.length;
    return {
      prompt: `Which LMR term matches “${term.gloss}”?`,
      options: [...choices.slice(shift), ...choices.slice(0, shift)].map(
        (key) => ({ id: key, label: terms.get(key).name }),
      ),
    };
  }),
}));
await writeFile(
  new URL("../learning-checkpoints.json", import.meta.url),
  JSON.stringify(checkpoints, null, 2) + "\n",
);
const quote = (s) => "'" + s.replaceAll("'", "''") + "'";
const rows = source.sections
  .map(
    (s, i) =>
      `(${i + 1},array[${s.terms.map(quote)}]::text[],array[${s.terms.slice(0, 2).map(quote)}]::text[])`,
  )
  .join(",\n");
const template = await readFile(
  new URL("./learning-schema.sql", import.meta.url),
  "utf8",
);
await writeFile(
  new URL("../../database/patches/inner-circle-learning.sql", import.meta.url),
  template.replace("-- CATALOG_ROWS", rows),
);
console.log(
  `Synced ${source.sections.length} chapters and their original reference checkpoints.`,
);
