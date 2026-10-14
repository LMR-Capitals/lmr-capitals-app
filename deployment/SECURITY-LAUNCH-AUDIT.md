# Launch security audit — 14 October 2026

**Status: remediation in progress; not a security clearance.** The production site is already live. A successful build or dependency scan does not prove absence of vulnerabilities.

## Coordination and ownership

User-requested Claude destinations: **LMR Database security and access rules**, **LMR GitHub repo and deploys**, **LMR Project Manager**. The website lead is **LMR Capitals website**. Codex branch: `codex/security-launch-audit`. Claude's database audit is PR #107; a coordination note was posted there. This document is the shared handoff; do not assume an already-running Claude chat has reread it.

Preserve records, images, existing publication states, Journal autosave fixes and MFA. Trades/observations stay private until individually published. Never use the older automatic-sharing patches to fix permissions.

## Findings and current status

| Priority | Finding | Status |
|---|---|---|
| High | `app-images` and `journal-images` are public; app-images also allows anonymous metadata listing | Authenticated downloads and short-lived chart URLs implemented locally. `launch-private-media.sql` prepared and tested, **not applied**. Deploy frontend first. |
| High | Production Journal tables lack restrictive paid-access policies present in the source patch | `launch-journal-membership.sql` prepared and tested, **not applied**. Retains owner policies; no record changes. |
| High | Legacy admin functions accept password-only admin sessions | Claude already applied MFA to seven. `admin_remove_admin` and `admin_revoke_comp` remain in Claude's pending patch. Recheck live definitions before changing. |
| High | Subscription-cancellation Edge Function checks admin registry without MFA | Local fix checks caller `circle_is_admin()` before privileged client/Stripe use, rejects non-POST and invalid IDs, masks errors, and binds update to the original subscription. **Function not deployed yet.** |
| High | Saved rich editor HTML and AI output reach HTML sinks | Pinned DOMPurify added to known editor load sinks; AI/user message text escaped. Targeted malicious HTML tests pass. Full legacy DOM-sink audit remains incomplete. |
| Medium | Service worker can cache same-origin authenticated responses in a shared device cache | Local fix caches only three explicit public assets, honors no-store/private, ignores authenticated requests and purges older caches. |
| Medium | Image index/missing-image cache shared between accounts; async downloads may finish after switching accounts | Local image indexes now scoped by user, reset on switch; restored/downloaded blobs check original account before cache writes. Broader multi-tab sign-out review remains open. |
| High | Two dependency advisories in form-data/source-map-js | Lockfile updated. Latest npm audit: **0 production vulnerabilities; 3 moderate development-tool advisories** through Capacitor CLI/xcode/uuid. No forced breaking dependency downgrade. |
| Medium | Leaked-password protection disabled | Open, requires Auth configuration verification/update. |
| Low | Life OS framing protection missing | Local same-origin framing and baseline object/base CSP added. This is not a complete strict CSP for the legacy app. |

## Verified evidence

- Production metadata inspection: RLS enabled on exposed tables; no exposed public views observed. Subscriptions have own-read policies and no ordinary client write policy. Life OS requires owner + verified admin MFA.
- Checkout verifies agreement ownership/version and server price; Stripe webhook validates signatures and syncs server-derived subscription state. No real charges or cancellations were performed.
- All 68 imported `journal-images` objects match existing owner Journal `image_keys` exactly. No storage object or member record has been changed by this audit.
- Current tracked-file secret scan found no privileged key; the Discord match was a test fixture. Public Supabase publishable/anon keys are intentionally browser-visible. Historical commits and generated artifacts still require a final secret scan.
- Local PostgreSQL negative tests: anonymous, free/expired, other-owner, draft publication denied; paid published-chart access and owner's imported charts allowed. Existing database regression suite passes.
- Local tests cover authenticated image signatures with no public fallback, shared-cache bypass, MFA before Stripe/service-role access, and HTML sanitizer behavior.
- Journal workspace/autosave preservation tests and production build pass. Existing unrelated ThreeUI build warnings remain.

## Safe release order

1. Review and merge frontend/function source with green checks through Git CD. Verify the exact published commit and authenticated image behavior.
2. Deploy the cancellation function separately with JWT verification enabled.
3. Apply the two reviewed SQL patches through a recorded Supabase migration; verify actual production policies before applying to avoid concurrent-policy conflicts. Storage patch is intentionally one-time and must not be blindly replayed.
4. Verify anonymous storage denial, owner reads, published member reads, unpublished denial, paid expiry and administrator MFA with isolated test identities. Do not alter real users' roles/subscriptions for testing.
5. Resolve remaining legacy admin MFA, Auth configuration, legacy HTML sinks and multi-tab account switching before calling launch security checks complete.

For rollback, preserve user data; do not restore public image exposure as a routine rollback. Correct a policy or frontend regression forward. Do not run unrelated historical migrations or imports.
