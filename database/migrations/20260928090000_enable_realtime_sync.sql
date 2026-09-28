-- Live cross-device sync: stream row changes on the per-user journal tables to
-- signed-in clients (app.html → sbStartRealtime). Additive only.
-- RLS (auth.uid() = user_id) already governs these tables, and Realtime applies
-- it to INSERT/UPDATE events, so each client only receives its own rows.
-- DELETE events carry only the primary key (default replica identity).
do $$
declare t text;
begin
  foreach t in array array['trades','accounts','transactions','notes','journal',
                           'daily','monthly','weekly','copier_config']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
