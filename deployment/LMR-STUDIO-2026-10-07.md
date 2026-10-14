# LMR Studio review — 7 October 2026

Review deploy: `6ac6e6483c2a68a7f4300fbc` on Netlify site `lmrcapitalsapp`.

- [Administrator Studio](https://6ac6e6483c2a68a7f4300fbc--lmrcapitalsapp.netlify.app/inner-circle?preview=1&tier=admin#studio-observations)
- [Free-member Q&A](https://6ac6e6483c2a68a7f4300fbc--lmrcapitalsapp.netlify.app/inner-circle?preview=1#questions)
- [Paid-member Callouts](https://6ac6e6483c2a68a7f4300fbc--lmrcapitalsapp.netlify.app/inner-circle?preview=1&tier=paid#callouts)

These three links use illustrative preview records and never construct a backend client. Remove `preview=1` to use the authenticated portal on this review origin; members/admins sign in themselves.

## Changes

LMR Studio replaces Publishing studio. Its sidebar has live sessions, observations, paid-only callouts, Journal trade entries, achievements, mentorship requests, the Q&A queue, announcements and free resources. The full Journal remains in the top workspace switcher; account/settings remain in the profile menu.

Creating an observation saves its original `lmr_observations` row and linked Circle draft or paid publication atomically. The client keeps the same source reference if a save must be retried. Existing observation/achievement publishing retains its source linkage and original content.

Trade publishing reads only the administrator's own Journal records. One entry chart is copied into private Circle media; it shares market, direction, session and date. Account IDs, P&L, lot size and exit charts are omitted. A source-version check refuses a stale chart selection. Journal detail edits synchronize; use Refresh entry chart to replace a published image snapshot. Removing/reassigning the Journal trade withdraws its Circle publication into a private draft and retains the Studio copy.

Q&A is available to registered free and paid accounts. Members only read their own questions/answers. Free users cannot attach a question to a paid live session. The admin queue orders unanswered requests oldest first and advances after answering; replies create private member notifications. It loads all waiting requests in pages, so answered history cannot displace older unanswered requests.

Profile photos display safe provider `avatar_url`/`picture` metadata when available. This is appearance only and does not affect authority. Password sign-in with a Gmail address does not itself supply a Google photo. Members can upload a PNG/JPEG/WebP (up to 5 MB), restore an available provider photo or use initials. Custom photos use private owner-only Storage and signed URLs; both profile buttons display the selected photo.

## Database and validation

Applied and verified `database/migrations/20261008002338_inner_circle_studio.sql` on `agrvylclhvxyevsmmexf`. Studio RPCs are security invokers, require registered admin MFA, and are unavailable to anonymous callers. The avatar bucket is private and Q&A policies retain owner isolation. Security advisors report no new findings for these additions.

The first proposed migration was rejected by automatic approval review because its trade-delete trigger could permanently delete a published Circle copy. The applied revision withdraws a copy without deleting it. This safer revision passed approval.

Validation: PostgreSQL/PGlite migration tests, role/MFA guards, observation atomicity and retries, source sync, reversible trade withdrawal, free Q&A/private replies, avatar ownership and paid media; frontend Studio/queue/photo tests; the existing member suite and Billing's VM tests; Journal preservation tests; production build. Browser preview checks confirmed free Q&A submission, queue advancement, a Journal trade publication, profile-photo upload updating both account buttons, mobile member layout without horizontal overflow, and deployed admin/free/paid views without rendering errors. No real Journal records were published, edited or created for browser verification.

Screenshot: `member/verification/lmr-studio-2026-10-07.png` (review only; excluded from the build).

## Release state

Frontend is a draft review deploy; production was not published. Earlier production approval, signup-policy approval, billing function deployment and the separately prepared legacy Journal-access patch remain separate release work. This migration does not apply that legacy patch, grant roles, change subscriptions or publish existing private Journal records automatically. No Git commit or push was made.
