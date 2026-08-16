# LMR Capitals — service-per-process map & Stage-2 plan

## Principle
MCP servers are connectors to services (deploy, data, payments, DB) — they are
plumbing, not design or animation tools. Animation/UI is always code written into
`index.html`. Pick a service per process; don't expect a connector to "design" or
"build" the page.

## Service map

| Process | Service / tool | Notes |
|---|---|---|
| Auth, per-user data, storage | **Supabase** | RLS-isolated tables (`trades`, `daily`, `weekly`, `monthly`, `accounts`, `transactions`, `notes`, `journal`, `profiles`). Already live. |
| Serverless webhooks/jobs | **Supabase Edge Functions** | `broker-webhook` shipped. Deploy via `supabase functions deploy … --no-verify-jwt`; secrets via `supabase secrets set`. |
| Payments — subscription, one-time, cancel | **Stripe** | Stage 2. Use Stripe MCP: `stripe_implementation_planner`, `stripe_api_read/write`, docs search. Products: premium subscription + per-indicator (subscription and one-time). |
| Hosting / deploy / previews | **Netlify** | `netlify.toml publish="."`. Branch deploy previews are how the user reviews scroll animations (chat panel can't scroll). |
| Live market data | **FMP** | Optional — real quotes/instrument data inside app cards/journal. |
| Source control / PRs | **GitHub** | Feature branch `claude/lmr-capitals-landing-trading-app-42zw5p`, PR #3. |
| AI site builder (optional) | **Macaly** | Paid-gated (`mcp.enabled`) on this account — cannot drive from MCP; user can run at macaly.com. Builds a SEPARATE React app, not edits to index.html. |
| Design references (optional) | **Mobbin** | Paid-gated. |
| React component gen (optional) | **21st.dev** | Outputs React — incompatible with the vanilla landing unless a React surface is introduced. |

## Admin-only login (single privileged user)
- One admin account: **admin@lmrcapitals.com**. Customers must never gain it.
- Enforce server-side: gate on the Supabase user id/email and RLS policies for any
  admin-only tables/actions — never rely on a client-side boolean alone.
- Admin surface = manage the app + site (content, subscriptions overview,
  indicator entitlements). Keep it behind the same Supabase auth, branched by role.

## Subscriptions & entitlements (Stage 2 shape)
- **Premium subscription** → unlocks the published "The Chain" app + cloud storage.
- **Indicators** (e.g. "LMR ICT Everything", "LMR 90-Min Cycle", $40/mo) → each
  available as **subscription** and **one-time purchase**; grant a TradingView-
  access entitlement on payment.
- Store entitlements in Supabase (a `subscriptions` / `entitlements` table keyed by
  user_id + product), written by a Stripe webhook Edge Function; gate features by
  reading entitlements, and handle cancellation (downgrade at period end).

## Broker integration (shipped, PR #3)
Broker (NinjaTrader 8 AddOn / Tradovate relay) → `broker-webhook` Edge Function
(shared-secret header, service-role insert) → `trades` row `status='unconfirmed'`
→ in-app "Pending Trades" queue → user completes ICT fields → confirmed trade.
`status` defaults to `confirmed` so only webhook rows are pending. Tradovate stays
on the existing in-browser pull until an always-on relay host (e.g. Fly.io) is set.

## Build order
1. Stage 1 landing (incl. The Chain animation) — in progress.
2. Stage 2: Stripe subscriptions + entitlements + cancellation.
3. Admin-only login/role.
4. Broker relay host (defer) + FMP live data (optional).
