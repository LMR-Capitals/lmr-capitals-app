# Journal publication display correction — 7 October 2026

Draft deploy: `6ac6eab371ba3fc49dafa2b4`.

- [Admin LMR Trade review](https://6ac6eab371ba3fc49dafa2b4--lmrcapitalsapp.netlify.app/inner-circle?preview=1&tier=admin#studio-trades)
- [Paid member observations](https://6ac6eab371ba3fc49dafa2b4--lmrcapitalsapp.netlify.app/inner-circle?preview=1&tier=paid#observations)
- [Paid member achievements](https://6ac6eab371ba3fc49dafa2b4--lmrcapitalsapp.netlify.app/inner-circle?preview=1&tier=paid#achievements)

Preview uses clearly marked illustrative data and never constructs a Supabase client. Use **Go to real sign in** for an authenticated account's Journal records. No real Journal entries were created, edited or published during verification.

## Correct source image

The user's selected Journal chart is labelled **ENTRY · exit / outcome**. The canonical Journal binds this zone to `tm-img-result` / `tl-img-result`, persisted as `trade-{id}-result` in `app-images`. The earlier bridge incorrectly used `trade-{id}-entry`, which is labelled **Intraday**. Both the source RPC and publication version check now read the `-result` slot. Missing ENTRY charts block publication rather than substituting another slot or a legacy image field. Publication copies the selected chart into private member storage; refresh explicitly replaces its image snapshot. Market, direction, session and date remain the selected trade details.

## Observations and achievements

Observation copies preserve the complete original HTML notes and all supported chart images. The display includes market/timeframe from Journal's `obsmeta`, session and original creation/update timestamps. Original titles remain available in full through allowlisted `source_details`, even when notification titles use their existing shorter limit. Charts use the Journal's count-based grid (up to four columns), stack at phone width and can each open at full size. Safe React rendering excludes active editor content.

Achievements use the same original Journal table as the landing page. Copies retain the original certificate image, full title/caption, category, firm, amount and achieved date. Presentation uses an uncropped certificate, category/title, firm/date and conditional USD payout amount, following `web/landing/experience-app.jsx`'s RecordCard format. Studio shows the original landing-page visibility flag without changing it. Publication still requires an administrator to select a record; private records are not automatically published.

Applied `database/migrations/20261008005139_inner_circle_journal_display.sql` to Supabase project `agrvylclhvxyevsmmexf`. RPCs require admin MFA, filter by source ownership and use security invoker execution. The source sync trigger remains internal with client execution revoked. It updates only selected linked publications; removing or reassigning a source now withdraws its copy reversibly. Drafts remain private. Material Journal changes trigger the existing paid-member notification mechanism. No access policy, account role or subscription change was included. A pre-apply aggregate confirmed zero linked posts, so no backfill or withdrawal of existing publications was needed.

## Verification

- Five scoped test files passed: PGlite database migration/permissions tests, Studio display tests, safe Journal media tests, canonical Journal navigation/preservation tests and latest daily-state preservation tests.
- Database tests seed all four Journal chart slots and prove that the labelled ENTRY uses `-result`, rejects missing/stale charts and ignores Intraday changes. They also verify complete observation content, full long titles/captions, achievement metadata synchronization, one notification for an achievement metadata edit, reversible source withdrawal and free/paid isolation.
- Production build passed. Existing ThreeUI/Three export warnings remain unrelated to this correction.
- Browser checks: all observation charts loaded and expanded; certificates loaded with `object-fit: contain`; original display metadata rendered; 390px phone view stacked charts without horizontal overflow; free account switching hid paid achievement content. Final deployed member/admin views had no rendering errors.
- Security advisors: no new findings. Existing security-definer RPC advisories decreased from 11 to 10 after moving journal publication to security invoker. Existing internal-table RLS and leaked-password settings advisories remain separate work. [Supabase function permissions remediation](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).

Screenshot: `member/verification/lmr-journal-display-2026-10-07.png` (illustrative paid-member review).

## Release state

Frontend is a draft review deployment, not a main-domain production release. The earlier automatic approval review rejected the full production upload because it included broader merged runtime changes beyond the verified release scope. That production release and the separately prepared legacy Journal-access/billing changes remain outside this correction. No Git push or commit was made.
