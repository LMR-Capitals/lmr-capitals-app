# LMR Inner Circle

> Production update, October 5: website and the additive Inner Circle / learning / journal-source migrations are live. Existing journal RLS and Stripe functions were not changed; those releases await explicit approval following automatic review rejection. See [deployment receipt](../deployment/RELEASE-2026-10-05.md).

A React member application built inside the existing Vite multi-page project. It uses the actual LMR logo, Archivo typography, navy surfaces and gold palette. It preserves the existing journal and admin applications.

## Open

- Free account preview: `/member/index.html?preview=1`
- Paid account preview: `/member/index.html?preview=1&tier=paid`
- The preview ribbon lets you switch between both tiers without payments.
- Real account application: `/member/index.html`
- Hosted clean route: `/members`
- Admin studio: `/member/index.html#admin`, also linked from the existing admin hub.

Run `npm run dev`. The preview is deliberately isolated: it creates no Supabase client, never calls Stripe, stores changes only in React memory, and resets on reload. It labels all sample activity. Execution and achievement galleries start empty rather than fabricate results. Admin preview simulates member publishing, questions and requests in the same local state; it does not impersonate a production admin.

## Implemented flow

The public website sign-in/enrollment entry points lead to this free Inner Circle account flow. Existing Supabase login → free Inner Circle dashboard + resources + chapter learning. Server-verified paid membership unlocks premium routes. Account creation and password recovery are supported. New enrollment is blocked while final legal policies are missing. Stripe Checkout uses the existing server-configured monthly/yearly price IDs; no prices or currencies are guessed. A server-verified webhook, not the return URL, updates subscription access. Stripe's hosted billing portal supports invoices, payment methods and subscription management according to its dashboard configuration.

| Free signed-in account                                                                                                         | Paid membership                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard, all ten terminology chapters in sequence, checkpoint progress, free resources, free announcements, profile/settings | Live analysis, observations/callouts, execution and achievement galleries, private Q&A, mentorship requests, trading application |

The actual application gate in `app/app.html` now uses the same paid-membership RPC and fails closed. It sends upgrade requests through the Inner Circle membership page. Restrictive policies in `inner-circle.sql` add the membership requirement to existing application ownership rules on the listed workflow tables and the `lmr-images` bucket. Comp and trial records no longer unlock premium; MFA-verified administrators retain operational access.

Chapter learning uses the supplied reference in order. Each chapter requires all its lessons marked studied and two definition checkpoint answers before the next chapter unlocks. Dashboard progress shows the current chapter, completed links, a progress ring and learning badges. These measure reference study, not trading skill or profitability. Progress is account-specific in `circle_learning_progress`; direct client writes are denied. A narrow writer in the non-exposed `circle_private` schema derives the user from Auth, locks their progress transaction, and checks prerequisites and answers. Its invoker RPC is public; the private catalog has no client read grant. Preview progress resets on reload.

The original content remains a bundled free reference. Chapter locking directs the learning journey; it does not claim to hide already-public reference assets from a technically skilled visitor.

Admin studio: publish posts or save drafts, publish/unpublish existing content, upload private images, publish free resources, choose free/paid announcement audiences, schedule a live session, mark live/ended, publish announcements, reply privately to questions, and respond to mentorship requests. Publishing plus notification creation is atomic through invoker-security RPCs. Admin access requires the existing admins registry **and MFA aal2**. Complete the existing `/admin` login before entering the studio.

Notifications refresh on focus and every 60 seconds while visible. This is in-app delivery; email, mobile push and browser push are not implemented or implied. Preferences filter optional categories; general announcements and question replies remain visible.

## Content provenance

- Logo: `public/icons/High-Resolution-Color-Logo-on-Transparent-Background.png`, rendered without replacing the artwork.
- Library: `design/handoff/terminology.json` (10 chapters, 73 entries).
- Expanded teaching blocks: `app/app.html`'s `DEFAULT_BLOCKS`, copied as JSON into `member/terminology-blocks.json` (39 enriched entries, 96 image references). All referenced local image files exist.
- Existing educational charts: `public/term/`. These are already public reference assets. The static original library remains bundled reference content; it is **not confidential paid media**. New paid post images use the private bucket. Making the legacy library itself exclusive requires migrating its already-public assets and original journal delivery too.
- Social channels: existing X / Twitter, Discord, YouTube and Instagram URLs from `web/landing/experience-app.jsx`, reused without guessing handles. External destinations were not modified.
- Checkpoints: definitions and distractor names generated from the original reference by `member/scripts/sync-learning-catalog.mjs`. Re-run it when changing the reference; it updates the checkpoint JSON and learning patch together.
- Observations and achievements now publish from the administrator’s existing Journal Application tables (`lmr_observations`, `lmr_achievements`). Select a source record in the terminal once; subsequent source edits synchronize its chosen member copy. Unselected records remain private, withdrawn copies stay withdrawn, and deleting a selected source removes its copy. The website `is_public` achievement setting remains independent.

## Backend release sequence (not performed against the live project)

1. Apply `database/patches/inner-circle.sql` to a staging copy containing the existing `admins`, `subscriptions`, `comp_access` and Supabase Storage/Auth schemas. The patch is additive and replay-safe for its own policies. It creates `circle_*` tables, policies, private `circle-media`, atomic publishing functions, and `paid_until` / `stripe_event_created` on subscriptions. Then apply `database/patches/inner-circle-learning.sql` for progress and checkpoints. Apply `database/patches/inner-circle-journal.sql` after the core patch and the existing observation/achievement tables to enable source selection and synchronization. The journal patch fails explicitly if either source table is absent; do not reapply old public-read source patches over an existing secured production schema. Both patches are replay-tested locally. The core patch also restricts existing application data to paid members; review the explicit table list against staging before production.
2. Validate the role/access tests against staging. Local tests run the actual SQL in PostgreSQL via PGlite with Supabase Auth/Storage scaffold substitutes. They do not validate the hosted project's other existing policies, API exposure, auth redirects or Storage service configuration.
3. Deploy `create-checkout`, `create-billing-portal`, and `stripe-webhook` with the shared billing module. Deploy the webhook without JWT verification; signature verification remains mandatory inside the handler. Other endpoints validate the Supabase user token.
4. Configure existing Stripe secrets/prices plus `APP_URL` and optional explicit `ALLOWED_APP_ORIGINS`. Missing plan settings now fail closed; the old hardcoded live price fallback is removed. Review this before replacing the legacy checkout endpoint.
5. Subscribe the Stripe endpoint to `checkout.session.completed`, `customer.subscription.created`, `.updated`, `.deleted`, `invoice.paid`, and `invoice.payment_failed`. Verify the Stripe API event version and run Stripe **test-mode** scenarios before any live activation.
6. Configure the Stripe billing portal's allowed cancellation/payment update actions. Add this member URL and recovery URL to Supabase Auth's allowed redirects.
7. Reconcile existing paid memberships from verified Stripe invoices to populate `paid_until`; do not mark old members paid based only on a client request. Existing subscribers without a verified future `paid_until` will have only free access. Reconcile them in staging and plan the production sequence before enabling the new gate.
8. Supply final legal provider details, jurisdiction, terms, privacy, renewal/trial/refund policy and risk/performance disclosures. Publish reviewed policy URLs and set matching frontend/server approval/version values. See `.env.example`. A setting is a release gate, not a certification of legal compliance.
9. Configure a stream provider and its privacy controls. Admin accepts YouTube/Vimeo embed URLs or an external HTTPS viewing link; a broadcast is created and transmitted through that provider. This app is **not an in-browser encoder, RTMP server or DRM system**. Member gating cannot prevent a viewer from copying an ordinary provider link; use provider restrictions or signed playback for strict paid-stream protection.
10. Build/deploy the website and validate login, payment failure, cancellation, trial expiration, invoice renewal, paid mentorship, private image URLs, admin MFA and two different member accounts.

## Security / access decisions

- No new service-role or Stripe secret appears in browser code. The publishable Supabase project configuration is the same as the existing admin app.
- `circle_can_access`: MFA-verified admin or active subscription with a Stripe ID, future period and future invoice-verified `paid_until`. Comp, trial, expired and unpaid accounts receive the free tier. Unavailable backend checks fail closed.
- `circle_is_paid`: active subscription, nonempty Stripe subscription ID, current period in the future, and future `paid_until` verified from a paid nonzero invoice. Trial and comp do not qualify for mentorship. User did not supply a separate mentorship product, so this implementation uses the existing paid membership.
- Questions and replies are private to owner and MFA-verified admin. Mentorship requests are likewise private and may be read by their owner after expiry.
- Members cannot set answers, request approval, Stripe status or admin membership. No user-editable auth metadata is trusted for permissions.
- New images use an admin-only upload policy and 5-minute signed URLs issued only for accessible published posts. `terminology` publications are free resources for signed-in accounts; other publication kinds are premium. Free accounts can access only images attached to visible free resources. Unpublishing stops new signed links; an already-issued link may remain usable for its remaining lifetime. Signed URLs refresh with workspace reads.
- External stream embeds are restricted to YouTube/Vimeo paths. External links require HTTPS.
- Billing redirects allow only configured application origins. Missing configuration fails closed. Free learning requires no checkout. New subscriptions start billing without an application trial. All checkout callers must pass the reviewed policy version; the old application directs users to the same membership flow.
- Webhooks verify signatures, retrieve current Stripe subscription state, surface database errors for retries, reject older event timestamps, and avoid old-subscription cancellations overwriting newer subscription records. Stripe event timestamps have one-second granularity; staging should exercise concurrent changes and reconciliation.

## Verification

- `npm run build` builds all existing pages and the new member route. Existing ThreeUI/Three.js `sRGBEncoding` warnings originate outside this change.
- `node --experimental-strip-types --check <edge-function.ts>` checks TypeScript syntax without executing network calls. Full Deno/Supabase deployment checks still belong to staging.
- `node member/tests/database.mjs` runs PostgreSQL row-policy and RPC tests. The test runtime was installed outside the project at `/private/tmp/lmr-circle-tests`; set `PGLITE_MODULE` to an installed `@electric-sql/pglite/dist/index.js` if elsewhere. No production dependency was added.
- `node --experimental-vm-modules member/tests/billing.mjs` verifies checkout authentication, trusted redirects, legal-version gates, required prices, duplicate-subscription rejection, retry keys and immediate paid checkout using mocked Stripe/Supabase services. It makes no network calls or charges.
- `node member/tests/learning.mjs` verifies sequential unlocks, study counts, full-path completion and checkpoint/source consistency. `node member/tests/application.mjs` verifies that the legacy application gate requires a successful server result.
- Browser checks cover original terminology, Q&A, admin replies/publishing, mentorship request and notification preference flows. The new free learner flow was checked from lesson marking through an incorrect checkpoint, successful chapter completion, next-chapter unlocking and dashboard progress. Production payment, actual streaming and authenticated hosted policies are not claimed tested without a deployed staging environment.

## Legal source notes

The existing site's Terms and Privacy text was explicitly placeholder material. A disclaimer cannot resolve the legal classification of paid trading commentary or individualized mentorship; that depends on the business, activity and jurisdiction. Review before launch. Primary references checked for the implementation's disclosure approach:

- [CFTC — Commodity Trading Systems Sold on the Internet](https://www.cftc.gov/LearnAndProtect/AdvisoriesAndArticles/fraudadv_tradingsystem.html)
- [CFTC — Futures Market Basics](https://www.cftc.gov/LearnAndProtect/EducationCenter/FuturesMarketBasics/index2.htm)
- [Stripe — Checkout subscriptions](https://docs.stripe.com/payments/checkout/build-subscriptions)
- [Supabase — Password sign-in](https://supabase.com/docs/reference/javascript/auth-signinwithpassword)

## Journal publishing and member navigation — October 5

The Admin Terminal reads only the MFA administrator’s own cloud journal records via `circle_journal_sources`. `circle_publish_journal` copies the chosen source itself inside a transaction, rather than accepting client-supplied content or another owner. A unique source reference prevents duplicate publications. Source updates/deletions synchronize through database triggers; drafts are not republished by an edit. Achievement images reuse the existing baked image, without changing the public website setting. Journal formatting becomes restricted React nodes; scripts, event attributes, styles and embeds are discarded. Supported inline raster images and HTTPS charts are retained.

Core database triggers create one in-app notice for a visible publication, edit, withdrawal or deletion, and for session scheduling, room/time/link edits, going live, ending and cancellation. Repeated identical writes and private draft edits do not notify. `notify_members` remains in the old RPC signature for compatibility; notifications are now mandatory for visible changes. Category preferences and free/paid RLS still govern each member’s feed. Delivery currently refreshes every 60 seconds/on focus; no email or device push is claimed.

Notifications stays in the top bell. Free accounts see **Get membership** at the top; paid members manage membership in their profile menu. Settings and Membership are absent from the navigation sidebar. A paid preview is not an administrator; administration belongs to its own terminal pane. The comparison hides member preview tier switches, while its outer labels identify the sample accounts. A page-specific, in-memory BroadcastChannel mirrors admin preview posts/sessions/announcements into both member panes; their existing tier filters apply. It sends no private questions or mentorship replies, reads no real records, and makes no backend writes.

Live analysis has four rooms: **Asia, London, NY AM, NY PM**. Players, schedules and question association are scoped to the selected room. Old unassigned sessions remain available for admin categorization.

Additional validation: `node member/tests/journal-media.mjs`, `node member/tests/live-sessions.mjs` and expanded `node member/tests/database.mjs`. PostgreSQL checks cover actual source-copy/edit/delete transactions, retries, private owner rows, MFA and paid audiences, plus one notice per visible event. The browser comparison was checked by publishing an illustrative journal observation and verifying the paid feed/notice versus the free account.
# Latest portal flow

Production entry is [lmrcapitals.com/inner-circle](https://lmrcapitals.com/inner-circle). Verified paid members and MFA administrators open Journal Application directly; free accounts are routed to membership. Admin Hub account controls and 24 private journal collections are available inside the admin Inner Circle. [Release, verification and pending database access approval](../deployment/PORTAL-FLOW-2026-10-05.md).

## Newcomer guide (7 October 2026)

Public guide and draft policies: `/inner-circle/guide`. Source: `guidelines.mjs`, `guide.jsx`, `guide.css`. Signup validates acknowledgements and matching passwords; optional dashboard activation lives in `getting-started.jsx`. Free registration can be approved independently with `VITE_ACCOUNT_POLICIES_APPROVED`, the published HTTPS policy URLs and a non-draft legal version; this does not enable paid checkout. Review [the release record](../deployment/ONBOARDING-2026-10-07.md) before enabling registration or publishing billing functions. The newest Journal production fixes are integrated and verified.


## LMR Studio — 7 October 2026

The admin Inner Circle now has a category-based LMR Studio, atomic Journal/Studio observation creation, single-entry Journal trade publications, a private Q&A queue for free and paid members, and editable profile photos. Google photos display when provider metadata supplies them; custom photos use private owner-only storage. The applied migration, review links and validation are recorded in `deployment/LMR-STUDIO-2026-10-07.md`. Entry charts are published as snapshots; Journal trade details stay linked and admins can refresh the chart.

Journal display correction (7 Oct 2026): executions select the visible **ENTRY · exit / outcome** chart (`trade-{id}-result`), not the Intraday slot. Observation notes/charts and original metadata stay complete; achievement certificates and record details follow the landing-page presentation. See `deployment/LMR-JOURNAL-DISPLAY-2026-10-07.md` for the applied targeted migration, review links and validation.

Newest-first chronology (7 Oct 2026): sources and member/admin publication lists order by the original trade, observation or achievement date. Authorized publication history loads beyond 100 rows. See `deployment/NEWEST-FIRST-2026-10-07.md` for the applied database function update, tests and release candidate.
