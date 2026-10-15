# Mor OS POC — Plan

Status: approved for implementation, 2026-10-15. Do not redesign or expand. Any genuine blocker goes back to Eyal before you build around it.

Home: this repo (`moriz_studio_redesig`) is the canonical home of the Mor OS POC. The dashboard, the migrations and this plan live here. Do not create a separate repo.

## What

A thin loop: **Mor → Dot → Supabase → Dashboard.**

Mor captures, updates and asks about her work by talking to the Dot. The Dot reads and writes structured rows in Supabase. A simple dashboard shows the same rows.

## Why

To prove one thing: **Mor can manage her real ongoing work through the Dot, and the dashboard reflects the same state.**

ShardOS showed that capture and direct model interaction worked, and that routing, approval queues, taxonomies and process layers created friction. So:

- The model handles semantics: interpreting, categorizing, prioritizing, phrasing.
- The database holds durable facts and relationships, and nothing else.

This is not the full Personal/Business OS. Usage earns any expansion.

## POC scope

Mor's current real work, seeded as the first projects:

| Project | State | What the POC must support |
|---|---|---|
| Mor website | active | finishing/polish, launch tasks, launch marketing thinking |
| Beit Chabad | active client | real tasks, closing the bank-of-hours arrangement |
| AI Praktí | ongoing, little/no work | stays on the radar, with reminders to check in |

## Data model

Two tables in the shared Supabase project (`eqyjdwloiffotezhedxh`), schema `public`.

### `work_projects`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `owner_user_id` | uuid, required | FK → `auth.users`, `on delete restrict` |
| `title` | text, required | |
| `client_name` | text, nullable | null = internal work (e.g. Mor website) |
| `status` | text, required | check: `active` / `paused` / `done`. Text + check, not a Postgres enum |
| `target_date` | date, nullable | e.g. website launch |
| `context` | text, nullable | free background for the Dot |
| `data` | jsonb | default `{}` |
| `created_at`, `updated_at` | timestamptz | `updated_at` maintained by trigger |

Projects end with `status = 'done'`. They are not deleted.

### `work_items`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `owner_user_id` | uuid, required | FK → `auth.users`, `on delete restrict` |
| `project_id` | uuid, nullable | FK → `work_projects`, `on delete restrict`. Null = general capture |
| `kind` | text, required | free text (task, followup, note, idea, decision, …). No taxonomy |
| `title` | text, required | |
| `body` | text, nullable | |
| `status` | text, nullable | check: `open` / `done` / null. Independent of `kind` |
| `due_on` | date, nullable | a date, not a timestamp |
| `done_at` | timestamptz, nullable | |
| `data` | jsonb | default `{}` |
| `created_at`, `updated_at` | timestamptz | `updated_at` maintained by trigger |

**Constraint:** `status = 'done'` if and only if `done_at` is not null. Notes, ideas and decisions usually have `status = null`.

### Queries the model must answer

| Question | Query |
|---|---|
| What do I need to do today? | open items with `due_on <= today`, so overdue items are included |
| What's open on Beit Chabad? | open items on that project |
| What remains before the website launch? | open items on that project, plus its `target_date` |
| AI Praktí has no next action, remind me later | the Dot creates an open item on that project with a future `due_on`. Snoozing moves `due_on` |
| **Radar** | `active` projects with no open item. Expose this as a view or a named query |

"Today" is computed in Israel time (`Asia/Jerusalem`), never from the database's UTC date.

## Product rule for the Dot

**Anything the dashboard must reason about is stored in columns, not only in prose.**

- If the Dot writes "follow up Thursday" in `body`, it also sets `due_on`.
- Marking an item done sets both `status = 'done'` and `done_at`.
- Every row the Dot writes sets `owner_user_id` explicitly. There is no silent default.

## Existing-system constraints

This Supabase project is shared with the Moriz Diagnostic, the Eyal Diagnostic and the Projects CMS. Follow the root `AGENTS.md`. Its rules apply to Mor OS code too, including the Next.js version note.

1. **RLS on both tables from the first migration.**
   - The project's anon key ships to browsers.
   - Grant no access to `anon`.
   - Allowed access paths:
     - the owner as `authenticated`, scoped to `owner_user_id = auth.uid()`
     - `service_role` (the Dot, and admin)
2. **Migration ownership.**
   - Mor OS migrations live in this repo's `supabase/migrations/`.
   - Name them so they are recognizable as Mor OS, e.g. `<timestamp>_mor_os_<description>.sql`.
   - This repo owns all Mor OS schema changes. Other repos sharing this Supabase project must not create or modify Mor OS migrations.
3. **Migration ledger.** The folder and the remote ledger are both mixed (diagnostic, CMS, other apps).
   - Never run `supabase db push`, repair, or revert any other app's versions.
   - Apply Mor OS migrations through an explicitly approved path.
   - Then record only the Mor OS versions as applied (`supabase migration repair --status applied <mor_os_version>`). See `docs/cms.md`.
4. **Do not touch** `diagnostic_*`, `projects`, `categories`, `project_categories`, `ai_knowledge` or `private.cms_*`.
   - The POC has no FKs to them and no reads from them.
   - Those contracts stay unchanged unless an explicit future change brings its own coordination.
5. **`updated_at` trigger.** Either:
   - reuse `private.set_updated_at()`, deliberately, knowing it comes from the CMS migration, or
   - ship a Mor OS trigger function.

   Pick one and note it in the migration.
6. **Identity.** `owner_user_id` is Mor's existing auth user in this project. Verify the id before seeding.
7. **Privacy.**
   - `owner_user_id` is for ownership and UI scoping, not a privacy boundary.
   - Service-role holders can read everything. That's acceptable for work data only.
   - No personal, wellbeing or financial data goes in until privacy is revisited.

## Out of scope

Do not add any of these:

- contacts
- lead integration or migration
- finance, subscriptions
- goals
- visibility/sharing
- priority, tags, subtasks, recurring tasks, milestones
- hours tracking
- activity log
- embeddings
- agent tables, routing, approval queues, workflow infrastructure

The dashboard is read-mostly. At most it can mark an item done. Capture and edits go through the Dot.

## Success criteria

Implementation is done when all of these hold:

**Schema**
- [ ] Both tables exist with the columns, checks and FKs above.
- [ ] RLS is enabled with no anon access, verified with the anon key.

**Data**
- [ ] The three projects are seeded under Mor's user.

**Constraints reject**
- [ ] a row without `owner_user_id`
- [ ] `status = 'done'` without `done_at`, and `done_at` without `status = 'done'`
- [ ] a bad project `status`
- [ ] deleting a project that still has items

**Queries**
- [ ] The four questions and the radar query return correct results against real data. "Today" is checked across Israel midnight.

**Dot**
- [ ] It can capture a new item, update one, mark one done, snooze one, and answer the four questions conversationally.
- [ ] Every write it makes lands in columns per the product rule.

**Dashboard**
- [ ] It shows today, open items per project, and the radar, and reflects the Dot's writes without manual sync.

**Shared project**
- [ ] No existing diagnostic or CMS table, policy or migration version has changed.

**POC outcome (separate from implementation):**
- [ ] Mor uses it for her real work on these three projects, and the state stays trustworthy.
