# design/ — new-design reference (do NOT ship)

Everything under `design/handoff/` is the **design reference** for the v2 redesign
(see `../tasks/plan.md` for the build plan). It is a prototype: HTML mockups, prototype
runtime JS, and specs. **None of it ships.** We recreate these screens inside the real
app (`app/index.html`) using its existing vanilla-JS patterns and Supabase storage layer.

- `handoff/LMR Capitals App v2.dc.html` — canonical design (with demo data). Open in a browser.
- `handoff/LMR Capitals App CLEAN.dc.html` — same design, no demo data.
- `handoff/README.md` — screen-by-screen spec + design tokens + normative maths.
- `handoff/SUPABASE_WIRING.md` — how design state maps to our tables.
- `handoff/*-section.html` — per-section markup references.
- `handoff/{image-slot.js,charts.jsx,support.js}` — prototype runtime, **reference only**.
- `FIELD_MAP.md` — old column → new design field (reconciled to the live schema).

The applied database migration lives in `../supabase/migrations/` (not duplicated here).
The `kb/` PD-array chart images (~12 MB) are intentionally excluded; they'll be uploaded
to Supabase Storage during the Knowledge slice.
