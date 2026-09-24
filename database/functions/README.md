# LMR Capitals — Supabase Edge Functions (Stripe paywall)

Two functions power the subscription paywall:

| Function | Purpose | JWT |
|----------|---------|-----|
| `create-checkout` | Signed-in user taps "Subscribe" → creates a Stripe Checkout Session (7-day trial) and returns the URL to redirect to. | required (default) |
| `stripe-webhook` | Stripe calls this when a subscription changes → writes the authoritative status into `public.subscriptions` (service role). **Deploy with `--no-verify-jwt`.** | disabled |

## Secrets to set (Supabase → Edge Functions → Secrets)

```
STRIPE_SECRET_KEY      sk_test_…  (use test keys first; swap to sk_live_… at launch)
STRIPE_WEBHOOK_SECRET  whsec_…    (from the Stripe webhook endpoint, step 3 below)
STRIPE_PRICE_MONTHLY   price_…    ($25 / month)
STRIPE_PRICE_YEARLY    price_…    ($270 / year)
```
`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are provided automatically — do **not** add them.

## Deploy (from the repo root, with the Supabase CLI logged in)

```bash
supabase functions deploy create-checkout
supabase functions deploy stripe-webhook --no-verify-jwt
```

## Wire the Stripe webhook (step 3)

1. After deploying, the webhook URL is:
   `https://agrvylclhvxyevsmmexf.functions.supabase.co/stripe-webhook`
2. Stripe Dashboard → Developers → Webhooks → **Add endpoint** → paste that URL.
3. Select events: `checkout.session.completed`, `customer.subscription.created`,
   `customer.subscription.updated`, `customer.subscription.deleted`.
4. Copy the endpoint's **Signing secret** (`whsec_…`) into `STRIPE_WEBHOOK_SECRET`.

Test with Stripe test cards (e.g. `4242 4242 4242 4242`) before switching to live keys.
