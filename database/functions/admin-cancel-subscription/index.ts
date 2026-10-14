// LMR Capitals — admin-cancel-subscription
// Admin-only. Cancels a user's Stripe subscription immediately. The caller must
// be an MFA-verified admin (verified through circle_is_admin). Uses raw fetch to the Stripe
// REST API (reliable in the Deno edge runtime).
//
// Secrets: STRIPE_SECRET_KEY (sk_live_…). Auto: SUPABASE_URL, SUPABASE_ANON_KEY,
// SUPABASE_SERVICE_ROLE_KEY.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const STRIPE_KEY = (Deno.env.get('STRIPE_SECRET_KEY') ?? '').replace(/[^\x21-\x7E]/g, '');

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (o: unknown, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'unauthorized' }, 401);

    // Who is calling?
    const asUser = createClient(
      Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: uErr } = await asUser.auth.getUser();
    if (uErr || !user) return json({ error: 'unauthorized' }, 401);

    // Evaluate the caller's JWT, including MFA, before creating a privileged client.
    const { data: isAdmin, error: adminError } = await asUser.rpc('circle_is_admin');
    if (adminError || isAdmin !== true) return json({ error: 'administrator MFA required' }, 403);

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { user_id } = await req.json().catch(() => ({}));
    if (typeof user_id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user_id)) return json({ error: 'valid user_id required' }, 400);

    const { data: sub } = await admin
      .from('subscriptions').select('stripe_subscription_id').eq('user_id', user_id).maybeSingle();
    const subId = sub?.stripe_subscription_id;
    if (!subId) return json({ error: 'no subscription on file for that user' }, 404);

    // Cancel immediately in Stripe.
    const res = await fetch(`https://api.stripe.com/v1/subscriptions/${subId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${STRIPE_KEY}` },
    });
    const text = await res.text();
    if (!res.ok) {
      let em = text; try { em = JSON.parse(text)?.error?.message ?? text; } catch { /* */ }
      console.error('[admin-cancel] stripe error:', res.status, em);
      return json({ error: 'Subscription cancellation failed. Please retry.' }, 502);
    }

    // Reflect it locally right away (the webhook will also confirm).
    await admin.from('subscriptions')
      .update({ status: 'canceled', cancel_at_period_end: false, updated_at: new Date().toISOString() })
      .eq('user_id', user_id).eq('stripe_subscription_id', subId);

    return json({ ok: true });
  } catch (e) {
    console.error('[admin-cancel] failed:', (e as Error)?.message ?? e);
    return json({ error: 'Unable to cancel subscription.' }, 500);
  }
});
