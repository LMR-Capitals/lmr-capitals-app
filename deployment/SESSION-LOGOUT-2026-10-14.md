# Browser logout and account isolation — 14 October 2026

Life OS follow-up: Settings now exposes the same browser-only and all-devices
options. The isolated iframe does not revoke tokens independently: only its
same-origin parent, after verifying the exact frame and allowed scope, invokes
the shared logout action and global confirmation. Pending/failed Life OS saves
block logout so attempted changes can be recovered. Frame-origin/source, scope
allowlist, delegation and save-protection regressions pass. No database changes.

Normal logout now explicitly uses Supabase `scope: local`. It signs out the
current shared browser session (including its tabs), retaining independent
browser/device sessions. The former implicit `signOut()` used Supabase's global
default and unintentionally signed out all devices.

Inner Circle account menus and Profile offer **Sign out this browser** and
**Sign out all devices**. Journal Settings → App also offers the explicit global
option. Global logout asks for confirmation and uses `scope: global`. Admin hub
and terminal ordinary logout is local. Successful password recovery retains
intentional global logout; abandoning a recovery form is local.

Global logout revokes refresh access, not already-issued JWTs. Other devices can
remain usable until their current access token expires. This release does not
claim instant remote token invalidation or add session-row enforcement to RLS.
See https://supabase.com/docs/reference/javascript/auth-signout.

## Account-switch checks and fixes

- Member requests/results are scoped to the identity captured by their setter;
  delayed old-account responses are discarded even when React applies queued
  updates later. Auth changes clear access, data, open details, search/menu and
  old notifications. Late startup session reads cannot restore an older user.
- Admin Terminal invalidates outstanding reads and hides previous account data
  immediately on identity changes, before deferred access revalidation.
- Journal flushes pending field saves into the original owner's local namespace
  before logout/account-change cleanup. Failed/cancelled logout does not clear
  the screen or stop its sync. Existing account-local storage is preserved.
- Existing account-keyed Journal/Life OS iframe mounts, owner-filtered RLS,
  private image signatures and account-specific caches remain intact.

The session regression uses the installed Supabase Auth SDK with an isolated
transport and two independent sessions; browser-only logout permits the other
session to refresh, and global logout denies it. It also executes actual member
auth/setter and Journal logout code with delayed responses, error and cancellation
cases. No production user was signed out to run tests.

Relevant private-media, shared-cache, sanitizer, paid/free/owner RLS, admin MFA,
Life OS navigation, Journal autosave and changed-row Realtime tests pass.
Production dependency audit reports zero known advisories at this check; this
does not establish absence of all vulnerabilities. Existing ThreeUI build
warnings remain. Broader legacy DOM/security review remains tracked separately.

## Read-only production usage review

Supabase organization dashboard displayed billing period **14–22 October 2026**,
**5,263 / 5,000,000 Realtime messages**, peak connections **3 / 500**, storage
**0.244 / 100 GB**, egress **0.468 / 250 GB**, and no quota exceeded in the current
displayed period. Overage billing is enabled. This is a current-period snapshot,
not deletion of historical usage or a guarantee about future costs.

Seven public-table insert/update/delete counters were unchanged from
2026-10-15T00:29:33.970512Z to 00:31:16.995158Z (103 seconds): accounts, journal,
monthly, profiles, trades, transactions and weekly. No repeated idle write loop
was observed in that window; table counters are not the billable Realtime metric.

This release contains frontend/test/docs changes only. No schema migrations,
business-record edits, storage changes, billing changes or payment tests are
needed. Do not replay earlier security migrations during deployment.

Local visual checks use the labelled administrator preview, not production
account data. Deployment/live verification is recorded in the release PR.

A fresh read-only production role simulation of the confirmed free test account
returned admin=false, member_access=false and zero visible trades, Journal
entries and Life OS workspaces. The transaction was rolled back; no account,
subscription or business record was changed.
