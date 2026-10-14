import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { learningState } from "../learning-model.mjs";
const reference = JSON.parse(
  await readFile(
    new URL("../../design/handoff/terminology.json", import.meta.url),
    "utf8",
  ),
);
const checkpoints = JSON.parse(
  await readFile(
    new URL("../learning-checkpoints.json", import.meta.url),
    "utf8",
  ),
);
const chapters = reference.sections;
let state = learningState(chapters, []);
assert.equal(state.current, 0);
assert.equal(state.percent, 0);
assert.equal(state.chapters.filter((c) => c.unlocked).length, 1);
state = learningState(chapters, [
  { chapter_no: 2, completed_at: "invalid-out-of-order" },
  { chapter_no: 1, reviewed_terms: ["mm-rates", "bogus"] },
]);
assert.equal(state.completed, 0);
assert.equal(state.chapters[0].reviewed.length, 1);
assert.equal(state.chapters[1].unlocked, false);
state = learningState(chapters, [
  {
    chapter_no: 1,
    completed_at: "2026-10-05",
    reviewed_terms: chapters[0].terms,
  },
]);
assert.equal(state.current, 1);
assert.equal(state.completed, 1);
assert.equal(state.percent, 10);
assert.equal(state.chapters[1].unlocked, true);
assert.equal(state.chapters[2].unlocked, false);
state = learningState(
  chapters,
  chapters.map((c, i) => ({
    chapter_no: i + 1,
    completed_at: "2026-10-05",
    reviewed_terms: c.terms,
  })),
);
assert.equal(state.percent, 100);
assert.equal(state.current, 9);
assert.equal(state.badge, "Chain scholar");
for (const [i, checkpoint] of checkpoints.entries()) {
  assert.equal(checkpoint.chapter, i + 1);
  assert.equal(checkpoint.questions.length, 2);
  for (const [q, question] of checkpoint.questions.entries()) {
    assert.ok(question.options.some((o) => o.id === chapters[i].terms[q]));
    assert.equal(
      new Set(question.options.map((o) => o.id)).size,
      question.options.length,
    );
  }
}
console.log(
  "PASS: sequential chapter unlocks, study counts, all-chapters completion and original reference checkpoint consistency.",
);
