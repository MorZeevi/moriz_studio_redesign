-- One small transactional RPC: a project and its category selection save together.
create function public.cms_save_project(project_id uuid, project_data jsonb, category_ids uuid[])
returns uuid language plpgsql security invoker set search_path = '' as $$
begin
  if not private.is_admin() then
    raise exception 'CMS access denied' using errcode = '42501';
  end if;
  insert into public.projects (
    id, title, slug, client, year, headline, short_description, description,
    services, cover_image_url, homepage_image_url, projects_image_url, content,
    featured, show_on_homepage, show_on_projects, homepage_order, projects_order, published
  ) select project_id, x.title, x.slug, x.client, x.year, x.headline,
    x.short_description, x.description, coalesce(x.services, '{}'),
    x.cover_image_url, x.homepage_image_url, x.projects_image_url, coalesce(x.content, '[]'),
    coalesce(x.featured,false), coalesce(x.show_on_homepage,true), coalesce(x.show_on_projects,true),
    x.homepage_order, x.projects_order, coalesce(x.published,false)
  from jsonb_populate_record(null::public.projects, project_data) x
  on conflict (id) do update set
    title=excluded.title, slug=excluded.slug, client=excluded.client, year=excluded.year,
    headline=excluded.headline, short_description=excluded.short_description,
    description=excluded.description, services=excluded.services,
    cover_image_url=excluded.cover_image_url, homepage_image_url=excluded.homepage_image_url,
    projects_image_url=excluded.projects_image_url, content=excluded.content,
    featured=excluded.featured, show_on_homepage=excluded.show_on_homepage,
    show_on_projects=excluded.show_on_projects, homepage_order=excluded.homepage_order,
    projects_order=excluded.projects_order, published=excluded.published;
  delete from public.project_categories pc where pc.project_id = cms_save_project.project_id;
  insert into public.project_categories(project_id,category_id)
  select cms_save_project.project_id, id from unnest(category_ids) id;
  return project_id;
end;
$$;
revoke all on function public.cms_save_project(uuid,jsonb,uuid[]) from public, anon;
grant execute on function public.cms_save_project(uuid,jsonb,uuid[]) to authenticated;
