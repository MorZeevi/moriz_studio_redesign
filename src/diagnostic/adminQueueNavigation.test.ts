import assert from 'node:assert/strict';
import { test } from 'node:test';

import { shouldRefreshAdminQueue } from './adminQueueNavigation.ts';

test('refreshes when navigation returns from a lead detail page to the admin queue', () => {
  assert.equal(shouldRefreshAdminQueue('/admin/leads/session-id', '/admin'), true);
});

test('does not refresh on initial load or unrelated route transitions', () => {
  assert.equal(shouldRefreshAdminQueue('/admin', '/admin'), false);
  assert.equal(shouldRefreshAdminQueue('/admin/leads/session-id', '/admin/leads/other-id'), false);
  assert.equal(shouldRefreshAdminQueue('/digital-audit', '/admin'), false);
});
