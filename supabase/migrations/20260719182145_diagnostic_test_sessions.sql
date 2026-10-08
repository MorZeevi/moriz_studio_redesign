-- Keep synthetic/internal diagnostic sessions out of production analytics.
alter table public.diagnostic_sessions
  add column is_test boolean not null default false;
create view public.diagnostic_production_events
with (security_invoker = true, security_barrier = true) as
select e.id, e.event_name, e.session_id, e.occurred_at, e.attribution,
       e.question_id, e.answer, e.primary_solution, e.lead_tier,
       e.ai_fallback_reason, e.created_at
from public.diagnostic_events e
where not exists (
  select 1 from public.diagnostic_sessions s
  where s.id = e.session_id and s.is_test
);
create view public.diagnostic_test_events
with (security_invoker = true, security_barrier = true) as
select e.id, e.event_name, e.session_id, e.occurred_at, e.attribution,
       e.question_id, e.answer, e.primary_solution, e.lead_tier,
       e.ai_fallback_reason, e.created_at
from public.diagnostic_events e
where exists (
  select 1 from public.diagnostic_sessions s
  where s.id = e.session_id and s.is_test
);
revoke all on public.diagnostic_production_events from public, anon, authenticated;
revoke all on public.diagnostic_test_events from public, anon, authenticated;
grant select on public.diagnostic_production_events to service_role;
grant select on public.diagnostic_test_events to service_role;
