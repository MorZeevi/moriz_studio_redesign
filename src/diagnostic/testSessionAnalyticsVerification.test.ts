import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const SCRIPT_PATH = new URL(
  '../../tools/diagnostic/verify-test-session-analytics.sql',
  import.meta.url
);

test('analytics verification SQL is rollback-only and covers every classification boundary', () => {
  assert.equal(
    existsSync(SCRIPT_PATH),
    true,
    'tools/diagnostic/verify-test-session-analytics.sql must exist'
  );

  const sql = readFileSync(SCRIPT_PATH, 'utf8');
  const normalized = sql.toLowerCase();

  assert.match(normalized, /^\s*begin\s*;/);
  assert.match(normalized, /rollback\s*;\s*$/);
  assert.doesNotMatch(normalized, /\bcommit\s*;/);

  assert.match(normalized, /insert\s+into\s+public\.diagnostic_sessions/);
  assert.match(normalized, /insert\s+into\s+public\.diagnostic_events/);
  assert.match(normalized, /insert\s+into\s+public\.diagnostic_contacts/);
  assert.match(normalized, /update\s+public\.diagnostic_sessions\s+set\s+is_test\s*=\s*true/);
  assert.match(normalized, /update\s+public\.diagnostic_sessions\s+set\s+is_test\s*=\s*false/);
  assert.match(normalized, /update\s+public\.diagnostic_contacts\s+set\s+status\s*=/);

  assert.match(normalized, /public\.diagnostic_production_events/);
  assert.match(normalized, /public\.diagnostic_test_events/);
  assert.match(normalized, /session_id\s*,\s*occurred_at\)[\s\S]*?null\s*,/);
  assert.match(normalized, /orphan/);

  const exceptionCount = normalized.match(/raise\s+exception/g)?.length ?? 0;
  assert.ok(exceptionCount >= 8, 'each required boundary must fail closed');

  const doBlockCount = normalized.match(/\bdo\s+\$\$/g)?.length ?? 0;
  const terminatedBlockCount = normalized.match(/\bend\s*;\s*\$\$\s*;/g)?.length ?? 0;
  assert.equal(terminatedBlockCount, doBlockCount, 'every DO block must terminate');

  assert.doesNotMatch(normalized, /raise\s+notice/);
  assert.doesNotMatch(normalized, /select\s+\*/);
});
