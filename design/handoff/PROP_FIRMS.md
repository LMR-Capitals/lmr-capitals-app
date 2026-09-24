# Accounts: prop firms, account creation, eval and payout rules

Brief for Claude Code. It covers every firm, how an account is created, and how each account's eval, drawdown and payout rules are stored and checked.

Files in this folder:
- `prop-firms.json` is the firm catalogue: 10 firms. Funded Futures Family has full numbers for every plan and size.
- `PROP_FIRMS.md` is this file.

---

## 1. Firms

| # | Firm | id | Plans | Sizes |
|---|---|---|---|---|
| 1 | Tradeify | `tradeify` | Growth, Select, Lightning | 25K–150K |
| 2 | Apex | `apex` | Full 1-step | 25K–300K |
| 3 | Topstep | `topstep` | Trading Combine, Live Funded | 50K–150K |
| 4 | Take Profit Trader | `tpt` | PRO, PRO+ (live) | 25K–150K |
| 5 | Blue Guardian | `blue` | Standard, Guardian | 25K–150K |
| 6 | Lucid Trading | `lucid` | LucidPro, LucidFlex | 25K–150K |
| 7 | MyFundedFutures | `mff` | Rapid, Flex, Pro, Builder | 25K–150K |
| 8 | FundedNext | `fnext` | Stellar, Rapid Pro, Rapid Daily | 25K–200K |
| 9 | **Funded Futures Family** | `fff` | Prime, Prime Max, Premier+ Fast Pass, Premier+ Standard, Velocity, Velocity + Daily, S2F Standard, S2F Accelerate | 25K–150K |
| 10 | Alpha Futures | `alpha` | Zero, Advanced, Premium | 25K–150K |

Where the numbers come from:
- **Funded Futures Family:** taken from the firm's own plan pages, reviewed September 2026.
- **The other nine:** the summary rulebook already in the app, with an eval target and max drawdown per size. Their per-plan details are text summaries only. Verify them against each firm's help centre before relying on exact payout caps.

---

## 2. Account types

Every account has a **type**, set by where it is in the firm's lifecycle:

| Type | Meaning | Rules that apply |
|---|---|---|
| `eval` | Buying the evaluation, not yet passed | Eval rules: profit target, max loss, min days, eval consistency |
| `funded` | Passed, or instant-funded (S2F) | Funded rules: drawdown, funded consistency, payout gates, scaling |
| `live` | Moved to a real account (Topstep Live, TPT PRO+, FFF Professional) | Same as funded, flagged live |
| `blown` | Breached | Read-only; keeps its history |
| `passed` | Eval passed, funded account not opened yet | Transitional |

Status tabs on the Accounts page: **All · Evaluation · Funded · Passed**. Blown accounts are hidden by the "hide failed" toggle.

Instant-funding plans (FFF S2F, Tradeify Lightning, FundedNext Rapid) skip `eval` and start as `funded`.

---

## 3. Account creation flow

**Form fields, in order:**
1. **Prop firm:** dropdown of the 10 firms. The firm choice drives everything below.
2. **Plan:** dropdown of that firm's plans only.
3. **Drawdown mode:** only shown when the plan offers a choice (FFF Premier+: Intraday or EOD).
4. **Account size:** dropdown of that plan's sizes only (S2F Accelerate is 50K only).
5. **Status:** Eval / Funded. Instant plans force Funded.
6. **Account name:** auto-filled as `Firm Size · NN`, editable.
7. **Account number:** the firm's own id.
8. **Start date.**
9. **Rulebook preview (read-only):** shows the target, max loss, drawdown type, daily loss limit, min days, consistency, split and payout rule for the chosen firm, plan and size, before saving.

**On save, copy the rules onto the account** so later catalogue edits never change an existing account:

```js
account = {
  id, user_id, name, firm, firm_id, plan, account_no, size, start_date,
  type: status === 'Eval' ? 'eval' : 'funded',
  status,
  dd_limit:     rules.maxLoss,        // $ allowance
  dd_type:      rules.drawdown,       // 'EOD' | 'Intraday trailing' | 'Static'
  eval_target:  rules.profitTarget,   // null for instant plans
  split:        rules.split,          // 90
  is_live:      firm.isLive,
  payout_rule:  rules.payoutSummary,  // display text
  rules: {                            // full copy of the plan + size, used by the gate checks
    firmId, planId, size, ddMode,
    eval:   { profitTarget, maxLoss, minDays, consistencyPct, dailyLossLimit },
    funded: { drawdown, locksAt, consistencyPct, consistencyResets, scaling },
    payout: { split, minTradingDays, qualifyingDay, qualifyingDays,
              profitTargetBetween, bufferBalance, maxPayoutPct,
              maxPayoutByIndex: [p1, p2, p3, p4plus] }
  },
  snapshot_at: now()
}
```

This fits the existing `accounts` table: `rules jsonb` holds the full copy, and the flat columns are for lists and sorting. No schema change is needed.

**Passing an eval:** when the eval target is hit and no rule is broken, set `status = 'passed'`. The "Open funded account" action creates a new `funded` account that copies the same firm and plan's funded and payout rules, and sets `funded_spawned = true` on the eval account.

---

## 4. Rule checks (computed from trades)

For each account, walk its trades day by day in date order.

**Drawdown floor:**
- `EOD`: the peak is the highest closing balance. `floor = peak − dd_limit`. It stops moving once it reaches the starting balance on firms that lock there (FFF EOD, Tradeify funded +$100, Blue Guardian +$100).
- `Intraday trailing`: same, but the peak includes unrealised highs. The trade log only has closing P&L, so treat each trade's P&L as the intraday extreme. Show this as an approximation.
- `Static`: `floor = start − dd_limit`, and it never moves.
- **Breach:** balance ≤ floor at any point. Set `status = 'blown'` and `blown_at`.

**Daily loss limit:** if the plan has one and a day's P&L is at or below `−dll`, flag it. FFF has none on any plan.

**Eval progress:** `profit / eval_target` as the ring, plus days traded against `minDays`, plus the consistency check below.

**Consistency:** `best day profit ÷ total profit in the window ≤ consistencyPct`. The window is the whole eval, or the current payout cycle once funded. S2F Accelerate never resets it.

**Payout eligibility:** every item must pass.
1. Enough qualifying days in the cycle (days with at least `qualifyingDay` profit, e.g. $200).
2. Enough trading days in the cycle, where the plan sets a minimum.
3. Profit since the last payout is at least `profitTargetBetween`.
4. Balance after the payout stays at least `bufferBalance` (FFF Prime: drawdown + $100). Premier+ only needs $1 of net profit since the last payout.
5. The consistency check passes, unless the plan waives it (e.g. Velocity with the Daily Add-On).
6. `amount = min(profit × maxPayoutPct, maxPayoutByIndex[n])`, where n is the number of payouts already taken.
7. Lifetime payouts across all FFF accounts ≤ $100,000, and at most 5 active funded FFF accounts.

When a payout is requested, write a `transactions` row with `type = 'payout'` and start a new cycle. The qualifying-day count and the consistency window restart from that date.

---

## 5. Funded Futures Family: full rules

Firm-wide:
- 90/10 split from the first dollar
- no daily loss limit
- a qualifying day is $200 or more profit
- $100K lifetime payout cap per user
- at most 5 active funded accounts per household, across all plans
- up to 3 funded resets per account
- news trading allowed
- more than 50% of trades and of profits must come from positions held longer than 10 seconds
- payouts go through Rise, with instant approval

### Prime (monthly, EOD drawdown)
| Size | Price (Prime Max) | Target | Max loss | Contracts (Max) | Funded reset |
|---|---|---|---|---|---|
| 25K | $129 ($144) | $1,250 | $1,000 | 2 (3) | $499 |
| 50K | $179 ($204) | $3,000 | $2,000 | 4 (5) | $649 |
| 100K | $279 ($319) | $6,000 | $3,000 | 6 (10) | $1,099 |
| 150K | $365 ($425) | $9,000 | $4,500 | 10 (15) | $1,499 |

- **Eval:** can pass in 1 day. No consistency rule, no daily loss limit.
- **Funded:** needs 3 trading days and a profit target between payouts. 40% consistency per cycle. Balance must stay above the buffer.

| Size | Target between payouts | Buffer balance | Max payout 1 | Max payout 2+ |
|---|---|---|---|---|
| 25K | $300 | $26,100 | $1,000 | $1,500 |
| 50K | $500 | $52,100 | $2,000 | $2,500 |
| 100K | $750 | $103,100 | $3,000 | $3,500 |
| 150K | $1,000 | $154,600 | $3,500 | $4,000 |

### Premier+ (monthly, choose Intraday or EOD at purchase)
| Size | Fast Pass (intraday / EOD) | Standard (intraday / EOD) | Target | Max loss (intraday / EOD) | Contracts* |
|---|---|---|---|---|---|
| 25K | $114 / $144 | $89 / $119 | $1,500 | $1,000 / $750 | 2 |
| 50K | $154 / $194 | $119 / $159 | $3,000 | $2,000 / $1,500 | 4 |
| 100K | $229 / $299 | $189 / $249 | $6,000 | $3,000 / $2,500 | 6 |
| 150K | $319 / $529 | $259 / $459 | $9,000 | $4,500 / $4,000 | 10 |

\*Flat maximum for accounts bought from 9 Sep 2026, with no scaling plan.

- **Eval:** Fast Pass can pass in 1 day with no consistency rule. Standard needs 2 or more days, with a 50% consistency rule.
- **Funded:** 40% consistency, which resets after each payout. Accounts bought before 9 Sep 2026 have none. There is no buffer; you only need $1 of net profit since your last payout.
- **Payout:** every 5 qualifying days. Each payout is 50% of profit, capped by size:

| Size | Cap per payout |
|---|---|
| 25K | $1,000 |
| 50K | $2,000 |
| 100K | $2,500 |
| 150K | $3,000 |

### Velocity (monthly, intraday trailing drawdown in eval and funded)
| Size | Price (+ Daily Add-On) | Target | Max loss | Contracts | Funded reset |
|---|---|---|---|---|---|
| 25K | $79 ($108) | $2,500 | $1,250 | 3 | $499 |
| 50K | $125 ($164) | $4,000 | $2,250 | 5 | $649 |
| 100K | $225 ($284) | $7,000 | $3,250 | 10 | $1,099 |
| 150K | $325 ($394) | $10,000 | $4,750 | 15 | $1,499 |

- **Eval:** 3 days minimum, with a 40% consistency rule.
- **Funded (standard):** 3 trading days and 3 winning days of $200 or more between payouts, plus a profit requirement. 40% consistency.
- **With the Daily Add-On:** payouts can be requested daily. There is no day count and no consistency rule.

| Size | Profit between payouts | Max payout (standard) | Max payout (Daily Add-On) |
|---|---|---|---|
| 25K | $1,500 | $750 | $600 |
| 50K | $3,000 | $1,250 | $1,000 |
| 100K | $6,000 | $2,250 | $1,500 |
| 150K | $9,000 | $3,250 | $2,500 |

### S2F Standard (one-time fee, instant funded, EOD drawdown locking at the start balance)
| Size | Price | Max loss | Starting trail | Contracts |
|---|---|---|---|---|
| 25K | $329 | $1,000 | $26,000 | 1 |
| 50K | $469 | $2,000 | $52,000 | 5 (starts at 3) |
| 100K | $629 | $3,000 | $103,000 | 10 |
| 150K | $734 | $4,500 | $154,500 | 15 |

- **Payout:** 7 qualifying days ($200 or more each), on a 7-day cycle. 25% consistency, which resets after each payout.

| Size | Profit goal, payout 1 | Profit goal, payout 2+ | Max payouts 1–3 | Max payout 4 |
|---|---|---|---|---|
| 25K | $1,500 | $1,000 | $1,000 | $1,000 |
| 50K | $3,000 | $2,000 | $2,000 | $2,500 |
| 100K | $6,000 | $3,000 | $2,500 | $3,000 |
| 150K | $9,000 | $4,500 | $3,000 | $3,500 |

### S2F Accelerate (50K only, one-time $499)
- $2,000 intraday trailing drawdown that never locks.
- 5 minis from day one.
- 5 qualifying days per payout.
- 25% consistency for the life of the account; it never resets.
- Max payouts: $1,250, $1,250, $1,500, then $1,500.

### Funded scaling (Prime, Velocity, S2F, and Premier+ bought before 9 Sep 2026)
Contract limit by simulated profit, recalculated at the end of each session:

| Profit | 25K | 50K | 100K | 150K |
|---|---|---|---|---|
| $0–999 | 1 | 3 | 4 | 5 |
| $1,000–1,499 | 2 | 3 | 4 | 5 |
| $1,500–1,999 | 2 | 4 | 6 | 7 |
| $2,000–2,999 | 3 (max) | 5 (max) | 7 | 10 |
| $3,000–4,499 | — | — | 10 (max) | 12 |
| $4,500+ | — | — | — | 15 (max) |

---

## 6. The other nine firms (summary rulebook)

These come from `prop-firms.json` → `firms[].summary` and `bySize`.

| Firm | Eval DD | Funded DD | Daily loss limit | Min days | Consistency | Split | Payout | After payout |
|---|---|---|---|---|---|---|---|---|
| Tradeify | EOD trailing | EOD, locks at floor + $100 | Growth $1,250 · Select none | Select 3 · Growth 1 | 35–40% eval · 40% funded | 90% | 1st: any profit · 2nd+: positive since last | Consistency resets each cycle |
| Apex | EOD (intraday opt-in) | EOD, unchanged | None | 7 days | None eval · 50% funded | 100% | 5 qualifying days · min $500 | Cap scales · PA closes after 6 payouts |
| Topstep | Intraday trailing | EOD (XFA) | Removed 2024 | 5 days ≥ $150 | 40% | 90% | 5 win days · above start | MLL resets to $0 |
| Take Profit Trader | EOD trailing | PRO intraday · PRO+ EOD | Removed Jan 2025 | 5 days | 50% max per day | PRO 80% · PRO+ 90% | PRO: clear start + DD buffer · PRO+: day 1 | Daily payouts once buffer cleared |
| Blue Guardian | EOD (6% static) | EOD, unchanged | Standard $1,250–3,750 · Guardian none | 5 days | Std 40% · Guardian 30% | 100% first $15K, then 90% | 48h · Reserve: 5 win days | Floor locks at start + $100 |
| Lucid Trading | EOD trailing | EOD, unchanged | Pro 20% of target · Flex none | 5 days | 50% eval · Pro 40% funded | 100% first $10K, then 90% | ~15 min average | 90% after first $10K |
| MyFundedFutures | EOD trailing | EOD, unchanged | None | 5 days | 50% eval | Rapid 90% · Flex/Pro 80% | Clear buffer $1,100–4,600 first | Rapid daily · Flex 5 win days · Pro 14 days |
| FundedNext | Stellar static · Rapid EOD | Same as eval | Stellar 5%/day · Rapid optional | 5 days | None eval · 40% funded | Stellar 80% · Rapid 90% | 40% consistency per cycle | Re-checked each cycle |
| Alpha Futures | EOD (4% MLL) | EOD, unchanged | None | Zero 1 · Adv 3 · Prem 5 | Zero none · Prem 30% | 90% | 5 win days ≥ $200 · max 50% of profit | 50% stays as buffer |

Eval target and max drawdown by size:

| Firm | 25K | 50K | 100K | 150K | Larger |
|---|---|---|---|---|---|
| Tradeify | 1,500 / 1,250 | 3,000 / 2,000 | 6,000 / 3,000 | 9,000 / 4,500 | |
| Apex | 1,500 / 1,500 | 3,000 / 2,500 | 6,000 / 3,000 | 8,000 / 3,000 | 250K 12,500 / 3,500 · 300K 15,000 / 4,500 |
| Topstep | | 3,000 / 2,000 | 6,000 / 3,000 | 9,000 / 4,500 | |
| Take Profit Trader | 1,500 / 1,500 | 3,000 / 2,000 | 6,000 / 3,000 | 9,000 / 4,500 | |
| Blue Guardian | 1,500 / 1,500 | 3,000 / 3,000 | 6,000 / 6,000 | 9,000 / 9,000 | |
| Lucid Trading | 1,500 / 1,000 | 3,000 / 2,000 | 6,000 / 3,000 | 9,000 / 4,500 | |
| MyFundedFutures | 1,500 / 1,500 | 3,000 / 2,500 | 6,000 / 3,000 | 9,000 / 4,500 | |
| FundedNext | 2,500 / 2,500 | 5,000 / 5,000 | 10,000 / 10,000 | | 200K 20,000 / 20,000 |
| Alpha Futures | 1,500 / 1,000 | 3,000 / 2,000 | 6,000 / 3,000 | 9,000 / 4,500 | |

To give these nine the same level of detail as FFF, add a `planRules[]` array to each firm in `prop-firms.json` using the FFF structure. The gate logic in §4 reads `planRules` when it exists and falls back to `summary` and `bySize` otherwise.

---

## 7. Where it lives

| What | Where |
|---|---|
| Firm catalogue | `prop-firms.json`, shipped with the app (read-only) |
| An account and its copied rules | `accounts` table: flat columns plus `rules jsonb` |
| Trades per account | `trades.account_id` |
| Payouts, deposits, fees, withdrawals | `transactions` (`type`) |
| Copier leader/follower | `accounts.copier jsonb`, `copier_config` |

No new tables are needed.
