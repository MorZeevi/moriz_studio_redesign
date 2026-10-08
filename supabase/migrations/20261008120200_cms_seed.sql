-- One-time import of the projects that were hardcoded in src/i18n/dictionaries/he.ts,
-- plus the starter categories. Safe to re-run: existing slugs are left untouched.
-- Preserve the clearly marked Q&A placeholders as editable, collapsible text blocks.

insert into public.projects
  (slug, title, short_description, description, published, homepage_order, projects_order)
values
  ('practice-ai', 'practice ai learning system', 'מערכת למידה עבור practice ai.', 'מערכת למידה עבור practice ai.', true, 1, 1),
  ('haaretz', 'הארץ — וורדעל', 'פרויקט עבור עיתון הארץ.', 'פרויקט עבור עיתון הארץ.', true, 2, 2),
  ('chabad-club', 'חב״ד קלאב', null, null, true, 3, 3)
on conflict (slug) do nothing;

update public.projects
set content = (
  select jsonb_agg(jsonb_build_object(
    'type', 'text', 'title', 'שאלה ' || i || ' — להשלמה',
    'text', 'תשובה — להשלמה', 'collapsible', true
  ) order by i) from generate_series(1,4) i
)
where slug in ('practice-ai', 'haaretz', 'chabad-club') and content = '[]'::jsonb;

insert into public.categories (name, slug, sort_order)
values
  ('Product Design', 'product-design', 1),
  ('Websites', 'websites', 2),
  ('Development', 'development', 3),
  ('AI', 'ai', 4),
  ('Experiments', 'experiments', 5)
on conflict do nothing;
