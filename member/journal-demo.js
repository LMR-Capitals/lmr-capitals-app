// Illustrative source records only. The preview never queries the real journal.
export const demoJournalEntries = [
  {id:"preview-journal-trade",kind:"trade",date:"2026-10-07",created_at:"2026-10-07T12:00:00Z",title:"Illustrative Journal entry",entry_slot:"result",entry_label:"ENTRY · exit / outcome",body:"Market: NQ · Direction: Long · Session: NY AM · Date: Oct 7. Workflow sample only.",image:"/term/lmrkb-0.png",updated_at:"2026-10-07T12:00:00Z"},
  {
    id: "preview-journal-observation",
    kind: "observation",
    title: "Preview journal observation",
    session_tag: "NY AM",
    created_at: "2026-10-05T11:00:00Z",
    content:
      '<!--obsmeta {"m":"NQ","tf":"5m"}--><h3>Built on THE Chain Methodology</h3><p>Start with the higher time frame, then document the session context.</p><ul><li>Record what you observed.</li><li>Explain your reasoning and the conditions that would invalidate the idea.</li><li>Review your execution separately.</li></ul><p><img src="/term/lmrkb-0.png" alt="Illustrative LMR library chart"></p><p><img src="/term/lmrkb-1.png" alt="Second illustrative Journal chart"></p><p>This is an illustrative journal record, not a trading callout.</p>',
    updated_at: "2026-10-05T12:00:00Z",
  },
  {
    id: "preview-journal-achievement",
    kind: "achievement",
    title: "Preview achievement image",
    category: "Workflow example",
    firm: "Illustrative Journal record",
    achieved_on: "2026-10-05",
    amount: null,
    is_public: true,
    created_at: "2026-10-05T11:00:00Z",
    caption:
      "Illustrative publishing workflow. Replace this brand image with your reviewed journal certificate; no performance result is being claimed.",
    image: "/icons/High-Resolution-Color-Logo-on-Transparent-Background.png",
    updated_at: "2026-10-05T12:00:00Z",
  },
];
