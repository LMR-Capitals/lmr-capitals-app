# Automated Broker Fills → LMR Capitals journal

When you place a trade on **NinjaTrader 8** (or, later, Tradovate via an always-on
relay), the fill flows into your journal automatically as a **draft** trade,
pre-filled with the objective data (symbol, direction, qty, price, time). You then
complete the ICT fields (model, session, confirmations, emotions) to confirm it.

```
Broker (NT8 AddOn / Tradovate relay)
        │  UniversalFillEvent  (x-webhook-secret header)
        ▼
Supabase Edge Function  broker-webhook
        │  service-role insert, status = 'unconfirmed'
        ▼
public.trades  (draft row)
        │
        ▼
App → Settings → Integrations → Pending Trades → Complete → confirmed journal trade
```

## UniversalFillEvent
```jsonc
{
  "broker": "tradovate" | "ninjatrader",
  "userId": "<supabase auth user uuid>",
  "accountId": "<broker account id>",
  "symbol": "NQ",
  "side": "buy" | "sell",
  "qty": 2,
  "fillPrice": 20134.25,
  "timestamp": "2026-08-16T14:32:05.123Z",
  "orderId": "abc123",
  "fillId": "fill-987"        // unique — idempotency key
}
```

## Setup (one time)

### 1. Database
Run **`../broker-fills-migration.sql`** in Supabase → SQL Editor. It ALTERs the
existing `trades` table (adds broker/fill columns + `status`) and a unique index
on `fill_id`. Safe to re-run.

> Note: `status` defaults to **`confirmed`**, not `unconfirmed`. The app upserts
> normal trades without a status field, so the column default is what they get —
> defaulting to `confirmed` keeps them out of the queue. Only the Edge Function
> writes `unconfirmed`.

### 2. Edge Function
```bash
# from the "LMR Capitals APP_files" directory (has the supabase/ folder)
supabase functions deploy broker-webhook --no-verify-jwt
supabase secrets set BROKER_WEBHOOK_SECRET=<a-long-random-string>
```
`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically.

Returns: **401** bad/missing secret · **400** malformed payload · **500** insert
failure · **200** ok.

### 3. NinjaTrader 8 AddOn
See **`ninjatrader/LMRBrokerSync.cs`**. Import it (Tools → Import → NinjaScript
Add-On), compile, then create `Documents\NinjaTrader 8\LMRBrokerSync.config` from
`ninjatrader/LMRBrokerSync.config.example` with your `userId`, `webhookSecret`,
and `webhookUrl`. Get your user id + the webhook URL from the app:
**Settings → Integrations → Automated Broker Fills**.

## Not built yet (deferred)
- **Tradovate always-on relay** (Task 2). Tradovate is currently synced by the
  existing in-browser pull (`tradovateSyncTrades()`), which only runs while the
  app is open. Moving Tradovate onto this webhook needs a small always-on service
  (recommended host: **Fly.io**) that holds the Tradovate WebSocket and POSTs
  fills to `broker-webhook`. Add it when you want fills to arrive with the app
  closed.
