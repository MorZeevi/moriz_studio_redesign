-- P8a: per-lead evidence, internal brief, and client-facing mini audit.
-- File-only migration: not applied to any remote project by this change.

create table diagnostic_lead_briefs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references diagnostic_sessions (id) on delete cascade,
  evidence_md text,
  internal_brief_md text,
  client_audit_md text,
  status text not null default 'draft' check (status in ('draft', 'approved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table diagnostic_lead_briefs enable row level security;
-- Keep the grant explicit: a default-privileges miss would otherwise make the
-- server-only admin flow fail with 42501 after the migration is applied.
grant all on table diagnostic_lead_briefs to service_role;
