# Membership launch checks — 14 October 2026

Public promotion is not cleared yet. This release fixes webhook gaps and adds an administrator billing review queue. Existing Journal records, subscriptions, images and publication states are not migrated or replaced.

## Verified

- Resend domain verified; production custom SMTP saved. Owner confirmed delivery of the password-reset test to admin@lmrcapitals.com. No password changed.
- Realtime write amplification fixed in PR #116; idle counters remained stable in the prior short check. Historical quota usage is not erased.
- Supabase billing now visibly reports spend cap disabled (owner-side change; this release did not change billing settings). Overage is billable, not a fixed budget.
- Sandbox weekly payment completed for $28 USD; four hosted checkout amounts matched trusted prices. No real charge performed.
- Seventeen isolated webhook/access regression cases pass: signature/consent rejection, paid owner isolation, unpaid/expired/cancelled denial, admin MFA, out-of-order event handling, async success, risk-event deduplication and admin-only review. Synthetic signatures are not proof of Stripe network delivery.
- Production additive migration `20261014230326_launch_billing_reviews` applied; webhook v16 deployed, JWT disabled with mandatory signature verification. Existing business tables receive no writes from the migration.
- Production queue RLS enabled, member direct access revoked, anonymous review RPC execution denied. Risk events never automatically refund or revoke membership. Marking reviewed only changes the new audit table.
- Canonical Stripe destination `we_1UEPWpBgi40jMsdmNEprafzi` (LMR Capitals Subscription) updated to eleven handled events. Stripe API version retained to avoid an unrelated billing API upgrade.

## Required before public promotion

1. Owner saves the canonical endpoint signing secret directly in Supabase. Do not read, export or commit the secret. The other enabled endpoint `we_1UEPUyBgi40jMsdmMUsgeTMt` must remain until the canonical secret is confirmed, then disable it and verify real event delivery.
2. Complete new account signup/confirmation using an owner-controlled test inbox. Owner must enter the password and accept terms. Password-reset delivery is verified; actual password change is intentionally not tested on the admin account.
3. Prove real Stripe-to-handler network delivery and membership activation in an isolated sandbox deployment. The completed sandbox purchase + isolated event replay are separate evidence; production keys must not be swapped to test mode.
4. Verify frontend deployment receipt and admin Billing reviews screen.

## Preservation evidence

The SQL only creates the new audit table/indexes/RPCs. It contains no UPDATE/DELETE against existing business tables. Before migration the live counts were 238 trades, 103 journal entries, 1 subscription, 1,676 storage objects. Later verification found 237 trades and 1,696 images while the owner was actively using the app; do not represent concurrent business changes as a byte-for-byte unchanged snapshot. This agent did not write those business tables or upload/delete images.

## Advisor findings

Supabase flags existing SECURITY DEFINER RPCs as a general warning. The reviewed admin RPCs guard registry + MFA; `dump_all_data` also enforces `circle_is_admin()`. The new RPCs have the same explicit server check, pinned empty search path and revoked anonymous/PUBLIC execution. Service-only internal tables deliberately have no client policies. Do not open their RLS to silence informational advisor messages.

## Validation

`npm test --prefix database/tests`, administrator terminal and Realtime regression checks passed. Root production build passed with existing ThreeUI export warnings. Test-only dependencies are pinned and audit clean. No public signup readiness claim follows merely from a build.
