# Newest-first Journal production release — 7 October 2026

User requested production deployment and newest-to-oldest Journal records. Verified full-site candidate: `6ac6ecc1094257cf11d32269`.

- [Full website candidate](https://6ac6ecc1094257cf11d32269--lmrcapitalsapp.netlify.app/)
- [Administrator Journal selector](https://6ac6ecc1094257cf11d32269--lmrcapitalsapp.netlify.app/inner-circle?preview=1&tier=admin#studio-trades)
- [Paid member portal](https://6ac6ecc1094257cf11d32269--lmrcapitalsapp.netlify.app/inner-circle?preview=1&tier=paid#observations)

## Implemented and applied

Trades use trade date; observations use original creation time; achievements use achieved date. Missing dates fall back to original creation time, then available timestamps. Equal dates use a deterministic kind/ID tie-break. Editing or republishing an older record does not make it newer. Source selectors, member feeds, galleries and the administrator publication list use the same chronology. Pinned publications no longer override this chronological feed ordering.

The publication adapter retrieves all authorized rows in stable 100-row pages before sorting; it no longer silently drops history beyond the first 100 publications. Free/paid and ownership filters remain in the existing database policies and frontend access model. Already-published trade copies use their existing selected-detail date as a compatibility fallback. No Journal source, publication status, image, subscription or account role was changed for this release.

Applied `database/migrations/20261008010414_inner_circle_journal_newest_first.sql` to Supabase project `agrvylclhvxyevsmmexf`. It replaces only the ordering/display metadata functions. Source RPC remains owner-filtered and admin-MFA guarded, reads the correct `trade-{id}-result` ENTRY chart slot, and sorts by typed original timestamps. The internal source synchronization trigger remains revoked for clients and preserves reversible withdrawal. Post-apply read-only checks confirmed correct ordering, ENTRY slot, metadata date calculation and retention of the existing publication.

## Verification

15 release test files passed with `node --experimental-vm-modules --test member/tests/*.mjs admin/login.test.mjs admin/terminal.test.mjs scripts/journal-workspace.test.mjs scripts/journal-daily-preservation.test.mjs`. New tests cover all three original date kinds, edited/re-published older records, missing dates, stable ties, legacy trade publications and a latest original record beyond the first two pagination pages. PostgreSQL/PGlite tests exercise the updated source RPC and copy metadata after an older observation is edited, plus existing MFA/ownership/free/paid/media controls.

Production build passed, with the existing unrelated ThreeUI export warnings. Hosted preflight verified landing rendering and public achievement dates newest first, the landing-to-Inner-Circle sign-in flow, and the administrator selector labelled newest first, with no browser rendering errors. Security advisor counts remain unchanged: 10 existing security-definer advisories, 2 internal-table RLS notices, 1 leaked-password protection advisory. [Function permissions remediation](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).

## Initial production upload review

The linked site is `09e03f83-2353-4a3a-bb21-ae5ab81ef45b`, `lmrcapitalsapp`, custom domain `https://lmrcapitals.com`, with Git continuous deployment connected. The owner was warned that a later Git production deploy can replace a manual upload; deployments were not locked.

Automatic approval review rejected `netlify deploy --prod --dir dist --no-build` before it executed. Stated reason: it replaces the live site with the entire broad build while the latest request was interpreted as approving newest-first ordering, and the broader production release scope had previously been rejected. No workaround, indirect publication, Git push or production promotion was attempted. Asked the owner explicitly to approve the complete reviewed website: landing, Inner Circle member/admin portals, LMR Studio, embedded Trading Journal and newest-first ordering. Production upload awaits that scope confirmation.

Published deploy at the preflight read was `6ac6d165ac83e3000875c837`; it was not replaced by this turn. Existing account-registration and paid-enrollment configuration gates, Stripe function releases and the separately prepared legacy Journal policy patch remain unchanged. Website deployment approval is separate from approving policy drafts or activating billing.

Screenshot: `member/verification/lmr-newest-first-ready-2026-10-07.png` (clearly marked illustrative administrator preview). No real private Journal records were published during verification.

## Owner-confirmed production deployment

The owner subsequently explicitly confirmed the full reviewed website release to `lmrcapitals.com`, including landing, Inner Circle, LMR Studio and the embedded Journal, with the condition that existing database records and stored data must not be overwritten. That confirmation resolved the earlier scope blocker.

Successfully uploaded the existing reviewed `dist/` with `netlify deploy --prod --dir dist --no-build`. Production deploy: `6ac6ee783c2a68cb0b300fd2`. The read-only Netlify site API confirmed this exact ID is the published deployment for `https://lmrcapitals.com`.

This deployment uploaded website files only. No database commands, migrations, record updates, storage uploads, Git commits/pushes or billing releases were run. Existing signup/paid enrollment gates and the unapplied legacy policy patch remain unchanged.

Production checks: landing, Inner Circle, administrator route, embedded Journal HTML and joining guide all respond successfully. Inner Circle and guide HTML exactly match the reviewed build. The Journal HTML differs only by Netlify's normal pretty-URL rewrite of the free Inner Circle anchor (`/member/index.html` to `/member/`), with no application code changes. Browser verification confirmed the live landing page and real Inner Circle sign-in screen render successfully. No credentials were entered or publication/Journal forms submitted. A Python certificate-store failure during a read-only check was resolved using system curl with normal TLS verification; certificate validation was not disabled.

Production screenshot: `member/verification/lmr-production-2026-10-07.png`.
