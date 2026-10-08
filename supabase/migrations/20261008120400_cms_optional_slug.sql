-- A project can appear in portfolio lists without a standalone public page.
-- Existing slugs, their format constraint, uniqueness, and all rows are preserved.
-- PostgreSQL's unique constraint permits multiple NULL (absent) slugs.
alter table public.projects alter column slug drop not null;
