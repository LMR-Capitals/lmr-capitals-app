# Plan — Migration Console + PD Array Rules

Two additions. The first makes deployment safe; the second makes the daily
chain enforce a decision instead of merely recording one.

---

# PART 1 — MIGRATION CONSOLE

## The constraint that shapes the whole design

The browser holds the **anon key**. The anon key can run DML (insert, update,
delete, scoped by RLS) but **cannot run DDL** — it cannot create a table or add
a column. Any design where the app "runs the migration itself" is impossible,
and pretending otherwise is how you get a deploy that half-works.

So the console splits along that line:

| Phase | Who executes | Why |
| --- | --- | --- |
| **Schema** (tables, columns) | You, in the Supabase SQL Editor | needs DDL |
| **Data** (rows) | The app, automatically | DML, RLS-scoped |
| **Images** (IndexedDB → column) | The app, automatically | DML |
| **Verify** | The app | read-only |

The console's job for schema is therefore **detect and hand over**, not execute.
For data it is a real runner with progress and a receipt.

## Interface — one panel, five stages, strictly ordered

A new nav item under Settings: **Deploy**. Vertical stepper; a stage cannot be
opened until the one above it is green. That ordering is the whole point — data
before schema fails, and silently.

### Stage 1 · Preflight
Four checks, each a row with a state dot:
- Supabase reachable (a `select 1` against `profiles`)
- Signed in, with the resolved `user_id` shown
- Anon key in use, not service-role — refuse to continue if the JWT role is
  `service_role`, because that key must never be in a browser build
- Local data present (counts from `state`)

### Stage 2 · Schema audit
The interesting part. For each of the 16 expected tables the app probes the
live database and reports one of three states:

- **OK** — table and all expected columns present
- **Columns missing** — lists exactly which
- **Table missing**

Probe method, since the anon key can't read `information_schema` by default:
`select <col1,col2,…> from <table> limit 0`. A missing column returns
PostgREST error `42703` naming it; a missing table returns `42P01`. Parse
those, and you have an accurate audit with no extra privileges.

Output is a **generated SQL patch** — only the statements this specific
database needs, not the whole migration — with a Copy button and a link
straight to the project's SQL Editor. Then a **Re-check** button, so the loop
is: copy → run → re-check → green.

### Stage 3 · Data migration
Per table: local count, cloud count, and the action to take.

Conflict policy is a single explicit choice, shown before anything runs —
**newest wins** (compare `updated_at`), **local wins**, or **cloud wins**.

A **Dry run** is mandatory before the real run: it produces the exact insert /
update / skip counts without writing. Then the run itself: batches of 100,
`upsert` on the primary key, a progress bar per table, and a log line per
batch. Any failure stops the run and keeps the log — partial success is
recoverable because upserts are idempotent; you re-run and it resumes.

### Stage 4 · Images
IndexedDB holds chart images keyed by `imgKey`. Each needs to land in its
row's `image` column.

Uncompressed screenshots are ~2 MB each and will blow up both the request and
the table, so each is re-encoded through a canvas to JPEG at max 1600px wide
before upload, with the resulting size shown. Anything still over 1 MB is
listed and skipped rather than silently truncated.

### Stage 5 · Verify
The gate. A table of local vs cloud counts per table, all of which must match,
plus an RLS check across all 16 tables. Only when every row is green does the
panel show **Ready to deploy** — and it states the build command and the two
required env vars, so there is no gap between "the console says ready" and
"the site works".

## Visual treatment

Same dark surfaces and gold accent as the rest of the app. The one new element
is the state dot — grey pending, amber running, green pass, rose fail — used
identically at every level (check row, table row, stage header) so the whole
console reads at a glance. Monospace for all counts and SQL. No new colours.

## What has to be built

1. `schemaProbe()` — the 42703/42P01 parser described above
2. `generatePatch(audit)` — emits only the needed DDL
3. `dryRun(table, policy)` / `migrate(table, policy)` — batched upserts
4. `migrateImages()` — canvas re-encode then upsert
5. `verify()` — count reconciliation + RLS check
6. The Deploy panel itself, plus its stepper state machine
7. `EXPECTED_SCHEMA` — the single source of truth both the audit and the patch
   generator read, so they can never disagree

---

# PART 2 — PD ARRAY RULES IN TODAY'S CHAIN

## The idea

Right now Price Reference records which array you noted. The change makes it a
**commitment**: pick one PD array for the day, and the app shows you its rules
and then holds you to them.

## Interaction

In Today's Chain, the Price Reference field becomes a row of array chips.
Clicking one does three things:

1. **Commits the day** — writes `dayArray` to that day's record. One array per
   day; changing it later asks for confirmation and logs the change, because
   switching mid-session is exactly the behaviour worth noticing.
2. **Opens its rule sheet** beneath the field.
3. **Arms validation** — trade entry now knows what today allows.

## The rule sheet — minimised, nothing lost

Collapsed by default to three lines that are always visible:

- the array's **name**
- its **thesis** in one sentence
- **Invalidated when —** the single condition that voids it

That is the part you need mid-session at a glance. Everything else sits in four
collapsed rows that expand in place, and nothing is summarised away:

| Row | Contains |
| --- | --- |
| **Formation** | what must have happened for this array to exist |
| **Entry** | the precise conditions for taking it |
| **Confirmation** | what must align — session, timeframe, confluence |
| **Why it works** | the reasoning, in full |

Expansion state persists per array, so once you have internalised Formation
you collapse it and it stays collapsed.

## The validation that makes it logical

This is what turns a reference into a rule:

- **Trade entry** — when logging a trade, models outside the day's array are
  still selectable but flagged: *"NWOG Reclaim is not in today's committed
  array (Judas Swing). Log anyway?"* Advisory, not blocked — an override is
  recorded on the trade as `offArray: true`.
- **Session check** — if the array requires London and it is 14:30 New York,
  the sheet says so.
- **Day review** — the daily page reports adherence: *4 of 5 trades on array*.
- **Psychology** — off-array trades feed the discipline score directly, which
  is where the cost of breaking the commitment becomes visible over weeks.

## Data shape

```js
PD_ARRAYS = [{
  id: 'ote',
  name: 'Optimal Trade Entry',
  group: 'Retracement',          // chip grouping
  thesis: '…',                    // one line, always visible
  invalidatedWhen: '…',           // one line, always visible
  formation: [],                  // bullets, expandable
  entry: [],
  confirmation: [],
  why: '',                        // prose, in full
  sessions: ['London','NY AM'],   // drives the session check
  timeframes: ['15m','1H'],
  allowedModels: ['ICT OTE','…']  // drives trade validation
}]
```

Stored per day as `daily.day_array` (text) — one more column on the migration.

## What I need from the PDF

The arrays themselves. For each one: name, thesis, formation, entry,
confirmation, invalidation, and the reasoning. Send it and I will structure it
into the shape above — and if the PDF is thinner in places, I would rather
leave a field empty and ask than invent a rule you did not write.
