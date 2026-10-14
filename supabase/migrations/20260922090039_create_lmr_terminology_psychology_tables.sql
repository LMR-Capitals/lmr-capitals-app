-- Dedicated per-section tables for the Terminology and Psychology nav panels.
-- Previously these pages were stored inside the `monthly` table under the keys
-- 'lmr-terminology' / 'lmr-psychology'. Each nav section now gets its own space.
-- One row per user (user_id is the primary key); RLS mirrors every other table.

create table if not exists public.lmr_terminology (
  user_id    uuid primary key default auth.uid(),
  data       jsonb,
  updated_at timestamptz default now()
);
alter table public.lmr_terminology enable row level security;
create policy "own lmr_terminology" on public.lmr_terminology
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.lmr_psychology (
  user_id    uuid primary key default auth.uid(),
  data       jsonb,
  updated_at timestamptz default now()
);
alter table public.lmr_psychology enable row level security;
create policy "own lmr_psychology" on public.lmr_psychology
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
