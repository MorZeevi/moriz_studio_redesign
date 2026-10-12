import assert from 'node:assert/strict';
import { test } from 'node:test';

import { isDiagnosticSource, isLeadSourceFilter, SOURCE_LABELS_HE } from './diagnosticSource.ts';

test('isDiagnosticSource accepts only moriz and eyal', () => {
  assert.equal(isDiagnosticSource('moriz'), true);
  assert.equal(isDiagnosticSource('eyal'), true);
  assert.equal(isDiagnosticSource('all'), false);
  assert.equal(isDiagnosticSource('Eyal'), false);
  assert.equal(isDiagnosticSource(undefined), false);
  assert.equal(isDiagnosticSource(42), false);
});

test('isLeadSourceFilter additionally accepts all', () => {
  assert.equal(isLeadSourceFilter('all'), true);
  assert.equal(isLeadSourceFilter('moriz'), true);
  assert.equal(isLeadSourceFilter('eyal'), true);
  assert.equal(isLeadSourceFilter(''), false);
  assert.equal(isLeadSourceFilter(null), false);
});

test('every DiagnosticSource has a Hebrew label', () => {
  assert.equal(SOURCE_LABELS_HE.moriz, 'מוריז');
  assert.equal(SOURCE_LABELS_HE.eyal, 'אייל');
});
