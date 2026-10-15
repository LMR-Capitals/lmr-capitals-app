# Journal Realtime write reduction

The owner requested investigation of the organization Realtime quota warning while preserving existing data. The last observed billing-cycle usage was 10,462,626 messages against 5 million included. Read-only production statistics show cumulative updates including notes 13,183,951 and daily 10,762,308; these counters are not a billing-period breakdown. The nine heavily updated Journal tables are exactly the nine tables in the Realtime publication.

Each generic Journal save previously upserted every historical row in those collections. Fresh generated timestamps caused needless updates even when content was identical. Realtime pulls can invoke render paths that save again. Supabase bills each database change once per listening client: https://supabase.com/docs/guides/platform/manage-your-usage/realtime-messages . This amplification is a confirmed code defect; the exact fraction of historical billed usage attributable to it is not measured.

## Change

Before bulk upserts, compare mapped fields against the owner's current stored records in chunks of 200 IDs. Only insert new rows or update rows whose content differs. Ignore generated metadata timestamps when detecting changes; preserve original creation times on existing records. JSON object key order does not produce false differences. A failed comparison fails the sync instead of rewriting everything; failed writes retain normal retry behavior. No persistent fingerprint cache means the comparison continues to observe other-device changes. Edits made while a sync is running keep the dirty flag and schedule another sync.

The trade/daily mapping, backups, pending autosave flush, direct record saves, source linkage, publication state and cross-device subscriptions remain intact. Comparisons introduce extra read requests; they trade those reads for eliminating broad unnecessary writes. Existing last-writer behavior for genuinely conflicting edits is not replaced with a new conflict-resolution model.

## Validation

- New executable sync regression: 1,205 unchanged rows → zero writes; one edit → one row; repeat → zero writes. Pagination, owner scope, creation timestamps, nested JSON, read/write failures and in-flight edits tested.
- Journal workspace, daily preservation, autosave preservation, authenticated private media and HTML sanitizer regressions passed.
- Full root Vite build passed; pre-existing ThreeUI warnings remain.
- No production SQL writes, migrations, storage changes, role changes, spend-cap changes, or billable plan changes are part of this release.

## Release and follow-up

Production verification is pending. Historical billed messages cannot be removed by this fix. Existing open tabs must load the new build before they stop broad upserts; flush pending edits before reloading. Compare usage growth after rollout; do not promise the warning immediately disappears. Keep the spend cap enabled unless the owner explicitly approves a billing change. SMTP setup and independent membership checkout/access tests remain separate launch tasks.
