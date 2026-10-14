# Membership functions

Production keeps live Stripe keys separate from sandbox testing. Never replace production secrets with sandbox keys.

- `create-checkout`: JWT required, verifies owner consent and server-owned USD price before creating a recurring subscription; no trial.
- `stripe-webhook`: JWT disabled, mandatory Stripe signature verification. Re-reads authoritative Stripe subscription/invoice data; redirect success alone cannot activate access.
- `create-billing-portal`: JWT required; owner customer mapping only. Cancellation stops renewal, access lasts through the paid period.
- `admin-cancel-subscription`: verified administrator MFA required; explicit immediate cancellation action.

Current USD prices: $28/week, $112.84/month, $327.60/quarter, $1,164.80/year. Tax configuration remains disabled while the business has no tax registrations.

Signing secret `STRIPE_WEBHOOK_SECRET` must match the single active production webhook endpoint. Keep secrets in Supabase only; never commit or paste them in chat.

Subscribe that endpoint to:

```
checkout.session.completed
checkout.session.async_payment_succeeded
checkout.session.async_payment_failed
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
invoice.paid
invoice.payment_failed
charge.refunded
charge.dispute.created
radar.early_fraud_warning.created
```

Apply `launch-billing-reviews.sql` before deploying the handler. Risk events add a deduplicated, MFA-protected admin review entry, without automatically issuing refunds or changing access. Ambiguous invoice allocation remains unmapped for manual review. No full event payload or card data is stored in the review queue.

Regression suite: install root dependencies, then `npm ci --prefix database/tests` and `npm test --prefix database/tests`. Uses synthetic signed Stripe events and an isolated PostgreSQL engine; no cloud writes. Real Stripe network delivery and signup confirmation must be verified separately before public promotion.
