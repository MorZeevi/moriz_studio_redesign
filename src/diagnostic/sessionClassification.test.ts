import { test } from 'node:test';
import assert from 'node:assert/strict';

import { isSessionClassificationAction } from './sessionClassification.ts';

test('isSessionClassificationAction accepts only the closed classification intent enum', () => {
  assert.equal(isSessionClassificationAction('mark_test'), true);
  assert.equal(isSessionClassificationAction('restore_real'), true);

  for (const value of [undefined, null, true, 'test', 'restore', '', 1]) {
    assert.equal(isSessionClassificationAction(value), false);
  }
});
