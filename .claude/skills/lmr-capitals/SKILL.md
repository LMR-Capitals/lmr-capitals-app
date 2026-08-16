---
name: lmr-capitals
description: >-
  Build spec, brand system, and animation requirements for the LMR Capitals
  trading platform (lmrcapitals.com) — the "LMR Capitals" marketing landing and
  "The Chain" trading-journal app. USE THIS SKILL whenever the work touches LMR
  Capitals, lmrcapitals.com/lmrcapitalsapp.com, "The Chain", the molten/lava chain
  animation, the Monthly→Weekly→Daily→Sessions→Trade methodology, the trading
  journal PWA (index.html), or Stage-2 features (Stripe subscriptions, indicator
  purchases, admin-only login, broker/NinjaTrader/Tradovate integration) — even
  when the user doesn't name this skill. It carries hard-won facts about the
  stack (a single-file vanilla-JS PWA, NOT React/Tauri) and gotchas (the landing
  scrolls inside a fixed #landingPage container, not the window) that are easy to
  get wrong and expensive to rediscover.
---

# LMR Capitals — build spec

LMR Capitals is a professional futures-trading practice, journal, mentorship and
managed-account business (NQ/ES/YM, ICT methodology). The product ships in two
stages that share one codebase:

- **Stage 1 — Landing:** the marketing site explaining LMR Capitals and its
  methodology, "The Chain".
- **Stage 2 — The Chain app:** the installable trading-journal app with premium
  subscription, paid indicators, cancellation, and an admin-only login.

Owner / admin: **admin@lmrcapitals.com**.

## Stack ground truth (do not re-derive, do not assume)

- The whole product is **one hand-written file**: `LMR Capitals APP_files/index.html`
  (~14.6k lines). It is a **vanilla-JS single-file PWA** — **no React, no Vite, no
  TypeScript, no build step, no Tauri.** Do not scaffold a framework unless the
  user explicitly asks to migrate.
- Hosting: **Netlify** (`netlify.toml`, `publish = "."`). Backend: **Supabase**
  (project ref `agrvylclhvxyevsmmexf`) — auth, Postgres with RLS, storage. PWA via
  `manifest.json` + `sw.js`.
- Migrations are **`.sql` files run by hand** in the Supabase SQL editor (see
  `supabase-setup.sql`, `fix-*.sql`). Follow that pattern — ship a `.sql`, never
  silently apply to prod.
- **Critical layout gotcha:** `html,body { height:100%; overflow:hidden }`. The
  window never scrolls. The landing lives in `#landingPage`
  (`position:fixed; inset:0; overflow-y:auto`) and **scrolls internally**. Any
  scroll-driven code MUST bind to the `#landingPage` container, not `window`
  (`el.closest('#landingPage') || window`). `position:sticky` works inside it
  (`.lp-nav` already uses it). This single fact silently breaks scroll animations.
- Landing markup starts at `#landingPage` → `.lp-nav`, then `.lp-*` sections
  (`#lp-about`, `#lp-what`, `#lp-how`, `#lp-indicators`, `#lp-contact`). The app is
  `<div class="app" id="mainApp">`, gated by `enterApp()` / `lgUnlock()`.

## Brand system

Dark, molten, premium (TradeZella-grade). CSS tokens already in `index.html`:

- **Ground:** `--bg:#05080F`, `--bg2:#080D18`, `--bg3:#0C1220`.
- **Gold accent:** `--gold:#F5A623` (`--gold2:#FFD166`, `--gold3:#E8901A`).
- **Semantic:** bull `--bull:#00D4A4`, bear `--bear:#FF4060`, blue `#5B8FFF`.
- **Molten/lava (for The Chain):** white-hot `#FFF8E0`/`#FFE08A` core → orange
  `#FF8A1E`/`#FF9A2E` → deep red `#E23A08`/`#7d0f02`.
- **Type:** Space Grotesk (display/headings), Plus Jakarta Sans / Inter (body),
  JetBrains Mono (data/labels). Uppercase eyebrows get letter-spacing.

## "The Chain" — the signature methodology + animation

The Chain is the core LMR concept: an unbroken line of logic where each timeframe
inherits from the one above it. Five links, in order, each with its LMR read:

1. **Monthly** — term `STS / LTS BIAS` — quarterly shift + market profile set the
   one directional bias. metric `BIAS LONG·LTS · Trending`. feeds → Weekly.
2. **Weekly** — `MMBM / MMSM` — the month's bias becomes a weekly Market-Maker
   model. metric `MODEL MMBM · draw Weekly high`. feeds → Daily.
3. **Daily** — `HTF POI` — daily bias + higher-timeframe points of interest.
   metric `POI NWOG/+OB · Bullish`. feeds → Sessions.
4. **Sessions** — `LONDON / NY · AMD` — London/NY profiled Accumulation,
   Manipulation, Distribution. metric `NY MANIP→DIST · win 09:50`. feeds → Trade.
5. **Trade** — `EXECUTION · REVIEW` — the trade taken; model/confirmations/
   emotions/result logged. metric `RESULT +2.4R · logged ✓`. logged → the journal.

The signature landing animation is a **scroll-driven molten forged chain**
(current approved direction: **sideways / horizontal** — Monthly left → Trade
right; the chain slides sideways as you scroll). Behaviour: each link reaches
center, **ignites** (molten glow + ignite flash + heat halo), **drips lava**,
reveals its **info card**, then **locks in with a ✓ Completed badge + shockwave
ring and cools to steel** as the next takes focus. A bottom rail tracks
Monthly→Trade. Full implementation notes, the scoped class contract, and the
scroll-container fix are in **`references/chain-section.md`** — read it before
touching the animation.

Animation is always **browser code** (CSS/SVG/JS; GSAP+ScrollTrigger+Lenis when a
build allows external libs). No MCP server produces animation. When embedding into
the existing `index.html`, prefer **dependency-free** and **fully namespaced**
code (`#lmrChain` scope, `.lc-*` classes, `lc_*` keyframes, `lc*` SVG ids) so it
cannot collide with the 14.6k-line app.

## Stage-2 plan and which services do what

Read **`references/architecture.md`** for the service-per-process map. Summary:

- **Supabase** — accounts, per-user isolated storage (RLS), Edge Functions
  (e.g. `broker-webhook`). Already powering the journal + broker integration.
- **Stripe** — premium subscription, one-time indicator purchases, cancellation.
  Stage 2. Use Stripe MCP for API/read/write and the implementation planner.
- **Netlify** — deploy + branch/deploy previews.
- **FMP** — live market data (quotes/forex) if real numbers are wanted in the app.
- **GitHub** — PRs / version control.
- **Admin-only login** — a single privileged account (admin@lmrcapitals.com) with
  access to both the app and site management; customers never get it. Gate by
  Supabase user id/email + RLS, not client-side flags alone.
- **Broker fills** (shipped in PR #3): NinjaTrader 8 AddOn / Tradovate → Supabase
  `broker-webhook` Edge Function → `trades` (status `unconfirmed`) → in-app
  Pending Trades queue → user completes ICT fields → confirmed. `status` column
  defaults to `confirmed` so only webhook rows are pending.

## Working conventions

- Match the surrounding hand-written vanilla style; don't introduce frameworks,
  bundlers, or global libraries into `index.html` without explicit sign-off.
- Keep new landing widgets self-contained and namespaced; test that any
  scroll-driven piece binds to `#landingPage`.
- Ship DB changes as idempotent `.sql` files; never auto-apply to production.
- Previews the user can't scroll inside the chat panel: give them a standalone
  self-contained `.html` file to open in their browser, or the Netlify deploy
  preview — the chat side-panel traps scroll and makes scroll-driven scenes look
  frozen.
- Paid/MCP reality: Macaly (AI site builder) and Mobbin (design refs) are
  paid-gated on this account; 21st.dev outputs React (incompatible with the
  vanilla landing). Don't promise these will build/design the page.
