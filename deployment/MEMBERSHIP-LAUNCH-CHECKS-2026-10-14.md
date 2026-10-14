# Membership launch verification — 14 October 2026

**Requested technical launch checks completed.** The evidence supports a controlled paid launch within the tested scope. This is not a guarantee of zero vulnerabilities or a legal/compliance certification. No real payment was made, and no paid production membership was fabricated.

## Signup and email

Resend domain verified; custom SMTP saved. Owner received the production password-reset email. Owner created and confirmed a separate Gmail test alias. Auth confirms email verification and sign-in; account is neither administrator nor paid. Live UI identifies Free member, locks paid observations, and gates Journal access. Read-only production role checks show zero visible private Journal trades/entries, drafts and Life OS workspaces. The owner's password and existing account were not changed.

## Production security and quota

Nineteen restrictive Journal entitlement policies remain present. Administrator access requires registry membership and MFA. Existing private image and manual-publication boundaries remain in place. Anonymous billing-review RPC returns401/42501, and unsigned webhook requests return400. Billing review migration `20261014230326` is applied; webhook v16 is active. Reviews never automatically refund or revoke access.

Realtime write amplification was fixed in #116; a prior short idle counter check remained stable. Supabase now visibly reports spend cap disabled (owner action), permitting billed overage. Historical usage remains; this is not a fixed spending budget. SMTP delivery and actual signup confirmation both passed.

The security advisor's generic SECURITY DEFINER warnings are documented in the earlier audit. Reviewed admin RPCs, including dump_all_data, enforce server-side admin MFA. Internal service-only tables intentionally deny client access. Existing ThreeUI build warnings and the previously documented development-only dependency advisories are not represented as fixed by this billing release.

## Real production Stripe delivery

Owner saved the signing secret at 2026-10-14T23:24:13Z. Its fingerprint matches **LMR Capitals Subscription**, endpoint `we_1UEPWpBgi40jMsdmNEprafzi`. After explicit owner approval, duplicate **memorable-sensation**, endpoint `we_1UEPUyBgi40jMsdmMUsgeTMt`, was disabled. One verified endpoint remains enabled with its normal eleven handled events.

Signed event `evt_1UQbbMBgi40jMsdmMKvBBbyV` reached the real production function at 19:28:53 New York and returned HTTP200 / ok. A temporary customer.created subscription was removed afterward. The metadata-only Stripe customer `cus_VRUamKLDYvhIe1` is clearly labelled **LMR webhook connectivity test - no payment**; it has no email, card, subscription or LMR user linkage. It remains as a labelled test record. This probe did not write existing member/Journal data or create a charge.

## Network payment-to-access test

CLI authorization was limited to sandbox **LMR mentorship Testing** (`acct_1UQPxSBBl8Fz0iG3`), test mode only, with no live-account access. The actual membershipCheckout helper created a hosted $28 USD weekly checkout. Fake test card payment completed. Real Stripe signed events were forwarded through Stripe CLI to the current production webhook source, which re-read authoritative sandbox subscription/invoice data and ran the membership RPC/RLS in isolated local PostgreSQL.

- Checkout: `cs_test_a1STNT0Ixxle6ojFiOfCjHdzSlZxZ2Nv481jjvoWms15FyNx9TF8QOmLUi`.
- Subscription: `sub_1UQbuRBBl8Fz0iG37nsl68jL`.
- Signed invoice.paid, checkout.session.completed and customer.subscription.created deliveries all returned200.
- Unpaid access was denied before payment. Paid test owner gained access to only its fixture; the other user remained denied. Exactly one agreement receipt was stored.
- Cancelling renewal kept access through the paid period, consistent with policy. Cancelling the fake subscription during cleanup delivered customer.subscription.deleted200 and revoked the test owner's access. No refund was issued.
- Test subscription was cleaned up. Local server/listener stopped; temporary CLI session revoked and authentication unavailable afterward.

**Scope:** this was real sandbox payment/network delivery into isolated local PostgreSQL with simulated local test consent. Production signup, production free-member isolation and production signed network delivery were verified separately. It was not a real-card production purchase. No production Stripe key was switched to test mode, and no paid production subscription was inserted.

Four hosted checkout amounts were previously verified: $28/week, $112.84/month, $327.60/quarter, $1,164.80/year, USD. The final full network purchase used the weekly plan. Tax remains disabled while no registrations exist. Cancellation policy remains stop renewal and retain paid-period access; no change-of-mind refunds, preserving legally required remedies.

## Code, deployment and evidence

#117 implements async Checkout success and protected Billing reviews. #118 fixes the live-detected stale-row tab render race and aligns the already-applied migration history. Verified production deploy `6ad00c353cf80d991a0299c0`, main commit `37703fff1a0acece61aa3c22ae7c9184b8878279`, published 2026-10-14T23:12:07.066Z. Live admin Billing reviews screen loads successfully.

Seventeen isolated signed-webhook/PostgreSQL regression cases, admin terminal and Realtime regressions, and the root production build passed. Test-only dependencies are pinned and audited clean. Migration only adds the audit table/indexes/RPCs; existing business tables/images/publication states are preserved. Do not interpret concurrent owner activity as unchanged row counts: live trade/image counts changed while the owner used the app, independently of this migration.

Owner-workspace evidence: `outputs/lmr-sandbox-network-fulfillment-result-2026-10-14.json`, `lmr-sandbox-network-activation-passed-2026-10-14.jpg`, `lmr-stripe-live-webhook-delivered-2026-10-14.jpg`, and `lmr-free-signup-access-check-2026-10-14.jpg`. PR #118 comments also retain the earlier rollout receipts. No secrets are stored in these artifacts.
