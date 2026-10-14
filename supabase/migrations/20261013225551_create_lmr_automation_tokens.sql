-- Recorded from the live migration history. The token hash is redacted because
-- this repository is public; the live row is unchanged and this migration is
-- already applied, so it is never re-run against production.
create table if not exists public.lmr_automation_tokens (
  name text primary key,
  token_sha256 text not null,
  owner_id uuid not null,
  created_at timestamptz not null default now()
);
alter table public.lmr_automation_tokens enable row level security;
-- no policies: only the service role (edge functions) can read it
comment on table public.lmr_automation_tokens is 'Hashed tokens for LMR automation edge functions (service role only).';
insert into public.lmr_automation_tokens (name, token_sha256, owner_id) values ('chart-upload','<redacted: sha256 of the live chart-upload token>','05fac964-001e-49d3-bf50-bcf0f31eb96d')
on conflict (name) do update set token_sha256=excluded.token_sha256;
