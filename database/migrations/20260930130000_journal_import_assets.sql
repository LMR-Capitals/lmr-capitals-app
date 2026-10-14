-- Keep the original Notion note identity and chart references on the owner's
-- Journal row. The PNGs themselves live in the existing private lmr-images
-- bucket, never in the public site or in this table.
alter table public.journal
  add column if not exists import_source_id text,
  add column if not exists import_source_title text,
  add column if not exists import_image_paths text[] not null default '{}',
  add column if not exists image_keys text[] not null default '{}';

create unique index if not exists journal_user_import_source_unique
  on public.journal(user_id, import_source_id)
  where import_source_id is not null;

-- Durable, non-API backup of rows before duplicate consolidation. No client
-- role has schema usage or an RLS policy on this table.
create schema if not exists lmr_internal;
revoke all on schema lmr_internal from public, anon, authenticated;
create table if not exists lmr_internal.journal_import_backup (
  batch_id text not null,
  journal_id text not null,
  snapshot jsonb not null,
  captured_at timestamptz not null default now(),
  primary key (batch_id, journal_id)
);
revoke all on lmr_internal.journal_import_backup from public, anon, authenticated;
alter table lmr_internal.journal_import_backup enable row level security;
