# LMR Capitals — database structure

22 existing tables + 2 new. Nothing is renamed or dropped.
New or newly-added items are marked **NEW**.

---

## Nav panel → table

| Panel | Table | State |
|---|---|---|
| Dashboard | *(derived from trades + accounts)* | no table |
| Today / The Chain | `daily` | +10 columns **NEW** |
| Monthly | `monthly` | +`saved_at` |
| Weekly | `weekly` | +`saved_at` |
| Daily Pages | `daily` | same table as Chain |
| Trades | `trades` | +7 columns **NEW** |
| Accounts | `accounts` | unchanged |
| Transactions | `transactions` | +4 columns |
| Knowledge | `lmr_terminology` | unchanged |
| Journal | `journal` | unchanged |
| Notes | `notes` | +`tags`, `updated_at` |
| Observation | `lmr_observations` | +`img_key`, `posted_to_discord` |
| Psychology | `lmr_psychology` | unchanged (jsonb) |
| Achievements | `lmr_achievements`, `lmr_ach_suppressions` | unchanged |
| AI Coach | `ai_chats` | unchanged |
| Reports | `weekly_reports` | +`kind`, `subtitle`, `updated_at` |
| Settings | `profiles` | +3 columns |
| Calendar | *(static news data)* | no table |
| Targets | `targets`, `target_events` | unchanged |
| — | `pd_switches` | **NEW TABLE** |
| — | `chart_images` | **NEW TABLE** |

Infrastructure: `admins`, `comp_access`, `subscriptions`, `copier_config`.

---

## daily — Today / The Chain

Primary key `(user_id, date)`.

| Column | Type | Notes |
|---|---|---|
| date | date | PK |
| user_id | uuid | PK |
| notion_id | text | legacy import id |
| day_count | integer | D-number |
| name | text | |
| bias | text | Bullish / Bearish / Neutral |
| weekly | text | |
| htf_poi | text | legacy — premarket read from here |
| week_draws | text | weekly draw / run / draw |
| london | text | legacy — superseded by `london_killzone` |
| ny | text | NY session profile |
| asian_range | jsonb | legacy array — superseded by `asian_single` |
| session | text | one of 10 killzones |
| rth | text | RTH delivery profile |
| plan | text | Followed / Unfollowed |
| pred | text | Correct / Incorrect |
| monthly_bias | text | |
| **price** | **jsonb** | **price references, ORDERED array — click order is data** |
| saved_at | timestamptz | |
| weekly_key | text | the Monday's date |
| day_status | text | Green / Red / Yellow / Off Day |
| **premarket** | text | **NEW** |
| **london_killzone** | text | **NEW** — merges old judas + london |
| **asian_single** | text | **NEW** — single value, replaces the array |
| **pd_array** | text | **NEW** — committed PD array |
| **review_notes** | text | **NEW** |
| **img_daily** | text | **NEW** — Storage path |
| **img_4h1h** | text | **NEW** |
| **img_15m** | text | **NEW** |
| **img_im** | text | **NEW** — inter-market |
| **img_summary** | text | **NEW** |
| **updated_at** | timestamptz | **NEW** |

### price — the reference sequence

Stored as an ordered JSON array. Order is meaningful; do not use a set.

```json
["Premium", "PWH", "NWOG", "Discount", "PDL"]
```

Colour rule, applied left to right at render time:
- starts neutral
- `Premium` → that entry and everything after it is **red**
- `Discount` → that entry and everything after it is **blue**

The three picker groups:
- **Premium side** — Premium, Above Swing High, Above Weekly/Monthly Open, PMH, PWH, PDH, Higher Quadrant, All time High, London High, Asian High, RTH High, Old High
- **EQ** — NWOG, NDOG, FVG, IFVG, BPR, OB, Breaker, Mitigation, EQ, OTE, Midnight Open, True Day Open, SD Target, Liquidity Void, Volume Imbalance, DOL, Daily ±OB, Daily SIBI/BISI/Wick/IFVG/Imbalance, HTF EQ/DRT/OTE, Suspension Block, 00:00, 18:00, 9:30
- **Discount side** — Discount, Below Swing Low, Below Weekly/Monthly Open, PDL, PWL, PML, Lower Quadrant, London Low, Asian Low, RTH Low, Old Low

### session — the 10 killzones

`Asian Killzone, Midnight Open, London Open, London Kill Zone, Pre-NY Session, NY AM, London Close, NY Lunch, NY PM, Final Hour`

### london_killzone

`Accumulation, Manipulation, Distribution, Judas London, Judas NY, Judas Both, No Judas`

---

## trades

| Column | Type | Notes |
|---|---|---|
| id | text | PK |
| user_id | uuid | |
| notion_id | text | |
| account_id | text | → accounts.id |
| date | date | |
| day_count | integer | |
| market | text | |
| position | text | Long / Short |
| day, month | text | |
| session | text | |
| time_period | text | macro window |
| models | jsonb | |
| confirmations | jsonb | |
| emotions | jsonb | |
| phases | jsonb | |
| mmm | jsonb | |
| movement | jsonb | |
| tframes | jsonb | |
| rth | text | |
| htf | text | |
| pnl | numeric | |
| risk | numeric | |
| lots | numeric | |
| draws | text | |
| feedback | text | |
| rr | numeric | |
| win | boolean | |
| locked | boolean | |
| open_time, close_time | text | |
| updated_at | timestamptz | |
| **pd_array** | text | **NEW** |
| **refs** | jsonb | **NEW** — ordered, same rule as daily.price |
| **plan_followed** | boolean | **NEW** |
| **grade** | text | **NEW** |
| **img_entry** | text | **NEW** — Storage path |
| **img_exit** | text | **NEW** |
| **created_at** | timestamptz | **NEW** |

---

## monthly / weekly

Both are `(user_id, key)` + a `data` jsonb blob. Everything the design adds lives inside `data` — **no schema change needed**.

`monthly.data` keys: `m-qshift`, `m-profile`, `m-seasonal`, `m-rate`, `m-pred`, `m-im`, `m-keylevels`

`weekly.data` keys: `w-model`, `w-profile`, `w-range`, `w-phase`, `smt[]`, `w-keylevels`, `w-pd`, `w-nq`, `w-es`, `w-ym`

`weekly` also has `week_key` (PK, the Monday's date) and `monthly_key`.

---

## pd_switches — NEW

Audit log for the hard-block rule. A trade outside the committed PD array is refused unless the array is switched, and every switch is recorded.

| Column | Type |
|---|---|
| id | text PK |
| user_id | uuid |
| date | date |
| from_array | text |
| to_array | text (not null) |
| reason | text |
| switched_at | timestamptz |

---

## chart_images — NEW

Storage paths only. Never base64 in a column.

| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| user_id | uuid | |
| slot_id | text | e.g. `today-2026-08-24-15m` |
| scope | text | daily / trade / journal / monthly / weekly |
| ref_id | text | the owning row's id or date |
| storage_key | text | path in the `lmr-images` bucket |
| width, height | integer | |
| created_at | timestamptz | |

Unique on `(user_id, slot_id)`.

Bucket `lmr-images` is private; policy scopes objects to `auth.uid()` as the first path segment.

---

## transactions

Existing: `id, user_id, notion_id, account_id, date, type, amount, note, status, tx_id, image, updated_at`
Added: **`currency`**, **`method`**, **`receipt_key`**, **`created_at`**

`type` drives the three ledgers: Deposits/Fees, Payouts, Withdrawals. Amounts stored positive; the sign is display-only.

---

## profiles — settings

Already holds `settings jsonb`, `current_acc`, `day_count_start`, `day_count_start_date`, `theme`, `balance_format`, `cal_month`, goals and risk defaults.
Added: **`discord_webhook`**, **`pd_hard_block`** (default true), **`density`**.

---

## weekly_reports

Existing: `id, user_id, week_start, week_end, title, content, metrics, created_at`
Added: **`kind`** (default `'weekly'`), **`subtitle`**, **`updated_at`** — so period-agnostic AI performance reviews share the table.

---

## RLS

Every table uses `auth.uid() = user_id`. The two new tables get a single `for all` policy matching that pattern. Storage objects are scoped by folder name.

---

## Run order

1. `schema.sql` — additive, idempotent, safe on a live project
2. `backfill.sql` — maps old shapes to new, re-runnable
3. Check the last verification query returns four zeros
