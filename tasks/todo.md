# LMR Capitals — modernist redesign · task checklist

Full plan + acceptance criteria: `tasks/plan.md`. DB is frozen (verified matched).
Each task = replace one panel's markup/render with the design, wired to the existing
data layer; verify (syntax → headless preview → data round-trip) → commit → send preview.

## Phase 0 — Database match
- [x] 0.1 Verify live DB matches the design spec (0 missing) — DONE

## Phase 1 — Global design system
- [x] 1.1 Modernist :root color tokens
- [x] 1.2 Fonts — Space Grotesk headings + Inter body (JetBrains Mono numbers already set)
- [ ] 1.3 Shared component CSS — card, section header, metric grid, dropdown, donut ring, pill/tag, KEY-LEVEL box

## Phase 2 — Today / The Chain
- [x] 2.1 Session 10 killzones · London Killzone · Premarket · Asian single-select
- [x] 2.2 Ordered price refs + Premium/Discount colour rule
- [x] 2.3 PD Array commitment card + hard-block → pd_switches
- [x] 2.4 Monthly/Weekly context cards (metric grid + KEY LEVEL)
- [ ] 2.5 HIGHER-TIMEFRAME CONTEXT 4-col grid
- [ ] 2.6 PRE-MARKET CHAIN dropdown-grid card
- [ ] 2.7 Chart-slot row order + trades moved to bottom

## Phase 3 — Dashboard
- [ ] 3.1 KEY STATS card row
- [ ] 3.2 Chain summary · news · equity curve · trailing DD · recent 5 trades

## Phase 4 — Accounts
- [ ] 4.1 Filter tabs + 4-tile strip + ring cards + BREACHED derived
- [ ] 4.2 Account detail sheet (balance/DD SVG, P&L calendar, ledger, trades table)

## Phase 5 — Transactions
- [ ] 5.1 Hero/KPI tiles + scope chips + 3 ledgers + signed rows + receipts
- [ ] 5.2 + Transaction sheet (auto firm, receipt → Storage)

## Phase 6 — Trades
- [ ] 6.1 Stats strip + gallery + list
- [ ] 6.2 Add/Edit sheet + new fields (pd_array/refs/grade/plan_followed/img_entry+exit)

## Phase 7 — Performance / Reports
- [ ] 7.1 6 charts + Review Performance → weekly_reports(kind='performance')

## Phase 8 — Daily Pages
- [ ] 8.1 Month grid + stat tiles + Week P&L rail + Day sheet

## Phase 9 — Knowledge (adopt fully)
- [ ] 9.1 66-term / 8-group base + block canvas
- [ ] 9.2 94 PD charts → Storage; PD detail reuses commitment card

## Phase 10 — Journal / Notes / Observation / Psychology / Achievements
- [ ] 10.1 Journal/Notes + inline charts + tags
- [ ] 10.2 Observation + Discord webhook + past posts
- [ ] 10.3 Psychology rule-based scoring
- [ ] 10.4 Achievements grid

## Phase 11 — AI Coach
- [ ] 11.1 New AI Coach layout + upgraded review flow

## Phase 12 — Shell / Sidebar + Settings
- [ ] 12.1 Fixed sidebar shell + keyboard nav
- [ ] 12.2 Settings sheet (export/import/clear, density)

## Checkpoints
- [ ] After Phase 2 — Today matches design; data round-trips
- [ ] After Phase 4 — Accounts reconcile with _accMetrics; Dashboard==Accounts P&L
- [ ] After Phase 9 — Knowledge fully adopted
- [ ] After Phase 12 — whole app matches; login + data round-trip; RLS intact
