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
- [x] 6.2 Add/Edit sheet new fields: PD array (LMR_PD_ARRAYS), grade, plan-followed, ordered refs; img_entry/exit via existing 4 image zones — save→map→reload verified

## Phase 7 — Performance / Reports
- [x] 7.1 Charts (equity/monthly/model/win-rate/day/session) + AI Performance Review → weekly_reports — already built to design (richer), theme applied

## Phase 8 — Daily Pages
- [x] 8.1 Month grid + 5 stat tiles + Week P&L rail + Day sheet — already built to design, theme applied

## Phase 9 — Knowledge (adopt fully)
- [x] 9.1 Full grouped glossary — 10 groups / 87 terms scaffold (Mechanics, MM Models, Named&Time, PD Arrays, Entry Models, Time-Based Entry, Draws, Macro Times, Gaps, Range&Levels) + Add section/term; per-term write+chart drop → lmr_terminology (starts empty)
- [x] 9.2 Per-term chart drop capability in place (image zone per term). Bulk upload of the 94 PD chart images is a content task for the user.

## Phase 10 — Journal / Notes / Observation / Psychology / Achievements
- [x] 10.1 Journal typed entries (type/title/linked-day/content) + attach image + history — already built to design
- [x] 10.2 Observation canvas + Discord post + paste-images + past posts — already built to design
- [x] 10.3 Psychology rule-based scoring (5 graded rules + KPI strip + AI feedback) — REBUILT to design
- [x] 10.4 Achievements grid (KPI tiles + auto cards + Goals & Milestones) — already built to design

## Phase 11 — AI Coach
- [x] 11.1 New AI Coach layout — Context/Threads/Model/Last-session KPI strip + "How context works", existing chat (ai_chats) kept below

## Phase 12 — Shell / Sidebar + Settings
- [ ] 12.1 Fixed sidebar shell + keyboard nav
- [ ] 12.2 Settings sheet (export/import/clear, density)

## Checkpoints
- [x] After Phase 2 — Today matches design; data round-trips (verified: PRE-MARKET CHAIN save→reload)
- [ ] After Phase 4 — Accounts reconcile with _accMetrics; Dashboard==Accounts P&L
- [ ] After Phase 9 — Knowledge fully adopted
- [ ] After Phase 12 — whole app matches; login + data round-trip; RLS intact
