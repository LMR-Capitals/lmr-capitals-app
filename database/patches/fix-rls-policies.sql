-- ─────────────────────────────────────────────────────────────────────────────
-- LMR Capitals — Fix write (INSERT/UPSERT) RLS on the core tables
--
-- Symptom: "new row violates row-level security policy for table ..." when pushing.
-- Cause:   the table allows SELECT but has no policy that PERMITS writes with a
--          WITH CHECK (auth.uid() = user_id).
--
-- RLS policies are PERMISSIVE (OR'd together), so adding these grants writes
-- WITHOUT breaking any existing read policies. Run in Supabase → SQL Editor.
-- ─────────────────────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['trades','accounts','transactions','notes','daily','monthly','weekly'] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists "own rows %s" on public.%I;', t, t);
    execute format(
      'create policy "own rows %s" on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id);',
      t, t
    );
  end loop;
end $$;

-- Also cover the feature tables if you use them:
alter table if exists public.lmr_observations enable row level security;
drop policy if exists "own rows lmr_observations" on public.lmr_observations;
create policy "own rows lmr_observations" on public.lmr_observations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
