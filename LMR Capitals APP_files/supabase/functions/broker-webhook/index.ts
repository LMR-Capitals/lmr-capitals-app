// LMR Capitals — broker-webhook Edge Function
// -----------------------------------------------------------------------------
// Receives a normalized broker fill (from the Tradovate relay or the NinjaTrader 8
// AddOn) and inserts it into public.trades as an UNCONFIRMED draft. The user then
// completes the ICT fields in the app's Pending Trades panel.
//
// Auth:   x-webhook-secret header must equal the BROKER_WEBHOOK_SECRET env var.
// Insert: SERVICE ROLE key (bypasses RLS); user_id comes from the payload.
// Returns 401 bad/missing secret · 400 malformed payload · 500 insert failure · 200 ok.
//
// Deploy:
//   supabase functions deploy broker-webhook --no-verify-jwt
//   (--no-verify-jwt because callers are brokers, not signed-in users; we do our
//    own shared-secret check instead of Supabase's JWT gate.)
// Secrets (set once):
//   supabase secrets set BROKER_WEBHOOK_SECRET=<a-long-random-string>
//   SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.
//
// NOTE (design deviation from the original spec, on purpose): the spec said
// `status default 'unconfirmed'`. This app upserts normal journal trades WITHOUT a
// status field, so a DB-level 'unconfirmed' default would make EVERY app-saved
// trade show up as pending. Instead the column defaults to 'confirmed' and THIS
// function is the only writer that sets 'unconfirmed'. See broker-fills-migration.sql.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface UniversalFillEvent {
  broker: "tradovate" | "ninjatrader";
  userId: string;      // Supabase auth user uuid
  accountId: string;   // broker account identifier
  symbol: string;
  side: "buy" | "sell";
  qty: number;
  fillPrice: number;
  timestamp: string;   // ISO 8601
  orderId: string;
  fillId: string;      // unique per fill — idempotency key
}

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  // 1. Shared-secret auth
  const secret = Deno.env.get("BROKER_WEBHOOK_SECRET");
  if (!secret || req.headers.get("x-webhook-secret") !== secret) {
    return json({ error: "unauthorized" }, 401);
  }

  // 2. Parse + validate payload
  let p: Partial<UniversalFillEvent>;
  try {
    p = await req.json();
  } catch {
    return json({ error: "invalid JSON body" }, 400);
  }

  const required = [
    "broker", "userId", "accountId", "symbol",
    "side", "qty", "fillPrice", "timestamp", "orderId", "fillId",
  ] as const;
  const missing = required.filter((k) => p[k] === undefined || p[k] === null || p[k] === "");
  if (missing.length) {
    return json({ error: `missing fields: ${missing.join(", ")}` }, 400);
  }
  if (p.side !== "buy" && p.side !== "sell") {
    return json({ error: "side must be 'buy' or 'sell'" }, 400);
  }

  const direction = p.side === "buy" ? "long" : "short";
  const dateOnly = String(p.timestamp).slice(0, 10);

  // 3. Insert as an unconfirmed draft (service role bypasses RLS).
  //    We MIRROR the objective fields onto the app's existing journal columns
  //    (market/position/lots/date) so the current Trade Log renderer shows the
  //    draft even before the user completes it.
  const row = {
    id: `${p.broker}:${p.fillId}`,   // deterministic id → also de-dupes the placeholder
    user_id: p.userId,
    account_id: String(p.accountId),
    // normalized broker fields
    broker: p.broker,
    symbol: p.symbol,
    direction,
    quantity: p.qty,
    entry_price: p.fillPrice,
    filled_at: p.timestamp,
    order_id: String(p.orderId),
    fill_id: String(p.fillId),
    status: "unconfirmed",
    // mirrors onto existing journal columns
    date: dateOnly,
    market: p.symbol,
    position: direction === "long" ? "Long" : "Short",
    lots: p.qty,
    feedback: `Imported from ${p.broker} (order ${p.orderId}) — complete the ICT fields.`,
    updated_at: new Date().toISOString(),
  };

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  // ignoreDuplicates → a retried webhook for the same fill_id is a no-op, not an error.
  const { error } = await supabase
    .from("trades")
    .upsert(row, { onConflict: "fill_id", ignoreDuplicates: true });

  if (error) {
    console.error("insert failed:", error);
    return json({ error: "insert failed", detail: error.message }, 500);
  }

  return json({ ok: true, id: row.id, status: "unconfirmed" }, 200);
});
