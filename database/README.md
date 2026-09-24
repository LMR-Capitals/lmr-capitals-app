# Database

All SQL for the LMR Capitals Supabase (Postgres) project lives here.

```
database/
  schema.sql        Full schema snapshot (tables, RLS policies, functions, triggers).
  migrations/       Ordered, timestamped migrations — the canonical change history.
  functions/        Supabase Edge Functions (Deno): Stripe checkout, webhook, admin cancel.
  patches/          Historical one-off SQL scripts applied ad hoc during development.
```

## How the database is managed

- The live database is a hosted Supabase project. Schema changes are applied through
  the Supabase dashboard / SQL editor (and, in this workspace, the Supabase MCP tools).
- `migrations/` is the authoritative, ordered record of schema changes. Add a new
  timestamped file here for every change and apply it to the project.
- `schema.sql` is a full snapshot for reference and fresh setup.
- `patches/` holds earlier standalone scripts (table creation, column fixes, payout /
  subscription setup). They are kept for history; prefer `migrations/` for new work.

## Notes

- Changes are **additive** — never drop or destructively alter existing columns/tables
  that the app relies on.
- There is no Supabase CLI project config committed here, so this folder does not drive
  any automated deploy. Moving these files does **not** affect the Netlify build, which
  publishes only the front-end (`dist/`). If you later adopt the Supabase CLI, point it
  at this folder (its default layout expects `supabase/migrations` and `supabase/functions`).
