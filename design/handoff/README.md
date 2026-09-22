# Handoff: LMR Capitals — Prop-Trading Journal & Cockpit

## Overview
A complete prop-firm trading journal and account cockpit: dashboard, the daily "Chain"
(monthly → weekly → daily planning), trade log with gallery, prop-account lifecycle
(eval → funded → payout), a transactions ledger, journal/notes with chart evidence,
an ICT knowledge base, AI performance reviews and Discord-mirrored observations.

## About the Design Files
The files in this bundle are **design references created in HTML** — a working prototype
of the intended look, structure and behaviour. They are **not production code to copy**.
The task is to **recreate these designs in your existing codebase** (React/Next, Vue,
Flutter, SwiftUI — whatever the app already uses) with its established patterns,
component library and data layer. Where the prototype keeps state in `localStorage`
and images in IndexedDB, your implementation should use the real backend (the live app
uses Supabase with per-user RLS).

## Fidelity
**High fidelity.** Final colours, typography, spacing, ring/chart geometry and
interaction states are all settled. Recreate the UI closely; the maths described below
is normative — several panels were reconciled specifically so the same quantity never
reads two different ways in two places.

## Screens / Views

### 1. Shell
- Left sidebar 248px: brand tile, day counter, active-account balance, collapsible nav
  groups (**Session / Analysis / Trading / Knowledge / AI**, group labels in gold
  `--color-accent-2`), admin footer (profile, settings, sign out).
- Main column: sticky header (panel title + date line, right-aligned actions).
  **+ Trade appears only on the Trades panel.** Performance shows **Review performance**;
  LMR Observation shows **+ New**.
- Keyboard nav: 0/D/M/W/L/C/T/A/X/N/J/P and ? for the shortcut sheet.

### 2. Dashboard
KPI tiles (day P&L, trades, W/L), today's chain summary, news strip, draggable widget
grid, equity curve, recent-trades list (last 5 pulled live from the trade log).

### 3. Today — The Chain
Stacked monthly context → weekly levels → daily bias. Chips for bias/POI/session,
plan & prediction tags, four chart slots. All fields full-width, autosaving.

### 4. Monthly / Weekly
Monthly: quarterly shift, market profile, seasonal, rate %, IM analysis, key levels,
11 chart slots, five week tiles with P&L. Weekly: week tabs, SMT correlations, profile
grid, Mon–Fri panels each with their own chart slots.

### 5. Daily Pages
Month navigator + 5 stat tiles (**Monthly P&L, Win days, Plan followed, Prediction,
Journaled**) + a 6-column grid: Mon–Fri day cells and a **Week P&L** rail (W#, total,
"5W · 3L").

Day cell contents, top to bottom: date + short month + `D###` day-count badge (gold),
holiday badge, `● status`, bias / ✓Plan / ✓Pred pills, `HTF:` line (34 chars, ellipsised),
`L:… NY:…`, quoted note preview, P&L (bottom), then trade count or `+ Chain`.
Cell tint: green wash if P&L > 0, red if < 0, faint gold if journaled with no trades.
Today gets a 2px gold border. Future untouched days sit at 0.5 opacity.

Clicking a cell opens the **Day sheet**: 14 graded fields in two columns —
left: Daily bias, Session, Plan, Prediction, London, New York, Asian range, Day status;
right: HTF POI, Week draws, RTH delivery, Price context, Monthly bias, Quick notes.
Selects tint themselves by value (green Bullish/Followed/Correct/Passed/Accumulation,
red Bearish/Unfollowed/Incorrect/Blown/Manipulation, blue Distribution/Retracement/PM,
gold In Process). Below: five chart slots (Daily/Weekly, 4H/1H, 15min, Inter-market,
plus a full-width Summary), then that date's trades table. Footer: Delete entry ·
AUTO-SAVE · Done.

**Normative maths:** the stat tiles grade the *union* of traded days and days carrying a
saved record. An explicit saved record wins; otherwise the day's own trades decide
(plan = day green, prediction = majority of trades won). A journaled no-trade day reads
"Journaled · no trades", never "+ Chain".

### 6. Trades
Stats strip (**Total, Win rate, Net P&L, Avg R:R**) sits above *both* views — list and
gallery. List: 16-column sticky-first-column table with a gold totals row. Gallery:
entry image in 16:9 with a read-out panel beneath (day#, date, market, P&L, R:R, risk,
session, model, emotion). Add/Edit Trade sheet covers market, session, LMR macro time,
models, confirmations, emotions, market phase, MMM, movement, T-frame, RTH profile,
HTF delivery, P&L/risk/lots and feedback.

### 7. Accounts
Filter tabs **All / Evaluation / Funded / Passed** + Hide-failed toggle.

Each card: name, status pill, traded meta, firm · account no. · size, then four metric
rails each with a 40×40 donut ring (34px on cards):
1. Account balance (coloured dot, no ring)
2. Trailing max drawdown + cushion — ring = `ddProgress`
3. Funded → **Win days** `n/5`; Eval → **Profit target** with % reached
4. Funded → **Payout** amount/blocked reason; Eval → **Consistency** `n% / limit%`

Actions: Request payout (funded) · View details · Set active · ⚙ Edit · 🗑 Delete.

**Detail sheet** (max-width 940px, opens 40px from top):
header (name, status pill, "last traded · firm · account no. · plan") →
two-column metric grid (left: hero balance 22px + ↑/↓ delta, trailing DD, daily loss
limit, total profit, paid out; right: four ring rows — profit target, consistency,
trading days, drawdown room — plus a compliance pill) →
**Account balance vs drawdown** SVG (viewBox 0 0 860 250, padL 58/padR 14/padT 16/padB 30;
green area at 0.08 opacity + 2.2px line, red 1.6px dashed `5 4` floor line, 5 grid rows
with $ labels, ~7 date ticks) →
**P&L calendar** (7-col Sun–Sat, 60px cells, green/red tint by P&L, ‹ month ›) →
**Deposits, fees & payouts** list with 🧾 markers + "Open ledger" →
full trades table (Date/Open/Mkt/Pos/Model/Emotion/Risk/Result/P&L/R:R), every row clickable.

**Status is derived, not stored:** a funded account whose balance sits at or below its
floor reads **BREACHED** in red on both the card and the sheet, with a red card border.

### 8. Account creation — the nine-firm rulebook
Firm grid (9 chips, each labelled Simulated or Live path) → plan chips for that firm →
size chips restricted to that firm's ladder → name/firm/account-no./date/deposit fields →
a live **rulebook card**: eval profit target, max drawdown, opening floor, drawdown type
in eval, drawdown type when funded, daily loss limit, minimum days, consistency, profit
split, payout eligibility, after each payout.

Naming convention, rebuilt on every plan/size change:
`<account type> <firm> <size>K · <NN>` — e.g. "Trading Combine Topstep 50K · 06".

Firms and their rules (researched Sept 2026) are in `FIRMS()` in the source:
Tradeify, Apex, Topstep, Take Profit Trader, Blue Guardian, Lucid Trading,
MyFundedFutures, FundedNext, Alpha Futures. Saving snapshots `ddLimit`, `evalTarget`,
`ddType`, `split`, `isLive` and `payoutRule` onto the account so later catalogue edits
never rewrite history.

### 9. Transactions
Two hero tiles (Funded profit, Withdrawal profit) + four KPI tiles (Deposits (ED), Fees,
Withdrawals, Payouts) → **account scope chips** → three ledger tabs
(**Deposits & Fees / Payouts / Withdrawals**) → ledger card with label pill, title,
`Total: $X`, **+ Deposit** and **+ Fee**.

Row grid (min-width 760px, wrapper scrolls):
`3px | 104px date | 88px type | 190px account | 116px amount | 200px note | 46px ✗`.
3px coloured left edge per type (green deposit/withdrawal, gold fee, purple payout),
pill type tag, account name is a button that opens that account's detail sheet, signed
cents-precise amount (`−$99.00` red for costs, `+$…` green for money in), 🧾 thumbnail
beside notes carrying a receipt, round red ✗ delete.

**+ Transaction sheet:** label-left rows (110px label column) — Date (native date input),
Type select, Account select, **Prop firm (read-only, auto-filled from the chosen
account)**, Amount, Note — then a dashed **RECEIPT / SCREENSHOT** drop area with a
Screenshot button, footer pill Cancel + gold Save (disabled until an amount exists).

### 10. Payout
KPI tiles (Eligible now, Available, Gate, Paid to date) → eligibility card per funded
account showing blocked-by, the firm's own payout rule, win days vs threshold,
cumulative profit, payout at 50%, cap, last payout, cycle P&L, and a
**Request $X** button when eligible → history table driven by real payout records.

Requesting files a payout record *and* a matching Payout transaction, then the win-day
gate and consistency window restart from that date.

### 11. Journal · Notes · Observation · Knowledge · Reports · Settings
- **Journal**: typed entries (Lesson/Win/Loss/Note), colour-coded left border, each card
  carrying its own chart frame. **The draft's image slot id is stored on the saved entry
  (`imgKey`)** so the pasted chart renders inside the card with the text.
- **Notes**: dated quick notes, same chart-frame treatment.
- **LMR Observation**: post canvas + Discord webhook mirror + past posts, newest first.
- **Knowledge**: 39 ICT terms in 8 groups, each opening a Notion-style block canvas
  (`/` opens the block menu, Backspace deletes, columns for side-by-side charts).
- **Reports**: AI performance reviews saved as documents.
- **Settings**: export / import / clear, storage stats.

## Interactions & Behaviour
- Every form autosaves; a toast confirms and names what changed.
- Image slots accept paste (⌘V), drag-drop, click-to-upload and screen capture; each
  slot has a stable id so the drop survives reload. Scoped paste: a paste anywhere in a
  card lands in that card's slot.
- Escape peels one layer at a time: confirm → detail → form.
- Month navigators (‹ Today ›) on Daily Pages, Monthly, Weekly and the account calendar.
- Arriving at Transactions from an account pre-selects that account's scope chip.

## State Management
```
trades[]        account, date, openTime/closeTime, market, position, models[],
                confirmations[], emotions[], session, macroTime, mmm, movement,
                tFrame, rthProfile, htf, risk, lots, pnl, rr, feedback, derived
accounts[]      id, name, status(Eval|Funded|Passed|Blown), plan, firm, firmId,
                accountNo, date, size, ddLimit, evalTarget, ddType, split, isLive,
                payoutRule, copier
transactions[]  id, accountId, type(Deposit|Withdrawal|Payout|Fee), amount(positive),
                date, note, imgKey
payouts[]       id, accountId, amount, date, baselineProfit, winDays
daily{iso}      bias, session, plan, prediction, daystatus, htfpoi, weekdraws, london,
                ny, rth, asianRange, price, monthlyBias, notes, savedAt
journal[]/notes[]  id, type|title, date, text, imgKey
images{slotId}  blob reference (IndexedDB in the prototype)
```

### accMetrics(acc) — the single source of truth
Never compute balances inline; every panel reads this.
```
ddAllow    = acc.ddLimit ?? tier default
balance    = size + tradePnl            (payouts tracked separately as paid)
peak       = running max of size + cumulative P&L
floor      = max(peak − ddAllow, size − ddAllow)   // opening floor sits BELOW deposit
breached   = status === 'Blown' || balance <= floor
cushion    = balance − floor
ddProgress = (balance − floor) / (peak − floor)    // 1 = at peak, 0 = at floor
target     = acc.evalTarget || firm ladder || 6% of size
consPct    = bestDay / sum(positive days) × 100    // limit default 40
winDays    = days since last payout with P&L >= winThreshold(size)
eligible   = Funded && !breached && winDays >= 5 && profit > 0 && cyclePnl > 0
amount     = min(profit × 0.5, payoutCap)
```
Tier defaults by size: 25K → dd 1500 / thr 100 / cap 2000; 50K → 2000 / 150 / 3000;
100K → 3000 / 200 / 4000; 150K+ → 4500 / 250 / 5000.

**Cross-panel invariants** (each was a real bug; keep them true):
1. Combined P&L includes every account, breached ones too — Dashboard and Accounts must agree.
2. A scoped account's Funded Profit comes from `accMetrics`, mirrors included — never a
   `!derived` filter, which empties follower accounts.
3. Deposits (ED) reports Deposit *records* only; account funding is labelled
   "Initial funding, not transactions" on the Accounts side.
4. Daily-page tiles and the grid below them must use the same day set.

## Design Tokens
```
--color-bg            #0A0A0F      page
--color-surface       #101018      cards
--color-neutral-100   #14141C      insets / cells
--color-neutral-200   #1A1A24      chips, inputs
--color-neutral-300   #24242F      ring tracks
--color-divider       rgba(255,255,255,0.08)
--color-text          #EDEDF2
--color-neutral-600   #7A7A8C      muted labels
--color-neutral-700   #A0A0B0      body secondary
--color-accent-2      #F5A623      gold — brand, day counts, primary buttons
--color-accent        #FF4060      rose — danger, losses, breach
bull green            #3fb950
payout purple         #b085f5
info blue             #6ea8fe
```
Type: **Space Grotesk** headings (700/800, tight tracking), **Inter** body,
**JetBrains Mono** for every number (`.money`). Radii: 3px buttons, 8–12px cards,
99px pills. Rings: r=16.5, stroke 3.5, round cap, `rotate(-90 20 20)`,
circumference 103.67. Minimums: 10px uppercase labels at 0.1em tracking.

## Assets
No bitmap assets ship with the prototype — every image is a user-filled slot
(`image-slot.js`). Charts use Recharts via `charts.jsx`. Icons are inline SVG paths
defined in the source. If you have `icons/lmr-icon.png`, it replaces the sidebar "L" tile.

## Files
- `LMR Capitals App v2.dc.html` — **the canonical design.** The whole application,
  template + logic, in one file. Open it in a browser to click through every panel;
  it seeds ~60 trades across 5 accounts so all maths is visible with real numbers.
- `CLAUDE_CODE_START_HERE.md` — suggested build order and first prompts
- `brief.txt` — the original brief
- `variants/` — three earlier visual directions (v1 original, v3 Soft, v4 Newsprint).
  Reference only; **v2 is the design to build.**
- `image-slot.js` — paste/drop/capture image slot web component
- `charts.jsx` — Recharts wrappers used by the Performance panel
- `support.js` — prototype runtime (not part of the design; do not port)
