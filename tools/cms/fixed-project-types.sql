-- One-off data change (not a migration): Moriz project types become a fixed
-- list of five, matching src/lib/cms/project-types.ts. Only source 'moriz'
-- rows change; the shared schema and Eyal rows are untouched. Idempotent.
-- Run: npx supabase db query --linked -f tools/cms/fixed-project-types.sql
begin;

with fixed(name, name_en, slug, sort_order) as (
  values
    ('משחק', 'Game', 'משחק', 1),
    ('אתר תדמית', 'Brand website', 'אתר-תדמית', 2),
    ('אפליקציית Web', 'Web app', 'אפליקציית-web', 3),
    ('כלי AI', 'AI tool', 'כלי-ai', 4),
    ('אחר', 'Other', 'אחר', 5)
)
insert into public.categories (source, kind, name, name_en, slug, sort_order)
select 'moriz', 'type', name, name_en, slug, sort_order from fixed
on conflict (source, kind, slug) do update
set name = excluded.name, name_en = excluded.name_en,
    sort_order = excluded.sort_order;

-- Projects with a type outside the list move to "אחר".
insert into public.project_categories (project_id, category_id, source)
select pc.project_id, other.id, 'moriz'
from public.project_categories pc
join public.categories old on old.id = pc.category_id
cross join (
  select id from public.categories
  where source = 'moriz' and kind = 'type' and slug = 'אחר'
) other
where old.source = 'moriz' and old.kind = 'type'
  and old.slug not in ('משחק', 'אתר-תדמית', 'אפליקציית-web', 'כלי-ai', 'אחר')
on conflict do nothing;

delete from public.categories
where source = 'moriz' and kind = 'type'
  and slug not in ('משחק', 'אתר-תדמית', 'אפליקציית-web', 'כלי-ai', 'אחר');

commit;
