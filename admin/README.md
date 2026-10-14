# LMR Admin Terminal

> Production update, October 5: website and the additive Inner Circle / learning / journal-source migrations are live. Existing journal RLS and Stripe functions were not changed; those releases await explicit approval following automatic review rejection. See [deployment receipt](../deployment/RELEASE-2026-10-05.md).

The current phase focuses on the administrator desk. The member phase remains separate.

Run `npm run dev`, then use the HTTP address printed by Vite:

- `/admin/terminal.html?preview=1`: isolated sample desk. Saves and replies update memory only; reload resets them. No Supabase client, payment or production publication is created.
- `/admin/admin.html?next=terminal`: existing Admin Hub sign-in, with `admin@lmrcapitals.com` prefilled. Enter the existing password and complete the existing authenticator verification. No password is embedded or reset.
- `/admin/terminal.html`: authenticated terminal sharing the existing Supabase session.

The source HTML cannot run React through `file://`. It now includes a direct-file explanation and a link to the local preview address used during development (port 5174). If Vite uses another port, use that server's printed address.

The terminal checks a server-validated Auth user, `is_admin` registry result and MFA `aal2` before fetching admin data. Email is an account label, never an authorization rule. Registry/MFA failures do not grant access. Admin publishing uses the existing server RPCs and RLS in `database/patches/inner-circle.sql`. The terminal does not call subscription, paid-membership or chapter-progress RPCs. It therefore does not need `inner-circle-learning.sql` or Stripe to load its admin desk.

The Admin Hub now links to **Admin Terminal** and **Journal Application**. The journal retains its paid member gate and also supports registered, MFA-verified administrators independently of the new member schema. Backend ownership policies still govern journal data. This UI change grants no new admin accounts or access to another user's private journal.

Terminal sections: desk overview, live sessions and status, observations/callouts, execution and achievement image posts, free resources, published/draft management, private member replies, mentorship review, and announcement audiences/history. Shared admin actions are in `member/admin-actions.js`; both the old member studio and the terminal use them.

For an authenticated admin whose publishing tables/functions are missing, the terminal displays a connection/setup state and disables saves. Apply the reviewed core patch in staging first and verify its policies against the hosted database. The core patch also affects member/journal restrictions, so inspect the existing release sequence in `member/README.md` before production. No live migration or deployment has been performed in this phase.

Verification:

- `node admin/terminal.test.mjs`: registry, MFA, missing session and service failure cases.
- `node member/tests/application.mjs`: paid journal access, independent MFA admin access, unavailable checks fail closed.
- `npm run build`: includes both admin HTML entries.
- Browser preview: profile menu/Settings keyboard action, draft saving and management, private reply/queue update, desktop/mobile layouts. Hosted publishing and a fresh password/MFA login still need validation in staging.

Auth implementation references checked against [Supabase MFA](https://supabase.com/docs/guides/auth/auth-mfa) and [server-validated getUser](https://supabase.com/docs/reference/javascript/auth-getuser). The markdown changelog endpoint was unavailable to the research tool.

## Journal sources and automatic notices

Observations and achievements now select records from the existing Journal Application database. Apply `database/patches/inner-circle-journal.sql` after the updated core patch and the two existing source tables. A missing integration RPC displays a source-specific setup message while other desk sections remain usable. Only the current MFA administrator’s own cloud records are listed. Source images/formatting are copied by the server, and future source edits synchronize an already chosen post. Source deletion removes the copy; unpublishing preserves withdrawal during subsequent edits. This does not publish other users’ data or toggle the website’s public achievement setting.

Every visible post/session change generates an atomic member notification through the updated core triggers. No-op writes and private draft edits stay quiet. Live sessions are categorized into Asia, London, NY AM and NY PM. The local comparison shares illustrative admin changes with free/paid panes in memory, subject to their tier filters, without any production write.
