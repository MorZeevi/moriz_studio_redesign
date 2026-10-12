import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const migrationUrl = new URL('../../supabase/migrations/20260719182145_diagnostic_test_sessions.sql', import.meta.url);

test('test-session migration isolates production and test analytics at the session boundary', async () => {
  const sql = await readFile(migrationUrl, 'utf8');

  assert.match(sql, /alter\s+table\s+public\.diagnostic_sessions\s+add\s+column\s+is_test\s+boolean\s+not\s+null\s+default\s+false\s*;/i);

  for (const viewName of ['diagnostic_production_events', 'diagnostic_test_events']) {
    assert.match(
      sql,
      new RegExp(`create\\s+view\\s+public\\.${viewName}\\s+with\\s*\\(\\s*security_invoker\\s*=\\s*true\\s*,\\s*security_barrier\\s*=\\s*true\\s*\\)`, 'i'),
    );
    assert.match(sql, new RegExp(`revoke\\s+all\\s+on\\s+(?:table\\s+)?public\\.${viewName}\\s+from\\s+public\\s*,\\s*anon\\s*,\\s*authenticated\\s*;`, 'i'));
    assert.match(sql, new RegExp(`grant\\s+select\\s+on\\s+(?:table\\s+)?public\\.${viewName}\\s+to\\s+service_role\\s*;`, 'i'));
  }

  assert.match(sql, /from\s+public\.diagnostic_events\s+e\s+where\s+not\s+exists\s*\(\s*select\s+1\s+from\s+public\.diagnostic_sessions\s+s\s+where\s+s\.id\s*=\s*e\.session_id\s+and\s+s\.is_test\s*\)/i);
  assert.match(sql, /from\s+public\.diagnostic_events\s+e\s+where\s+exists\s*\(\s*select\s+1\s+from\s+public\.diagnostic_sessions\s+s\s+where\s+s\.id\s*=\s*e\.session_id\s+and\s+s\.is_test\s*\)/i);

  const eventColumns = [
    'id', 'event_name', 'session_id', 'occurred_at', 'attribution', 'question_id',
    'answer', 'primary_solution', 'lead_tier', 'ai_fallback_reason', 'created_at',
  ];
  for (const column of eventColumns) {
    assert.match(sql, new RegExp(`select[\\s\\S]*?\\be\\.${column}\\b`, 'i'));
  }

  assert.doesNotMatch(sql, /alter\s+table\s+public\.diagnostic_contacts[\s\S]*?status[\s\S]*?check/i);
  assert.doesNotMatch(sql, /alter\s+table\s+public\.diagnostic_events\s+add\s+column\s+is_test/i);
});
