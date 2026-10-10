-- FAQ "ask AI": short knowledge entries the owner adds by hand in Supabase.
-- The site's server reads them with the secret key; browsers get no access.

create table public.ai_knowledge (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(btrim(title)) > 0),
  content text not null check (length(btrim(content)) > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger ai_knowledge_set_updated_at
before update on public.ai_knowledge
for each row execute function private.set_updated_at();

-- RLS on with no policies: anon and authenticated are denied even if a grant slips in.
alter table public.ai_knowledge enable row level security;

revoke all on table public.ai_knowledge from anon, authenticated;
grant select on table public.ai_knowledge to service_role;
