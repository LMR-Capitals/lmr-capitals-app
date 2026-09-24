# LMR Capitals — handoff contents

## Start here

**`CLAUDE_CODE_START_HERE.md`** — the brief. Point Claude Code at this file first.

---

## Design

| File | What it is |
|---|---|
| `LMR Capitals App CLEAN.dc.html` | **The design, zero demo data.** Open in a browser. This is the reference to build from. |
| `LMR Capitals App v2.dc.html` | Same design with demo data, for seeing populated states |
| `README.md` | Screen-by-screen spec, tokens, interactions |
| `support.js`, `charts.jsx`, `image-slot.js` | Prototype runtime — reference only, do not ship |

## Database

| File | What it is |
|---|---|
| `DATABASE.md` | Full table structure, column by column, old vs new |
| `schema.sql` | Additive migration. Idempotent. Safe on a live project. |
| `backfill.sql` | Maps old field shapes to new. Re-runnable. Ends with verification queries. |
| `SUPABASE_WIRING.md` | How the design's state maps to tables |

## Reference sections

| File | What it is |
|---|---|
| `PLAN-migration-and-pd-arrays.md` | PD-array commitment rules and hard-block logic |
| `knowledge-section.html` | Knowledge panel markup |
| `journal-notes-section.html` | Journal + Notes |
| `observation-section.html` | Observation canvas + Discord |
| `psychology-section.html` | Psychology scoring |
| `achievements-section.html` | Achievements |
| `kb/` | 94 PD array chart images |

---

## Order of work

1. Back up prod (Database → Backups, plus Storage downloads)
2. Run `schema.sql` on the database
3. Run `backfill.sql`
4. Confirm the last verification query returns four zeros, and that P&L / win rate / balances match your live app
5. Hand the folder to Claude Code with `CLAUDE_CODE_START_HERE.md`
6. Deploy the frontend — the schema is backwards-compatible, so the old app keeps running until you cut over

---

## Five rules the implementation must honour

1. **`daily.price` is an ordered array.** Click order is data. Not a set.
2. **Premium / Discount colour the rest of the sequence.** `Premium` turns that entry and all after it red; `Discount` turns the rest blue.
3. **Monthly and weekly context cards are whole-card click targets** that jump to that period.
4. **PD array is hard-blocked.** Switching requires a logged reason in `pd_switches`.
5. **Chart images go to Supabase Storage.** Only the path is stored, in `chart_images`.
