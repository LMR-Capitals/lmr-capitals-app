// LMR Capitals — create-checkout
// Creates a Stripe Checkout Session (subscription, 7-day trial) for the signed-in
// user and returns the hosted-checkout URL. The frontend redirects to it.
//
// Required Supabase secrets (Edge Functions → Secrets):
//   STRIPE_SECRET_KEY      sk_test_… / sk_live_…
//   STRIPE_PRICE_MONTHLY   price_…   ($25/mo)
//   STRIPE_PRICE_YEARLY    price_…   ($270/yr)
// Auto-provided by Supabase: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

import Stripe from 'npm:stripe@17';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '');

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
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
    const priceId = plan === 'yearly'
      ? Deno.env.get('STRIPE_PRICE_YEARLY')
      : Deno.env.get('STRIPE_PRICE_MONTHLY');
    if (!priceId) return json({ error: 'price not configured' }, 500);

    // Reuse the user's existing Stripe customer if we already have one.
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: existing } = await admin
      .from('subscriptions').select('stripe_customer_id').eq('user_id', user.id).maybeSingle();

    let customerId = existing?.stripe_customer_id ?? undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
    }

    const origin = req.headers.get('origin') ?? Deno.env.get('APP_URL') ?? '';
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: { trial_period_days: 7, metadata: { user_id: user.id } },
      allow_promotion_codes: true,
      success_url: `${origin}/index.html?checkout=success`,
      cancel_url: `${origin}/index.html?checkout=cancel`,
    });

    return json({ url: session.url });
  } catch (e) {
    return json({ error: (e as Error)?.message ?? String(e) }, 400);
  }
});
