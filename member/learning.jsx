import React, { useState } from "react";
import reference from "../design/handoff/terminology.json";
import originalBlocks from "./terminology-blocks.json";
import checkpoints from "./learning-checkpoints.json";
import { learningState } from "./learning-model.mjs";
import { Button, Empty } from "./ui";
import Icon from "./icons";
export const chapters = reference.sections;
const termsById = new Map(reference.terms.map((t) => [t.id, t]));
export function LearningProgress({ progress = [], go }) {
  const state = learningState(chapters, progress),
    chapter = state.chapters[state.current];
  return (
    <section
      className="learning-progress panel"
      aria-label="Your chapter progress"
    >
      <div className="learning-score">
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="41" />
          <circle
            className="score-fill"
            cx="50"
            cy="50"
            r="41"
            pathLength="100"
            strokeDasharray={`${state.percent} 100`}
          />
        </svg>
        <strong>
          {state.completed}
          <small>of {chapters.length}</small>
        </strong>
      </div>
      <div className="learning-copy">
        <span className="eyebrow">YOUR CHAIN JOURNEY · {state.badge}</span>
        <h2>
          {state.completed === chapters.length
            ? "Every chapter connected."
            : `Chapter ${chapter.number}: ${chapter.title}`}
        </h2>
        <p>
          {state.completed === chapters.length
            ? "You completed the reference path. Return to any chapter to keep your foundations sharp."
            : `${chapter.reviewed.length} of ${chapter.total} lessons studied. Connect this chapter to unlock the next.`}
        </p>
        <div
          className="chapter-chain"
          aria-label={`${state.completed} of ${chapters.length} chapters complete`}
        >
          {state.chapters.map((c) => (
            <span
              key={c.number}
              className={
                c.complete
                  ? "done"
                  : c.number === chapter.number
                    ? "current"
                    : "locked"
              }
              title={`Chapter ${c.number}: ${c.complete ? "Complete" : c.unlocked ? "In progress" : "Locked"}`}
            >
              {c.complete ? <Icon name="check" size={11} /> : c.number}
            </span>
          ))}
        </div>
      </div>
      <Button gold icon="terminology" onClick={() => go("terminology")}>
        {state.completed === chapters.length
          ? "Revisit your chapters"
          : chapter.reviewed.length
            ? "Continue learning"
            : `Start chapter ${chapter.number}`}
        <Icon name="arrow" size={14} />
      </Button>
    </section>
  );
}
export function LearningLibrary({
  search = "",
  progress = [],
  onStudy,
  onComplete,
  busy,
}) {
  const state = learningState(chapters, progress);
  const [selected, setSelected] = useState(state.current),
    [answers, setAnswers] = useState({}),
    [feedback, setFeedback] = useState("");
  const chapter = state.chapters[selected] || state.chapters[0];
  const accessible = state.chapters.filter((c) => c.unlocked);
  const ids = search
    ? [...new Set(accessible.flatMap((c) => c.terms))]
    : chapter.terms;
  const terms = ids
    .map((id) => termsById.get(id))
    .filter(
      (t) =>
        t &&
        (!search ||
          `${t.name} ${t.gloss} ${t.body}`
            .toLowerCase()
            .includes(search.toLowerCase())),
    );
  const quiz = checkpoints[selected];
  const changeChapter = (i) => {
    setSelected(i);
    setAnswers({});
    setFeedback("");
    window.scrollTo(0, 0);
  };
  const complete = async (e) => {
    e.preventDefault();
    setFeedback("");
    const ok = await onComplete(
      chapter.number,
      quiz.questions.map((_, i) => answers[i]),
    );
    if (ok)
      setFeedback(
        `Chapter ${chapter.number} connected. ${chapter.number < chapters.length ? "Your next chapter is unlocked." : "The full Chain journey is complete."}`,
      );
  };
  return (
    <>
      <div className="learning-intro">
        <span className="tag">FREE WITH YOUR LMR ACCOUNT</span>
        <p>
          Study the original LMR reference in order. Mark each lesson studied,
          then answer two definition questions to unlock your next chapter.
        </p>
      </div>
      <div className="library-layout">
        <aside className="library-index" aria-label="Terminology chapters">
          {state.chapters.map((c, i) => (
            <button
              key={c.number}
              disabled={!c.unlocked}
              className={i === selected ? "active" : ""}
              aria-pressed={i === selected}
              onClick={() => changeChapter(i)}
            >
              <span className="chapter-index-icon">
                {c.complete ? (
                  <Icon name="check" size={15} />
                ) : !c.unlocked ? (
                  <Icon name="lock" size={14} />
                ) : (
                  String(c.number).padStart(2, "0")
                )}
              </span>
              {c.title}
              <small>
                {c.complete
                  ? "Chapter complete"
                  : c.unlocked
                    ? `${c.reviewed.length} / ${c.total} studied`
                    : `Complete chapter ${c.number - 1} to unlock`}
              </small>
            </button>
          ))}
        </aside>
        <section>
          <div className="section-head" style={{ marginTop: 0 }}>
            <h2>
              {search
                ? "Search your unlocked chapters"
                : `Chapter ${chapter.number} · ${chapter.title}`}
            </h2>
            <span>
              {search
                ? `${terms.length} entries`
                : `${chapter.reviewed.length} / ${chapter.total} studied`}
            </span>
          </div>
          <p className="content-note">
            {search
              ? `Results for “${search}”. Locked chapters open as you complete the path.`
              : chapter.blurb}
          </p>
          <div className="term-list">
            {terms.map((t) => {
              const reviewed = chapter.reviewed.includes(t.id);
              return (
                <details
                  key={t.id}
                  className={`term-row panel ${reviewed && !search ? "studied" : ""}`}
                >
                  <summary>
                    <div>
                      <h3>{t.name}</h3>
                      <p>{t.gloss}</p>
                    </div>
                    <Icon
                      name={reviewed && !search ? "check" : "plus"}
                      size={17}
                    />
                  </summary>
                  <div className="term-content">
                    {!originalBlocks[t.id] &&
                      String(t.body || "")
                        .split("\n")
                        .filter(Boolean)
                        .map((p, i) => <p key={i}>{p}</p>)}
                    {Array.isArray(originalBlocks[t.id]) &&
                      originalBlocks[t.id].map((b, i) =>
                        b.type === "img" ? (
                          <img
                            key={i}
                            src={b.src}
                            alt={`${t.name} — LMR reference illustration`}
                            loading="lazy"
                          />
                        ) : b.type === "h" ? (
                          <h4 key={i}>{b.text}</h4>
                        ) : (
                          <p key={i}>{b.text}</p>
                        ),
                      )}
                    {!search && (
                      <Button
                        small
                        icon="check"
                        disabled={busy || reviewed}
                        onClick={() => onStudy(chapter.number, t.id)}
                      >
                        {reviewed ? "Lesson studied" : "Mark lesson studied"}
                      </Button>
                    )}
                  </div>
                </details>
              );
            })}
          </div>
          {!terms.length && (
            <Empty
              icon="search"
              title="No matching unlocked terminology."
              body="Try a different term or continue your current chapter to open more of the library."
            />
          )}
          {!search && (
            <section className="chapter-checkpoint panel">
              <span className="eyebrow">CONNECT THE CHAPTER</span>
              <h2>
                {chapter.complete
                  ? "Chapter complete. Keep the connection."
                  : "Your chapter checkpoint"}
              </h2>
              {chapter.complete ? (
                <>
                  <p>
                    Your lessons and checkpoint are complete. You can revisit
                    them anytime.
                  </p>
                  {chapter.number < chapters.length && (
                    <Button gold onClick={() => changeChapter(selected + 1)}>
                      Open chapter {chapter.number + 1}
                      <Icon name="arrow" size={15} />
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <p>
                    {chapter.reviewed.length < chapter.total
                      ? `Study ${chapter.total - chapter.reviewed.length} more lessons to unlock this checkpoint.`
                      : "All lessons studied. Check the definitions below and connect your next chapter."}
                  </p>
                  <form onSubmit={complete}>
                    {quiz.questions.map((q, i) => (
                      <fieldset
                        key={q.prompt}
                        disabled={
                          busy || chapter.reviewed.length < chapter.total
                        }
                      >
                        <legend>
                          {i + 1}. {q.prompt}
                        </legend>
                        {q.options.map((option) => (
                          <label className="quiz-option" key={option.id}>
                            <input
                              type="radio"
                              name={`checkpoint-${i}`}
                              value={option.id}
                              required
                              checked={answers[i] === option.id}
                              onChange={() =>
                                setAnswers((a) => ({ ...a, [i]: option.id }))
                              }
                            />
                            {option.label}
                          </label>
                        ))}
                      </fieldset>
                    ))}
                    <Button
                      gold
                      type="submit"
                      disabled={busy || chapter.reviewed.length < chapter.total}
                    >
                      {busy ? "Checking…" : "Complete chapter & unlock next"}
                      <Icon name="arrow" size={15} />
                    </Button>
                  </form>
                </>
              )}
              {feedback && (
                <p className="chapter-success" role="status">
                  <Icon name="check" size={16} />
                  {feedback}
                </p>
              )}
            </section>
          )}
          <p className="content-note">
            Progress records your study of the LMR reference. It is not a
            trading credential or a measure of profitability.
          </p>
        </section>
      </div>
    </>
  );
}
