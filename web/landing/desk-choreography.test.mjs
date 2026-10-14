import test from 'node:test';
import assert from 'node:assert/strict';
import { notebookState } from './desk-choreography.js';

test('notebook starts closed, stays open for reading, and ends closed with pen on cover', () => {
  assert.deepEqual(notebookState({ phase: 'entry' }), { open: 0, penAway: 0, completed: false });
  assert.equal(notebookState({ phase: 'handoff', local: .55 }).open, 0);
  assert.equal(notebookState({ phase: 'handoff', local: 1 }).open, 1);
  assert.equal(notebookState({ phase: 'desk', local: .5 }).open, 1);
  assert.deepEqual(notebookState({ phase: 'exit', local: 1 }), { open: 0, penAway: 0, completed: true });
});
test('pen clears before opening and returns only after closing', () => {
  assert.equal(notebookState({ phase: 'handoff', local: .55 }).penAway, 1);
  const closing = notebookState({ phase: 'exit', local: .65 });
  assert.equal(closing.open, 0); assert.equal(closing.penAway, 1);
});
test('reversing every phase reproduces exactly the same notebook geometry', () => {
  for (const phase of ['entry', 'method', 'handoff', 'desk', 'exit']) {
    const forward = Array.from({ length: 101 }, (_, i) => notebookState({ phase, local: i / 100 }));
    for (let i = 100; i >= 0; i--) assert.deepEqual(notebookState({ phase, local: i / 100 }), forward[i]);
  }
});
