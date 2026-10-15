-- Mor OS schema checks. Run after the Mor OS migrations. Self-cleaning: the DO block
-- always ends by raising 'MOR_OS_TESTS_PASSED', which rolls back everything it wrote.
-- Run: npx supabase db query --linked -f tests/mor-os/constraints.sql
-- Any other error message means a check failed.
do $$
declare
  mor constant uuid := '300a2870-9861-4a41-9272-1d783b2636df';
  other constant uuid := 'dbce8f48-f615-4080-a7e9-a70c16b78959';
  p_active uuid; p_snooze uuid; p_done_only uuid; p_note uuid; p_paused uuid; p_other uuid;
  today date := (now() at time zone 'Asia/Jerusalem')::date;
  n int;
begin
  insert into public.work_projects (owner_user_id, title, status) values (mor, 't-active', 'active') returning id into p_active;
  insert into public.work_projects (owner_user_id, title, status) values (mor, 't-snooze', 'active') returning id into p_snooze;
  insert into public.work_projects (owner_user_id, title, status) values (mor, 't-doneonly', 'active') returning id into p_done_only;
  insert into public.work_projects (owner_user_id, title, status) values (mor, 't-note', 'active') returning id into p_note;
  insert into public.work_projects (owner_user_id, title, status) values (mor, 't-paused', 'paused') returning id into p_paused;
  insert into public.work_projects (owner_user_id, title, status) values (other, 't-other', 'active') returning id into p_other;

  -- Constraints reject ---------------------------------------------------------
  begin insert into public.work_projects (title, status) values ('x', 'active'); raise exception 'no-fail';
  exception when not_null_violation then null; end;
  begin insert into public.work_items (kind, title) values ('task', 'x'); raise exception 'no-fail';
  exception when not_null_violation then null; end;
  begin insert into public.work_items (owner_user_id, kind, title, status) values (mor, 'task', 'x', 'done'); raise exception 'no-fail';
  exception when check_violation then null; end;
  begin insert into public.work_items (owner_user_id, kind, title, status, done_at) values (mor, 'task', 'x', 'open', now()); raise exception 'no-fail';
  exception when check_violation then null; end;
  begin insert into public.work_items (owner_user_id, kind, title, done_at) values (mor, 'note', 'x', now()); raise exception 'no-fail';
  exception when check_violation then null; end;
  begin insert into public.work_projects (owner_user_id, title, status) values (mor, 'x', 'archived'); raise exception 'no-fail';
  exception when check_violation then null; end;
  begin insert into public.work_items (owner_user_id, kind, title, status) values (mor, 'task', 'x', 'blocked'); raise exception 'no-fail';
  exception when check_violation then null; end;
  begin insert into public.work_items (owner_user_id, project_id, kind, title) values (mor, p_other, 'task', 'cross-owner'); raise exception 'no-fail';
  exception when foreign_key_violation then null; end;
  begin insert into public.work_items (owner_user_id, project_id, kind, title) values (mor, gen_random_uuid(), 'task', 'ghost'); raise exception 'no-fail';
  exception when foreign_key_violation then null; end;

  -- Valid shapes accepted
  insert into public.work_items (owner_user_id, kind, title) values (mor, 'note', 'general capture, no project, null status');
  insert into public.work_items (owner_user_id, project_id, kind, title, status, done_at) values (mor, p_done_only, 'task', 'finished', 'done', now());
  insert into public.work_items (owner_user_id, project_id, kind, title) values (mor, p_note, 'idea', 'idea, null status');

  -- Deleting a project that still has items is refused
  begin delete from public.work_projects where id = p_done_only; raise exception 'no-fail';
  exception when foreign_key_violation then null; end;

  -- updated_at trigger
  update public.work_items set updated_at = '2000-01-01' where title = 'finished';
  select count(*) into n from public.work_items where title = 'finished' and updated_at > '2020-01-01';
  if n <> 1 then raise exception 'updated_at trigger not firing'; end if;

  -- Queries --------------------------------------------------------------------
  insert into public.work_items (owner_user_id, project_id, kind, title, status, due_on) values
    (mor, p_active, 'task', 'overdue',   'open', today - 1),
    (mor, p_active, 'task', 'due-today', 'open', today),
    (mor, p_active, 'task', 'tomorrow',  'open', today + 1),
    (mor, p_active, 'task', 'no-due',    'open', null),
    (mor, p_snooze, 'followup', 'check in later', 'open', today + 14);
  select count(*) into n from public.work_items_today
    where title in ('overdue','due-today','tomorrow','no-due','check in later','finished');
  if n <> 2 then raise exception 'today view returned % rows, expected 2', n; end if;

  -- Radar: active and no open item. Done-only and note-only (null status) projects
  -- are on the radar; paused projects and projects with an open item are not.
  select count(*) into n from public.work_radar where id in (p_active, p_snooze, p_done_only, p_note, p_paused);
  if n <> 2 then raise exception 'radar returned % of test projects, expected 2', n; end if;
  if not exists (select 1 from public.work_radar where id = p_done_only)
     or not exists (select 1 from public.work_radar where id = p_note) then
    raise exception 'radar wrong members';
  end if;
  update public.work_items set status = 'done', done_at = now() where title = 'check in later';
  if not exists (select 1 from public.work_radar where id = p_snooze) then
    raise exception 'radar should include project after its only open item is done';
  end if;

  -- Israel midnight: UTC+3 in October, UTC+2 in winter.
  if ('2026-10-15 20:30+00'::timestamptz at time zone 'Asia/Jerusalem')::date <> date '2026-10-15' then raise exception 'IL date before midnight'; end if;
  if ('2026-10-15 21:30+00'::timestamptz at time zone 'Asia/Jerusalem')::date <> date '2026-10-16' then raise exception 'IL date after midnight'; end if;
  if ('2026-12-15 21:30+00'::timestamptz at time zone 'Asia/Jerusalem')::date <> date '2026-12-15' then raise exception 'IL winter date'; end if;

  -- Access ---------------------------------------------------------------------
  set local role anon;
  begin perform 1 from public.work_projects; raise exception 'no-fail-anon-projects';
  exception when insufficient_privilege then null; end;
  begin perform 1 from public.work_items; raise exception 'no-fail-anon-items';
  exception when insufficient_privilege then null; end;
  begin perform 1 from public.work_radar; raise exception 'no-fail-anon-radar';
  exception when insufficient_privilege then null; end;
  begin perform 1 from public.work_items_today; raise exception 'no-fail-anon-today';
  exception when insufficient_privilege then null; end;
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', other, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.work_projects where owner_user_id = mor;
  if n <> 0 then raise exception 'other user sees Mor projects'; end if;
  select count(*) into n from public.work_items where owner_user_id = mor;
  if n <> 0 then raise exception 'other user sees Mor items'; end if;
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', mor, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.work_projects where title like 't-%';
  if n <> 5 then raise exception 'Mor sees % own test projects, expected 5', n; end if;
  select count(*) into n from public.work_projects where id = p_other;
  if n <> 0 then raise exception 'Mor sees other user project'; end if;
  begin insert into public.work_items (owner_user_id, kind, title) values (mor, 'task', 'x'); raise exception 'no-fail-auth-insert';
  exception when insufficient_privilege then null; end;
  begin delete from public.work_items where title = 'overdue'; raise exception 'no-fail-auth-delete';
  exception when insufficient_privilege then null; end;
  begin update public.work_items set title = 'renamed' where title = 'overdue'; raise exception 'no-fail-auth-title';
  exception when insufficient_privilege then null; end;
  begin update public.work_projects set status = 'done' where id = p_active; raise exception 'no-fail-auth-project-update';
  exception when insufficient_privilege then null; end;
  update public.work_items set status = 'done', done_at = now() where title = 'overdue';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'Mor could not mark own item done'; end if;
  reset role;

  raise exception 'MOR_OS_TESTS_PASSED';
end $$;
