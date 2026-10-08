# Inner Circle source handoff to Claude

Branch: **`codex/inner-circle-portal`** in `https://github.com/LMR-Capitals/lmr-capitals-app`.
Base: current GitHub `main`, commit `739f9a1b23bccd8fd49cb70497a0e4976d5f27b2` (#71).

The real portal source was copied from the owner's Mac into a clean isolated checkout, preserving their original checkout and index. This is a source handoff only. It does not authorize deployment, merging to `main`, database changes or payment activation.

## Fetch and inspect

```bash
git fetch origin codex/inner-circle-portal
git switch -c review-inner-circle --track origin/codex/inner-circle-portal
git diff origin/main...HEAD --stat
```

Use a clean checkout to avoid overwriting another task's work. The branch already includes build wiring: `vite.config.mjs`, root `netlify.toml`, `scripts/portal-routes.mjs` and the generated same-origin embedded Journal workspace. Do not reconstruct the portal from screenshots or rewrite the canonical Journal.

## Included

- All `member/` runtime components, styles, chapter/checkpoint catalog, guide, illustrative previews, tests and source documentation.
- Admin Terminal, MFA/role routing and integrated Admin Hub dependencies.
- Canonical Journal navigation/access integration and embedded workspace bridge/plugin.
- Landing entry and membership links, existing motion source/brand dependencies and the actual logo used by the portal.
- SQL/migration and billing-function source **for reference/review only**; source inclusion is not permission to apply/deploy these files.
- Root Claude context and release receipts so the full build is traceable in this cloud checkout.

Existing `main` package/lock files are preserved: they already contain the required web dependencies. Unrelated local Capacitor build changes, indicator deletions, unused business-card assets, credentials, generated builds, journal exports, private chart data and browser screenshots were excluded. A local-only duplicate Session Chain card was omitted; the canonical Journal card from `main` remains.

## Data and activation boundary

No database commands, migrations, upserts, imports, source publications, image/storage uploads or Supabase function deploys were executed for this source handoff. SQL files are not executed by the Vite build. Netlify branch-deploy settings were read-only checked: `allowed_branches` contains only `main`. No PR, main push/merge, deploy hook or Netlify upload is part of this task.

The actual live Circle schema migrations already applied are listed in `CURRENT.md` and earlier receipts. `database/patches/inner-circle-journal-access.sql` remains unapplied. `database/functions/create-checkout`, `create-billing-portal`, `stripe-webhook` and `_shared/billing.ts` contain pending billing-source work, not a live release. Registration and paid enrollment remain gated. Do not run blanket `supabase db push` or deploy those functions simply because they are in this branch.

## Verify from this source

Node 22.13+ or a recent Node 24 is required by the existing build and test APIs.

```bash
npm ci
npm run build
```

Expected output: `dist/web/index.html`, `dist/member/index.html`, `dist/member/guide.html`, `dist/admin/admin.html`, `dist/admin/terminal.html`, `dist/app/app.html`, `dist/app/workspace.html`, `dist/app/journal-import.html` plus assets. `/` rewrites to `web/index.html`; no root `dist/index.html` is needed. `/inner-circle` and `/inner-circle/guide` are wired in `netlify.toml`.

Regression checks use mocks and an isolated in-memory PostgreSQL runtime, not production data. Install the test runtime outside the repository so production dependencies and lockfile stay unchanged:

```bash
npm install --prefix /tmp/lmr-circle-tests --no-save --ignore-scripts @electric-sql/pglite@0.5.8
PGLITE_MODULE=/tmp/lmr-circle-tests/node_modules/@electric-sql/pglite/dist/index.js node --experimental-vm-modules --test member/tests/*.mjs admin/login.test.mjs admin/terminal.test.mjs scripts/journal-workspace.test.mjs scripts/journal-daily-preservation.test.mjs scripts/journal-autosave-preservation.test.mjs
```

Also verify any newer `main` Journal changes before merging. #70's local/cloud merge and monthly-bias preservation, and #71's flush-before-teardown/deferred-refresh fix, are retained in this branch. Actual source tests cover both.

## Integration status

Prepared for source review; not merged into `main`. A future authorized merge to `main` will trigger Netlify's existing Git deployment. This push does not itself fix production replacement by future `main` builds until the full portal is integrated there. Do not publish/merge automatically based on this document.

## Verified before source push

- `npm ci --ignore-scripts` succeeded using unchanged `main` dependency manifests.
- `npm run build` passed; all nine required HTML/bridge outputs and their linked assets are present. Existing ThreeUI export warnings remain unchanged.
- The 16 regression test files above all passed with isolated/mocked dependencies.
- Exact source comparison confirms `saveDaily`, debounce/flush, teardown and service-worker refresh sections match current `main` (#70/#71).
- No unrelated local native/package edits or indicator deletions are in this branch. No credentials, stored records/images, generated output or private screenshots are included.
- Original Mac Git index was preserved.
