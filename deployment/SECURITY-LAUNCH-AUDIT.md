## Final technical launch verification — 14 October 2026

[Completed launch checks](MEMBERSHIP-LAUNCH-CHECKS-2026-10-14.md) supersede the historical SMTP/signup/quota/webhook blockers below. Test scope and remaining general limitations are explicit. Do not re-run applied migrations or claim zero vulnerabilities. Existing business data and publication decisions remain protected.

# Launch security audit — 14 October 2026

**Status: frontend/function fixes released; approved database access/storage hardening applied and verified. This is not final launch clearance.** The production site is already live. A successful build or dependency scan does not prove absence of vulnerabilities.

## Coordination and ownership

User-requested Claude destinations: **LMR Database security and access rules**, **LMR GitHub repo and deploys**, **LMR Project Manager**. The website lead is **LMR Capitals website**. Codex branch: `codex/security-launch-audit`. Claude's database audit is PR #107; a coordination note was posted there. This document is the shared handoff; do not assume an already-running Claude chat has reread it.

Preserve records, images, existing publication states, Journal autosave fixes and MFA. Trades/observations stay private until individually published. Never use the older automatic-sharing patches to fix permissions.

## Findings and current status

| Priority | Finding | Status |
|---|---|---|
| High | `app-images` and `journal-images` are public; app-images also allows anonymous metadata listing | Authenticated downloads and short-lived chart URLs released in PR #113. **Applied** as `20261014100031_launch_private_journal_media`, after frontend deployment. Owners retain file access regardless of subscription; paid members can read only published trade charts. |
| High | Production Journal tables lack restrictive paid-access policies present in the source patch | **Applied** as `20261014095808_launch_journal_membership`: 19 existing Journal tables now have an additional entitlement gate. Retains owner policies; no record changes. |
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
- All 68 imported `journal-images` objects match existing owner Journal `image_keys` exactly. No storage object or member record has been changed by this audit; only access policies, security functions and bucket privacy settings changed.
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

## Release receipt and production verification

- PR #113 merged as `480c492bb047a95170af306a34f11934a142ebce`. Passing checks: web deploy preview, header/redirect checks and iOS build.
- Verified published deployment `6acf202710ab6f37eb67df90`, commit `e27d23e4a1e7f8bd7a46bd48e0955b5fba523d9e`, published `2026-10-14T06:25:19.803Z`, includes that merge. Live `sw.js` and `journal-content-security.js` match the reviewed files byte-for-byte.
- Edge Function `admin-cancel-subscription` version 2 is active; `verify_jwt=true`. No real cancellation was performed.
- Password leak protection enabled and verified in the dashboard. Secure password change and requiring the current password are also enabled in the observed configuration. The owner made additional settings changes during this audit; preserve those settings.
- Both chart buckets are now private. Production has 19 restrictive Journal membership policies. Before/after counts match: 238 trades, 103 Journal entries, 49 accounts, 8 posts, 1 subscription, 1 Life OS workspace and 1,676 storage objects.
- Approval review initially blocked the broad Journal access change. The owner explicitly approved both production security changes. A subsequent image-policy review rejected gating owners by subscription; the patch was narrowed to preserve personal file access, tested again, and approved/applied through the original migration tool. No workaround or indirect execution was used.
- The patch lists 20 table names and skips absent tables; live verification confirms 19 policies were created. The initial review/request described 21 tables. The approved SQL and applied migration are the authoritative scope.
- Dashboard launch concerns: built-in SMTP is in use (production email rate limits); organization exceeded quota and warns about project restrictions from 2 November 2026. No paid upgrade or billing change was performed.
- Claude coordination: repository CLAUDE.md, design handoff, audit document and security PR #107 comment were updated. Posting into the native Claude chats remains unverified because macOS computer-use permissions were pending.

Supabase advisor review: no leaked-password warning remains. Three no-policy tables are intentionally deny-by-default. Fourteen SECURITY DEFINER notices require in-body authorization checks; do not revoke legitimate application RPCs indiscriminately. [Advisor guidance](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).

- Production role simulations: anonymous users list zero private chart objects; an unentitled synthetic identity reads zero trades, Journal entries and private images. A verified administrator retains access to all 238 trades, 1,595 app-images objects and all 68 imported charts. These SQL role tests do not replace end-to-end testing of independent real member sessions.
- Live signed-in Studio loads all 238 trades and the visible entry/exit charts successfully through signed URLs; newest unpublished trades remain private. No Publish button was pressed.
- Residual work: production SMTP setup, organization quota, low-priority public admin UUID enumeration, development-only Capacitor advisories, and broader legacy DOM/independent member-session testing. No guarantee of zero vulnerabilities is made.
