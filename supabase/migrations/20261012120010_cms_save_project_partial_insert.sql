-- Follow-up to 20261012120000: partial payloads without a title must update
-- existing projects instead of failing the new-row insert.
create or replace function public.cms_save_project(project_id uuid, project_data jsonb, category_ids uuid[])
returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  r public.projects;
begin
  if not private.is_admin() then
    raise exception 'CMS access denied' using errcode = '42501';
  end if;
  -- Insert only new rows: VALUES are evaluated before ON CONFLICT, so a partial
  -- payload without a title must not reach the insert for an existing project.
  if not exists (select 1 from public.projects p where p.id = cms_save_project.project_id) then
    insert into public.projects (id, title)
    values (cms_save_project.project_id, project_data->>'title');
  end if;
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
