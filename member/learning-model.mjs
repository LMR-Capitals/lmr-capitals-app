export function learningState(chapters, rows = []) {
  const valid = new Map(rows.map((row) => [row.chapter_no, row]));
  let completed = 0;
  while (completed < chapters.length && valid.get(completed + 1)?.completed_at)
    completed++;
  const current = Math.min(completed, chapters.length - 1);
  const states = chapters.map((chapter, index) => {
    const row = valid.get(index + 1);
    const reviewed = chapter.terms.filter((id) =>
      row?.reviewed_terms?.includes(id),
    );
    return {
      ...chapter,
      number: index + 1,
      unlocked: index <= completed,
      complete: index < completed,
      reviewed,
      total: chapter.terms.length,
    };
  });
  return {
    chapters: states,
    completed,
    current,
    percent: Math.round((completed / chapters.length) * 100),
    badge:
      completed === chapters.length
        ? "Chain scholar"
        : completed >= 7
          ? "Context builder"
          : completed >= 3
            ? "Pattern explorer"
            : "Market apprentice",
  };
}
