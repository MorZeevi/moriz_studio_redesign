import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildAdminDetailHref,
  buildAdminQueueHref,
  buildAdminSortHref,
  resolveLeadQueueSource,
  resolveLeadQueueView,
} from './leadQueueView.ts';

const navigation = {
  secret: 'secret value',
  view: 'test' as const,
  source: 'eyal' as const,
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

test('missing and invalid source values fail safe to the caller-supplied default', () => {
  assert.equal(resolveLeadQueueSource(undefined, 'eyal'), 'eyal');
  assert.equal(resolveLeadQueueSource('', 'eyal'), 'eyal');
  assert.equal(resolveLeadQueueSource('nonsense', 'eyal'), 'eyal');
  assert.equal(resolveLeadQueueSource(undefined, 'moriz'), 'moriz');
});

test('an explicit, valid source always wins regardless of the default', () => {
  assert.equal(resolveLeadQueueSource('moriz', 'eyal'), 'moriz');
  assert.equal(resolveLeadQueueSource('all', 'eyal'), 'all');
  assert.equal(resolveLeadQueueSource('eyal', 'moriz'), 'eyal');
});

test('queue sorting preserves the secret, validated view, source, sort, and direction', () => {
  assert.equal(
    buildAdminSortHref(navigation, 'status'),
    '/admin?secret=secret+value&view=test&source=eyal&sort=status&dir=desc',
  );
  assert.equal(
    buildAdminSortHref({ ...navigation, sort: 'grade', dir: 'desc' }, 'grade'),
    '/admin?secret=secret+value&view=test&source=eyal&sort=grade&dir=asc',
  );
});

test('detail and back navigation preserve the full validated queue context', () => {
  const detailHref = buildAdminDetailHref('11111111-1111-4111-8111-111111111111', navigation);
  assert.equal(
    detailHref,
    '/admin/leads/11111111-1111-4111-8111-111111111111?secret=secret+value&view=test&source=eyal&sort=grade&dir=asc',
  );
  assert.equal(
    buildAdminQueueHref(navigation),
    '/admin?secret=secret+value&view=test&source=eyal&sort=grade&dir=asc',
  );
});

test('queue links omit an absent sort while retaining the validated direction, view, and source', () => {
  assert.equal(
    buildAdminQueueHref({ secret: 's', view: 'real', source: 'all', dir: 'desc' }),
    '/admin?secret=s&view=real&source=all&dir=desc',
  );
});
