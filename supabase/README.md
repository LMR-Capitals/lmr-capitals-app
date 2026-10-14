# supabase/

Directory read by the Supabase GitHub integration (Project Settings → Integrations,
working directory `.`).

- `migrations/` is an exact copy of the live project's migration history
  (`supabase_migrations.schema_migrations`): the same 34 versions, names and SQL. It was
  verified file by file against the live statements on 14 Oct 2026. The one exception is
  `20261013225551_create_lmr_automation_tokens.sql`, whose token hash is redacted
  because this repository is public. `20261014120000_security_hardening.sql` was
  added from `database/migrations/` after it was applied live; the live history stores
  no SQL text for it, so it is matched by version only.
- Because every version here is already applied, connecting the integration applies
  nothing. Only a **new** file added here is run against production.
- `config.toml` declares no Edge Functions or buckets, so billing functions in
  `database/functions/` are never deployed by the integration.

## Adding a database change

1. Create `supabase/migrations/<YYYYMMDDHHMMSS>_<name>.sql` with a timestamp later than
   the newest file. Write it additively (`if not exists`, no drops of live data).
2. Merge to `main`. The integration applies it to production and records the version.

Do not rename, edit or delete existing files here. Their versions must keep matching
the live history.

## Integration settings

- **Deploy to production**: on, production branch `main`.
- **Automatic branching**: leave off. Preview branches rebuild from these migrations
  alone. The original tables (`daily`, `trades`, `profiles`, `lmr_achievements`, …) were
  created in the dashboard before migrations were tracked, so a fresh branch build would
  fail.

`database/migrations/` stays as the development and test source used by `member/tests/`.
It also holds four Inner Circle function migrations (live executions, live
observations, Studio publication gate, Studio review sources) and the daily ROL/DOL
columns. These were applied to production outside the tracked history (their functions
and columns exist live), so they are not repeated here. It also holds the design v2
backfill, a one-time, re-runnable data update rather than a schema change.
