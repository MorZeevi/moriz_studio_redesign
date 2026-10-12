import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { getClassificationSuccessMessageHe } from './testClassificationView.ts';

test('classification success copy reflects the canonical server classification', () => {
  assert.equal(getClassificationSuccessMessageHe(true), 'המסע סווג כנתוני בדיקה.');
  assert.equal(getClassificationSuccessMessageHe(false), 'המסע שוחזר כנתוני אמת.');
});

test('classification control announces canonical success politely', () => {
  const source = readFileSync(
    new URL('../app/digital-audit/admin/leads/[sessionId]/TestClassificationControl.tsx', import.meta.url),
    'utf8',
  );

  assert.match(source, /getClassificationSuccessMessageHe\(canonicalIsTest\)/);
  assert.match(source, /role="status"/);
  assert.match(source, /aria-live="polite"/);
});
