# Life OS / Week Plan source handoff

Branch: `codex/life-os-week-plan`
Base: `main` at `a3debe020417fb6c173e883ca65a3440c7386da4` (#72).

The Mac's Life OS source is now available in this branch. It includes `life-os/**` (including the newer `WeekPlan.jsx`), the persistent workspace iframe, admin-only navigation beside Trading Journal, MFA return routing, root Vite build entry and Netlify no-cache headers. Existing main dependencies and lockfile are unchanged. Unrelated Mac native-wrapper edits, indicator deletions, billing edits, private reference amounts, user records, credentials, screenshots and generated builds are excluded.

For a cloud session:

1. Fetch and check out this branch, or review its PR against main.
2. Run `npm ci` and `npm run build` from the repository root.
3. Confirm `dist/life-os/index.html` plus landing/member/guide/admin and both Journal entries exist.
4. Follow `deployment/CURRENT.md` for any separately authorized deployment. Publish only the complete `dist/` output. Do not apply database patches or billing functions as part of a website build/deployment.

Runtime uses the existing LMR Supabase login, admin registry and MFA. Life OS data lives in the already provisioned `life_os_workspaces` table and save RPC. `database/patches/life-os-admin-workspace.sql` is an applied schema reference, not a pending migration. Week Plan reads owner-filtered `lmr_week_plans` and uses `payload.weekPlan` as a current-week fallback. Scheduled plan generation and database provisioning are outside this source push.

`?preview=1&tier=admin#life-os` on `/inner-circle` uses illustrative records without a Supabase client. Actual private data requires verified admin access. The live reference release is documented in `LIFE-OS-2026-10-11.md`; a PR/branch push is not a production merge or deployment.
