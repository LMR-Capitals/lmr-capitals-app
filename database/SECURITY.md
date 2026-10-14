# LMR Database – Security & access rules

What the LMR Capitals Supabase project (`agrvylclhvxyevsmmexf`) lets each kind of
caller do, and the rules every schema change must follow.

**Source of truth:** the live database, read on 2026-10-14 with read-only catalog
queries (`pg_policy`, `pg_proc`, `storage.buckets`, `pg_policies`) plus the Supabase
security advisor. Nothing was changed during that read. `schema.sql` and `migrations/`
lag the live project: tables such as `circle_*`, `life_os_workspaces`, `lmr_week_plans`,
`chart_images`, `pd_switches` and `lmr_automation_*` exist live but not all of them
are in the snapshot.

---

## 1. Who can call the database

| Caller | How they authenticate | What they reach |
|---|---|---|
| `anon` | Publishable (anon) key only, no session | Only rows/functions explicitly granted to `anon` or `public` (see §3). |
| `authenticated` member | Supabase Auth session (JWT) | Their own rows (`auth.uid() = user_id`) plus member content their entitlement unlocks. |
| Admin | `authenticated` + a row in `public.admins` | Admin RPCs. Inner Circle / Life OS admin rights **also need MFA** (`aal2`). |
| `service_role` | Secret key, server-side only (Edge Functions in `functions/`) | Bypasses RLS. Used for Stripe webhook, checkout and admin cancel. Never ship it to a browser. |

### Role helpers

| Function | True when | Notes |
|---|---|---|
| `is_admin()` | caller is in `admins` | Legacy. `SECURITY DEFINER`. **Does not check MFA.** |
| `circle_is_admin()` | caller is in `admins` **and** JWT `aal = 'aal2'` | Use this for every new admin rule. |
| `circle_has_account()` | signed in and not an anonymous Supabase user | |
| `circle_is_paid()` | `subscriptions.status = 'active'`, real Stripe sub id, `current_period_end > now()` and `paid_until > now()` | |
| `circle_can_access()` | `circle_is_admin()` **or** `circle_is_paid()` | The Inner Circle content gate. |
| `is_entitled(uid)` | admin, comp access, or active/trialing sub | Legacy Journal gate. |

---

## 2. Table access matrix

Every table in `public` has RLS **enabled**. An event trigger (`rls_auto_enable`)
turns RLS on automatically for any new `public` table, so a new table with no
policies is closed to `anon` and `authenticated` by default.

### Private journal data — owner only (`auth.uid() = user_id`, all commands)

`accounts`, `ai_chats`, `chart_images`, `copier_config`, `daily`, `journal`,
`lmr_ach_suppressions`, `lmr_automation_scripts`, `lmr_observations`, `lmr_profiles`,
`lmr_psychology`, `lmr_session_chain`, `lmr_terminology`, `monthly`, `notes`,
`pd_switches`, `profiles`, `targets`, `trades`, `transactions`, `weekly`,
`weekly_reports`.

- `target_events`: owner of the parent `targets` row.
- `lmr_week_plans`: owner select / insert / update (no delete policy, so rows cannot be deleted from the client).
- `life_os_workspaces`: owner **and** admin **and** MFA (`aal2`), select / insert / update.

Admins have **no** RLS read access to other members' journal tables. The only
cross-user path is `dump_all_data()` (admin-only RPC, §4).

### Billing — read your own, write server-side only

| Table | Client access | Written by |
|---|---|---|
| `subscriptions` | owner `SELECT` | Stripe webhook (`service_role`) |
| `comp_access` | owner `SELECT` | `admin_grant_comp` / `admin_revoke_comp` RPCs |
| `circle_checkout_receipts` | owner or MFA admin `SELECT`; triggers block `UPDATE`/`DELETE` | server-side |
| `circle_agreement_acceptances` | owner or MFA admin `SELECT`; triggers block `UPDATE`/`DELETE` | `circle_accept_agreement` RPC |

Members cannot grant themselves access: there are no client `INSERT`/`UPDATE`
policies on `subscriptions`, `comp_access` or `admins`.

### Inner Circle

| Table | Members | MFA admin |
|---|---|---|
| `circle_posts` | read if published, `published_at <= now()` and (`kind = 'terminology'` or `circle_can_access()`) | full |
| `circle_live_sessions` | read if `circle_can_access()` | full |
| `circle_notifications` | read own targeted, or broadcast where `audience = 'free'` or `circle_can_access()` | full |
| `circle_questions` | insert own (open, unanswered); read own | full |
| `circle_mentorship_requests` | insert own if `circle_is_paid()` (pending, no reply); read own | update, read all |
| `circle_learning_progress` | read own (written by `circle_record_learning`) | — |
| `circle_profiles` | full on own | read all |
| `circle_preferences`, `circle_saved_posts`, `circle_notification_reads` | full on own | — |

### Public reference data — readable by `anon`

`circle_legal_documents`, `circle_membership_plans`, `circle_membership_launch`
(read-only; legal documents are hash-stamped on insert and triggers block rewrites).
`lmr_achievements` rows are publicly readable only when `is_public = true` **and**
the owner is an admin (landing page feed); only admins can set `is_public = true`.

### Locked tables (RLS on, no policies → no client access)

`lmr_automation_tokens`, `lmr_internal.journal_import_backup`,
`lmr_internal.journal_import_tombstones`. Reached only by `service_role` or
`SECURITY DEFINER` code. Keep it that way.

---

## 3. Storage buckets

| Bucket | Public URL | Read | Write |
|---|---|---|---|
| `app-images` | yes | anyone (`SELECT` policy for `public`) | owner folder only (`<uid>/…`) |
| `journal-images` | yes, 10 MB | anyone with the URL | no client policy (server-side import only) |
| `lmr-images` | no | owner folder only | owner folder only |
| `circle-avatars` | no, 5 MB, png/jpeg/webp | owner folder only | owner folder only |
| `circle-media` | no, 10 MB, png/jpeg/webp | image of a post the member can read; MFA admin | MFA admin |

Path rule: user-owned objects live under `<auth.uid()>/…` and policies compare
`storage.foldername(name)[1]` to `auth.uid()`.

---

## 4. RPC functions

- All `admin_*`, `circle_admin_*` and `dump_all_data()` are `SECURITY DEFINER`.
  They are **not** executable by `anon`, and each one checks admin membership in its
  body before doing anything. Execution by `authenticated` is expected. The advisor
  lists these 14 functions as warnings, and the in-body check is what makes them safe.
- Every `SECURITY DEFINER` function pins `search_path` (`public` or `''`).
- Sync/trigger functions (`circle_sync_trade`, `circle_sync_journal`,
  `circle_content_notice`, `circle_sync_subscription`, `rls_auto_enable`) are not
  executable by `anon` or `authenticated`.

---

## 5. Rules for every schema change

1. **RLS on every table**, with explicit policies. Use `to authenticated` (not the
   default `public` role) unless anonymous access is intended.
2. **Ownership:** `using (user_id = (select auth.uid()))` **and** the same
   `with check`. The `(select …)` wrapper lets Postgres cache the call.
3. **Admin rules use `circle_is_admin()`** (MFA-gated), never `is_admin()` or a raw
   `admins` lookup.
4. **Paid content uses `circle_can_access()` / `circle_is_paid()`**, never a client-set
   flag or `profiles` column (`profiles.role` is a free-text display label the user
   can edit).
5. **Billing, entitlement and admin tables get no client write policies.** Write them
   from Edge Functions (`service_role`) or guarded `SECURITY DEFINER` RPCs.
6. **`SECURITY DEFINER` functions:** set `search_path = ''`, check the caller
   first, `revoke execute … from public, anon`, and grant only what's needed.
7. **Audit/legal records are append-only**: protect them with a `BEFORE UPDATE OR DELETE`
   trigger, as done for agreements, receipts and legal documents.
8. **Storage:** private bucket by default. Use the `<uid>/` folder rule, and set
   size and MIME limits.
9. **Never put the `service_role` key in front-end code** (`app/`, `member/`,
   `admin/`, `web/`, `life-os/`), in the repo or in Netlify client env vars.
10. **Additive changes only**, and nothing is applied as part of a website
    redeploy (see `deployment/CURRENT.md`). After each DDL change, run the Supabase
    security advisor.

---

## 6. Open findings (not yet fixed)

Ranked by impact. As of 2026-10-14, #2 and #6 are fixed on the live project by
`migrations/20261014120000_security_hardening.sql` and
`migrations/20261014120100_security_hardening_pending.sql`. #7 is handled by
`migrations/20261014090000_merge_duplicate_owner_policies.sql`.
#1, #3, #4 and #5 are open.

| # | Finding | Risk | Suggested fix |
|---|---|---|---|
| 1 | `app-images` has a `SELECT` policy for role `public` on `storage.objects`. | Anyone with the anon key can **list** every member's trade chart files across all folders, not only fetch a known URL. | Drop the `SELECT` policy (public URLs keep working for a public bucket), or replace it with an owner-folder policy. Check the Studio/member flows first, because they read `storage.objects` metadata through RPCs. |
| 2 | *(Fixed: all 9 require MFA)* Legacy admin RPCs (`admin_add_admin`, `admin_grant_comp`, `dump_all_data`, …) check `admins` membership but **not MFA**. | A stolen admin password alone can add admins, grant free access or export the whole database. Inner Circle admin already requires `aal2`. | Add `and coalesce(auth.jwt()->>'aal','') = 'aal2'` to the guard, after confirming the admin portal does an MFA step-up. |
| 3 | Leaked-password protection is disabled in Supabase Auth. | Members can sign up with known-breached passwords. | Enable it in Auth → Password security ([docs](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)). |
| 4 | `journal-images` is a public bucket. | Imported journal charts can be read by anyone who has the object path. | Make it private and serve it via signed URLs or an owner-folder policy if the content is sensitive. |
| 5 | `admins` has `admins_read` `using (true)` for role `public`. | Anon callers can list admin user UUIDs (no emails). Needed today for the `lmr_achievements` public-read subquery. | Restrict to `authenticated`, or move the subquery into a `SECURITY DEFINER` helper. |
| 6 | *(Fixed)* `is_entitled(uid)` is executable by `anon` for any `uid`. | Low: as anon, RLS hides `comp_access`/`subscriptions`, so it only reveals admin status. | `revoke execute … from anon`. |
| 7 | *(Pending, handled by `migrations/20261014090000_merge_duplicate_owner_policies.sql`)* Duplicate identical policies ("own X" + "own rows X") on `accounts`, `daily`, `monthly`, `notes`, `trades`, `transactions`, `weekly`. | None to security. Postgres evaluates both (small performance cost). | That migration replaces each pair with one `own rows X` policy. |
