-- Projects CMS v2: bilingual text, case-study fields, gallery, highlights, SEO
-- and managed taxonomies (categories / services / project types).
-- Additive only: existing rows, links and media keep working unchanged, and
-- code written before this migration can keep saving (see cms_save_project).

-- Projects ---------------------------------------------------------------------

alter table public.projects
  add column title_en text,
  add column client_en text,
  add column headline_en text,
  add column short_description_en text,
  add column description_en text,
  add column archive_description text,
  add column archive_description_en text,
  add column role text,
  add column role_en text,
  add column target_audience text,
  add column target_audience_en text,
  add column audience_description text,
  add column audience_description_en text,
  add column website_url text,
  add column seo_title text,
  add column seo_title_en text,
  add column seo_description text,
  add column seo_description_en text,
  add column og_image_url text,
  -- Gallery assets ({src, kind, role?, poster?, width?, height?, alt, ...}).
  -- Blocks and covers reference these by src, so a file is uploaded once.
  add column media jsonb not null default '[]'::jsonb
    check (jsonb_typeof(media) = 'array'),
  -- Up to three project facts; cards point at one via on_homepage/on_archive.
  add column highlights jsonb not null default '[]'::jsonb
    check (jsonb_typeof(highlights) = 'array' and jsonb_array_length(highlights) <= 3);

comment on column public.projects.featured is
  'Unused. The homepage is driven by show_on_homepage (shown as "Featured" in the CMS).';
comment on column public.projects.services is
  'Legacy mirror of linked service names. Services are managed as categories with kind = service.';

-- Taxonomies -------------------------------------------------------------------

alter table public.categories
  add column kind text not null default 'category'
    check (kind in ('category', 'service', 'type')),
  add column name_en text;

-- Names and slugs are unique per kind ("Development" may be a category and a service).
alter table public.categories drop constraint if exists categories_slug_key;
create unique index categories_kind_slug_idx on public.categories (kind, slug);
drop index if exists public.categories_name_unique_idx;
create unique index categories_kind_name_idx on public.categories (kind, lower(btrim(name)));
create index categories_kind_idx on public.categories (kind);

-- Saving -----------------------------------------------------------------------

-- Partial-update semantics: keys missing from project_data keep their stored
-- value, so older callers never null newer columns. Links are replaced only
-- when category_ids is provided (it carries category, service and type ids).
create or replace function public.cms_save_project(project_id uuid, project_data jsonb, category_ids uuid[])
returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  r public.projects;
begin
  if not private.is_admin() then
    raise exception 'CMS access denied' using errcode = '42501';
  end if;
  insert into public.projects (id, title)
  values (cms_save_project.project_id, project_data->>'title')
  on conflict (id) do nothing;
  select * into r from public.projects p where p.id = cms_save_project.project_id for update;
  r := jsonb_populate_record(r, project_data - 'id' - 'created_at' - 'updated_at');
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
  where p.id = cms_save_project.project_id;
  if category_ids is not null then
    delete from public.project_categories pc where pc.project_id = cms_save_project.project_id;
    insert into public.project_categories (project_id, category_id)
    select cms_save_project.project_id, id from unnest(category_ids) id;
  end if;
  return cms_save_project.project_id;
end;
$$;

-- Bulk ordering for the homepage ("projects featured") and the archive.
create function public.cms_reorder_projects(surface text, ids uuid[])
returns void language plpgsql security invoker set search_path = '' as $$
begin
  if not private.is_admin() then
    raise exception 'CMS access denied' using errcode = '42501';
  end if;
  if surface = 'homepage' then
    update public.projects p set homepage_order = o.ord::integer
    from unnest(ids) with ordinality as o(id, ord) where p.id = o.id;
  elsif surface = 'projects' then
    update public.projects p set projects_order = o.ord::integer
    from unnest(ids) with ordinality as o(id, ord) where p.id = o.id;
  else
    raise exception 'Unknown surface %', surface using errcode = '22023';
  end if;
end;
$$;
revoke all on function public.cms_reorder_projects(text, uuid[]) from public, anon;
grant execute on function public.cms_reorder_projects(text, uuid[]) to authenticated;

-- Media ------------------------------------------------------------------------

-- Gallery files and the social image become public once their project is published.
create or replace function private.cms_media_is_public(object_name text)
returns boolean language sql stable set search_path = '' as $$
  select exists (
    select 1 from public.projects p
    where p.published and (
      '/media/' || object_name in (p.cover_image_url, p.homepage_image_url, p.projects_image_url, p.og_image_url)
      or p.media @> jsonb_build_array(jsonb_build_object('src', '/media/' || object_name))
      or p.media @> jsonb_build_array(jsonb_build_object('poster', '/media/' || object_name))
      or p.content @> jsonb_build_array(jsonb_build_object('src', '/media/' || object_name))
      or p.content @> jsonb_build_array(jsonb_build_object('poster', '/media/' || object_name))
      or p.content @> jsonb_build_array(jsonb_build_object('images', jsonb_build_array(jsonb_build_object('src', '/media/' || object_name))))
    )
  );
$$;

-- Project logos may be SVG. The application accepts SVG only for the logo role
-- and serves media with a sandboxing Content-Security-Policy.
update storage.buckets
set allowed_mime_types = array_append(allowed_mime_types, 'image/svg+xml')
where id = 'project-media' and not ('image/svg+xml' = any (allowed_mime_types));
