-- Admin role + public-landing lockdown (server-enforced multi-tenant fix).

create table if not exists public.admins (
  user_id   uuid primary key references auth.users(id) on delete cascade,
  added_at  timestamptz not null default now()
);

alter table public.admins enable row level security;

drop policy if exists "admins_read" on public.admins;
create policy "admins_read" on public.admins
  for select
  using (true);

insert into public.admins (user_id)
values ('05fac964-001e-49d3-bf50-bcf0f31eb96d')
on conflict (user_id) do nothing;

drop policy if exists "public_achievements_read" on public.lmr_achievements;
create policy "public_achievements_read" on public.lmr_achievements
  for select
  using (
    is_public = true
    and user_id in (select user_id from public.admins)
  );

drop policy if exists "own_achievements_all" on public.lmr_achievements;
create policy "own_achievements_all" on public.lmr_achievements
  for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (
      is_public = false
      or auth.uid() in (select user_id from public.admins)
    )
  );

revoke execute on function public.rls_auto_enable() from anon, authenticated;
