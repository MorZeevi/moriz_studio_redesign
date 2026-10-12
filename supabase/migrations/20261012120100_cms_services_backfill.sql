-- Services become managed terms (categories.kind = 'service'). Copies every
-- distinct legacy service tag into a term and links it to its projects.
-- Idempotent; projects.services stays as a mirror and is not modified.

with names as (
  select distinct on (lower(btrim(s))) btrim(s) as name
  from public.projects, unnest(services) as s
  where btrim(s) <> ''
  order by lower(btrim(s)), btrim(s)
), slugs as (
  select name, coalesce(
    nullif(trim(both '-' from regexp_replace(
      lower(regexp_replace(normalize(name, NFKD), '[̀-֑ͯ-ׇ''"׳״]', '', 'g')),
      '[^a-z0-9א-ת]+', '-', 'g')), ''),
    'service-' || left(md5(lower(name)), 8)
  ) as base
  from names
), numbered as (
  select name, base, row_number() over (partition by base order by name) as n
  from slugs
)
insert into public.categories (kind, name, slug, sort_order)
select 'service', name, case when n = 1 then base else base || '-' || n end,
  row_number() over (order by name)::integer
from numbered
on conflict do nothing;

insert into public.project_categories (project_id, category_id)
select distinct p.id, c.id
from public.projects p
cross join lateral unnest(p.services) as s
join public.categories c
  on c.kind = 'service' and lower(btrim(c.name)) = lower(btrim(s))
on conflict do nothing;
