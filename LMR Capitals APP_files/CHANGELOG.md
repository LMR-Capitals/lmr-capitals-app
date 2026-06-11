# Changelog

All notable changes to the LMR Capitals trading journal app are documented here.

## [Deployed] — 2026-06-11 (latest)

- Deployed commit `0e22bfc7` (Align Daily Chain / Daily day-modal fields) to production via `netlify deploy --prod`.
- Live at https://lmrcapitals.com — deploy: https://app.netlify.com/projects/lmrcapitalsapp/deploys/6a2a6a15a32b21f2562dbde4
- ⚠️ **Action needed**: run `fix-daily-day-status-column.sql` in the Supabase SQL Editor (adds `day_status` column to `public.daily`) so the Status (Passed/In Process/Blown) field stops getting wiped on cloud sync.

## [Unreleased] — 2026-06-11

### Fixed — Today's Chain ↔ Daily day-modal field alignment
- **RTH Delivery**: the Daily day-modal's RTH dropdown had a hardcoded option list with typos/spacing that didn't match `RTH_PROFILES` (used by Today's Chain), so a value saved on Today's Chain often showed blank in the Daily modal. `dm-rth` is now populated dynamically from `RTH_PROFILES`, guaranteeing an exact match.
- **New York field**: standardized the "Manip / Distrib" chip value from `"Manipulation/ Distibution"` (typo) to `"Manipulation / Distribution"` everywhere (chip, colorMap, CSS), matching the day-modal's `<select>` option. Added `_normNY()` to normalize any previously-saved legacy values on load.
- **Weekly summary bug**: `saveDayModal()` no longer overwrites the `weekly` (model · profile · phase) summary field with the Week Draws text — this was corrupting the "Weekly: ..." line shown in the Daily list.
- **Cloud sync**: `_mapDaily()` / `_sbDoPull()` now include `day_status`, so the Status chip (Passed/In Process/Blown) survives a cloud pull/reload instead of resetting to blank. Requires the new `day_status` column (see `fix-daily-day-status-column.sql` / updated `supabase-setup.sql`).

### Added — Share buttons on Today's Chain
- The Today's Chain card header now has Share to Discord/X buttons (`shareDailyEntry`), matching the buttons already on the Daily day-modal and Daily list.

## [Deployed] — 2026-06-11

- Deployed commit `e95c1dbc` (SEO: robots.txt, sitemap.xml, head meta tags) to production via `netlify deploy --prod`.
- Live at https://lmrcapitals.com — deploy: https://app.netlify.com/projects/lmrcapitalsapp/deploys/6a2a59a416ce6f3393d693cc
- ⚠️ **Action needed**: `https://lmrcapitals.com/robots.txt` and `https://lmrcapitals.com/sitemap.xml` currently return **HTTP 401 "Password protected site"** — this is Netlify's site-wide Visitor Access / Password Protection feature, which blocks ALL paths including these SEO files. Search engines cannot crawl the site (or read robots.txt/sitemap.xml) while this is enabled. To fix: in the Netlify dashboard go to **Site configuration → Visitor access → Password protection** and disable it (or switch to a different access method that doesn't gate static files). This is an access-control setting and was left unchanged.

## [Unreleased] — 2026-06-11

### Added — SEO foundation
- New `robots.txt` at the project root: allows all crawlers (`User-agent: * / Allow: /`) and points to `https://lmrcapitals.com/sitemap.xml`.
- New `sitemap.xml` at the project root: lists the homepage (`https://lmrcapitals.com/`, weekly changefreq, priority 1.0).
- `index.html` `<head>`: updated `<title>` to "LMR Capitals | US Futures Trading | NQ ES YM"; updated `<meta name="description">`, `<meta property="og:title">`, `<meta property="og:description">`, and `<meta property="og:url">` (now trailing-slash) with futures-trading/ICT-focused copy; added new `<meta name="keywords">`, `<meta name="robots" content="index, follow">`, and `<link rel="canonical" href="https://lmrcapitals.com/">`.

## [Deployed] — 2026-06-10 (latest)

- Deployed commit `977f01e3` (Per-Trade Share to Discord/X) to production via `netlify deploy --prod`.
- Live at https://lmrcapitals.com — deploy: https://app.netlify.com/projects/lmrcapitalsapp/deploys/6a2a13abe0df905c4994b0c5

## [Unreleased] — 2026-06-10

### Added — Per-Trade Share to Discord / X
- Every row in the **Trade Log** table (Trades tab) now has Share to Discord / Share to X icon buttons, alongside the delete (✗) button.
- The **Edit Trade** modal also shows share buttons in its header when editing an existing trade.
- New `shareTrade(id, platform)` builds a per-trade summary (date, market, position, P&L, R, session, model, confirmations, HTF delivery, MMM, emotions, draws, feedback notes) and shares it to the **Trades / Executions** Discord channel (`#lmr-executions`) by default — or opens an X compose window.
- Automatically attaches any saved execution screenshots for that trade (Result, Entry, HTF, 15min) via `_shareImageBlobs()`.

## [Deployed] — 2026-06-10 (latest)

- Deployed commit `f6618930` (Multi-Channel Discord Routing + Image Sharing) to production via `netlify deploy --prod`.
- Live at https://lmrcapitals.com — deploy: https://app.netlify.com/projects/lmrcapitalsapp/deploys/6a2a0f33f9aca333ef591427

## [Unreleased] — 2026-06-10

### Added — Multi-Channel Discord Routing + Image Sharing
- Settings → Integrations → Discord Webhook now supports **4 separate webhook URLs**, one per Discord channel:
  - **Main** (`#lmr-captials`) — AI Reports, AI Performance Reviews, Performance stats, Monthly Analysis, and negative pattern alerts. Also the fallback for any channel left blank.
  - **Weekly** (`#lmr-weekly-profiling`) — Weekly Analysis shares.
  - **Daily** (`#lmr-daily-profile`) — Daily recap shares.
  - **Trades / Executions** (`#lmr-executions`) — new-trade-logged notifications.
- Each channel has its own "Test ..." button (Test Main / Test Weekly / Test Daily / Test Trades) to verify the webhook independently.
- New `_discordWebhookUrl(category)` resolves the right webhook per category with automatic fallback to Main if a category-specific URL isn't set — existing single-webhook setups keep working unchanged.
- **Image sharing**: `sendDiscordMessage()` now supports attaching images via Discord's multipart webhook upload (`opts.images`/`opts.image`). Sharing a Daily, Weekly, or Monthly entry to Discord now automatically attaches any chart screenshots already saved for that day/week/month (e.g. Today's Summary, Weekly Profile, Daily Profile, Monthly Result charts) — up to 3 images per share, via new `_shareImageBlobs()` helper.
- New trade-logged notifications now route to the Trades/Executions webhook by default.

## [Deployed] — 2026-06-10 (latest)

- Deployed commit `539dbf44` (Professional Landing Page) to production via `netlify deploy --prod`.
- Live at https://lmrcapitals.com — deploy: https://app.netlify.com/projects/lmrcapitalsapp/deploys/6a29603da32b2100cb2dc0d8

## [Unreleased] — 2026-06-10

### Added — Professional Landing Page
- New `#landingPage` shown before the login/sign-up gate — a full marketing page introducing LMR Capitals.
- **Hero**: "Trade With a System. Master The Chain." with Sign In/Sign Up + Learn More CTAs.
- **Who I Am**: personal/prop trader positioning — the journal as the actual operating system used daily.
- **What We Do**: three pillars — Trading Journal & Track Record, Education & Mentorship, Fund & Signal Management.
- **How We Do It (LMR Methodology)**: 6-card grid covering the Daily/Weekly/Monthly Chain, MMBM/MMSM models, session profiling (London/NY), LMR Terminology & Psychology, and daily discipline/journaling.
- Final CTA section + footer with risk disclaimer.
- Sticky nav with anchor links (About / What We Do / Methodology) and a "Sign In" button.
- New `enterApp()` / `showLanding()` toggle functions; `lgUnlock()` now also hides the landing page on auto sign-in. `#loginGate` gained a "← Home" back-link (`showLanding()`) to return to the landing page.
- New `.lp-*` CSS — dark/gold theme matching `#loginGate`, fully responsive (stacked cards/grid, collapsed nav links on mobile).

## [Deployed] — 2026-06-10

- Deployed commit `895c0300` (Tier 5: Share to Discord/X) to production via `netlify deploy --prod`.
- Live at https://lmrcapitals.com — deploy: https://app.netlify.com/projects/lmrcapitalsapp/deploys/6a28eed840d7b171ebd4f70e

## [Unreleased] — 2026-06-10

### Added — Tier 5: Share to Discord / X (Twitter)
- New "Share" button pair (Discord + X icons) added to:
  - **AI Reports** — each report card (Reports tab), next to "Read Full Report".
  - **AI Performance Review** — appears under the AI analysis once a review is generated.
  - **Performance tab** — "Share Performance" shares your live stats (total trades, win rate, net P&L, R:R, profit factor, expectancy, streak, total R).
  - **Daily Pages** — Day modal (calendar → click a day) shares that day's bias, P&L, win rate, and chain notes.
  - **Weekly Analysis** — shares the week's model/profile/phase plus week P&L.
  - **Monthly Analysis** — shares the month's quarterly shift/profile/prediction plus month P&L.
- **Share to Discord**: posts automatically as a rich embed via the existing Discord webhook (Settings → Integrations). One click, no further action needed.
- **Share to X**: opens a pre-filled X/Twitter compose window (`twitter.com/intent/tweet`) — user reviews and posts manually. No API keys/auth required.
- Both options are independent — click one, the other, or both.
- New `shareContent()`, `shareButtonsHTML()`, `_stripMd()` helpers + new `'x-logo'` / `'share-2'` icons in the SVG icon library.

## [Deployed] — 2026-06-09

- Deployed commit `49c1ceb3` to production via `netlify deploy --prod` (CLI, using existing authenticated session — Netlify project has no linked Git repo, so deploys are manual).
- Live at https://lmrcapitals.com — deploy: https://app.netlify.com/projects/lmrcapitalsapp/deploys/6a28dc7c0e34f8edb1c60d0d
- Includes everything below (Tier 1/2/4 features + professional icon system).

## [Unreleased] — 2026-06-09

### Added — Tier 1: Notifications, Analytics, Scheduled AI Recap
- Browser Notification API integration (`sendAppNotification`) with per-user toggles for daily reminders, AI report ready, sync alerts, and pattern alerts (Settings → Notifications).
- Performance tab analytics: R-multiple totals, current streak, longest win/loss streaks, drawdown stats (Stats Row 4).
- Scheduled weekly AI recap report generation.

### Added — Tier 2: Proactive AI Pattern Alerts
- Three new automatic pattern detectors in `renderPerfPatterns`:
  - **Low session win-rate alert** — flags a trading session with <40% win rate over 3+ trades.
  - **Costly emotion correlation** — flags an emotion tag associated with 3+ trades and net negative P&L.
  - **Overtrading detection** — flags days with 4+ trades and net negative P&L (2+ such days).
- New `_checkPatternAlerts()` — sends a browser notification (and optionally a Discord message) the first time a negative pattern is detected, deduped via `localStorage` (`lmr_seenPatternAlerts`).

### Added — Tier 4a: Discord Webhook Integration
- New **Integrations** section in Settings with a Discord Webhook subsection: webhook URL, toggles for AI reports / new trades / pattern alerts, and a "Send Test Message" button.
- `sendDiscordMessage()` posts rich embeds to a user-configured Discord webhook.
- AI-generated reports, newly logged trades, and negative pattern alerts can each independently post to Discord.
- Discord settings (webhook URL + toggles) sync to the cloud `profiles` table; broker credentials never do (see below).

### Added — Tier 4b: Tradovate Broker Sync (read-only)
- New **Broker Sync — Tradovate** subsection in Settings (Integrations): environment (demo/live), username, password, App CID/Secret, "Connect" and "Sync Trades Now" buttons.
- `tradovateAuth()` / `tradovateApi()` — authenticate against the Tradovate REST API (`/v1/auth/accesstokenrequest`) with automatic token refresh on expiry.
- `tradovateConnect()` — authenticates and fetches the linked account.
- `_tradovateBuildRoundTrips()` — FIFO matching of raw fills (`/v1/fill/list`) into round-trip (entry/exit) trades per contract.
- `tradovateSyncTrades()` — pulls closed trades, resolves contract names and value-per-point (`/v1/contract/item`, `/v1/product/item`), maps them into the journal's trade schema (`models: ['Tradovate Import']`), dedupes by exit fill ID, and syncs to Supabase.
- **Read-only by design**: only ever calls `GET` endpoints (`/account/list`, `/fill/list`, `/contract/item`, `/product/item`) — never places, modifies, or cancels orders.
- **Security**: Tradovate credentials (username, password, App CID/Secret, access token) are stored only in `localStorage` and are explicitly excluded from `syncProfileToCloud()` — they never reach the Supabase `profiles` table.
- If a contract's value-per-point can't be auto-detected, the imported trade is flagged in its notes for manual verification against the Tradovate statement.

### Changed — Professional Icon System
- New `ICONS` object + `icon(name, size)` helper: a reusable inline-SVG icon library matching the app's existing minimal stroke-icon style (`viewBox 0 0 24 24`, `stroke-width 2`, round caps/joins).
- Replaced emoji icons with this SVG system across: notification settings, the performance Streaks/R-Multiple tiles, the pattern-alerts table, the AI Coach panel, the Reports panel, the LMR Observation panel header, and the related sidebar nav items.
- New Discord/Tradovate Integrations UI was built using the same SVG icon system from the start.

### Notes / Known Limitations
- Tradovate trade import assumes 1:1 fill→fill FIFO matching per contract; partial fills across multiple orders are matched by quantity but not cross-checked against Tradovate's own P&L figures.
- `valuePerPoint` lookup falls back to `1` (raw points) if the product API doesn't return a usable value — these trades are flagged for manual review.
- No real Tradovate account was available for end-to-end testing; all integration logic was verified against mocked API responses in Claude Preview.
