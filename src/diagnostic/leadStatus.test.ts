import { test } from 'node:test';
import assert from 'node:assert/strict';

import { isLeadStatus, STATUS_LABELS_HE, URGENCY_LABELS_HE, URGENCY_AGING_MS, URGENCY_URGENT_MS } from './leadStatus.ts';

test('isLeadStatus accepts exactly the four known statuses', () => {
  for (const status of ['new', 'in_review', 'contacted', 'closed']) {
    assert.equal(isLeadStatus(status), true);
  }
});

test('isLeadStatus rejects unknown strings and non-strings', () => {
  for (const value of ['done', '', 'New', 42, null, undefined, {}, ['new']]) {
    assert.equal(isLeadStatus(value), false);
  }
});

test('STATUS_LABELS_HE has a Hebrew label for every status', () => {
  for (const status of ['new', 'in_review', 'contacted', 'closed'] as const) {
    assert.equal(typeof STATUS_LABELS_HE[status], 'string');
    assert.ok(STATUS_LABELS_HE[status].length > 0);
  }
});

test('URGENCY_LABELS_HE covers only the two attention-worthy levels', () => {
  assert.deepEqual(Object.keys(URGENCY_LABELS_HE).sort(), ['aging', 'urgent']);
});

test('urgency thresholds are ordered and non-zero', () => {
  assert.ok(URGENCY_AGING_MS > 0);
  assert.ok(URGENCY_URGENT_MS > URGENCY_AGING_MS);
});
