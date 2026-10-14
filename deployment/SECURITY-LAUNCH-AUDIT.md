# Launch security audit — 14 October 2026

**Status: frontend/function fixes released; database access/storage rollout awaits explicit approval. This is not final launch clearance.** The production site is already live. A successful build or dependency scan does not prove absence of vulnerabilities.

## Coordination and ownership

User-requested Claude destinations: **LMR Database security and access rules**, **LMR GitHub repo and deploys**, **LMR Project Manager**. The website lead is **LMR Capitals website**. Codex branch: `codex/security-launch-audit`. Claude's database audit is PR #107; a coordination note was posted there. This document is the shared handoff; do not assume an already-running Claude chat has reread it.

Preserve records, images, existing publication states, Journal autosave fixes and MFA. Trades/observations stay private until individually published. Never use the older automatic-sharing patches to fix permissions.

## Findings and current status

| Priority | Finding | Status |
|---|---|---|
| High | `app-images` and `journal-images` are public; app-images also allows anonymous metadata listing | Authenticated downloads and short-lived chart URLs released in PR #113. `launch-private-media.sql` prepared and tested, **not applied**. Deploy frontend first. |
| High | Production Journal tables lack restrictive paid-access policies present in the source patch | `launch-journal-membership.sql` prepared and tested, **not applied**. Retains owner policies; no record changes. |
| High | Legacy admin functions accept password-only admin sessions | Recheck on 14 October confirms all nine legacy functions now use `circle_is_admin()`, including Claude's final two guards. No duplicate patch is needed. |
| High | Subscription-cancellation Edge Function checks admin registry without MFA | Released fix checks caller `circle_is_admin()` before privileged client/Stripe use, rejects non-POST and invalid IDs, masks errors, and binds update to the original subscription. **Deployed and verified as Edge Function version 2, with JWT verification enabled.** |
| High | Saved rich editor HTML and AI output reach HTML sinks | Pinned DOMPurify added to known editor load sinks; AI/user message text escaped. Targeted malicious HTML tests pass. Full legacy DOM-sink audit remains incomplete. |
| Medium | Service worker can cache same-origin authenticated responses in a shared device cache | Released fix caches only three explicit public assets, honors no-store/private, ignores authenticated requests and purges older caches. |
| Medium | Image index/missing-image cache shared between accounts; async downloads may finish after switching accounts | Released image indexes now scoped by user, reset on switch; restored/downloaded blobs check original account before cache writes. Cross-tab account changes now lock and reload the Journal; pending edits stay in the original account namespace. Full end-to-end multi-account browser testing remains open. |
| High | Two dependency advisories in form-data/source-map-js | Lockfile updated. Latest npm audit: **0 production vulnerabilities; 3 moderate development-tool advisories** through Capacitor CLI/xcode/uuid. No forced breaking dependency downgrade. |
| Medium | Leaked-password protection disabled | **Enabled and saved in Supabase Auth; the Attack Protection screen verifies Enabled.** |
| Low | Life OS framing protection missing | Released same-origin framing and baseline object/base CSP added. This is not a complete strict CSP for the legacy app. |

## Verified evidence

- Production metadata inspection: RLS enabled on exposed tables; no exposed public views observed. Subscriptions have own-read policies and no ordinary client write policy. Life OS requires owner + verified admin MFA.
- Checkout verifies agreement ownership/version and server price; Stripe webhook validates signatures and syncs server-derived subscription state. No real charges or cancellations were performed.
- All 68 imported `journal-images` objects match existing owner Journal `image_keys` exactly. No storage object or member record has been changed by this audit.
- Current tracked-file secret scan found no privileged key; the Discord match was a test fixture. Public Supabase publishable/anon keys are intentionally browser-visible. A history scan across all fetched refs also found no matches for common privileged-key/private-key patterns. This is pattern-based evidence, not proof that every possible secret is absent. Generated artifact coverage remains a follow-up.
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

## Release receipt and approval status

- PR #113 merged as `480c492bb047a95170af306a34f11934a142ebce`. Passing checks: web deploy preview, header/redirect checks and iOS build.
- Verified published deployment `6acf202710ab6f37eb67df90`, commit `e27d23e4a1e7f8bd7a46bd48e0955b5fba523d9e`, published `2026-10-14T06:25:19.803Z`, includes that merge. Live `sw.js` and `journal-content-security.js` match the reviewed files byte-for-byte.
- Edge Function `admin-cancel-subscription` version 2 is active; `verify_jwt=true`. No real cancellation was performed.
- Password leak protection enabled and verified in the dashboard. Secure password change and requiring the current password are also enabled in the observed configuration. The owner made additional settings changes during this audit; preserve those settings.
- The two chart buckets remain public; production still has zero restrictive Journal membership policies.
- First migration attempt did not execute because automatic approval review hit a usage-limit error. A later review rejected broad Journal RLS changes because of possible free/expired user lockout and required explicit approval of that scope. Do not route these pending changes through another tool, agent or the SQL editor to bypass approval.
- The pending patch lists 20 table names; 18 currently exist (`payouts` and `target_events` do not). The review message described 21 tables; the SQL file is the authoritative scope and skips absent tables. An explicit approval request was sent to the owner.
- Dashboard launch concerns: built-in SMTP is in use (production email rate limits); organization exceeded quota and warns about project restrictions from 2 November 2026. No paid upgrade or billing change was performed.
- Claude coordination: repository CLAUDE.md, design handoff, audit document and security PR #107 comment were updated. Posting into the native Claude chats remains unverified because macOS computer-use permissions were pending.

Supabase advisor review: no leaked-password warning remains. Three no-policy tables are intentionally deny-by-default. Fourteen SECURITY DEFINER notices require in-body authorization checks; do not revoke legitimate application RPCs indiscriminately. [Advisor guidance](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).
