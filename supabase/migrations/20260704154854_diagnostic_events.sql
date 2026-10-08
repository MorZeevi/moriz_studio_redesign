-- P6c: diagnostic_events (first-party funnel analytics sink for P6a events).
-- No FK on session_id: landing_view (and other early events) can fire before
-- a session row exists, so a NOT NULL FK would reject legitimate early events.
-- File-only migration: not applied to any remote project by this change.

create table diagnostic_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  session_id uuid,
  occurred_at timestamptz not null,
  attribution jsonb,
  question_id text,
  answer jsonb,
  primary_solution text,
  lead_tier text,
  ai_fallback_reason text,
  created_at timestamptz not null default now()
);
alter table diagnostic_events enable row level security;
-- Explicit grant even though 20260701185849's default-privileges statement
-- should already cover future diagnostic_ tables: a silent grant miss here
-- would fail closed (analytics errors are swallowed by design, so a missing
-- grant could go unnoticed for a long time).
grant all on table diagnostic_events to service_role;
