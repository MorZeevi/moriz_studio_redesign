import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FIXTURES } from './fixtures.ts';
import { calculateDiagnosticResult } from './scoring.ts';

const DIR = dirname(fileURLToPath(import.meta.url));

// Forbidden signals for React/Next/Supabase/browser/AI dependencies leaking into the core.
const FORBIDDEN_PATTERNS: RegExp[] = [
  /from ['"]react/i,
  /from ['"]next/i,
  /@supabase/i,
  /moonshot/i,
  /\bwindow\./,
  /\bdocument\./,
  /\bfetch\(/,
];

function coreSourceFiles(): string[] {
  return readdirSync(DIR).filter((name) => name.endsWith('.ts') && !name.endsWith('.test.ts'));
}

test('diagnostic-core has no React/Next/Supabase/browser/AI dependency', () => {
  for (const file of coreSourceFiles()) {
    const source = readFileSync(join(DIR, file), 'utf8');
    for (const pattern of FORBIDDEN_PATTERNS) {
      assert.equal(pattern.test(source), false, `${file} matches forbidden pattern ${pattern}`);
    }
  }
});

test('calculateDiagnosticResult resolves synchronously — AI is not needed', () => {
  const result = calculateDiagnosticResult(FIXTURES.trust_website);
  assert.equal(result instanceof Promise, false);
});
