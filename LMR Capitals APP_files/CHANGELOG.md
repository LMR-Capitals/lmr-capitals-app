# Changelog

All notable changes to the LMR Capitals trading journal app are documented here.

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
