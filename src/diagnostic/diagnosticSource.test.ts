import assert from 'node:assert/strict';
import { test } from 'node:test';

import { isDiagnosticSource, OWN_SOURCE, SOURCE_LABELS_HE } from './diagnosticSource.ts';

test('isDiagnosticSource accepts only moriz and eyal', () => {
  assert.equal(isDiagnosticSource('moriz'), true);
  assert.equal(isDiagnosticSource('eyal'), true);
  assert.equal(isDiagnosticSource('all'), false);
  assert.equal(isDiagnosticSource('Eyal'), false);
  assert.equal(isDiagnosticSource(undefined), false);
  assert.equal(isDiagnosticSource(42), false);
});

test('this deployment owns moriz sessions, and ownership is a valid source', () => {
  assert.equal(OWN_SOURCE, 'moriz');
  assert.equal(isDiagnosticSource(OWN_SOURCE), true);
});

test('every DiagnosticSource has a Hebrew label', () => {
  assert.equal(SOURCE_LABELS_HE.moriz, 'מוריז');
  assert.equal(SOURCE_LABELS_HE.eyal, 'אייל');
});
