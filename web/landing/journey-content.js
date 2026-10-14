// Public-facing explanations only. No member notes, trade results, or private documents.
export const CHAPTERS = [
  {
    id: 'framework', short: 'Methodology', title: 'The Chain Methodology', question: 'What is the process behind the trade?',
    copy: 'The Chain gives every plan, decision, and review a shared language. Begin with market context, then work through the week, the day, and the session before considering execution. Record what happened and how you responded. The review is not an ending; it becomes the starting point for the next plan.',
    fields: ['Context before execution', 'Rules before reaction', 'Review before repetition'], artifact: 'ONE PROCESS. EVERY SESSION.',
  },
  {
    id: 'monthly', short: 'Monthly', title: 'Monthly Analysis', question: 'What context am I trading inside?',
    copy: 'The Monthly Chain observes the broader quarterly shift, STS/LTS bias, and monthly market profile. Is the market trending, retracing, consolidating, or manipulative? Write the larger context before forming a smaller-timeframe expectation. The purpose is alignment: a session idea should be considered inside that context, not mistaken for the whole picture.',
    fields: ['STS / LTS bias', 'Monthly market profile', 'Broader quarterly context'], artifact: 'MONTHLY / CONTEXT',
  },
  {
    id: 'weekly', short: 'Weekly', title: 'Weekly Analysis', question: 'What does the weekly model suggest?',
    copy: 'The Weekly Chain maps the MMBM and MMSM models and the expected delivery across the five sessions ahead. A written expectation gives the trader something to compare with actual price behaviour. Keep the model visible, observe each session, and distinguish an unfolding profile from an assumption that has not been confirmed.',
    fields: ['MMBM / MMSM', 'Expected weekly delivery', 'Observed session behaviour'], artifact: 'WEEKLY / MODEL',
  },
  {
    id: 'daily', short: 'Daily', title: 'Daily Analysis', question: 'Where does today fit in The Chain?',
    copy: 'Define the daily bias and the higher-timeframe points of interest before a session plan becomes action. Observe what price does around those locations instead of treating the location alone as a reason to enter. The daily record brings the bias, the planned session, and the end-of-day review into the same conversation.',
    fields: ['Daily bias', 'Higher-timeframe points of interest', 'Session plan + daily review'], artifact: 'DAILY / PLAN',
  },
  {
    id: 'session', short: 'Session', title: 'Session Analysis', question: 'What is price doing at this location?',
    copy: 'London and New York are observed through session profiles: accumulation, manipulation, distribution, rebalance, or continuation. The label should describe what is being observed, not give permission to force a trade. Connect the session behaviour to the written bias and planned location, then ask whether the execution model has actually confirmed.',
    fields: ['London / New York', 'Observed session profile', 'Location + confirmation'], artifact: 'SESSION / OBSERVE',
  },
  {
    id: 'trade', short: 'Trade', title: 'Trade Execution', question: 'Has the planned model actually confirmed?',
    copy: 'An entry belongs to the process only when the planned model confirms. Record the model, session, risk, and the reasoning behind the decision, then capture the entry, exit, and result. If confirmation is missing, waiting remains available. Feeling certain, hurried, or afraid of missing out does not complete a missing link.',
    fields: ['Model + confirmation', 'Entry / exit / risk', 'Emotion + result'], artifact: 'EXECUTION / CONFIRM',
  },
  {
    id: 'discipline', short: 'Journal', title: 'Discipline & Journaling', question: 'Did the decision follow the plan?',
    copy: 'Review the decision against the plan, not only against its outcome. The journal records what was observed, what was expected, what the trader did, and the emotions present along the way. Name hesitation or FOMO honestly. Carry the lesson into the next session so the review reconnects to the next plan.',
    fields: ['Plan versus decision', 'Emotion + reasoning', 'Lesson for the next session'], artifact: 'JOURNAL / RETURN TO PLAN',
  },
  {
    id: 'observe', short: 'Observe', title: 'Observation is not expectation.', question: 'What am I actually seeing?',
    copy: 'At the desk, separate what price actually did from what you expected it to do. Note the larger context, the planned location, and the session behaviour. An interpretation may be useful, but it is still an interpretation. Give the observation its own line before deciding whether it supports the written plan.',
    fields: ['OBSERVED / What price did', 'EXPECTED / What the plan anticipated', 'UNCONFIRMED / What still needs evidence'], artifact: 'OBSERVE / BEFORE DECIDING',
  },
  {
    id: 'confirm', short: 'Confirm', title: 'A setup must earn the decision.', question: 'What would make this a valid trade?',
    copy: 'Return to the condition written before the session. Does the context support the idea, is price at the planned location, and has the model confirmed? Keep the missing evidence explicit. A compelling opinion is not an execution condition. When a link is missing, the decision can remain open rather than becoming a trade.',
    fields: ['CONTEXT / Check the larger picture', 'LOCATION / Return to the plan', 'TRIGGER / Require confirmation'], artifact: 'IF A LINK IS MISSING / WAIT',
  },
  {
    id: 'wait', short: 'Wait', title: 'Patience has a written reason.', question: 'Can I wait without forcing it?',
    copy: 'Fear of missing out, hesitation, and the urge to recover a loss can feel urgent. None of them changes the written condition. Name the emotion, then check the evidence again. Standing aside preserves the distinction between a planned opportunity and a reaction. A no-trade decision still belongs in the journal, together with its reason.',
    fields: ['NAME / FOMO, hesitation, recovery urge', 'CHECK / Feeling is not confirmation', 'DECIDE / Trade, wait, or stand aside'], artifact: 'FEELING IS NOT A SIGNAL',
  },
  {
    id: 'review', short: 'Review', title: 'What will tomorrow learn from today?', question: 'What belongs in the next plan?',
    copy: 'Whether the trader acted or waited, record the reasoning as well as the result. Compare the observation, expectation, action, and emotion without rewriting the original plan after the fact. The useful lesson is specific enough to revisit. Bring it back into the next session, and the desk becomes the place where The Chain closes.',
    fields: ['Observed + expected', 'Action + emotion', 'Lesson → next plan'], artifact: 'PLAN → DECISION → REVIEW',
  },
];

export const METHOD_COUNT = 7;
export const PACING = Object.freeze({ entry: 80, handoff: 90, exit: 65, method: 110, desk: 125, phoneMethod: 140, phoneDesk: 160, fade: 0.15 });
export const clamp = (n, min = 0, max = 1) => Math.max(min, Math.min(max, n));
export const ease = value => { const t = clamp(value); return t * t * (3 - 2 * t); };

export function makeTimeline(phone = false) {
  let cursor = 0;
  const segments = [];
  const push = (phase, span, chapter) => { segments.push({ phase, span, chapter, start: cursor, end: cursor + span }); cursor += span; };
  push('entry', PACING.entry, 0);
  CHAPTERS.forEach((_, index) => {
    if (index === METHOD_COUNT) push('handoff', PACING.handoff, METHOD_COUNT);
    push(index < METHOD_COUNT ? 'method' : 'desk', index < METHOD_COUNT ? (phone ? PACING.phoneMethod : PACING.method) : (phone ? PACING.phoneDesk : PACING.desk), index);
  });
  push('exit', PACING.exit, CHAPTERS.length - 1);
  return { segments, total: cursor, conviction: segments.find(s => s.phase === 'handoff').start };
}

export function sampleTimeline(progress, timeline) {
  const position = clamp(progress) * timeline.total;
  const segment = timeline.segments.find(s => position < s.end) || timeline.segments.at(-1);
  const local = clamp((position - segment.start) / segment.span);
  const chapterSegment = segment.phase === 'method' || segment.phase === 'desk';
  // The first desk chapter already enters during the camera landing. Do not
  // fade it out and restart it when the handoff crosses into its reading hold.
  const opacity = segment.phase === 'handoff' ? ease((local - .65) / .35)
    : segment.phase === 'desk' && segment.chapter === METHOD_COUNT ? ease((1 - local) / PACING.fade)
    : chapterSegment ? Math.min(ease(local / PACING.fade), ease((1 - local) / PACING.fade)) : 1;
  return { ...segment, local, opacity, progress: clamp(progress) };
}

export function chapterProgress(index, timeline) {
  const segment = timeline.segments.find(s => s.chapter === index && (s.phase === 'method' || s.phase === 'desk'));
  return segment ? (segment.start + segment.span * 0.5) / timeline.total : 0;
}
