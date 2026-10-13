-- Projects ownership boundary: every project, term and link belongs to one product
-- ('moriz' or 'eyal'). The owner is resolved in the database from the caller's
-- Auth user (private.cms_admins), never from a client-supplied value.
--
-- Compatibility: code that does not know about `source` keeps working. `source`
-- defaults to the caller's source, so inserts need not send it, and an explicit
-- value for another source is rejected by RLS. Existing rows become 'moriz'.
-- Media is split into one private bucket per source. Project slugs stay
-- globally unique.

-- Trusted admin -> source mapping ------------------------------------------------

create table private.cms_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  source text not null check (source in ('moriz', 'eyal'))
);

-- RLS on and no policies: only the table owner and service-side SQL can read it.
alter table private.cms_admins enable row level security;
revoke all on table private.cms_admins from public, anon, authenticated;

-- Mor's existing owner account, previously hardcoded in private.is_admin().
insert into private.cms_admins (user_id, source)
select id, 'moriz' from auth.users
where id = '300a2870-9861-4a41-9272-1d783b2636df'::uuid
on conflict (user_id) do nothing;

-- The caller's source, or null for anonymous visitors and non-admin users.
create function private.cms_source()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select a.source from private.cms_admins a where a.user_id = (select auth.uid());
$$;
revoke all on function private.cms_source() from public;
grant execute on function private.cms_source() to anon, authenticated;

create function private.cms_source_immutable()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.source is distinct from old.source then
    raise exception 'source cannot be changed' using errcode = '42501';
  end if;
  return new;
end;
$$;

-- Columns ------------------------------------------------------------------------

alter table public.projects
  add column source text not null default 'moriz'
    check (source in ('moriz', 'eyal'));
alter table public.categories
  add column source text not null default 'moriz'
    check (source in ('moriz', 'eyal'));
-- Existing rows were backfilled to 'moriz' above. New rows take the caller's
-- source; callers without one (service role, anon) must be explicit or fail.
alter table public.projects alter column source set default private.cms_source();
alter table public.categories alter column source set default private.cms_source();

alter table public.projects add constraint projects_id_source_key unique (id, source);
alter table public.categories add constraint categories_id_source_key unique (id, source);

create trigger projects_source_immutable
before update on public.projects
for each row execute function private.cms_source_immutable();
create trigger categories_source_immutable
before update on public.categories
for each row execute function private.cms_source_immutable();

-- Links carry the source so composite foreign keys can forbid cross-source rows.
alter table public.project_categories add column source text;
update public.project_categories pc
set source = p.source
from public.projects p
where p.id = pc.project_id;
alter table public.project_categories
  alter column source set not null,
  add constraint project_categories_source_check check (source in ('moriz', 'eyal'));
alter table public.project_categories alter column source set default private.cms_source();

-- The single-column keys are replaced (not supplemented) so PostgREST sees one
-- relationship per side and embedded selects stay unambiguous.
alter table public.project_categories
  drop constraint project_categories_project_id_fkey,
  drop constraint project_categories_category_id_fkey,
  add constraint project_categories_project_source_fkey
    foreign key (project_id, source) references public.projects (id, source) on delete cascade,
  add constraint project_categories_category_source_fkey
    foreign key (category_id, source) references public.categories (id, source) on delete cascade;

create trigger project_categories_source_immutable
before update on public.project_categories
for each row execute function private.cms_source_immutable();

-- Taxonomy names and slugs are unique per source and kind.
drop index public.categories_kind_slug_idx;
create unique index categories_source_kind_slug_idx on public.categories (source, kind, slug);
drop index public.categories_kind_name_idx;
create unique index categories_source_kind_name_idx
  on public.categories (source, kind, lower(btrim(name)));
drop index public.categories_kind_idx;
create index categories_source_kind_idx on public.categories (source, kind);
create index projects_source_idx on public.projects (source);

-- Media: one private bucket per source ---------------------------------------------

create function private.cms_bucket_source(bucket text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case bucket
    when 'project-media' then 'moriz'
    when 'project-media-eyal' then 'eyal'
  end;
$$;
grant execute on function private.cms_bucket_source(text) to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
select 'project-media-eyal', 'project-media-eyal', false, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'project-media'
on conflict (id) do nothing;

-- A file is public only while a published project of the bucket's own source
-- references it, so one source's content never exposes the other's files.
create function private.cms_media_is_public(bucket text, object_name text)
returns boolean language sql stable set search_path = '' as $$
  select exists (
    select 1 from public.projects p
    where p.published
      and p.source = private.cms_bucket_source(bucket)
      and (
        '/media/' || object_name in (p.cover_image_url, p.homepage_image_url, p.projects_image_url, p.og_image_url)
        or p.media @> jsonb_build_array(jsonb_build_object('src', '/media/' || object_name))
        or p.media @> jsonb_build_array(jsonb_build_object('poster', '/media/' || object_name))
        or p.content @> jsonb_build_array(jsonb_build_object('src', '/media/' || object_name))
        or p.content @> jsonb_build_array(jsonb_build_object('poster', '/media/' || object_name))
        or p.content @> jsonb_build_array(jsonb_build_object('images', jsonb_build_array(jsonb_build_object('src', '/media/' || object_name))))
      )
  );
$$;
grant execute on function private.cms_media_is_public(text, text) to anon, authenticated;

drop policy "Published referenced project media is readable" on storage.objects;
drop policy "Admin reads project media" on storage.objects;
drop policy "Admin uploads project media" on storage.objects;
drop policy "Admin updates project media" on storage.objects;
drop policy "Admin deletes project media" on storage.objects;

create policy "Published referenced project media is readable"
on storage.objects for select to anon, authenticated
using (
  private.cms_bucket_source(bucket_id) is not null
  and private.cms_media_is_public(bucket_id, name)
);

create policy "Source admin reads own project media"
on storage.objects for select to authenticated
using (private.cms_bucket_source(bucket_id) = (select private.cms_source()));

create policy "Source admin uploads own project media"
on storage.objects for insert to authenticated
with check (private.cms_bucket_source(bucket_id) = (select private.cms_source()));

create policy "Source admin updates own project media"
on storage.objects for update to authenticated
using (private.cms_bucket_source(bucket_id) = (select private.cms_source()))
with check (private.cms_bucket_source(bucket_id) = (select private.cms_source()));

create policy "Source admin deletes own project media"
on storage.objects for delete to authenticated
using (private.cms_bucket_source(bucket_id) = (select private.cms_source()));

drop function private.cms_media_is_public(text);

-- Row Level Security ---------------------------------------------------------------

drop policy "Published projects are public; admin reads all" on public.projects;
drop policy "Admin inserts projects" on public.projects;
drop policy "Admin updates projects" on public.projects;
drop policy "Admin deletes projects" on public.projects;
drop policy "Categories of published projects are public; admin reads all" on public.categories;
drop policy "Admin inserts categories" on public.categories;
drop policy "Admin updates categories" on public.categories;
drop policy "Admin deletes categories" on public.categories;
drop policy "Links of published projects are public; admin reads all" on public.project_categories;
drop policy "Admin inserts project categories" on public.project_categories;
drop policy "Admin deletes project categories" on public.project_categories;

create policy "Published projects are public; source admin reads own"
on public.projects for select to anon, authenticated
using (
  source = (select private.cms_source())
  or ((select private.cms_source()) is null and published)
);
create policy "Source admin inserts own projects"
on public.projects for insert to authenticated
with check (source = (select private.cms_source()));
create policy "Source admin updates own projects"
on public.projects for update to authenticated
using (source = (select private.cms_source()))
with check (source = (select private.cms_source()));
create policy "Source admin deletes own projects"
on public.projects for delete to authenticated
using (source = (select private.cms_source()));

create policy "Categories of published projects are public; source admin reads own"
on public.categories for select to anon, authenticated
using (
  source = (select private.cms_source())
  or (
    (select private.cms_source()) is null
    and exists (
      select 1
      from public.project_categories pc
      join public.projects p on p.id = pc.project_id
      where pc.category_id = categories.id and p.published
    )
  )
);
create policy "Source admin inserts own categories"
on public.categories for insert to authenticated
with check (source = (select private.cms_source()));
create policy "Source admin updates own categories"
on public.categories for update to authenticated
using (source = (select private.cms_source()))
with check (source = (select private.cms_source()));
create policy "Source admin deletes own categories"
on public.categories for delete to authenticated
using (source = (select private.cms_source()));

create policy "Links of published projects are public; source admin reads own"
on public.project_categories for select to anon, authenticated
using (
  source = (select private.cms_source())
  or (
    (select private.cms_source()) is null
    and exists (
      select 1 from public.projects p
      where p.id = project_categories.project_id and p.published
    )
  )
);
create policy "Source admin inserts own project categories"
on public.project_categories for insert to authenticated
with check (source = (select private.cms_source()));
create policy "Source admin deletes own project categories"
on public.project_categories for delete to authenticated
using (source = (select private.cms_source()));

-- Saving ---------------------------------------------------------------------------

-- Same contract as before, scoped to the caller's source. A payload `source` is
-- ignored; another source's project id is rejected and left untouched.
create or replace function public.cms_save_project(project_id uuid, project_data jsonb, category_ids uuid[])
returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  r public.projects;
  src text := private.cms_source();
begin
  if src is null then
    raise exception 'CMS access denied' using errcode = '42501';
  end if;
  -- Insert only new rows: VALUES are evaluated before ON CONFLICT, so a partial
  -- payload without a title must not reach the insert for an existing project.
  if not exists (select 1 from public.projects p where p.id = cms_save_project.project_id) then
    begin
      insert into public.projects (id, title, source)
      values (cms_save_project.project_id, project_data->>'title', src);
    exception when unique_violation then
      -- The id exists but is hidden from this caller: it belongs to another source.
      raise exception 'CMS access denied' using errcode = '42501';
    end;
  end if;
  select * into r from public.projects p
  where p.id = cms_save_project.project_id and p.source = src for update;
  if not found then
    raise exception 'CMS access denied' using errcode = '42501';
  end if;
  r := jsonb_populate_record(r, project_data - 'id' - 'source' - 'created_at' - 'updated_at');
  update public.projects p set (
    title, title_en, slug, client, client_en, year, headline, headline_en,
    short_description, short_description_en, description, description_en,
    archive_description, archive_description_en, role, role_en,
    target_audience, target_audience_en, audience_description, audience_description_en,
    website_url, services, cover_image_url, homepage_image_url, projects_image_url,
    og_image_url, content, media, highlights,
    seo_title, seo_title_en, seo_description, seo_description_en,
    featured, show_on_homepage, show_on_projects, homepage_order, projects_order, published
  ) = (
    r.title, r.title_en, r.slug, r.client, r.client_en, r.year, r.headline, r.headline_en,
    r.short_description, r.short_description_en, r.description, r.description_en,
    r.archive_description, r.archive_description_en, r.role, r.role_en,
    r.target_audience, r.target_audience_en, r.audience_description, r.audience_description_en,
    r.website_url, coalesce(r.services, '{}'), r.cover_image_url, r.homepage_image_url, r.projects_image_url,
    r.og_image_url, coalesce(r.content, '[]'), coalesce(r.media, '[]'), coalesce(r.highlights, '[]'),
    r.seo_title, r.seo_title_en, r.seo_description, r.seo_description_en,
    coalesce(r.featured, false), coalesce(r.show_on_homepage, true), coalesce(r.show_on_projects, true),
    r.homepage_order, r.projects_order, coalesce(r.published, false)
  )
  where p.id = cms_save_project.project_id and p.source = src;
  if category_ids is not null then
    delete from public.project_categories pc
    where pc.project_id = cms_save_project.project_id and pc.source = src;
    -- A term of another source fails the composite foreign key.
    insert into public.project_categories (project_id, category_id, source)
    select cms_save_project.project_id, id, src from unnest(category_ids) id;
  end if;
  return cms_save_project.project_id;
end;
$$;

create or replace function public.cms_reorder_projects(surface text, ids uuid[])
returns void language plpgsql security invoker set search_path = '' as $$
declare
  src text := private.cms_source();
begin
  if src is null then
    raise exception 'CMS access denied' using errcode = '42501';
  end if;
  if surface = 'homepage' then
    update public.projects p set homepage_order = o.ord::integer
    from unnest(ids) with ordinality as o(id, ord)
    where p.id = o.id and p.source = src;
  elsif surface = 'projects' then
    update public.projects p set projects_order = o.ord::integer
    from unnest(ids) with ordinality as o(id, ord)
    where p.id = o.id and p.source = src;
  else
    raise exception 'Unknown surface %', surface using errcode = '22023';
  end if;
end;
$$;

-- Every policy and function now resolves the caller through private.cms_source().
drop function private.is_admin();

notify pgrst, 'reload schema';
