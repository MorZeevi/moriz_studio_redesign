-- Portfolio CMS: projects, categories and their many-to-many link.
-- Single-admin model: an immutable Auth UUID, not user-editable metadata.

create schema if not exists private;

-- Provisioned through Auth Admin API; credentials are never stored in migrations.
create or replace function private.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(auth.uid() = '300a2870-9861-4a41-9272-1d783b2636df'::uuid, false);
$$;

-- Public read policies call is_admin(), so anon needs access to evaluate them.
grant usage on schema private to anon, authenticated;
grant execute on function private.is_admin() to anon, authenticated;

create or replace function private.set_updated_at()
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

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(btrim(title)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9א-ת]+(-[a-z0-9א-ת]+)*$'),
  client text,
  year integer check (year between 1900 and 2100),
  headline text,
  short_description text,
  description text,
  services text[] not null default '{}',
  cover_image_url text,
  homepage_image_url text,
  projects_image_url text,
  content jsonb not null default '[]'::jsonb check (jsonb_typeof(content) = 'array'),
  featured boolean not null default false,
  show_on_homepage boolean not null default true,
  show_on_projects boolean not null default true,
  homepage_order integer,
  projects_order integer,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_published_idx on public.projects (published);

create trigger projects_set_updated_at
before update on public.projects
for each row execute function private.set_updated_at();

-- Categories ------------------------------------------------------------------

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9א-ת]+(-[a-z0-9א-ת]+)*$'),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index categories_name_unique_idx on public.categories (lower(btrim(name)));

create trigger categories_set_updated_at
before update on public.categories
for each row execute function private.set_updated_at();

-- Deleting a project or a category removes only the link rows.
create table public.project_categories (
  project_id uuid not null references public.projects (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  primary key (project_id, category_id)
);

create index project_categories_category_id_idx on public.project_categories (category_id);

-- Row Level Security ----------------------------------------------------------

alter table public.projects enable row level security;
alter table public.categories enable row level security;
alter table public.project_categories enable row level security;

grant select on public.projects, public.categories, public.project_categories to anon, authenticated;
grant insert, update, delete on public.projects, public.categories, public.project_categories to authenticated;

create policy "Published projects are public; admin reads all"
on public.projects for select
to anon, authenticated
using (published or (select private.is_admin()));

create policy "Admin inserts projects"
on public.projects for insert
to authenticated
with check ((select private.is_admin()));

create policy "Admin updates projects"
on public.projects for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "Admin deletes projects"
on public.projects for delete
to authenticated
using ((select private.is_admin()));

create policy "Categories of published projects are public; admin reads all"
on public.categories for select
to anon, authenticated
using (
  (select private.is_admin())
  or exists (
    select 1
    from public.project_categories pc
    join public.projects p on p.id = pc.project_id
    where pc.category_id = categories.id and p.published
  )
);

create policy "Admin inserts categories"
on public.categories for insert
to authenticated
with check ((select private.is_admin()));

create policy "Admin updates categories"
on public.categories for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "Admin deletes categories"
on public.categories for delete
to authenticated
using ((select private.is_admin()));

create policy "Links of published projects are public; admin reads all"
on public.project_categories for select
to anon, authenticated
using (
  (select private.is_admin())
  or exists (
    select 1 from public.projects p
    where p.id = project_categories.project_id and p.published
  )
);

create policy "Admin inserts project categories"
on public.project_categories for insert
to authenticated
with check ((select private.is_admin()));

create policy "Admin deletes project categories"
on public.project_categories for delete
to authenticated
using ((select private.is_admin()));
