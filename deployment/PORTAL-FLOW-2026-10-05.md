# Unified Inner Circle and Admin Hub release

**Latest update:** administrator sign-in now opens an administrator-only Inner Circle shell, with separate free and paid member workspaces. Current production deploy: `6ac387df76fa298fe75a1909`. See [role entry release](ROLE-ENTRY-2026-10-05.md).

Published October 5, 2026 to https://lmrcapitals.com.

- Production deploy: `6ac38214fe33343e1895b912` (Netlify confirmed ready/published).
- Verified draft: `6ac3812ef3f59b7618968475`.
- Previous production for rollback: `6ac375d3885eea51a0647e7f`.
- [Deploy log](https://app.netlify.com/projects/lmrcapitalsapp/deploys/6ac38214fe33343e1895b912).

## Navigation

The homepage's Inner Circle and join buttons open `/inner-circle`. The existing `/members` URL redirects there; `/member/index.html` remains available for existing authentication callbacks. All surfaces use the same Supabase project and persisted account session.

Selecting Journal Application in the authenticated Inner Circle opens `/app` for server-verified paid accounts and MFA-verified administrators. Free accounts are redirected to `/inner-circle?next=journal#billing`. An administrator who still needs MFA goes through `/admin?next=journal` and returns to the journal after verification. The journal independently rechecks access. Direct anonymous journal visits return to Inner Circle sign-in. The journal sidebar now includes a return link to Inner Circle.

Admin sign-in at `/admin?next=circle` or the default `/admin` completes registry verification and MFA, then opens `/inner-circle#admin-hub`. The historical Hub remains accessible through `/admin?next=legacy`. `/admin?next=terminal` still opens the dedicated terminal.

## Integrated Admin Hub

The admin-only Inner Circle sidebar includes Admin Hub and Publishing studio. Admin Hub uses the existing business metrics, users/access, subscriptions and administrator RPCs. Account mutations have explicit confirmation controls; cancellation uses the existing admin cancellation function. No account grants, removals or cancellations were executed during verification.

The Journal database tab provides paginated access to 24 existing journal collections, including trades, account records, transactions, daily/weekly/monthly analysis, journal entries, notes, observations, achievements, reports, goals/history, session chains, market profiles, terminology, psychology, PD changes, copier configuration, chart records, AI conversations, scripts and journal profile. Queries filter the verified administrator's own user ID; target history is joined to the owner's targets. It does not expose another member's private journal or copy existing rows into new tables. Profile credential/settings columns are excluded. Editing continues in the existing Journal Application.

The same Admin Hub component is also available in the dedicated Admin Terminal. Preview never constructs a database client or loads private records; empty preview metrics are intentional.

## Checks

- Production build, portal destination/MFA/owner-pagination tests, journal application access tests, existing terminal tests and PostgreSQL migration/access suite passed.
- Hosted draft verified clean Inner Circle, Admin Terminal, free membership upgrade and existing `/members` redirect. Private `.env` returns 404.
- Live read-only transaction confirmed registered MFA admin access to the existing Hub RPCs: 3 accounts, 0 subscription rows, 1 administrator; own source data included 229 trades, 28 observations and 8 achievements. The project's 29th observation belongs to another account and is intentionally outside this administrator's own journal view.
- The transaction rolled back; no database rows were changed. Existing data were not published to members automatically.
- Browser verified compiled and hosted preview layouts and the production Inner Circle sign-in entry. Full real password/MFA sign-in and a paid checkout were not exercised. The browser viewport override did not change the captured size, so mobile rendering was not independently confirmed in this pass.
- The existing local development server exposed stale optimized React modules; the compiled production preview and hosted build rendered correctly. No user server was terminated or cache deleted.

## Explicit approval still required

Automatic approval review rejected applying `database/patches/inner-circle-journal-access.sql` to production because the exact change was not explicitly approved and restrictive policies on existing tables/storage could lock out accounts or disrupt service. It was not applied. The navigation and Journal Application gate are live, but direct database access to legacy journal tables/storage continues to use their existing policies.

That pending migration adds paid membership or registered MFA admin requirements to the existing journal collections and `lmr-images` storage while retaining existing ownership restrictions. Free/legacy comp accounts would lose access to those protected journal records. Obtain explicit approval for this exact production migration before applying it.

The earlier Stripe-function deployment remains separately pending approval and finalized policy configuration. New enrollment is still closed in the Inner Circle frontend. This release does not deploy billing functions, accept policy terms, charge customers or simulate a paid subscription.

## Rollback

Restore Netlify deploy `6ac375d3885eea51a0647e7f` if needed. This release changed no database schema, data or Edge Functions, so no database rollback is required.
