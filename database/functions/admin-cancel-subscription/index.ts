// LMR Capitals — admin-cancel-subscription
// Admin-only. Cancels a user's Stripe subscription immediately. The caller must
// be an admin (verified against public.admins). Uses raw fetch to the Stripe
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
  new Response(JSON.stringify(o), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
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

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // Must be an admin.
    const { data: isAdmin } = await admin.from('admins').select('user_id').eq('user_id', user.id).maybeSingle();
    if (!isAdmin) return json({ error: 'not authorized' }, 403);

    const { user_id } = await req.json().catch(() => ({}));
    if (!user_id) return json({ error: 'user_id required' }, 400);

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
      return json({ error: `Stripe ${res.status}: ${em}` }, 400);
    }

    // Reflect it locally right away (the webhook will also confirm).
    await admin.from('subscriptions')
      .update({ status: 'canceled', cancel_at_period_end: false, updated_at: new Date().toISOString() })
      .eq('user_id', user_id);

    return json({ ok: true });
  } catch (e) {
    console.error('[admin-cancel] failed:', (e as Error)?.message ?? e);
    return json({ error: (e as Error)?.message ?? String(e) }, 400);
  }
});
