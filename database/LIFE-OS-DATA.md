# Life OS data (LMR Supabase)

Life OS stores its data in the existing LMR Supabase project (`agrvylclhvxyevsmmexf`), not a
separate project. Two tables, both already live. Their migrations are recorded in
`migrations/` under the same versions as the live `supabase_migrations.schema_migrations` rows,
so they are a reference — do not re-apply them.

| Migration | Object | Purpose |
|---|---|---|
| `20261012011215_life_os_admin_workspace.sql` | `public.life_os_workspaces`, `public.life_os_save_workspace(integer, jsonb)` | The whole Life OS workspace for one user, as one JSON document |
| `20261012013907_create_lmr_week_plans.sql` | `public.lmr_week_plans` | Weekly trading plan history, one row per week |

`patches/life-os-admin-workspace.sql` is the original copy of the first migration.

## `life_os_workspaces`

One row per user: `user_id` (PK → `auth.users`, cascade), `version`, `payload jsonb`, `updated_at`.

- **Access:** RLS select/insert/update only when the row is the caller's, `is_admin()` is true and
  the session is `aal2` (MFA verified). No delete policy. `anon` has no grants.
- **Writes** go through `life_os_save_workspace(p_version, p_payload)` (`life-os/repository.mjs`):
  - `p_version = 0` creates the row (version 1); a second create is refused.
  - otherwise it updates only if `p_version` matches the stored version, then increments it.
    A stale version raises `40001 Newer workspace changes exist` — optimistic locking, so two
    open tabs cannot silently overwrite each other.
  - The payload must be an object ≤ 20 MB with `goals`, `tasks`, `reviews`, `reminders` and
    `habits` arrays. Other keys are stored as-is.
- **Payload keys in use:** `goals`, `tasks`, `habits`, `reviews`, `reminders`, `roadmap`,
  `deadlines`, `financialReference`, `achievementRecords` (images compressed inline),
  `weekPlan`, `weekPlanChecks`, `privacy`, `referenceDate`.

## `lmr_week_plans`

Primary key `(user_id, week_key)`, e.g. `2026-10-W2`. Columns: `week_start`, `week_end`, `title`,
`summary`, `plan jsonb`, `content_md`, `outcome jsonb`, `outcome_md`, `created_at`, `updated_at`.
Index `(user_id, week_start desc)`. The Sunday Week Plan automation writes a row; the Friday
review fills `outcome`/`outcome_md`. Life OS reads the newest rows and falls back to
`payload.weekPlan` for the current week.

- **Access:** RLS owner-only select/insert/update (`auth.uid() = user_id`). No delete policy.

## Live state (checked 2026-10-14, read-only)

- `life_os_workspaces`: 1 row, version 15, ~9 KB, last saved 2026-10-13. 7 goals, 8 tasks,
  5 roadmap items, 4 deadlines, 1 reminder, 6 financial reference entries, 0 habits/reviews/achievements.
- `lmr_week_plans`: 1 row (`2026-10-W2`).
- Live table, policy and function definitions match the migration files.

## Open hardening items (not applied)

1. `lmr_week_plans` still has Supabase's default table grants to `anon` (and `TRUNCATE` etc. to
   `authenticated`). RLS blocks anon today because every policy targets `authenticated`, but
   matching `life_os_workspaces` would be tighter:
   `revoke all on public.lmr_week_plans from anon; revoke delete, truncate, references, trigger on public.lmr_week_plans from authenticated;`
   Check first that the Week Plan automation does not write with the anon key.
2. `lmr_week_plans` policies only check ownership, while `life_os_workspaces` also requires
   `is_admin()` and `aal2`. Only the owner can see their rows either way, but adding the same
   checks would keep week plans behind MFA like the rest of Life OS. Only do this if the automation
   writes with the service role (which bypasses RLS).
