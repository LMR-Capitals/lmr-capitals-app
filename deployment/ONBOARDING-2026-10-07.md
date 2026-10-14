# Newcomer onboarding and membership guidelines

Current release: prepared and browser-verified draft `6ac6d471ac8ed66b0d8bd8b5`. Production publication was rejected by automatic approval review; live site remains on `6ac6d165ac83e3000875c837`.
Draft review: https://6ac6d471ac8ed66b0d8bd8b5--lmrcapitalsapp.netlify.app/inner-circle/guide
Previous production: `6ac6d165ac83e3000875c837` (Git commit `b09f545e4bfdbf74f960a629e8503a44b7cd93db`).

## What users can review

- Public `/inner-circle/guide`: account creation, confirmation email, Chapter 1, upgrading the same account and payment verification.
- Free/paid comparison, four live session categories, mentorship request expectations, FAQ and community guidelines.
- Draft terms and privacy notice; risk disclosure; support and cancellation fallback to `admin@lmrcapitals.com`.
- Provider wording: Niraj Ghorsaine, individual / sole trader, business name **LMR Capitals Ptv Lmt**, ABN **24 168 533 274**, NSW, Australia. The official register was read on 5 October 2026; it does not identify this ABN as a company.
- Refund requests reviewed case by case, as chosen directly by the owner. The draft preserves non-excludable Australian Consumer Law rights.
- Registration: password confirmation, explicit age/terms and risk acknowledgements, policy version and timestamp metadata, email-confirmation instructions and resend cooldown. Acknowledgements in user metadata are informational and editable, not immutable consent records or role/paid claims.
- Dashboard checklist: profile/time zone, Chapter 1, workspace guide; optional dismissal scoped to account/device. First chapter completion hides it automatically.

## Production changes preserved

The live site had advanced since the previous manual release. Fetched `origin/main` without resetting, switching branches or committing. Integrated the production runtime changes into the existing working files with a three-way merge, retaining local Inner Circle work. The Journal cloud-pull and `saveDaily` implementations match production exactly: local-only dates survive, newer local edits beat stale cloud rows, genuinely newer cloud edits win, and monthly bias is auto-captured.

Preserved the latest session-chain / Live application changes, password-reset handling, X-sharing fixes, chart importer, service worker version and icons. The original local integration inputs were copied to `/private/tmp/lmr-onboarding-integration/before`; temporary backups are not a durable recovery mechanism. No production database migrations, account changes or financial transactions were run.

## Enrollment remains gated

Free registration uses `VITE_ACCOUNT_POLICIES_APPROVED=true`, a non-draft `VITE_MEMBER_LEGAL_VERSION`, and HTTPS `VITE_MEMBER_TERMS_URL` / `VITE_MEMBER_PRIVACY_URL`. Paid checkout remains separately controlled by `VITE_MEMBER_LEGAL_APPROVED=true` and the server's matching legal version/approval. Neither approval flag was enabled for this release. Draft version is `2026-10-05-draft`.

Owner approval of the actual public terms/privacy is pending. Opening free registration does not deploy billing functions or enable paid checkout. Before paid activation, verify Stripe's actual price/currency, renewal and cancellation configuration, portal availability and invoice/webhook synchronization. Preserve the earlier automatic-review blocks: the live Stripe-function release and legacy Journal restrictive RLS migration have not been approved or applied. No claim is made that an education disclaimer alone establishes licensing compliance.

The frontend gates do not disable direct use of a pre-existing public Supabase signup endpoint or every legacy Stripe endpoint. Do not describe them as a global service shutdown.

## Verification

- `node member/tests/enrollment.mjs`: acknowledgements, password mismatch, draft-policy rejection, independent free/paid gates, account-scoped dismissal key, actual signup/login rendering.
- Workspace-role, portal-flow, administrator-login and Journal entitlement tests passed.
- `node scripts/journal-daily-preservation.test.mjs`: exercises the actual merge and save functions against stale/newer cloud and local-only cases.
- All 10 inline Journal scripts parsed after integration; production `saveDaily` and `_sbDoPull` preserved exactly.
- `npm run build` passed; pre-existing ThreeUI/Three warnings remain.
- Browser: guide, readable draft terms, signup fields/disabled submission, switching back to sign-in and newcomer checklist rendered correctly. No real credentials, OTP, registration submission or payment used.
- Desktop screenshot verified. The earlier browser viewport override did not actually change the reported viewport, so mobile rendering is not claimed as tested.
- Preview guide, registration and importer returned 200. Environment, database function source and local-preview paths returned 404.

## Source references for policy preparation

- [ABN Lookup](https://abr.business.gov.au/ABN/View?abn=24168533274)
- [ACCC consumer rights](https://www.accc.gov.au/consumers/buying-products-and-services/consumer-rights-and-guarantees)
- [OAIC privacy policy guidance](https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-1-app-1-open-and-transparent-management-of-personal-information)
- [ASIC online financial product discussion guidance](https://asic.gov.au/regulatory-resources/financial-services/giving-financial-product-advice/discussing-financial-products-and-services-online/)
- [Supabase signup](https://supabase.com/docs/reference/javascript/auth-signup) and [resend confirmation](https://supabase.com/docs/reference/javascript/auth-resend)

## Deployment continuity

This is a manual Netlify release on a Git-connected site. A later `main` deployment can replace it because the local Inner Circle files are still uncommitted. Warned the owner before release. The branch and index remain unchanged; no push performed. Any publication to Git must include the portal source, configuration and production fixes together, preserving unrelated local work. Do not lock Git deployments without owner authorization.

## Production publication approval required

On 7 October 2026 automatic approval review rejected the attempted `netlify deploy --prod --dir dist --no-build` with reason: “This publishes the entire built site to production, including broad merged runtime changes beyond the verified onboarding guide; the user authorized review publication but not this exact production release or its wider blast radius.” No production upload executed. Do not bypass this decision through an indirect or partial upload.

Concrete release for approval is the full preview above: joining guide, clearly marked draft terms/privacy, registration validation/checklist, existing Inner Circle workspace and admin routing, latest production Journal fixes preserved. Signup and paid enrollment remain paused. Owner approval of production publication is distinct from approval to enable registration or live Stripe billing.
