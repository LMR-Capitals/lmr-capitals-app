# Implementation Plan: LMR Capitals — full modernist redesign

## Overview
Replace the entire app front-end (`app/index.html`, single-file vanilla JS) with the
**modernist v2 design** (`/design-v2.html` / `design/handoff/`), screen by screen, on
top of the **existing Supabase database, which is unchanged**. User directive: don't
preserve the old layout — only the data layer. Every screen is *replaced*, not tweaked.

## Architecture Decisions
- **Database is frozen and already matched.** Verified live: all 34 design columns +
  `pd_switches`, `chart_images`, `copier_config`, and the `lmr-images` bucket exist
  (0 missing). No further schema/data changes — additive only if a genuine new need appears.
- **Keep the proven data layer** (`save()`, `sbSyncRecord`, `_sbDoPull`/`_sbUpsertAll`,
  `_mapDaily`/`_mapTrade`, `_accMetrics`, auth, RLS, IndexedDB images). Replace only the
  markup + render functions above it (per `design/handoff/SUPABASE_WIRING.md`).
- **Modernist tokens are the theme** (done at :root). Charts stay Chart.js.
- **Design fidelity source:** `/design-v2.html` (rendered) + `design/handoff/*-section.html`
  + `README.md`. Port real structure/CSS, not approximations.
- **Cross-panel invariants preserved:** `_accMetrics` single source of truth; combined P&L
  incl. breached accounts; Net P&L de-dups copier mirrors; Deposits(ED)=deposit records only.

## Task List  (tracked in tasks/todo.md)

### Phase 0 — DB match ✅ DONE (verified 0 missing)

### Phase 1 — Global design system
- [~] 1.1 Modernist color tokens at :root ✅ done
- [ ] 1.2 Fonts: Space Grotesk (headings) + Inter (body); JetBrains Mono numbers already set
- [ ] 1.3 Shared components CSS: card, section-header, metric-grid, dropdown, donut ring, pill/tag, KEY-LEVEL box

### Phase 2 — Today / The Chain  (mostly done)
- [x] 2.1 Session→10 killzones · London Killzone · Premarket · Asian single-select
- [x] 2.2 Ordered price refs + Premium/Discount colour rule
- [x] 2.3 PD Array commitment card (full detail) + hard-block → pd_switches
- [x] 2.4 Monthly/Weekly context cards (metric grid + KEY LEVEL)
- [ ] 2.5 HIGHER-TIMEFRAME CONTEXT 4-col grid (Premarket · Weekly draw · Daily run · Daily draw)
- [ ] 2.6 PRE-MARKET CHAIN as the design's dropdown-grid card (bias/asian/london/ny/rth/session)
- [ ] 2.7 Session-chart slot row order + Today's trades moved to bottom

### Phase 3 — Dashboard
- [ ] 3.1 KEY STATS card row (Net P&L leader · Combined · Win rate · Avg R:R · Paid out)
- [ ] 3.2 Today's Chain summary card · news strip · equity curve · trailing DD · recent-5 trades

### Phase 4 — Accounts (with its own detail/transactions memory)
- [ ] 4.1 Filter tabs + 4-tile strip + ring cards (balance/DD/win-days-or-target/payout-or-consistency), BREACHED derived
- [ ] 4.2 Account detail sheet: hero balance, ring rows, balance-vs-drawdown SVG, P&L calendar,
      deposits/fees/payouts ledger, full trades table

### Phase 5 — Transactions
- [ ] 5.1 Hero+KPI tiles, account scope chips, 3 ledger tabs, signed rows + receipt markers
- [ ] 5.2 + Transaction sheet (auto-filled firm, receipt drop → Storage/receipt_key)

### Phase 6 — Trades
- [ ] 6.1 Stats strip + gallery view (entry image cards) + list view
- [ ] 6.2 Add/Edit sheet with new fields (pd_array, refs ordered, grade, plan_followed, img_entry/exit)

### Phase 7 — Performance / Reports
- [ ] 7.1 6 Chart.js charts + Review Performance → weekly_reports(kind='performance')

### Phase 8 — Daily Pages
- [ ] 8.1 Month grid + 5 stat tiles + Week P&L rail + Day sheet (union-of-days maths)

### Phase 9 — Knowledge (adopt the new heavy design COMPLETELY)
- [ ] 9.1 66-term / 8-group knowledge base UI + block canvas (from knowledge-section.html)
- [ ] 9.2 94 PD-array charts (kb/) → upload to lmr-images Storage; PD detail reuses the commitment card

### Phase 10 — Journal · Notes · Observation · Psychology · Achievements
- [ ] 10.1 Journal/Notes typed entries + inline chart (img_key), notes.tags
- [ ] 10.2 Observation canvas + Discord webhook (discord_webhook) + posted_to_discord + past posts
- [ ] 10.3 Psychology rule-based scoring (lmr_psychology.data; from trades.plan_followed)
- [ ] 10.4 Achievements grid (unlocks)

### Phase 11 — AI Coach (upgrades)
- [ ] 11.1 New AI Coach layout + upgraded review flow (ai_chats), per design

### Phase 12 — Shell / Sidebar + Settings
- [ ] 12.1 Fixed sidebar shell (day count + active balance, independent scroll, static groups) + keyboard nav
- [ ] 12.2 Settings sheet (export/import 4 shapes/clear, storage stats, density)

## Checkpoints
- After Phase 2: Today fully matches /design-v2 Today; data round-trips.
- After Phase 4: Accounts + detail reconcile with _accMetrics; Dashboard==Accounts P&L.
- After Phase 9: Knowledge fully adopted.
- After Phase 12: whole app matches design; login + all data round-trip; RLS isolation intact.

## Verification (every task)
JS syntax check → browser preview (headless) of the screen → data round-trip where
applicable → commit → send preview screenshot. No DB writes beyond existing sync.

## Risks and Mitigations
| Risk | Impact | Mitigation |
|---|---|---|
| 14k-line single file, wholesale panel replace | High | One panel per task; syntax-check + preview each; keep data fns intact |
| Breaking the shared data layer | High | Never edit save()/sync/_accMetrics; only markup+render |
| kb/ images 12MB in repo | Med | Upload to Storage, reference by path (chart_images), not repo |
| Can't data-verify without login | Med | Layout via headless preview; user verifies data on Netlify signed in |

## Open Questions (resolved)
- AI Coach "upgrades": RESOLVED — build the new AI Coach layout from the design; keep the existing chats (ai_chats) intact. No new model/actions required beyond the design's review flow.
- Knowledge: RESOLVED — start empty. Build the full design structure/capabilities (8-group / block canvas, PD detail); user-authored content lives in lmr_terminology. Transcribe the complete structure from the design ("go deeper"), not shipped term bodies.
