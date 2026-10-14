// Pure scroll samples make opening, closing and pen placement reversible.
const smooth = value => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); };
export function notebookState({ phase, local = 0 }) {
  if (phase === 'handoff') return { open: smooth((local - .55) / .45), penAway: smooth(local / .55), completed: false };
  if (phase === 'desk') return { open: 1, penAway: 1, completed: false };
  if (phase === 'exit') return { open: 1 - smooth(local / .6), penAway: 1 - smooth((local - .65) / .35), completed: local >= .6 };
  return { open: 0, penAway: 0, completed: false };
}
