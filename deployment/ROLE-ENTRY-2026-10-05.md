# Administrator and member sign-in routing

Production deploy `6ac387df76fa298fe75a1909`, published to https://lmrcapitals.com. Verified role-routing draft: `6ac3863804e91f91f289203b`. Previous unified-portal release for rollback: `6ac38214fe33343e1895b912`.

## Behavior

- Registered administrators signing in through Inner Circle are sent through the existing MFA verification if needed, then land directly on Inner Circle Admin Hub. Default `/admin` and `/admin?next=circle` already return there after verification.
- The administrator workspace has only Admin Hub, Publishing studio, Journal Application and Admin Terminal navigation. Its account menu contains Admin Hub, Profile, Settings and Sign out. Member learning navigation and membership/upgrade controls are excluded.
- Paid members retain their paid Inner Circle dashboard, premium access and member account menu; they receive no administrator controls. Free members retain their free dashboard, learning/resources and Get membership action.
- Actual classification comes from verified identity, `is_admin`, MFA and server-paid/entitlement checks. Administrator role takes precedence over subscription status; the displayed email and preview URL cannot grant real administrator privileges.
- The member layout is withheld until access classification finishes. Fresh account changes clear the prior user's access and data before loading the new workspace. Unknown/error access gets a retry/sign-out screen rather than silently assigning a free tier.
- Administrator data loading uses the existing terminal/account adapters and does not require subscription or learner-progress checks. Notification read markers remain preserved on refresh.
- Explicit administrator journal links still open the journal after verification; members keep the prior paid/free journal flow.

## Verification

Production build, role/identity/MFA tests, portal destination tests, terminal access tests and Journal Application tests passed. Role tests cover admin precedence without subscription calls, matching-email nonadmins, MFA downgrade, paid/free combinations, verification errors and stale identities. Browser checks confirmed the separate administrator menu, no administrator controls in either member tier, no paid upgrade button, and a free Get membership button. The hosted draft and production administrator preview render the new shell.

The explicit administrator preview is `/inner-circle?preview=1&tier=admin`. It constructs no backend client, loads no private records and has no membership tier-switch controls. Ordinary paid/free previews remain separate. Screenshot: `member/verification/administrator-role-workspace.jpg`.

The final real sign-in check found a stale `terminalRequested` reference in the legacy Login component. It now uses `requestedSurface`, and `admin/login.test.mjs` renders that actual component for default/circle/terminal/journal entry paths to catch undefined-variable failures. The repaired production `/admin?next=circle` form was visibly verified. Screenshot: `member/verification/administrator-sign-in.jpg`.

A full real production password/MFA sign-in was not performed by the agent. No database migrations, role grants, payment-function releases, charges or data publications were performed in this update. The previously pending legacy journal database policy change and billing release remain pending; this update does not approve or apply them.
