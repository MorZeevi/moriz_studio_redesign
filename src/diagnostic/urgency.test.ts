import { test } from 'node:test';
import assert from 'node:assert/strict';

import { deriveUrgency } from './urgency.ts';
import { URGENCY_AGING_MS, URGENCY_URGENT_MS } from './leadStatus.ts';

const NOW = new Date('2026-07-16T12:00:00.000Z').getTime();

function createdAgo(ms: number): string {
  return new Date(NOW - ms).toISOString();
}

test('deriveUrgency: contacted is always none, regardless of age', () => {
  assert.equal(deriveUrgency(createdAgo(URGENCY_URGENT_MS * 10), 'contacted', NOW), 'none');
  assert.equal(deriveUrgency(createdAgo(0), 'contacted', NOW), 'none');
});

test('deriveUrgency: closed is always none, regardless of age', () => {
  assert.equal(deriveUrgency(createdAgo(URGENCY_URGENT_MS * 10), 'closed', NOW), 'none');
  assert.equal(deriveUrgency(createdAgo(0), 'closed', NOW), 'none');
});

test('deriveUrgency: fresh at age 0 and just under the aging boundary', () => {
  assert.equal(deriveUrgency(createdAgo(0), 'new', NOW), 'fresh');
  assert.equal(deriveUrgency(createdAgo(URGENCY_AGING_MS - 1), 'new', NOW), 'fresh');
});

test('deriveUrgency: exactly at the aging boundary is still fresh (strict >)', () => {
  assert.equal(deriveUrgency(createdAgo(URGENCY_AGING_MS), 'new', NOW), 'fresh');
});

test('deriveUrgency: just past the aging boundary is aging', () => {
  assert.equal(deriveUrgency(createdAgo(URGENCY_AGING_MS + 1), 'new', NOW), 'aging');
});

test('deriveUrgency: just under the urgent boundary is still aging', () => {
  assert.equal(deriveUrgency(createdAgo(URGENCY_URGENT_MS - 1), 'in_review', NOW), 'aging');
});

test('deriveUrgency: exactly at the urgent boundary is still aging (strict >)', () => {
  assert.equal(deriveUrgency(createdAgo(URGENCY_URGENT_MS), 'in_review', NOW), 'aging');
});

test('deriveUrgency: just past the urgent boundary is urgent', () => {
  assert.equal(deriveUrgency(createdAgo(URGENCY_URGENT_MS + 1), 'in_review', NOW), 'urgent');
});

test('deriveUrgency: applies identically to both actionable statuses (new, in_review)', () => {
  const age = URGENCY_URGENT_MS + 1000;
  assert.equal(deriveUrgency(createdAgo(age), 'new', NOW), 'urgent');
  assert.equal(deriveUrgency(createdAgo(age), 'in_review', NOW), 'urgent');
});
