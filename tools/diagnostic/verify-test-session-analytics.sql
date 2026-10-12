begin;

-- All identifiers and values in this transaction are synthetic. The final
-- rollback guarantees that no verification fixture or classification change
-- persists.
insert into public.diagnostic_sessions (id, is_test)
values
  ('61000000-0000-4000-8000-000000000001', false),
  ('61000000-0000-4000-8000-000000000002', true);

insert into public.diagnostic_events (id, event_name, session_id, occurred_at)
values
  (
    '61000000-0000-4000-9000-000000000001',
    'verification_initial_real',
    '61000000-0000-4000-8000-000000000001',
    '2026-01-01T00:00:00Z'
  ),
  (
    '61000000-0000-4000-9000-000000000002',
    'verification_initial_test',
    '61000000-0000-4000-8000-000000000002',
    '2026-01-01T00:01:00Z'
  );

do $$
declare
  production_count integer;
  test_count integer;
begin
  select count(*) into production_count
  from public.diagnostic_production_events
  where id = '61000000-0000-4000-9000-000000000001';

  select count(*) into test_count
  from public.diagnostic_test_events
  where id = '61000000-0000-4000-9000-000000000001';

  if production_count <> 1 or test_count <> 0 then
    raise exception 'initial real event classification failed';
  end if;
end;
$$;

do $$
declare
  production_count integer;
  test_count integer;
begin
  select count(*) into production_count
  from public.diagnostic_production_events
  where id = '61000000-0000-4000-9000-000000000002';

  select count(*) into test_count
  from public.diagnostic_test_events
  where id = '61000000-0000-4000-9000-000000000002';

  if production_count <> 0 or test_count <> 1 then
    raise exception 'initial test event classification failed';
  end if;
end;
$$;

update public.diagnostic_sessions
set is_test = true
where id = '61000000-0000-4000-8000-000000000001';

do $$
declare
  production_count integer;
  test_count integer;
begin
  select count(*) into production_count
  from public.diagnostic_production_events
  where id = '61000000-0000-4000-9000-000000000001';

  select count(*) into test_count
  from public.diagnostic_test_events
  where id = '61000000-0000-4000-9000-000000000001';

  if production_count <> 0 or test_count <> 1 then
    raise exception 'marking a real session test did not move its event history';
  end if;
end;
$$;

insert into public.diagnostic_events (id, event_name, session_id, occurred_at)
values (
  '61000000-0000-4000-9000-000000000003',
  'verification_after_mark',
  '61000000-0000-4000-8000-000000000001',
  '2026-01-01T00:02:00Z'
);

do $$
declare
  production_count integer;
  test_count integer;
begin
  select count(*) into production_count
  from public.diagnostic_production_events
  where id = '61000000-0000-4000-9000-000000000003';

  select count(*) into test_count
  from public.diagnostic_test_events
  where id = '61000000-0000-4000-9000-000000000003';

  if production_count <> 0 or test_count <> 1 then
    raise exception 'event added after marking was not test-only';
  end if;
end;
$$;

update public.diagnostic_sessions
set is_test = false
where id = '61000000-0000-4000-8000-000000000001';

do $$
declare
  production_count integer;
  test_count integer;
begin
  select count(*) into production_count
  from public.diagnostic_production_events
  where id in (
    '61000000-0000-4000-9000-000000000001',
    '61000000-0000-4000-9000-000000000003'
  );

  select count(*) into test_count
  from public.diagnostic_test_events
  where id in (
    '61000000-0000-4000-9000-000000000001',
    '61000000-0000-4000-9000-000000000003'
  );

  if production_count <> 2 or test_count <> 0 then
    raise exception 'restoring a session real did not move its full event history';
  end if;
end;
$$;

insert into public.diagnostic_contacts (
  id,
  session_id,
  full_name,
  phone,
  email,
  review_consent,
  marketing_consent,
  status
)
values
  (
    '61000000-0000-4000-a000-000000000001',
    '61000000-0000-4000-8000-000000000001',
    'Synthetic Verification Real',
    '0000000000',
    'synthetic-real@example.invalid',
    true,
    false,
    'new'
  ),
  (
    '61000000-0000-4000-a000-000000000002',
    '61000000-0000-4000-8000-000000000002',
    'Synthetic Verification Test',
    '0000000000',
    'synthetic-test@example.invalid',
    true,
    false,
    'new'
  );

update public.diagnostic_contacts
set status = 'contacted'
where id in (
  '61000000-0000-4000-a000-000000000001',
  '61000000-0000-4000-a000-000000000002'
);

do $$
declare
  real_in_production integer;
  real_in_test integer;
  test_in_production integer;
  test_in_test integer;
begin
  select count(*) into real_in_production
  from public.diagnostic_production_events
  where session_id = '61000000-0000-4000-8000-000000000001';

  select count(*) into real_in_test
  from public.diagnostic_test_events
  where session_id = '61000000-0000-4000-8000-000000000001';

  select count(*) into test_in_production
  from public.diagnostic_production_events
  where session_id = '61000000-0000-4000-8000-000000000002';

  select count(*) into test_in_test
  from public.diagnostic_test_events
  where session_id = '61000000-0000-4000-8000-000000000002';

  if real_in_production <> 2 or real_in_test <> 0 then
    raise exception 'lead status changed real-session analytics classification';
  end if;

  if test_in_production <> 0 or test_in_test <> 1 then
    raise exception 'lead status changed test-session analytics classification';
  end if;
end;
$$;

insert into public.diagnostic_events (id, event_name, session_id, occurred_at)
values (
  '61000000-0000-4000-9000-000000000004',
  'verification_sessionless',
  null,
  '2026-01-01T00:03:00Z'
);

do $$
declare
  production_count integer;
  test_count integer;
begin
  select count(*) into production_count
  from public.diagnostic_production_events
  where id = '61000000-0000-4000-9000-000000000004';

  select count(*) into test_count
  from public.diagnostic_test_events
  where id = '61000000-0000-4000-9000-000000000004';

  if production_count <> 1 or test_count <> 0 then
    raise exception 'sessionless event was not production-only';
  end if;
end;
$$;

insert into public.diagnostic_events (id, event_name, session_id, occurred_at)
values (
  '61000000-0000-4000-9000-000000000005',
  'verification_orphan',
  '61000000-0000-4000-8000-000000000003',
  '2026-01-01T00:04:00Z'
);

do $$
declare
  production_count integer;
  test_count integer;
begin
  select count(*) into production_count
  from public.diagnostic_production_events
  where id = '61000000-0000-4000-9000-000000000005';

  select count(*) into test_count
  from public.diagnostic_test_events
  where id = '61000000-0000-4000-9000-000000000005';

  if production_count <> 1 or test_count <> 0 then
    raise exception 'orphan non-null session event was not production-only';
  end if;
end;
$$;

do $$
declare
  session_count integer;
  event_count integer;
  contact_count integer;
begin
  select count(*) into session_count
  from public.diagnostic_sessions
  where id in (
    '61000000-0000-4000-8000-000000000001',
    '61000000-0000-4000-8000-000000000002'
  );

  select count(*) into event_count
  from public.diagnostic_events
  where id in (
    '61000000-0000-4000-9000-000000000001',
    '61000000-0000-4000-9000-000000000002',
    '61000000-0000-4000-9000-000000000003',
    '61000000-0000-4000-9000-000000000004',
    '61000000-0000-4000-9000-000000000005'
  );

  select count(*) into contact_count
  from public.diagnostic_contacts
  where id in (
    '61000000-0000-4000-a000-000000000001',
    '61000000-0000-4000-a000-000000000002'
  );

  if session_count <> 2 then
    raise exception 'unexpected synthetic session fixture count';
  end if;

  if event_count <> 5 then
    raise exception 'unexpected synthetic event fixture count';
  end if;

  if contact_count <> 2 then
    raise exception 'unexpected synthetic contact fixture count';
  end if;
end;
$$;

rollback;
