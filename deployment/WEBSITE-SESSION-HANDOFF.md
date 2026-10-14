# LMR Capitals website — lead session handoff

From 14 October 2026 the Claude Code session **"LMR Capitals website"** is the lead session for lmrcapitals.com. It replaces the earlier session **"lmrcapitlas.com"** (10 Sep – 12 Oct 2026), whose work is all merged to `main`. That session left no open branch or PR; its last PR, #79, is merged and live.

Read [CURRENT.md](CURRENT.md) before any deploy. This file only records what the lead session carries forward.

## Owner rules (unchanged)

- Build from the repository root with `npm run build`, and publish only `dist/` via the root `netlify.toml`. Netlify site `lmrcapitalsapp` deploys from `main` through Git continuous deployment.
- A website change never includes database migrations, imports, seed data, record replacement, storage uploads, pending patches or billing activation, unless the owner explicitly asks.
- Preserve the existing Supabase data and stored images. Preserve the Journal save/image fixes from #71, #78 and #79 in every build.
- After a deploy, users must hard-refresh once so the old service worker is replaced (see #68).
- Work goes through a draft PR, which is watched until CI is green and it merges.

## Delivered by the previous session (merged to `main`)

| Area | PRs |
|---|---|
| Live Session key levels, chart importer, notes consolidation | 30 Sep (direct commits) |
| Sign-in / app-not-opening fixes | #57, #58 |
| Missing trade/journal images, vanishing entries | #59 |
| Chain page, copier sizing, Dashboard cleanup | #60, #61 |
| Trade log save feedback and sync (`plan_followed` text) | #56, #62 |
| Trade modal overhaul, macro → session mapping | #64, #65 |
| Price references sync to trade log | #67 |
| Force stale clients to update (service worker) | #68 |
| X share button blank page | #69 |
| Daily page data loss: cloud merge + monthly bias | #70 |
| Today-session chain autosave flush before teardown | #71 |
| Today-session journal saves to the Journal (Today, Daily, Journal pages) instead of Notes | #78 |
| Today-session journal image linked to its Journal card (key `<date>-today-journal-1`) | #79 |

Later work (#72–#77 and #80–#108: Inner Circle, Life OS, Studio, membership, navigation, indicators) came from other sessions and is recorded in this directory's dated receipts.

## Open offers carried forward

1. Show the Today-session journal image in the **Daily page** day view as well. The `#dm-journal` field is text-only today.
2. Migrate Today-session journal entries saved **before #78** from Notes into the Journal. Existing entries were left under Notes.

Neither is started. Both need the owner's go-ahead. Item 2 rewrites stored records, so it needs explicit approval under the data-preservation rule.

## Recurring pitfalls

- **Stale service worker:** fixed code doesn't appear until clients update. Bump the cache/asset versions and tell the owner to hard-refresh.
- **Journal image keys:** an image only shows on a card when the entry stores the exact image key it was uploaded under.
- **Autosave on teardown:** pending autosaves must be flushed before reload/navigation, or same-day entries are lost.
- **Git CD replaces manual deploys:** any manual Netlify release is overwritten by the next `main` build unless its source is merged.
