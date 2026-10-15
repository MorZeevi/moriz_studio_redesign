-- Mor OS POC seed: Mor's three real projects (docs/mor-os/PLAN.md).
-- Owner: morzavi1@gmail.com, auth user 300a2870-9861-4a41-9272-1d783b2636df
-- (verified against auth.users on 2026-10-15). Idempotent.

insert into public.work_projects (owner_user_id, title, client_name, status, context)
select v.owner_user_id, v.title, v.client_name, v.status, v.context
from (values
  ('300a2870-9861-4a41-9272-1d783b2636df'::uuid, 'Mor website', null::text, 'active',
   'Mor''s own website. Finishing and polish, launch tasks, launch marketing thinking.'),
  ('300a2870-9861-4a41-9272-1d783b2636df'::uuid, 'Beit Chabad', 'Beit Chabad', 'active',
   'Active client. Real tasks, and closing the bank-of-hours arrangement.'),
  ('300a2870-9861-4a41-9272-1d783b2636df'::uuid, 'AI Praktí', null::text, 'active',
   'Ongoing, little or no work right now. Stays on the radar with reminders to check in.')
) as v(owner_user_id, title, client_name, status, context)
where not exists (
  select 1 from public.work_projects p
  where p.owner_user_id = v.owner_user_id and p.title = v.title
);
