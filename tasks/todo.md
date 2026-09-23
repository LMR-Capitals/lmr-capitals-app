# LMR Capitals — modernist redesign · task checklist

Full plan + acceptance criteria: `tasks/plan.md`. DB is frozen (verified matched).
Each task = replace one panel's markup/render with the design, wired to the existing
data layer; verify (syntax → headless preview → data round-trip) → commit → send preview.

## Phase 0 — Database match
- [x] 0.1 Verify live DB matches the design spec (0 missing) — DONE

## Phase 1 — Global design system
- [x] 1.1 Modernist :root color tokens
- [x] 1.2 Fonts — Space Grotesk headings + Inter body (JetBrains Mono numbers already set)
- [x] 1.3 Shared component CSS — card, section header, metric grid, dropdown, donut ring, pill/tag, KEY-LEVEL box

## Phase 2 — Today / The Chain
- [x] 2.1 Session 10 killzones · London Killzone · Premarket · Asian single-select
- [x] 2.2 Ordered price refs + Premium/Discount colour rule
- [x] 2.3 PD Array commitment card + hard-block → pd_switches
- [x] 2.4 Monthly/Weekly context cards (metric grid + KEY LEVEL)
- [x] 2.5 HIGHER-TIMEFRAME CONTEXT 4-col grid
- [x] 2.6 PRE-MARKET CHAIN dropdown-grid card
- [x] 2.7 Chart-slot row order (Daily/Weekly full → 3-up row → Summary full); no Today trades block exists to move

## Phase 3 — Dashboard
- [x] 3.1 KEY STATS card row (Net P&L·Leader · Combined · Win rate · Avg R:R on wins · Paid out)
- [x] 3.2 Today's Chain summary grid · Today's News · Equity curve · Trailing DD · Recent 5 trades
- [x] 3.3 Daily Heatmap (leader/all toggle, 9-week Mon–Fri) + Copier Distribution card (leader + derived followers)

## Phase 4 — Accounts
- [x] 4.1 Filter tabs + 4-tile strip + ring cards + BREACHED derived (already built to design; theme applied + design copy synced)
- [x] 4.2 Account detail sheet (hero balance, profit/consistency/days rings, balance-vs-DD SVG, P&L calendar, ledger, trades table) — already matches design

## Phase 5 — Transactions
- [x] 5.1 Hero/KPI tiles + 3 ledgers (Deposits&Fees/Payouts/Withdrawals) + signed rows — already built to design; theme applied
- [x] 5.2 + Transaction sheet (Deposit/Fee/Payout/Withdrawal; receipt_key + image sync) — already matches design

## Phase 6 — Trades
- [x] 6.1 Stats strip (already) + filter toolbar (acc/side/model/emotion/phase/mmm/rth + result chips + Clear) + List/Gallery views
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
- [x] After Phase 2 — Today matches design; data round-trips (verified: PRE-MARKET CHAIN save→reload)
- [ ] After Phase 4 — Accounts reconcile with _accMetrics; Dashboard==Accounts P&L
- [ ] After Phase 9 — Knowledge fully adopted
- [ ] After Phase 12 — whole app matches; login + data round-trip; RLS intact
