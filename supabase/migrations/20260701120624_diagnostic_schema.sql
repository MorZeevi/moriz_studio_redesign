-- P2: diagnostic_sessions + diagnostic_answers only.
-- diagnostic_contacts + human_review_queue are P4 (deferred).
-- File-only migration: not applied to any remote project by this change.

create table diagnostic_sessions (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  result_snapshot jsonb,
  lead_tier text,
  primary_solution text,
  scores jsonb,
  utm jsonb,
  created_at timestamptz not null default now()
);
create table diagnostic_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references diagnostic_sessions (id) on delete cascade,
  question_id text not null,
  answer_value jsonb not null,
  created_at timestamptz not null default now(),
  unique (session_id, question_id)
);
alter table diagnostic_sessions enable row level security;
alter table diagnostic_answers enable row level security;
