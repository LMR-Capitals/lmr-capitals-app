# Field map — new design → live Supabase columns

Reconciled against the **actual applied schema** (`supabase/migrations/`). Note: the
handoff's `SUPABASE_WIRING.md` was written partly blind — several columns it says to
"add" already exist, and two of its suggested names differ from what we actually applied.
This file is the source of truth for the build.

## Already present (no work) — the wiring doc's "needs a migration" is already done
`accounts`: `firm, firm_id, plan, account_no, size, dd_limit, eval_target, dd_type,
split, is_live, payout_rule, copier` — all exist. Extend the accounts upsert to send them.

## Naming reconciliations (design term → real column)
| Design field | Wiring doc guess | **Actual column to use** |
|---|---|---|
| Quick notes (daily) | `daily.notes` | **`daily.review_notes`** (applied) |
| Transaction receipt | `transactions.img_key` | **`transactions.receipt_key`** (applied); base64 stays in existing `transactions.image` via `_txImageSync` |
| Trade macro time | `macro_time` / fold | **fold into existing `trades.time_period`** |

## New columns added by the v2 migration (use these)
- `daily`: `premarket, london_killzone, asian_single, pd_array, review_notes,
  img_daily, img_4h1h, img_15m, img_im, img_summary, updated_at`
- `trades`: `pd_array, refs (jsonb), plan_followed, grade, img_entry, img_exit, created_at`
- `transactions`: `currency, method, receipt_key, created_at`
- `weekly` / `monthly`: `saved_at`
- `weekly_reports`: `kind, subtitle, updated_at`
- `profiles`: `discord_webhook, pd_hard_block, density`
- `notes`: `tags (jsonb), updated_at`
- `lmr_observations`: `img_key, posted_to_discord`
- NEW tables: `pd_switches` (PD-array change audit), `chart_images` (Storage path index)
- Storage bucket: `lmr-images` (private, per-user RLS)

## Backfill already applied (old → new, non-destructive; old columns retained)
- `asian_range[0]` → `asian_single`   (old `asian_range` jsonb array kept)
- `london` → `london_killzone`        (old `london` kept; merge `judas` at build time:
  `'Judas ' || judas` when judas set, else `london`)
- `htf_poi` → `premarket`             (old `htf_poi` kept)
- `rth` (when it reads like a PD label) → `pd_array`
- `price`: normalised to a jsonb **array** — **order is data**, preserve it
- `transactions.image` → `receipt_key`; `currency` defaulted to USD
- `weekly`/`monthly` rows created for every period that has daily data

## Invariants to honour (from README + current code)
- `_accMetrics(acc)` (index.html ~14422 / `computePayoutState` ~10991) is the single
  source of truth for balance / floor / drawdown / payout eligibility. Do not inline maths.
- Net P&L excludes copier mirror copies (`_mirrorTradeIds()`); the Trades stats strip,
  Dashboard and Accounts must all agree.
- Keep every `save()` / `sbSyncRecord(table, record)` call site; only the produced DOM changes.
- Do not touch `_switchUserStore()`, `STORE_KEY`, the `lmr_active_uid` handshake, the
  quota-safe `save()`, `saveImg`/`getImg`, or `_sbUpsertAll`'s error collection.
