import { test } from 'node:test';
import assert from 'node:assert/strict';

import { parsePersonalizedCopy } from './validateOutput.ts';

function validPayload(): Record<string, unknown> {
  return {
    insightHe: 'Insight text tied to the specific business.',
    contextFitHe: 'Why this fits text that fits within the cap.',
  };
}

function withoutKey(key: string): Record<string, unknown> {
  const payload = validPayload();
  delete payload[key];
  return payload;
}

function parse(payload: unknown) {
  return parsePersonalizedCopy(JSON.stringify(payload));
}

function assertRejected(payload: unknown, expectedError: string): void {
  const result = parse(payload);
  assert.equal(result.valid, false);
  if (result.valid) return;
  assert.equal(result.error, expectedError);
}

function assertRejectedRaw(raw: string, expectedError: string): void {
  const result = parsePersonalizedCopy(raw);
  assert.equal(result.valid, false);
  if (result.valid) return;
  assert.equal(result.error, expectedError);
}

// ── Happy path ─────────────────────────────────────────────────────────────

test('accepts a well-formed payload', () => {
  const result = parse(validPayload());
  assert.equal(result.valid, true);
  if (!result.valid) return;
  assert.deepEqual(result.value, validPayload());
});

test('trims surrounding whitespace on string fields', () => {
  const padded = { ...validPayload(), insightHe: '  Insight text  ' };
  const result = parse(padded);
  assert.equal(result.valid, true);
  if (!result.valid) return;
  assert.equal(result.value.insightHe, 'Insight text');
});

test('strips a plain code fence before parsing', () => {
  const raw = '```\n' + JSON.stringify(validPayload()) + '\n```';
  assert.equal(parsePersonalizedCopy(raw).valid, true);
});

test('strips a json-tagged code fence before parsing', () => {
  const raw = '```json\n' + JSON.stringify(validPayload()) + '\n```';
  assert.equal(parsePersonalizedCopy(raw).valid, true);
});

// ── Malformed payload ────────────────────────────────────────────────────────

test('rejects unparsable JSON', () => {
  assertRejectedRaw('not json at all {', 'invalid_json');
});

test('rejects a JSON payload that is not an object', () => {
  assertRejectedRaw('null', 'payload_not_object');
  assertRejectedRaw('42', 'payload_not_object');
  assertRejectedRaw('"a string"', 'payload_not_object');
  assertRejectedRaw(JSON.stringify([validPayload()]), 'payload_not_object');
});

// ── Key set ──────────────────────────────────────────────────────────────────

test('rejects a payload missing a required key', () => {
  assertRejected(withoutKey('insightHe'), 'unexpected_keys');
});

test('rejects a payload with an extra unknown key', () => {
  assertRejected({ ...validPayload(), extraField: 'not allowed' }, 'unexpected_keys');
});

test('rejects a payload where a required key is swapped for an unknown key of the same count', () => {
  const payload = withoutKey('insightHe');
  payload.headlineHe = 'Headline text';
  assertRejected(payload, 'unexpected_keys');
});

// ── Per-field caps ───────────────────────────────────────────────────────────

test('rejects insightHe over 400 chars and accepts exactly 400', () => {
  assertRejected({ ...validPayload(), insightHe: 'a'.repeat(401) }, 'invalid_insightHe');
  assert.equal(parse({ ...validPayload(), insightHe: 'a'.repeat(400) }).valid, true);
});

test('rejects a non-string, empty, or whitespace-only insightHe', () => {
  assertRejected({ ...validPayload(), insightHe: 42 }, 'invalid_insightHe');
  assertRejected({ ...validPayload(), insightHe: '' }, 'invalid_insightHe');
  assertRejected({ ...validPayload(), insightHe: '   ' }, 'invalid_insightHe');
});

test('rejects contextFitHe over 500 chars', () => {
  assertRejected({ ...validPayload(), contextFitHe: 'a'.repeat(501) }, 'invalid_contextFitHe');
});
