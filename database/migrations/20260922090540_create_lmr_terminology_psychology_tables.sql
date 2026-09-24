-- Give the Terminology and Psychology nav sections their own dedicated tables.
--
-- Before this migration both pages were stored inside the shared `monthly` table
-- under the keys 'lmr-terminology' / 'lmr-psychology'. Per the "each nav section
-- has its own space" maintenance, each page now persists to its own table with a
-- single row per user (user_id is the primary key). RLS mirrors every other table.
--
-- This migration is idempotent and also carries the one-time data move out of
-- `monthly`. It matches what was applied to the live project.

-- 1. Dedicated tables --------------------------------------------------------
create table if not exists public.lmr_terminology (
  user_id    uuid primary key default auth.uid(),
  data       jsonb,
  updated_at timestamptz default now()
);
alter table public.lmr_terminology enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='lmr_terminology' and policyname='own lmr_terminology') then
    create policy "own lmr_terminology" on public.lmr_terminology
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

create table if not exists public.lmr_psychology (
  user_id    uuid primary key default auth.uid(),
  data       jsonb,
  updated_at timestamptz default now()
);
alter table public.lmr_psychology enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='lmr_psychology' and policyname='own lmr_psychology') then
    create policy "own lmr_psychology" on public.lmr_psychology
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

-- 2. Move existing rows out of `monthly` (all users) -------------------------
insert into public.lmr_terminology (user_id, data, updated_at)
select user_id, data, now() from public.monthly where key='lmr-terminology'
on conflict (user_id) do update set data=excluded.data, updated_at=now();

insert into public.lmr_psychology (user_id, data, updated_at)
select user_id, data, now() from public.monthly where key='lmr-psychology'
on conflict (user_id) do update set data=excluded.data, updated_at=now();

-- 3. Remove the moved rows from the shared table -----------------------------
delete from public.monthly where key in ('lmr-terminology','lmr-psychology');
