-- ─────────────────────────────────────────────────────────────────────────────
-- LMR Capitals — Achievement Suppressions (delete tombstones)
--
-- Run this in Supabase → SQL Editor (once) to make "delete an auto trophy" sync
-- across all your devices. When you remove an auto-granted achievement (a Funded
-- Pass / Payout card), its id is recorded here so the auto-grant never re-creates
-- it — on ANY device. Until you run this, tombstones still work, but only on the
-- browser where you deleted (the app falls back to localStorage gracefully).
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.lmr_ach_suppressions (
  id          text not null,                 -- the auto achievement id, e.g. auto-funded-777
  user_id     uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz default now(),
  primary key (user_id, id)
);

create index if not exists lmr_ach_suppressions_user_idx on public.lmr_ach_suppressions(user_id);

alter table public.lmr_ach_suppressions enable row level security;

-- Owner: full access to their own tombstones
drop policy if exists "own_ach_suppressions_all" on public.lmr_ach_suppressions;
create policy "own_ach_suppressions_all" on public.lmr_ach_suppressions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
