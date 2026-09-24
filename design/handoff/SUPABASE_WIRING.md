# Wiring the new design to your live Supabase data

Your existing app (`index.html`, ~14,600 lines) already has a complete, working
storage layer. **Do not rebuild it.** The port is: keep that layer exactly as-is,
and replace the markup and render functions above it with the new design.

## The storage architecture you already have

Three tiers, per your own notes:

| Tier | Role | Key detail |
|---|---|---|
| **Supabase** | source of truth | tables: `trades, accounts, transactions, notes, journal, daily, weekly, monthly, lmr_observations, lmr_achievements, targets, payouts` |
| **localStorage** | cache only | `lmr_v3_state__<uid>` + `_bk` backup. Quota-safe `save()`. **Never** base64 images here. |
| **IndexedDB** | chart/block images | `saveImg` / `getImg` / `compress`, keyed by entry id. Mirrors to Supabase Storage. |

Client init lives at `index.html` line ~12506 (`SB_URL`, `SB_KEY`, `_sbClient()`).
Per-user isolation is handled by `_switchUserStore(uid)` — leave it untouched.

## Field mapping: design state → your Supabase columns

The design's `README.md` § State Management describes an in-memory shape. Your
`_mapTrade()` / `_mapDaily()` (line ~5490) already translate that shape to Supabase.
Where the design adds a field your schema lacks, the choices are below.

### trades — `_mapTrade(t, uid)` covers everything
Design fields map 1:1: `market, position, session, models[], confirmations[],
emotions[], phases[], mmm[], movement[], tframes[], rth, htf, pnl, risk, lots, rr,
openTime→open_time, closeTime→close_time, draws, feedback`, plus derived `win`.

Design field with **no column yet**: `macroTime`. Either fold it into the existing
`time_period` column, or add `macro_time text`. Folding is simpler and loses nothing.

### accounts — needs a migration
Your upsert sends only base columns:
`id, user_id, notion_id, name, type, status, date, deposit`.

The new Accounts panel and the nine-firm rulebook need these snapshotted per account
so a later catalogue edit never rewrites history:

```sql
alter table accounts
  add column if not exists firm         text,
  add column if not exists firm_id      text,
  add column if not exists plan         text,
  add column if not exists account_no   text,
  add column if not exists size         numeric,
  add column if not exists dd_limit     numeric,
  add column if not exists eval_target  numeric,
  add column if not exists dd_type      text,
  add column if not exists split        numeric,
  add column if not exists is_live      boolean default false,
  add column if not exists payout_rule  text,
  add column if not exists copier       jsonb;
```

Until that runs, those fields persist locally only — which is exactly the state
your current code comments describe ("extended fields persist locally until the
accounts migration is run", line ~7935). Run the migration, then extend the
accounts upsert to send them.

Note your schema uses `type` (Eval/Funded) and `deposit`; the design calls these
`status` and `size`. **Keep your column names** and rename in the design, not the
reverse — your data already lives under them.

### transactions — one column short
Sent today: `id, user_id, notion_id, account_id, date, type, amount, note, status`.
The design's receipt thumbnail needs an image reference:

```sql
alter table transactions add column if not exists img_key text;
```

You already have `_txImageSync(x.id, x.image)` probe-guarded against a missing
column — so this is additive and safe.

### daily — `_mapDaily()` already carries 14 of the 15 fields
Present: `bias, weekly, htf_poi, week_draws, london, ny, session, rth, plan, pred,
monthly_bias, day_status, asian_range[], price[], saved_at`.

Missing: the design's **Quick notes** field.
```sql
alter table daily add column if not exists notes text;
```
Then add `notes:d.notes||null` to `_mapDaily()`.

### journal / notes — no change
`journal` takes `{id, user_id, date, title(=type), content(=text), created_at}`;
`notes` takes `{id, user_id, title, text, date, created_at}`. The design's per-entry
`imgKey` goes to IndexedDB via `saveImg`, not to a column — same as today.

### payouts — verify it exists
Your notes list a `payouts` table but `_sbUpsertAll` never writes it; the payout
flow at line ~11605 writes a **transaction** with `type:'Payout'` instead. The new
Payout panel reads payout records for its history table and win-day gate. Simplest
path: derive payout history from `transactions where type='Payout'` and skip the
table entirely. That keeps one source of truth.

## Order of work

1. **Run the migrations above** in the Supabase SQL Editor. Additive only — nothing
   existing breaks, and the app keeps working between each one.
2. **Extend the three upsert bodies** (`accounts`, `transactions`, `_mapDaily`) to
   send the new columns.
3. **Port `accMetrics(acc)`** from the design as the single balance/drawdown/payout
   calculator, and replace the ad-hoc maths currently spread across
   `renderAccountCards`, `renderPayoutModule`, `updateAllStats` and `_accAutoBlow`.
   Your existing `_accMetrics`-style helper at line ~14422 already computes
   `m.balance` and `m.ddFloor` — reconcile to one function, tested.
4. **Replace panel markup one panel at a time**, newest design first: Accounts →
   Transactions → Payout → Trades → the Chain. Each panel's render function keeps
   its name and its `save()` / `sbSyncRecord()` calls; only the DOM it produces changes.
5. **Keep every `sbSyncRecord(table, record)` call site.** They are what make saves
   instant in the cloud. The design's "autosave + toast" behaviour is precisely this
   plus a `flash()`.

## What must not change

- `_switchUserStore()`, `STORE_KEY`, and the `lmr_active_uid` handshake — this is
  what stops one signed-in account seeing another's cached journal on a shared device.
- The quota-safe `save()` and the "no base64 in localStorage" rule.
- `saveImg`/`getImg` for every chart image. The design has more image slots than the
  current app, so slot ids must stay stable and unique or drops will collide.
- `_sbUpsertAll`'s error collection — it exists because a silent column mismatch once
  reported "Synced" while writing nothing.
