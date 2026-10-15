# Mor OS POC — implementation notes

Plan: [PLAN.md](PLAN.md). The Dot is external (ChatGPT + Supabase plugin); nothing in this repo calls a model.

- Migrations: `supabase/migrations/20261015120000_mor_os_schema.sql`, `20261015120100_mor_os_seed.sql`. Applied with `supabase db query --linked -f`, then `supabase migration repair --status applied <version>` for those two versions only. No `db push`.
- Checks: `npx supabase db query --linked -f tests/mor-os/constraints.sql`. Passing means it fails with `MOR_OS_TESTS_PASSED` (the block rolls back everything it wrote).
- Dashboard: `/admin/os` (Mor's session, RLS-scoped). Read-mostly; the only write is "mark done".
- Owner: Mor, auth user `300a2870-9861-4a41-9272-1d783b2636df`.

## For the Dot

- Always set `owner_user_id` explicitly. `project_id` must belong to the same owner (composite FK).
- Done = `status='done'` **and** `done_at`. Snooze = move `due_on` on an open item.
- "Today" and overdue: query the view `work_items_today` (Israel date). Never use `current_date` (UTC).
- Radar: query the view `work_radar` (active projects with no `status='open'` item).
- Items with `status = null` (notes, ideas, decisions) never count as open work.
- `Mor website` has no `target_date` yet; set it for the "what remains before launch" question.
