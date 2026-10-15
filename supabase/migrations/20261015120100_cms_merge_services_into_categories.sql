-- Moriz merges services into categories: one list, shown as tags and used for
-- archive filters. Only source 'moriz' changes; kind 'service' stays allowed
-- for the Eyal site. Idempotent.

-- A service that matches a category (by name or slug) moves its links to it
-- and is removed.
with matches as (
  select s.id as service_id, c.id as category_id
  from public.categories s
  join public.categories c
    on c.source = s.source and c.kind = 'category'
    and (lower(btrim(c.name)) = lower(btrim(s.name)) or c.slug = s.slug)
  where s.source = 'moriz' and s.kind = 'service'
), moved as (
  insert into public.project_categories (project_id, category_id, source)
  select pc.project_id, m.category_id, 'moriz'
  from matches m
  join public.project_categories pc on pc.category_id = m.service_id
  on conflict do nothing
)
delete from public.categories s
using matches m
where s.id = m.service_id;

-- Every other service becomes a category, after the existing ones.
with base as (
  select coalesce(max(sort_order), 0) as top
  from public.categories
  where source = 'moriz' and kind = 'category'
), ordered as (
  select id, row_number() over (order by sort_order, name) as n
  from public.categories
  where source = 'moriz' and kind = 'service'
)
update public.categories c
set kind = 'category', sort_order = base.top + ordered.n
from ordered, base
where c.id = ordered.id;

-- The legacy text mirror of services is no longer read or written.
update public.projects set services = '{}'
where source = 'moriz' and services <> '{}';
