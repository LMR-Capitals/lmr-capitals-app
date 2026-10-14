import {journalPublication} from "./journal-media.mjs";
import {demoJournalEntries} from "./journal-demo";
// Explicitly illustrative UI data. Never used by the authenticated data adapter.
export const demoPosts = [
  ...demoJournalEntries.map(source => ({...journalPublication(source,"preview-admin"),id:`preview-copy-${source.id}`})),
  {
    id: "preview-free-resource",
    kind: "terminology",
    title: "Your starting point: THE Chain Methodology",
    body: "Start with Mechanics of the market fluctuations in the original LMR library. Study each lesson, connect its definitions at the chapter checkpoint, and build the foundations before moving to the next chapter.",
    created_at: "2026-10-04T14:00:00Z",
    published_at: "2026-10-04T14:00:00Z",
    status: "published",
    preview: true,
  },
  {
    id: "preview-observation",
    kind: "observation",
    title: "Start with the context. Then look for the trade.",
    body: "Begin with the higher-timeframe narrative, mark the draw on liquidity, and wait for price to confirm the idea. This preview uses an illustration from the LMR reference library, not an executed trade.",
    created_at: "2026-10-04T13:30:00Z",
    published_at: "2026-10-04T13:30:00Z",
    image_url: "/term/lmrkb-0.png",
    image_caption: "LMR reference library · Educational illustration",
    pinned: true,
    status: "published",
    preview: true,
  },
  {
    id: "preview-analysis",
    kind: "analysis",
    title: "The chain: daily → weekly → monthly.",
    body: "Understand how the daily narrative fits inside the weekly and monthly context. Open LMR Terminology to explore the original explanations and diagrams from your library.",
    created_at: "2026-10-04T12:00:00Z",
    published_at: "2026-10-04T12:00:00Z",
    status: "published",
    preview: true,
  },
  {
    id: "preview-callout",
    kind: "callout",
    title: "A setup is a plan, not a promise.",
    body: "A desk callout should communicate the instrument, the thesis, the confirmation to wait for, and where the idea becomes invalid. This is an example of the publishing format; there is no active trade signal.",
    created_at: "2026-10-04T11:00:00Z",
    published_at: "2026-10-04T11:00:00Z",
    status: "published",
    preview: true,
  },
];
export const demoSessions = [
  {
    id: "preview-session",
    session_block: "ny_am",
    title: "New York session briefing",
    description:
      "Read the context. Map the liquidity. Build the narrative together.",
    starts_at: "2026-10-05T12:30:00Z",
    status: "scheduled",
    provider: "external",
    preview: true,
  },
  {
    id: "preview-review",
    session_block: "ny_pm",
    title: "The week in review",
    description: "A structured review of the process behind the decisions.",
    starts_at: "2026-10-09T20:30:00Z",
    status: "scheduled",
    preview: true,
  },
  {
    id: "preview-asia",
    session_block: "asia",
    title: "Asia session analysis",
    description:
      "Illustrative Asia room: build the context and review the developing narrative.",
    starts_at: "2026-10-06T00:00:00Z",
    status: "scheduled",
    provider: "external",
    preview: true,
  },
  {
    id: "preview-london",
    session_block: "london",
    title: "London session analysis",
    description:
      "Illustrative London room: connect the session observations to the higher-timeframe context.",
    starts_at: "2026-10-06T07:00:00Z",
    status: "scheduled",
    provider: "external",
    preview: true,
  },
];
export const demoNotifications = [
  {
    id: "preview-welcome",
    title: "Welcome to the Inner Circle",
    body: "Start with the LMR reference library, then explore the desk updates and live room.",
    created_at: "2026-10-04T13:00:00Z",
    category: "announcement",
    audience: "free",
    preview: true,
  },
  {
    id: "preview-briefing",
    title: "Your next session: New York briefing",
    body: "This is an illustrative notification. Admin announcements will arrive here in the connected application.",
    created_at: "2026-10-04T12:00:00Z",
    category: "live",
    preview: true,
  },
];
export const demoQuestions = [
  {id:"preview-question-waiting-1",user_id:"preview-member",title:"How do I document an invalidation?",body:"Illustrative free-member question. What should I record before reviewing an idea?",created_at:"2026-10-05T09:00:00Z",status:"open",preview:true},
  {id:"preview-question-waiting-2",user_id:"preview-member",title:"Where do session observations fit in the chain?",body:"Illustrative learner question about the learning process.",created_at:"2026-10-06T09:00:00Z",status:"open",preview:true},
  {
    id: "preview-question",
    title: "How should I work through the LMR terminology?",
    body: "I want to understand the context before focusing on entries.",
    answer:
      "Start with the mechanics of market fluctuations. Then work through the market maker models, and use the diagrams to connect the terminology to the chart.",
    created_at: "2026-10-04T10:00:00Z",
    status: "answered",
    preview: true,
  },
];
