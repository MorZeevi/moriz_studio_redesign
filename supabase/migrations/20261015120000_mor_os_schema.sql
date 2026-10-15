-- Mor OS POC: work_projects + work_items (see docs/mor-os/PLAN.md).
-- Owned by this repo. Additive only: touches no diagnostic_*, projects, categories,
-- project_categories, ai_knowledge or private.cms_* object.
--
-- updated_at trigger: Mor OS ships its own function (private.mor_os_set_updated_at)
-- instead of reusing the CMS's private.set_updated_at(), so a CMS change can never
-- break Mor OS.
--
-- Access model: RLS on, no anon access. The owner (authenticated) reads her own rows
-- and may only mark her own items done. service_role (the Dot, admin) has full access.

create schema if not exists private;

create or replace function private.mor_os_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Projects --------------------------------------------------------------------

create table public.work_projects (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users (id) on delete restrict,
  title text not null check (length(btrim(title)) > 0),
  client_name text,
  status text not null check (status in ('active', 'paused', 'done')),
  target_date date,
  context text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Target for the composite FK below: an item can only point at a project
  -- with the same owner (service_role bypasses RLS, so this must live in the schema).
  unique (id, owner_user_id)
);

create trigger work_projects_set_updated_at
before update on public.work_projects
for each row execute function private.mor_os_set_updated_at();

-- Items -----------------------------------------------------------------------

create table public.work_items (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users (id) on delete restrict,
  project_id uuid,
  kind text not null check (length(btrim(kind)) > 0),
  title text not null check (length(btrim(title)) > 0),
  body text,
  status text check (status in ('open', 'done')),
  due_on date,
  done_at timestamptz,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- status = 'done' if and only if done_at is set (null status counts as not done).
  constraint work_items_done_consistency
    check (coalesce(status = 'done', false) = (done_at is not null)),
  -- project_id null = general capture (MATCH SIMPLE skips the check). Otherwise the
  -- project must exist, belong to the same owner, and cannot be deleted under items.
  constraint work_items_project_fk
    foreign key (project_id, owner_user_id)
    references public.work_projects (id, owner_user_id)
    on delete restrict
);

create index work_items_project_idx on public.work_items (project_id);
create index work_items_open_due_idx on public.work_items (owner_user_id, due_on)
  where status = 'open';

create trigger work_items_set_updated_at
before update on public.work_items
for each row execute function private.mor_os_set_updated_at();

-- RLS -------------------------------------------------------------------------

alter table public.work_projects enable row level security;
alter table public.work_items enable row level security;

-- Supabase default privileges grant new public tables to anon/authenticated.
revoke all on table public.work_projects from anon, authenticated;
revoke all on table public.work_items from anon, authenticated;

grant all on table public.work_projects to service_role;
grant all on table public.work_items to service_role;

grant select on table public.work_projects to authenticated;
grant select on table public.work_items to authenticated;
-- Dashboard may mark an item done and nothing else.
grant update (status, done_at) on table public.work_items to authenticated;

create policy work_projects_owner_select on public.work_projects
  for select to authenticated
  using (owner_user_id = (select auth.uid()));

create policy work_items_owner_select on public.work_items
  for select to authenticated
  using (owner_user_id = (select auth.uid()));

create policy work_items_owner_update on public.work_items
  for update to authenticated
  using (owner_user_id = (select auth.uid()))
  with check (owner_user_id = (select auth.uid()));

-- Views (security_invoker: the caller's RLS applies) --------------------------

-- Radar: active projects with no open item.
create view public.work_radar
with (security_invoker = true) as
select p.*
from public.work_projects p
where p.status = 'active'
  and not exists (
    select 1
    from public.work_items i
    where i.project_id = p.id
      and i.status = 'open'
  );

-- Today: open items due today or earlier, "today" in Israel time (not UTC).
create view public.work_items_today
with (security_invoker = true) as
select i.*
from public.work_items i
where i.status = 'open'
  and i.due_on <= (now() at time zone 'Asia/Jerusalem')::date;

revoke all on table public.work_radar from anon, authenticated;
revoke all on table public.work_items_today from anon, authenticated;
grant select on table public.work_radar to authenticated, service_role;
grant select on table public.work_items_today to authenticated, service_role;
