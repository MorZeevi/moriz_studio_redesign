-- Product-level provenance: which app/brand originated this session.
-- Default 'moriz' is deliberate on both sides of the shared table:
--   - it backfills every historical row as moriz (no historical data changes meaning), and
--   - it keeps the untouched Moriz_studio/moriz-diagnostic insert path writing 'moriz'
--     rows with zero code change there, exactly as the is_test default protects it today.
-- Eyal-protfolio's own insert path (src/diagnostic/db/mutations.ts) sets 'eyal' explicitly
-- and must never rely on this default for its own rows.
alter table public.diagnostic_sessions
  add column source text not null default 'moriz'
  check (source in ('moriz', 'eyal'));
