-- Private bucket: draft uploads must not be accessible through public URLs.
-- The application streams media using ordinary anon/authenticated access.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-media',
  'project-media',
  false,
  52428800, -- 50 MB
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif',
    'video/mp4', 'video/webm'
  ]
)
on conflict (id) do nothing;

-- Read access is granted only to files actually referenced by published content.
-- Shared references (e.g. duplicated projects) remain valid independently.
create function private.cms_media_is_public(object_name text)
returns boolean language sql stable set search_path = '' as $$
  select exists (
    select 1 from public.projects p
    where p.published and (
      '/media/' || object_name in (p.cover_image_url, p.homepage_image_url, p.projects_image_url)
      or p.content @> jsonb_build_array(jsonb_build_object('src', '/media/' || object_name))
      or p.content @> jsonb_build_array(jsonb_build_object('poster', '/media/' || object_name))
      or p.content @> jsonb_build_array(jsonb_build_object('images', jsonb_build_array(jsonb_build_object('src', '/media/' || object_name))))
    )
  );
$$;
grant execute on function private.cms_media_is_public(text) to anon, authenticated;

create policy "Published referenced project media is readable"
on storage.objects for select to anon, authenticated
using (bucket_id = 'project-media' and private.cms_media_is_public(name));

create policy "Admin reads project media"
on storage.objects for select
to authenticated
using (bucket_id = 'project-media' and (select private.is_admin()));

create policy "Admin uploads project media"
on storage.objects for insert
to authenticated
with check (bucket_id = 'project-media' and (select private.is_admin()));

create policy "Admin updates project media"
on storage.objects for update
to authenticated
using (bucket_id = 'project-media' and (select private.is_admin()))
with check (bucket_id = 'project-media' and (select private.is_admin()));

create policy "Admin deletes project media"
on storage.objects for delete
to authenticated
using (bucket_id = 'project-media' and (select private.is_admin()));
