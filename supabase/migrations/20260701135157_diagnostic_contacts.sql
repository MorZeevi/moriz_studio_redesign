-- P4a: diagnostic_contacts (contact + human-review status lane).
-- File-only migration: not applied to any remote project by this change.

create table diagnostic_contacts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references diagnostic_sessions (id) on delete cascade,
  full_name text not null,
  phone text not null,
  email text not null,
  business_name text,
  link text,
  review_request text,
  review_consent boolean not null,
  marketing_consent boolean not null default false,
  status text not null default 'new' check (status in ('new','in_review','contacted','closed')),
  created_at timestamptz not null default now(),
  unique (session_id)
);
alter table diagnostic_contacts enable row level security;
