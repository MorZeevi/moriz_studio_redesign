import assert from "node:assert/strict";
import { test } from "node:test";
import { formatStatValue, parseStatValue } from "./infographic-values.ts";

test("published numbers parse, and units do not", () => {
  assert.deepEqual(parseStatValue("85"), {
    numeric: 85,
    decimals: 0,
    grouped: false,
  });
  assert.deepEqual(parseStatValue("1,200.5"), {
    numeric: 1200.5,
    decimals: 1,
    grouped: true,
  });
  assert.equal(parseStatValue("85%"), null);
  assert.equal(parseStatValue("חמישה"), null);
  assert.equal(parseStatValue(""), null);
});

test("count-up formatting keeps decimals and grouping", () => {
  assert.equal(formatStatValue(31.4, { decimals: 0, grouped: false }), "31");
  assert.equal(formatStatValue(1200.5, { decimals: 1, grouped: true }), "1,200.5");
  assert.equal(formatStatValue(0, { decimals: 0, grouped: false }), "0");
});
