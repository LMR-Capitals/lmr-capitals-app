# LMR Inner Circle continuation record

> Production update, October 5: website and the additive Inner Circle / learning / journal-source migrations are live. Existing journal RLS and Stripe functions were not changed; those releases await explicit approval following automatic review rejection. See [deployment receipt](../../deployment/RELEASE-2026-10-05.md).

Verified locally on October 5, 2026. The user requested the working member application using existing LMR branding and source terminology, including Stripe membership, admin publications, live analysis, image galleries, private Q&A, paid mentorship requests, profiles and notifications.

## Current free and paid model

Free signed-in users get the dashboard, all ten sequential terminology chapters, lesson/checkpoint progress, resources, free announcements, profile and settings. Premium requires a current paid invoice plus active subscription. It unlocks live analysis, observations/callouts, execution/achievement galleries, Q&A, mentorship requests and the trading application. Trial/comp records do not unlock premium. MFA-verified administrators retain operational access.

Chapter one opens first. Mark every lesson studied, answer the two original-definition checkpoint questions, then unlock the next chapter. The dashboard shows the current chapter, a ten-link path, completed-chapter ring and reference-study badges. No financial outcome is implied. Progress is per account in the new learning patch; direct writes are denied.

Social URLs were copied from the existing site: X, Discord, YouTube, Instagram. Preview defaults to the free tier; use its ribbon to switch to paid. All preview writes remain temporary.

## Current result

- Public website sign-in and enrollment CTAs lead to the free Inner Circle; outdated trial copy was updated to match the free-account / paid-membership model.
- The application lives in `member/`, with a Vite entry and Netlify `/members` rewrite. Existing admin hub links to its publishing studio.
- Preview: `/member/index.html?preview=1`. Preview updates are temporary React state; there are no production writes or payments.
- Member/admin backend patches: `database/patches/inner-circle.sql`, followed by `database/patches/inner-circle-learning.sql`. Core adds restrictive membership policies to existing application tables and the journal image bucket.
- Checkout, billing portal and webhook handlers: `database/functions/`.
- Complete release sequence and configuration: `member/README.md` and `member/.env.example`.

## Validation evidence

- Vite production build passed; existing ThreeUI/Three.js import warnings remain outside this change.
- Actual migration executed twice in local PGlite. Role/access tests passed for membership expiry, paid-only mentorship, private questions/replies/media, admin MFA, and webhook timestamp ordering.
- Mocked checkout tests passed without network calls or charges.
- Node TypeScript syntax checks passed for all four billing files. Hosted Deno deployment remains unverified.
- Browser flows checked: original terminology and charts; Q&A submission; admin reply/publication; paid preview mentorship request; notification preferences; membership page; mobile feed search and navigation.
- At 390 × 844, the dashboard has no document horizontal overflow. The closed drawer is absent from the accessibility tree. Opening focuses navigation; Escape closes and returns focus to the trigger.
- Browser checkpoint walkthrough passed: all nine chapter-one lessons marked, wrong answers rejected, correct answers completed the chapter, chapter two opened, and dashboard progress advanced.
- Latest screenshots: `free-learning-progress.jpg` and `mobile-learning-progress.jpg`; earlier dashboard screenshots remain in this folder. The temporary mobile viewport was reset.

## Next activation work

No live schema migration, Edge Function deployment, payment charge or stream broadcast has been performed. Use the README release sequence against staging first. Supply reviewed terms/privacy, provider details and policy versions; configure Stripe test mode, redirect origins and stream-provider restrictions; reconcile existing paid invoices before enabling paid mentorship.

Working assumptions: mentorship uses the existing paid membership; live analysis uses a configured YouTube/Vimeo embed or external HTTPS stream. No separate mentorship price or final streaming provider was supplied. In-app notifications refresh every 60 seconds and on focus. Email and push delivery are not implemented.

The repository contains substantial pre-existing edits and deletions. Preserve them when continuing. Do not repeat completed work or claim that the local tests certify hosted security or legal compliance.

## Admin-first phase — October 5 continuation

The user renamed the member navigation entry to **Journal Application** and asked to prioritize the **Admin Terminal**, sharing the existing Admin Hub credentials for admin@lmrcapitals.com. Member expansion is deferred. The profile button now opens an account menu with Profile, Settings, Membership and Sign out; keyboard arrow navigation into Settings was checked in the browser.

The new entry is `admin/terminal.html`. Use the running Vite HTTP URL, currently `http://127.0.0.1:5174/admin/terminal.html?preview=1`. Direct `file://` opening was white because JSX source requires Vite; the HTML now has a static explanation/link instead of an empty root. The working HTTP terminal was opened in the browser and screenshot proof saved.

Admin Hub now links to Admin Terminal and Journal Application; `admin/admin.html?next=terminal` returns to the terminal only after registry validation and MFA. The terminal validates `getUser`, `is_admin` and aal2 independently of membership/chapter RPCs. Shared publishing/reply actions are in `member/admin-actions.js`. Fields and saves stay disabled when publishing tables are missing. No production migration, password change or live publication was performed. See `admin/README.md`.

Verified: terminal draft save and management, private reply and overview queue count, announcement audience/history, desktop/mobile layout without horizontal overflow, mobile drawer and Escape. `node admin/terminal.test.mjs` and updated `node member/tests/application.mjs` passed. Journal access still requires paid membership for ordinary accounts; registered MFA admins can operate without the member patch RPC. Preview uses sample data and no Supabase client. Proof: `admin-terminal.jpg`, `admin-terminal-mobile.jpg`. Actual hosted publishing, fresh password/MFA login and production activation remain unverified.

## Journal source and member navigation continuation

- Admin observations/achievements now use the administrator’s existing cloud journal rows. Apply the new `inner-circle-journal.sql` patch after core and both source tables. Server-owned copying, unique linkage and source update/delete triggers implement replication; no hosted migration has been performed.
- Core triggers automatically notify for post publications/edits/withdrawals/deletions and session scheduling/group/details/status updates. Draft/no-op changes stay quiet, private replies retain owner-only notices, and audience policies remain intact.
- Four Live Analysis rooms are implemented: Asia, London, NY AM, NY PM. Legacy unassigned sessions can be categorized without disappearing.
- Member sidebar no longer contains Notifications/Settings/Membership. Top bell remains. **Get membership** appears only for free accounts; paid accounts use the profile menu for Membership/Settings. Paid preview no longer grants admin status. Comparison member panes hide the developer tier ribbon and use the real member layout.
- The comparison uses a page-specific in-memory preview channel. Admin sample publication produces the paid sample post/notification and remains invisible to the free sample account. It transfers no private replies or live database data.
- Actual PostgreSQL tests passed for source ownership/MFA, copy/duplicate prevention, edit/delete sync, draft preservation, raster image copying, free/paid separation and complete session/post notification coverage. Journal media URL safety tests, terminal tests and production build passed.
- Browser verified source observation publication, paid notification/free exclusion, sidebar removal of admin/account routes, top free upgrade label and profile Membership/Settings menu. Screenshot: `member-profile-membership.jpg`.
- Live backend activation is still pending the documented staging release sequence. Source previews are explicitly illustrative; actual certificates/observations appear only after the integration patch and administrator authentication.
