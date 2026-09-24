# START HERE — Claude Code brief

## What you are doing

There is an **existing, deployed LMR Capitals trading-journal app** backed by a **live Supabase project with real data in it**. There is also a **new design** (this bundle).

Your job is to **adopt the new design into the existing app, against the existing database** — not to build a new app and not to create a second database.

Two rules that override everything else:

1. **The existing Supabase project stays the source of truth.** No new project. No drops. No renames. No destructive migrations. Only additive changes.
2. **The HTML in this bundle is a design reference, not production code.** Recreate it in the app's existing framework and patterns. Do not ship the HTML.

---

## Step 0 — Before you touch anything

```bash
# full logical backup of the live DB
supabase db dump --db-url "$PROD_DB_URL" -f backup_$(date +%F).sql

# storage bucket backup (chart screenshots / receipts)
supabase storage download --recursive --experimental
```

Confirm the dump restores into a scratch database before continuing. Do not proceed without a verified restore.

---

## Step 1 — Read the current schema, don't assume it

Run this and save the output — every later step depends on it:

```sql
select table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
order by table_name, ordinal_position;

select conrelid::regclass as tbl, conname, pg_get_constraintdef(oid)
from pg_constraint where connamespace = 'public'::regnamespace;

select tablename, policyname, cmd, qual, with_check
from pg_policies where schemaname = 'public';
```

Write the result into `SCHEMA_ACTUAL.md` in the repo. `deploy-migration.sql` in this bundle is a **first cut written blind** — reconcile it against the real schema before running it anywhere.

---

## Step 2 — Work on a branch, never on prod

```bash
supabase branches create design-migration   # or a separate staging project
```

Restore the prod dump into the branch so you're testing the migration against **real data shapes**, not empty tables.

---

## Step 3 — Write the additive migration

Everything the new design needs that the old schema lacks. Every statement must be idempotent and non-destructive:

- `create table if not exists`
- `alter table … add column if not exists … ` (nullable, or with a default)
- new indexes `if not exists`
- RLS enabled on every new table, with the same `auth.uid() = user_id` pattern the existing tables use

**New tables the design needs** (verify each against `SCHEMA_ACTUAL.md` first — some may already exist under a different name):

| Table | Holds |
|---|---|
| `chain_days` | The Today/Chain record: premarket, weekly DOL, daily ROL/DOL, bias, london killzone, ny session, asian range, session traded, rth profile, plan notes, prediction, review notes, saved_at |
| `chain_refs` or `chain_days.refs jsonb` | Price references **in click order** — order is meaningful, use a jsonb array not a set |
| `pd_switches` | Array-commitment audit log: day, from_array, to_array, reason, switched_at |
| `monthly` | m-qshift, m-profile, m-seasonal, m-rate, m-pred, m-im, m-keylevels, saved_at |
| `weekly` | w-model, w-profile, w-range, w-phase, smt[], w-keylevels, w-pd, w-nq, w-es, w-ym, saved_at |
| `daily_pages` | Day narrative, session notes, graded fields |
| `reports` | AI performance reviews (title, sub, when, body) |
| `achievements`, `psych_scores` | Unlock state and rule-based scoring |
| `chart_images` | Storage path + slot id + scope. **Store the path only — the file goes in Supabase Storage, never base64 in a column.** |

**New columns on the existing `trades` table** (names may already exist — check first):
`pd_array`, `time_period`, `mmm`, `rth_profile`, `refs jsonb`

---

## Step 4 — Backfill / field mapping

The old app and the new design use different names for some of the same things. Write `backfill.sql` that maps old → new, one statement per field, each re-runnable. Typical cases in this app:

- Old `session` values were only `NY AM` / `NY PM`. The new design uses ten: `Asian Killzone, Midnight Open, London Open, London Kill Zone, Pre-NY Session, NY AM, London Close, NY Lunch, NY PM, Final Hour`. **Keep old values valid** — widen the check constraint, map nothing automatically, let the user re-tag historically if they want.
- Old `judas` and `london` were two fields; the new design merges them into one **London Killzone** field with values `Accumulation, Manipulation, Distribution, Judas London, Judas NY, Judas Both, No Judas`. Backfill: if `judas` set → `'Judas ' || judas`, else copy `london`. Keep the old columns in place (deprecated, not dropped) for one release.
- `asian` changed from an array (multi-select) to a single string. Backfill `asian = old_asian[1]` and log rows where the array had >1 element so the user can review them.
- Price references moved from a flat 30-item list to three groups (Premium side / EQ / Discount side) plus new entries (`Premium`, `Discount`, `Above/Below Swing High/Low`, `Above/Below Weekly/Monthly Open`, `Higher/Lower Quadrant`, `All time High`, `Daily ±OB`, `Daily SIBI/BISI/Wick/IFVG/Imbalance`, `HTF EQ/DRT/OTE`, `Suspension Block`, `00:00`, `18:00`, `9:30`). **All 30 original values are still valid** — this is purely additive. Preserve stored order.

Run backfill on the branch. Diff row counts and spot-check 20 rows against the live app before and after.

---

## Step 5 — Prove it on the branch

Point a local build of the app at the branch DB and check, against the live app side by side:

- net P&L, win rate, per-account balances, trailing drawdown — must match exactly
- day count / D-number anchoring
- every chart image still resolves from Storage
- RLS: a second test user sees **zero** rows

Only when all five pass do you touch prod.

---

## Step 6 — Ship

```bash
supabase db push --db-url "$PROD_DB_URL"   # migration
psql "$PROD_DB_URL" -f backfill.sql        # backfill
```

Then deploy the frontend. Migration first, frontend second — the additive schema is backwards-compatible, so the old frontend keeps working in between.

---

## Step 7 — The frontend work

Rebuild the screens from `LMR Capitals App v2.dc.html` in the app's existing framework. Structure and exact values are documented in `README.md` in this bundle. The parts that changed most in this round:

- **Today / The Chain** — monthly + weekly context cards at the top (each whole card is a click target that jumps to that month/week), grouped price-reference picker that collapses behind a toggle with an always-visible in-order sequence, session charts laid out as Daily/Weekly full width → 4H/1H · 15min · Inter-market in one 3-up row → Today's summary full width, today's trades last.
- **Sidebar** — fixed shell, nav scrolls independently of the profile footer, group expansion is static and does not react to the active panel.
- **Price references color rule** — clicking `Premium` turns that entry and every entry after it red; clicking `Discount` switches the rest to blue. Order of selection is data, persist it.

## Files in this bundle

- `LMR Capitals App v2.dc.html` — the full design (all panels), open it in a browser
- `README.md` — screen-by-screen spec, tokens, interactions
- `SUPABASE_WIRING.md` — how the design's state maps to tables
- `deploy-migration.sql` — first-cut additive migration (reconcile with `SCHEMA_ACTUAL.md` before running)
- `PLAN-migration-and-pd-arrays.md` — PD-array commitment rules and hard-block logic
- `*-section.html` — drop-in reference sections
- `support.js`, `charts.jsx`, `image-slot.js` — runtime the prototype uses (reference only, do not ship)
