# LMR Capitals — deploy guide

Written against the real repo: `LMR-Capitals/lmr-capitals-app@main`.

---

## What I can and cannot do

I have no network access to your Supabase project or your Netlify account, so
**I cannot run the deploy or execute SQL for you.** What I can do — and have
done — is read your actual schema and produce the exact migration and steps.
You (or Claude Code, which runs on your machine) execute them. Two commands and
one paste; roughly five minutes.

---

## 1. Your database does NOT need recreating

`app/supabase-setup.sql` already defines the full schema, and nine migration
files extend it:

| Table | Holds |
| --- | --- |
| `trades` | every logged trade, 28 columns incl. `models`/`emotions` as jsonb |
| `daily` | the daily chain, PK `(date, user_id)` |
| `monthly` / `weekly` | chain records keyed `2026-08` / `2026-08-W3`, body in `data` jsonb |
| `accounts` / `transactions` | prop accounts and the ledger |
| `journal` / `notes` | written entries |
| `lmr_observations` | observation posts |
| `lmr_achievements` | track record, with a public-read policy |
| `profiles` | settings, day-count calibration, goals |
| `weekly_reports` | saved AI reports |
| `payouts` / `targets` / `subscriptions` | payout requests, targets, access |

Row Level Security is enabled on all of them with `auth.uid() = user_id`, so
one user can never read another's journal. That part is already correct.

### The gaps

Four things the current app writes that the DB has no home for:

1. **`lmr_observations`** has only `title` and `content` — the panel also posts
   `date`, `kind`, `market`, `tags` and the chart image.
2. **`journal` and `notes` have no `image` column**, so a chart attached to an
   entry lives only in that browser's IndexedDB and vanishes on another device.
3. **No psychology table** exists at all.
4. **No indexes** on `(user_id, date)` — fine now, slow once the trade log grows.

`deploy-migration.sql` in this folder fixes all four. It is idempotent: every
statement is `IF NOT EXISTS` or drop-then-create on a policy, so running it
against your live data is safe and can be repeated.

---

## 2. Run the migration

Supabase dashboard → **SQL Editor** → New query → paste
`deploy-migration.sql` in full → **Run**.

Then verify:

```sql
select tablename, rowsecurity as rls
from pg_tables
where schemaname = 'public'
order by tablename;
```

Every row must read `rls = true`. If any table shows false, that table is
readable by any authenticated user — stop and fix it before deploying.

---

## 3. Deploy

`netlify.toml` is authoritative and overrides anything set in the Netlify UI:

```toml
[build]
  base    = "app"
  command = "npm ci && npm run build"
  publish = "dist"
```

It is a Vite multi-page build: the marketing landing is `index.html`, the
trading app is served at `/app` from `app.html`, the admin portal at `/admin`.

**Locally first — always:**

```bash
cd app
npm ci
npm run build
npm run preview        # open the /app route and click through every panel
```

**Then ship:**

```bash
git add -A
git commit -m "Add observation columns, entry images, psychology table"
git push origin main   # Netlify builds on push
```

Or `netlify deploy --prod` if you deploy from the CLI.

### Environment variables

Set in Netlify → Site configuration → Environment variables, for the
**Production** context:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Only the **anon** key. The service-role key must never reach a Vite build — it
is bundled into JavaScript that anyone can read, and it bypasses RLS entirely.

After changing an env var you must trigger a fresh deploy; Vite inlines these
at build time, so an existing deploy will not pick them up.

---

## 4. Existing data is untouched

The migration only adds columns, tables, indexes and policies. It contains no
`drop table`, no `delete`, no `alter column type`. Your trades, accounts and
chain records are read but never rewritten.

Still, take a backup first — Supabase dashboard → Database → Backups — because
a restore point costs nothing and an irreversible mistake is expensive.

---

## 5. Order of operations

Migration **before** deploy. The app upserts the new columns as soon as it
loads; if the code ships first, every sync fails with "column does not exist"
until the SQL runs.

1. Backup
2. Run `deploy-migration.sql`
3. Verify RLS
4. `npm run build` locally and click through
5. Push

---

## If you want me to go further

Tell me which and I will write it:

- **Wire the extracted sections to Supabase** — Psychology and Achievements
  still need their `sbSyncRecord` calls; the other drop-ins already have theirs.
- **A localStorage → Supabase import** — one-time script that reads an exported
  `state` JSON and upserts it into the right tables, so existing local-only
  data lands in the cloud.
- **Pull-side mapping** for the new columns, so `_sbDoPull()` reads back
  `kind`/`market`/`tags`/`image` instead of silently dropping them.
