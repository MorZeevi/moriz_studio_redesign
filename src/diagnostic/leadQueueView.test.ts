import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildAdminDetailHref,
  buildAdminQueueHref,
  buildAdminSortHref,
  resolveLeadQueueView,
} from './leadQueueView.ts';

const navigation = {
  secret: 'secret value',
  view: 'test' as const,
  sort: 'grade' as const,
  dir: 'asc' as const,
};

test('missing and invalid queue views fail safe to the real-lead queue', () => {
  assert.equal(resolveLeadQueueView(undefined), 'real');
  assert.equal(resolveLeadQueueView(''), 'real');
  assert.equal(resolveLeadQueueView('invalid'), 'real');
  assert.equal(resolveLeadQueueView('real'), 'real');
});

test('only view=test selects the test-data queue', () => {
  assert.equal(resolveLeadQueueView('test'), 'test');
});

test('queue navigation never carries a source: ownership is not a request parameter', () => {
  assert.doesNotMatch(buildAdminQueueHref(navigation), /source/);
  assert.doesNotMatch(buildAdminSortHref(navigation, 'status'), /source/);
  assert.doesNotMatch(buildAdminDetailHref('11111111-1111-4111-8111-111111111111', navigation), /source/);
  // A smuggled field is not serialized either.
  const smuggled = { ...navigation, source: 'eyal' } as typeof navigation;
  assert.doesNotMatch(buildAdminQueueHref(smuggled), /source|eyal/);
});

test('queue sorting preserves the secret, validated view, source, sort, and direction', () => {
  assert.equal(
    buildAdminSortHref(navigation, 'status'),
    '/admin?secret=secret+value&view=test&sort=status&dir=desc',
  );
  assert.equal(
    buildAdminSortHref({ ...navigation, sort: 'grade', dir: 'desc' }, 'grade'),
    '/admin?secret=secret+value&view=test&sort=grade&dir=asc',
  );
});

test('detail and back navigation preserve the full validated queue context', () => {
  const detailHref = buildAdminDetailHref('11111111-1111-4111-8111-111111111111', navigation);
  assert.equal(
    detailHref,
    '/admin/leads/11111111-1111-4111-8111-111111111111?secret=secret+value&view=test&sort=grade&dir=asc',
  );
  assert.equal(
    buildAdminQueueHref(navigation),
    '/admin?secret=secret+value&view=test&sort=grade&dir=asc',
  );
});

test('queue links omit an absent sort while retaining the validated direction and view', () => {
  assert.equal(
    buildAdminQueueHref({ secret: 's', view: 'real', dir: 'desc' }),
    '/admin?secret=s&view=real&dir=desc',
  );
});
