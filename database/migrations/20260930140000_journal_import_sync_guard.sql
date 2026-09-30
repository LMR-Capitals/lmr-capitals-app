-- Old, open app tabs can still upsert their pre-cleanup local cache. Guard only
-- the duplicate IDs backed up and removed by the 2026-09-30 Journal import.
create table if not exists lmr_internal.journal_import_tombstones (
  journal_id text primary key,
  batch_id text not null,
  created_at timestamptz not null default now()
);
revoke all on lmr_internal.journal_import_tombstones from public, anon, authenticated;
alter table lmr_internal.journal_import_tombstones enable row level security;

create or replace function lmr_internal.guard_journal_import_sync()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' and exists (
    select 1 from lmr_internal.journal_import_tombstones t
    where t.journal_id = new.id
  ) then
    return null;
  end if;

  if tg_op = 'UPDATE' and old.import_source_id is not null
     and new.title is distinct from old.title
     and new.title in ('Note', old.type) then
    new.title := old.title;
    new.type := old.type;
    new.text := old.text;
    new.content := old.content;
    new.date := old.date;
    new.image_keys := old.image_keys;
    new.import_image_paths := old.import_image_paths;
    new.import_source_id := old.import_source_id;
    new.import_source_title := old.import_source_title;
  end if;
  return new;
end;
$$;
revoke all on function lmr_internal.guard_journal_import_sync() from public, anon, authenticated;

drop trigger if exists journal_import_sync_guard on public.journal;
create trigger journal_import_sync_guard
before insert or update on public.journal
for each row execute function lmr_internal.guard_journal_import_sync();
