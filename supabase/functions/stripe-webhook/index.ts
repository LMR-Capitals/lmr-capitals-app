// LMR Capitals — stripe-webhook
// Stripe calls this when subscriptions change. It verifies the signature and
// writes the authoritative subscription status into public.subscriptions using
// the service role (bypasses RLS). This is the ONLY trusted source of "is this
// user subscribed" — the browser is never trusted for that.
//
// Required Supabase secrets:
//   STRIPE_SECRET_KEY       sk_test_… / sk_live_…
//   STRIPE_WEBHOOK_SECRET   whsec_…  (from the Stripe webhook endpoint you create)
// Auto-provided: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// NOTE: deploy this function with JWT verification DISABLED (Stripe calls it
// without a Supabase token) — `supabase functions deploy stripe-webhook --no-verify-jwt`.

import Stripe from 'npm:stripe@17';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '');
const cryptoProvider = Stripe.createSubtleCryptoProvider();
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

async function upsert(userId: string, sub: Stripe.Subscription, customer: string | Stripe.Customer | null) {
  await admin.from('subscriptions').upsert({
    user_id: userId,
    stripe_customer_id: typeof customer === 'string' ? customer : customer?.id ?? null,
    stripe_subscription_id: sub.id,
    status: sub.status, // active | trialing | past_due | canceled | unpaid | incomplete
    price_id: sub.items?.data?.[0]?.price?.id ?? null,
    current_period_end: sub.current_period_end
      ? new Date(sub.current_period_end * 1000).toISOString() : null,
    cancel_at_period_end: sub.cancel_at_period_end ?? false,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
}

async function resolveUserId(sub: Stripe.Subscription): Promise<string | null> {
  if (sub.metadata?.user_id) return sub.metadata.user_id;
  // Fall back to the customer id we stored on checkout.
  const { data } = await admin
    .from('subscriptions').select('user_id')
    .eq('stripe_customer_id', typeof sub.customer === 'string' ? sub.customer : sub.customer?.id)
    .maybeSingle();
  return data?.user_id ?? null;
}

Deno.serve(async (req) => {
  const sig = req.headers.get('stripe-signature');
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig!, webhookSecret, undefined, cryptoProvider);
  } catch (e) {
    return new Response(`bad signature: ${(e as Error).message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id || (session.metadata?.user_id ?? null);
        if (session.subscription && userId) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          await upsert(userId, sub, session.customer);
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const uid = await resolveUserId(sub);
        if (uid) await upsert(uid, sub, sub.customer);
        break;
      }
      default:
        break; // ignore other events
    }
    return new Response('ok', { status: 200 });
  } catch (e) {
    return new Response(`error: ${(e as Error).message}`, { status: 500 });
  }
});
