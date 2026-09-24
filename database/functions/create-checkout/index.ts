// LMR Capitals — create-checkout
// Creates a Stripe Checkout Session (subscription, 7-day trial) for the signed-in
// user and returns the hosted-checkout URL. The frontend redirects to it.
//
// Uses the Stripe REST API directly via fetch() instead of the Stripe SDK —
// the SDK's HTTP client raised StripeConnectionError inside Supabase's Deno
// edge runtime. Raw fetch is the reliable transport here.
//
// Required Supabase secrets (Edge Functions → Secrets):
//   STRIPE_SECRET_KEY      sk_test_… / sk_live_…
//   STRIPE_PRICE_MONTHLY   price_…   ($25/mo)
//   STRIPE_PRICE_YEARLY    price_…   ($270/yr)
// Auto-provided by Supabase: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from 'jsr:@supabase/supabase-js@2';

// Strip any non–visible-ASCII characters (a trailing newline, space, or hidden
// copy-paste character in the stored secret makes the Authorization header an
// invalid ByteString and every Stripe call fails).
const STRIPE_KEY = (Deno.env.get('STRIPE_SECRET_KEY') ?? '').replace(/[^\x21-\x7E]/g, '');
const STRIPE_API = 'https://api.stripe.com/v1';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

// POST form-encoded params to the Stripe REST API and return parsed JSON.
async function stripePost(path: string, params: Record<string, string>): Promise<any> {
  const body = new URLSearchParams(params).toString();
  let res: Response;
  try {
    res = await fetch(`${STRIPE_API}${path}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
  } catch (e) {
    // Network-level failure reaching api.stripe.com — surface the real reason.
    const msg = (e as Error)?.message ?? String(e);
    console.error(`[create-checkout] fetch to ${path} threw:`, msg, (e as Error)?.cause ?? '');
    throw new Error(`network error reaching Stripe (${path}): ${msg}`);
  }
  const text = await res.text();
  let data: any = {};
  try { data = JSON.parse(text); } catch { /* non-JSON */ }
  if (!res.ok) {
    const em = data?.error?.message ?? text;
    console.error(`[create-checkout] Stripe ${path} -> ${res.status}:`, em);
    throw new Error(`Stripe ${res.status}: ${em}`);
  }
  return data;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    if (!STRIPE_KEY) return json({ error: 'STRIPE_SECRET_KEY not set' }, 500);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'unauthorized' }, 401);

    // Identify the caller from their Supabase JWT.
    const asUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: uErr } = await asUser.auth.getUser();
    if (uErr || !user) return json({ error: 'unauthorized' }, 401);

    const { plan } = await req.json().catch(() => ({ plan: 'monthly' }));
    // Price IDs are NOT secret. Use the env secret only when it is a well-formed
    // price id, otherwise fall back to the known LMR Capitals live price ids —
    // this makes checkout robust against a mistyped STRIPE_PRICE_* secret.
    const pickPrice = (envKey: string, fallback: string) => {
      const v = (Deno.env.get(envKey) ?? '').replace(/[^\x21-\x7E]/g, '');
      return /^price_[A-Za-z0-9]+$/.test(v) ? v : fallback;
    };
    const cleanPrice = plan === 'yearly'
      ? pickPrice('STRIPE_PRICE_YEARLY', 'price_1UEPLOBgi40jMsdm6LlsT3Hr')
      : pickPrice('STRIPE_PRICE_MONTHLY', 'price_1UEPM2Bgi40jMsdmzaWUy7Vg');

    // Reuse the user's existing Stripe customer if we already have one.
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: existing } = await admin
      .from('subscriptions').select('stripe_customer_id').eq('user_id', user.id).maybeSingle();

    let customerId = existing?.stripe_customer_id ?? undefined;
    if (!customerId) {
      const customer = await stripePost('/customers', {
        email: user.email ?? '',
        'metadata[user_id]': user.id,
      });
      customerId = customer.id;
    }

    const origin = req.headers.get('origin') ?? Deno.env.get('APP_URL') ?? '';
    const session = await stripePost('/checkout/sessions', {
      'mode': 'subscription',
      'customer': customerId!,
      'client_reference_id': user.id,
      // This account has Stripe Managed Payments on by default, which requires a
      // product tax code. Disable it for this session so checkout works without
      // per-product tax codes (the user can enable + configure tax codes later).
      'managed_payments[enabled]': 'false',
      'line_items[0][price]': cleanPrice,
      'line_items[0][quantity]': '1',
      'subscription_data[trial_period_days]': '7',
      'subscription_data[metadata][user_id]': user.id,
      'allow_promotion_codes': 'true',
      'success_url': `${origin}/index.html?checkout=success`,
      'cancel_url': `${origin}/index.html?checkout=cancel`,
    });

    return json({ url: session.url });
  } catch (e) {
    const msg = (e as Error)?.message ?? String(e);
    console.error('[create-checkout] failed:', msg);
    return json({ error: msg }, 400);
  }
});
