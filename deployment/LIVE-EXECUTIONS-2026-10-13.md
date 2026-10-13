# Live LMR execution gallery — 13 October 2026

The owner explicitly authorized all existing and future trades from their own admin Journal to be visible to paid members, including both saved chart slots and trade details. Member Journal trades and any future admins are excluded.

The source trades, accounts, images, publications and their RLS policies are unchanged. An additive, read-only API function calls a guarded function in the unexposed circle_private schema. It requires paid membership or verified administrator MFA, uses a fixed opted-in owner, and returns only a field allowlist. It never returns account identifiers, account numbers, deposits or balances. No copies, imports, seed records, triggers, storage uploads, or writes to trades were performed.

Applied reference: database/migrations/20261013063956_inner_circle_live_executions.sql. Do not reapply merely for website redeployment. Live verification returned 236 trades, 106 saved Intraday / entry trigger charts, and 106 saved Entry / exit outcome charts. Missing images remain honest empty states. Both chart paths retain original Journal semantics; they are not relabelled or replaced with HTF/15m charts.

The gallery refreshes every 15 seconds while visible and on window focus. It pages through all authorized trades, shows 24 at a time with Show more, orders by original trade date, deduplicates older manual snapshots, and opens the full saved detail/paired-chart view. Observation and achievement publication flows are unchanged. Studio explains automatic synchronization instead of requiring manual trade publication.

Validation: PGlite access/isolation/read-only/pagination/chart-slot tests; client pagination, deduplication, zero-value and private-field tests; existing workspace access, Studio, portal, Journal media/order and Application tests; complete root Vite build; mobile and desktop illustrative gallery verification. Supabase advisor shows no findings for the new private function or public invoker wrapper; existing unrelated notices remain unchanged.

Deploy through reviewed PR to main using the complete root build. The final Git merge and Netlify production receipt are reported in the PR and chat.
