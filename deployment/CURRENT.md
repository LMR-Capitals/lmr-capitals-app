# Current full-site deployment

This file is the deployment entry point for Claude and other collaborators. Historical receipts remain in this directory; the latest verified production ID below takes precedence over draft URLs and older deploy notes.

## Current release status

The owner requested a full production redeployment on 7 October 2026 without overwriting stored database data. Previous full production release: `6ac6ee783c2a68cb0b300fd2`. A later Git deployment (`6ac6f2a7fdde6a000883de1f`, commit `739f9a1b23bccd8fd49cb70497a0e4976d5f27b2`) replaced that manual release and contains Claude's Journal autosave/refresh preservation fix (#71). That exact fix was merged into the local full-site Journal before rebuilding, preserving the Inner Circle integration.

**Latest verified production deploy:** `6ac6f66836c3649427724425`, published at `2026-10-08T01:48:28.022Z` (7 October, New York). [Live website](https://lmrcapitals.com) · [Inner Circle](https://lmrcapitals.com/inner-circle) · [Netlify release details](https://app.netlify.com/projects/lmrcapitalsapp/deploys/6ac6f66836c3649427724425). Reviewed draft: `6ac6f627cdf71842a68db825`.

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

Git CD is connected to `https://github.com/LMR-Capitals/lmr-capitals-app` on `main`. Manual deployment does not commit or push local source. A later Git build can replace it with a version missing uncommitted Inner Circle work. The complete portal source is now prepared on `codex/inner-circle-portal` for Git integration; see [the source handoff](GITHUB-HANDOFF.md). This branch is based on current `main` and excludes unrelated Mac changes. It is not merged into production `main`; integration/merge/deployment require a separate authorized task.

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

For source integration, read `GITHUB-HANDOFF.md`: this branch supplies the source that earlier releases described as Mac-only. Older home-project memory describes a single static file in `LMR Capitals APP_files`, a home-rooted Git repo and no Git deployments. That memory describes an earlier setup and must not govern this checkout. Root `CLAUDE.md` links here so Claude can locate the full build and release evidence. An already-running Claude session may need to reread this file; editing a file does not prove that session has consumed it.
