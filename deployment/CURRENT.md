## Session logout follow-up — 14 October 2026

See [browser logout and account isolation](SESSION-LOGOUT-2026-10-14.md) for explicit
local/global logout, account-switch fixes, tests and the current Supabase usage
snapshot. This website-only release requires no database or billing operations;
the release PR records deployment verification.

## Membership launch checks completed — 14 October 2026

[Final technical verification](MEMBERSHIP-LAUNCH-CHECKS-2026-10-14.md) supersedes the earlier pending signup/webhook checklist. Production signup/free isolation and signed Stripe delivery passed; real sandbox payment-to-access and cancellation passed against the current handler and isolated PostgreSQL. Duplicate live webhook disabled with explicit owner approval. No live purchase, production key swap or existing business-record replacement occurred. This documentation update requires no migration, function deployment, billing activation or website code change.

## Membership billing review release — 14 October 2026

See [launch checks](MEMBERSHIP-LAUNCH-CHECKS-2026-10-14.md) for deployed backend fixes, preservation scope and remaining signup/network checks. The new audit migration is applied. Website deploy `6ad00b69071723e19c019490` published main commit `4c89c63ecc86e55ed5af5fec9fb180c614fd89a3` (#117) at 2026-10-14T23:08:48.305Z. Use the final technical verification above for the current launch-check status.

## Security release — 14 October 2026

[Launch security audit](SECURITY-LAUNCH-AUDIT.md) records PR #113, the verified production receipt, deployed cancellation MFA fix, enabled leaked-password protection and approved and verified database/storage hardening. Remaining launch concerns are recorded in the audit. The two security migrations are already applied and mirrored by their server-generated versions; do not reapply them as part of a website deploy.

# Current full-site deployment

Lead Claude session for the website: see [WEBSITE-SESSION-HANDOFF.md](WEBSITE-SESSION-HANDOFF.md).

## Latest verified production — 14 October 2026

**Published deploy:** `6acedeb7d3db9fd950f11e7f`, published `2026-10-14T01:45:45.217Z` via Git CD from `main` commit `ecf02ba30bfa28631df3d356807e27aedacefe48` (#104). [Live LMR](https://lmrcapitals.com) · [Netlify permalink](https://6acedeb7d3db9fd950f11e7f--lmrcapitalsapp.netlify.app). It includes all merged work through #104 (Journal sidebar footer, header session clock and live status #98–#102; Pine indicator consolidation #103–#104). The deploy shipped the `studio-discord` function, with no edge functions and no database migrations. Netlify's secret scan found nothing. A local `npm run build` of the same commit produced every required output in the build map below (only the existing ThreeUI export warnings appeared). No database, storage or Supabase function operations were performed.

## Manual Studio publication — 13 October 2026

[Explicit Studio publication](STUDIO-MANUAL-PUBLICATION-2026-10-13.md) supersedes the earlier automatic-sharing releases. Trades and observations must stay private until explicitly published in Studio. Both live feed/detail functions enforce the existing published source linkage. Do not reapply the older automatic-feed functions. Existing source records, publication states, images and RLS are preserved. Admin source lists/details load on demand, and published observation images are lazy-loaded.

## Live execution feed — 13 October 2026

See [live execution release notes](LIVE-EXECUTIONS-2026-10-13.md). The owner has explicitly opted their own admin Journal into automatic paid-member execution sharing. Its additive read-only function is applied; source Journal records and RLS are unchanged. Use Git continuous deployment after review and merge. Preserve #78 and #79 Journal save/image fixes.

This file is the deployment entry point for Claude and other collaborators. Historical receipts remain in this directory; the latest verified production ID below takes precedence over draft URLs and older deploy notes.

## Mobile workspace update — 12 October 2026

The latest verified production Git release before the mobile update is `6acc605fe0c1ac0008ea51b9`, commit `af9da91c7adb369146ef11732d9c52600e3250cb` (#74), published `2026-10-12T04:22:06.999Z`. It includes #73 Life OS and #74 single sign-on. Both must remain in all future builds.

The mobile-only frontend update is tracked in `codex/mobile-workspace-navigation` and [its release notes](MOBILE-WORKSPACES-2026-10-12.md). Use Git continuous deployment after review and merge; preserve the complete root build. The verified production ID for that merge will be recorded in the pull request. No database or storage operations are part of this update.

## Earlier release status

**Latest verified production deploy:** `6acc35760f93dfd5ccc6982d`, published `2026-10-12T01:18:57.321Z` (11 October, New York). [Live LMR](https://lmrcapitals.com) · [Life OS admin entry](https://lmrcapitals.com/admin?next=life-os). Reviewed draft: `6acc3536fc7dc093edd5118f`. See [Life OS release receipt](LIFE-OS-2026-10-11.md).

Life OS now sits beside Trading Journal in the admin workspace switcher. Source: `life-os/`, `member/life-os-workspace.jsx` and the existing member navigation; output `dist/life-os/index.html`. Build from the repository root and deploy the complete `dist/` as before.

An explicitly authorized Life OS schema addition and one-time reference-data initialization were completed in the existing Supabase project: `public.life_os_workspaces` and `life_os_save_workspace`. RLS requires user ownership, `is_admin()` and an `aal2` session. Existing Journal, accounts, images, billing and member records were preserved. Do not reapply the saved `database/patches/life-os-admin-workspace.sql`; it is an applied reference. Other pending patches remain pending. Full validation and initial storage limits are in the linked receipt.

The prior actual live Git release was `6ac706f45ee5be000851c2d4` (#72), later than the historical receipt below. Its Journal script blocks match this release. Git CD remains enabled. This release is a manual website deployment; no source commit or push was made, so a later main build can replace Life OS unless the integration is retained.

## Previous release history

The owner requested a full production redeployment on 7 October 2026 without overwriting stored database data. Previous full production release: `6ac6ee783c2a68cb0b300fd2`. A later Git deployment (`6ac6f2a7fdde6a000883de1f`, commit `739f9a1b23bccd8fd49cb70497a0e4976d5f27b2`) replaced that manual release and contains Claude's Journal autosave/refresh preservation fix (#71). That exact fix was merged into the local full-site Journal before rebuilding, preserving the Inner Circle integration.

**Previous verified production deploy:** `6ac6f66836c3649427724425`, published at `2026-10-08T01:48:28.022Z` (7 October, New York). [Live website](https://lmrcapitals.com) · [Inner Circle](https://lmrcapitals.com/inner-circle) · [Netlify release details](https://app.netlify.com/projects/lmrcapitalsapp/deploys/6ac6f66836c3649427724425). Reviewed draft: `6ac6f627cdf71842a68db825`.

16 regression test files passed, including actual Journal autosave flush/deferred refresh, cloud merge preservation, embedded workspace bridge, member access controls, Studio publication data and chronology. `npm run build` succeeded (existing unrelated ThreeUI export warnings). The production site API confirmed this deploy ID is published. Landing, Inner Circle, joining guide, admin and embedded Journal routes all returned the reviewed build; the embedded HTML comparison accounted for Netlify's existing pretty-URL anchor rewriting. Hosted admin preview rendered the full LMR Studio navigation and newest-first ENTRY selector. Production screenshot: `member/verification/lmr-claude-handoff-production-2026-10-07.png` (clearly labelled illustrative administrator preview).

This release ran no database commands/migrations, Supabase function deployments, imports, record updates, image/storage uploads, Git commits or pushes. Only website files were uploaded. The existing Claude deployment-memory file and memory index now link to this record and explain the obsolete static-directory instructions; no claim is made that an already-running Claude session has reread them.

## Website/build map

| Public route | Source | Required build output |
| --- | --- | --- |
| `/` | `web/index.html`, `web/landing/` | `dist/web/index.html` |
| `/inner-circle` | `member/index.html`, `member/` | `dist/member/index.html` |
| `/inner-circle/guide` | `member/guide.html` | `dist/member/guide.html` |
| LMR Studio inside Inner Circle | `member/admin.jsx`, `member/journal-sources.jsx` | Member entry plus bundled assets |
| Embedded Trading Journal | `app/app.html`, `scripts/journal-workspace.mjs`, `public/journal-workspace-bridge.js` | `dist/app/workspace.html` |
| `/app` | `app/app.html` | `dist/app/app.html` |
| `/admin`, `/admin/terminal` | `admin/admin.html`, `admin/terminal.html` | Both admin HTML entries and bundled assets |

`vite.config.mjs` and root `netlify.toml` are authoritative. There is no required `dist/index.html`; `/` rewrites to `/web/index.html`. Inner Circle and Studio use the existing authenticated Supabase backend; previews are illustrative and are not live database records.

## Correct process

1. Work from `/Users/nirajghorsaine/LMR-Capitals`. Check the current Netlify published deployment and compare any newer Journal fixes before building. Do not overwrite another collaborator's work.
2. Run appropriate regression checks, then `npm run build`. Confirm all required output paths in the table exist.
3. Use the existing authenticated Netlify CLI and site `09e03f83-2353-4a3a-bb21-ae5ab81ef45b`. Upload a draft with `netlify deploy --dir dist --no-build`; verify its routes.
4. When authorized, upload that same reviewed output with `netlify deploy --prod --dir dist --no-build`. This is a fresh atomic file deployment, not a database operation. Do not restore/publish an old deploy.
5. Verify the Netlify published ID and primary-domain landing, Inner Circle, guide, admin and embedded Journal routes. Record the ID, timestamp and screenshots here.

Git CD is connected to `https://github.com/LMR-Capitals/lmr-capitals-app` on `main`. Manual deployment does not commit or push local source. A later Git build can replace it with a version missing uncommitted Inner Circle work. Integration of the complete portal into Git is a separate task requiring review of the extensive existing local changes.

## Preserve data

- Existing Supabase project: `agrvylclhvxyevsmmexf`. Keep existing accounts, roles, subscriptions, Journal records, images and publication statuses.
- This website redeploy runs no database migrations, upserts/imports, data replacements, storage uploads or Supabase function deployments.
- Already applied Circle migrations are documented in `NEWEST-FIRST-2026-10-07.md` and earlier receipts. Do not reapply them merely to redeploy website files.
- `database/patches/inner-circle-journal-access.sql` remains unapplied. Billing function releases and signup/paid-enrollment activation remain separate and unchanged.
- Preserve both Journal fixes: original local daily edits survive stale cloud pulls (#70), and pending autosaves flush before teardown while service-worker refresh defers during active chain edits (#71).

## Important runtime details

- Administrator precedence/MFA, paid Journal exception for admins, and free/paid content boundaries remain in place.
- ENTRY execution image is the Journal's `trade-{id}-result` slot; `trade-{id}-entry` is Intraday.
- Observations carry full original notes/charts/meta, achievements use original certificates/details, and Journal-derived lists use original dates newest to oldest.
- Registration and paid enrollment are still gated; website deployment alone does not activate them.

## Claude context

Older home-project memory describes a single static file in `LMR Capitals APP_files`, a home-rooted Git repo and no Git deployments. That memory describes an earlier setup and must not govern this checkout. Root `CLAUDE.md` links here so Claude can locate the full build and release evidence. An already-running Claude session may need to reread this file; editing a file does not prove that session has consumed it.
