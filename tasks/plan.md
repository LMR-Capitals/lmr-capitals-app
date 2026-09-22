# LMR Capitals — Design v2 frontend adoption plan

Adopt the new design (handoff bundle) into the **existing** app (`app/index.html`,
single-file vanilla-JS PWA) against the **existing** Supabase project. Database Steps
0–6 of `CLAUDE_CODE_START_HERE.md` are DONE (additive schema + backfill live on main,
tracked in `supabase/migrations/`). This plan covers **Step 7 — the frontend**, built
in thin vertical slices, one commit per slice.

## Guardrails (do not violate)
- **Existing DB is source of truth.** No new tables/renames/drops beyond the already-
  applied additive migration. Use the columns that migration added.
- **Recreate, don't ship the HTML.** The handoff `.dc.html`/`*-section.html` are design
  reference. Rebuild in the app's own vanilla-JS patterns. Charts stay **Chart.js**
  (already vendored) — do NOT introduce Recharts.
- **Per-user RLS already enforced.** Never add a client-only trust check.
- **Cross-panel invariants (README §"Cross-panel invariants" + accMetrics):**
  1. Combined P&L includes every account, breached ones too (Dashboard == Accounts).
  2. A scoped account's Funded Profit comes from `_accMetrics`, mirrors included.
  3. Deposits (ED) reports Deposit *records* only.
  4. Daily-page tiles and the grid below use the same day set.
  5. `_accMetrics(acc)` stays the single source of truth for balance/floor/dd/eligibility.
- **Five design rules:** `daily.price` is an ordered array (click order is data);
  Premium colours that entry + all after red, Discount colours the rest blue; monthly/
  weekly context cards are whole-card jump targets; PD-array switching is hard-blocked
  and logs a reason to `pd_switches`; chart images go to Storage, only the path in
  `chart_images`.
- **Backwards compatible.** Old columns (`daily.london`, `daily.asian_range`, `judas`,
  flat price list) stay readable; the current app keeps working until cutover.

## Verification (no test suite in repo)
Per slice: (a) inline-JS syntax check passes; (b) load in a real browser (Playwright/
Chromium available) signed in, exercise the screen, confirm data round-trips to Supabase
and reloads; (c) the relevant invariant numbers match the pre-change app. Commit only
when green. `graphify update .` after each slice.

---

## Slice 0 — Setup & reference (no user-facing change)
- Add the handoff as tracked reference under `design/handoff/` (docs + `*.dc.html` +
  `*-section.html` + `README.md`/`SUPABASE_WIRING.md`/`PLAN-migration-and-pd-arrays.md`).
  Exclude the 12 MB `kb/` images for now (pulled in at the Knowledge slice, likely to
  Storage). Add a short `design/README.md` noting "reference only, do not ship".
- Confirm the new DB columns are present (already migrated) and note the field map in
  `design/FIELD_MAP.md` (old column → new design field), from SUPABASE_WIRING.md.
- Acceptance: files tracked; no change to `app/index.html`; app still loads.

## Slice 1 — Today / The Chain  (biggest change; highest value)
Rebuild `#p-today` / `loadDaily()` to the new Chain layout.
- Monthly + weekly **context cards** at top, each whole card a click target →
  `navTo('monthly'|'weekly')` at that period.
- Single-choice fields → dropdowns; **Asian range single-select** (writes `asian_single`,
  reads legacy `asian_range[0]` fallback); **London Killzone** merged field (writes
  `london_killzone`, falls back to `london`); **Premarket** (`premarket`, fallback
  `htf_poi`); Session widened to the 10 killzones (keep old values valid).
- **Price references**: grouped Premium / EQ / Discount, searchable, collapsible behind a
  toggle, with a persistent "In order:" sequence. Persist to `daily.price` as an **ordered
  jsonb array**. Premium→that entry + all after red; Discount→rest blue.
- **PD array** field with **hard block**: changing it requires a logged reason; write a
  row to `pd_switches`; respect `profiles.pd_hard_block`.
- Session chart slots via existing image layer, saved to `chart_images` (Storage path):
  Daily/Weekly full-width → 4H/1H · 15m · Inter-market (3-up) → Summary full-width.
- HTF context = premarket → weekly draw/run/draw. "Why I should take a trade?" wording.
- Today's trades moved to bottom.
- Acceptance: fields autosave to `daily` (+ new columns) and reload; price order + colour
  rule persist; a PD switch writes `pd_switches`; context cards navigate; old daily rows
  still open without error.

## Slice 2 — Accounts
- Filter tabs All/Evaluation/Funded/Passed + Hide-failed; 4-tile summary strip.
- Card: status pill, meta, firm·no.·size, four metric rails with donut rings
  (balance, trailing DD + cushion via `ddProgress`, win-days n/5 or profit-target %,
  payout or consistency). **BREACHED** derived (balance ≤ floor) in red + red border.
- Detail sheet (≤940px): hero balance + delta, DD/limits/profit/paid-out, four ring rows,
  balance-vs-drawdown SVG, P&L calendar, deposits/fees/payouts list, full trades table.
- All balances via `_accMetrics` (single source of truth) — no inline math.
- Acceptance: rings/breach match `_accMetrics`; Dashboard combined P&L == Accounts sum;
  detail sheet opens and figures reconcile.

## Slice 3 — Transactions
- Two hero tiles + four KPI tiles; account scope chips (pre-selected when arriving from an
  account); three ledger tabs (Deposits&Fees / Payouts / Withdrawals).
- Signed cents-precise amounts, coloured left edge per type, account-name button →
  account detail, 🧾 receipt markers (`receipt_key`/`image`).
- + Transaction sheet: Date, Type, Account, **Prop firm read-only auto-filled**, Amount,
  Note, receipt drop area; Save disabled until amount present. New cols: `currency`,
  `method`, `receipt_key`.
- Acceptance: three ledgers scope correctly; Deposits(ED) counts Deposit records only;
  receipts persist to Storage; totals reconcile with account funding labelling.

## Slice 4 — Trades
- Stats strip (Total, Win rate, Net P&L de-duped, Avg R:R) above both views.
- **Gallery view** with entry image card + read-out panel; list view retained.
- Add/Edit sheet + new fields already in DB: `pd_array`, `time_period`(exists), `mmm`
  (exists), `rth`/RTH profile, `refs jsonb`, `grade`, `plan_followed`, `img_entry`/
  `img_exit` (Storage).
- Acceptance: Net P&L uses the existing de-dup (mirror-exclusion) formula and matches the
  Trades stats strip everywhere; gallery images resolve from Storage; new fields save/reload.

## Slice 5 — Performance / Reports
- 6 live Chart.js charts; "Review Performance" → AI summary saved to `weekly_reports`
  with `kind`/`subtitle` (period-agnostic).
- Acceptance: charts render from live trades; a saved review appears in Reports and reloads.

## Slice 6 — Daily Pages
- Month navigator + 5 stat tiles (Monthly P&L, Win days, Plan followed, Prediction,
  Journaled) + 6-col grid (Mon–Fri + Week P&L rail); day cell tints + `D###` badge; Day
  sheet with 14 graded fields (value-tinted selects), 5 chart slots, that day's trades.
- **Normative maths:** tiles grade the union of traded days + saved records; saved record
  wins else trades decide; journaled no-trade day reads "Journaled · no trades".
- Acceptance: tiles and grid use the same day set (invariant 4); cells reflect P&L/journal
  state; Day sheet round-trips.

## Slice 7 — Knowledge
- Group/term canvas (existing block editor, `lmr_terminology`); bring in `kb/` PD-array
  chart images — upload to Storage `lmr-images`, reference by path (not base64/repo).
- Acceptance: terms open the block canvas and persist; PD images resolve from Storage.

## Slice 8 — Journal · Notes · Observation · Psychology · Achievements
- Journal/Notes: typed entries with inline chart frame; store slot id (`img_key`) so chart
  renders in-card; `notes.tags`.
- Observation: post canvas + Discord webhook (`profiles.discord_webhook`) + past posts;
  `posted_to_discord`.
- Psychology: rule-based scoring inside `lmr_psychology.data`.
- Achievements: unlock rules (existing `lmr_achievements`).
- Acceptance: each panel round-trips; Discord post flagged; images from Storage.

## Slice 9 — Shell / Sidebar + Settings
- Fixed sidebar shell: day count + active-account balance; nav scrolls independently of
  the profile footer; static group expansion (does not react to active panel). Keyboard
  nav + shortcut sheet. Settings: export/import (4 shapes)/clear + storage stats;
  `profiles.density`. Optional `icons/lmr-icon.png` swap if provided.
- Acceptance: sidebar layout/scroll per spec; settings import/export works.

## Sequencing
0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9. Slices 1–4 are the core cutover value;
5–9 can follow. Each is independently shippable behind the same DB (already migrated).

## Out of scope here
- Native packaging (Tauri) — separate SPEC Phase B.
- Any destructive cleanup of deprecated columns (leave ≥1 release, per DEPLOY.md).
