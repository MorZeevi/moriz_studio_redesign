import assert from "node:assert/strict";
import { test } from "node:test";

import { hasJsonContentType, isSameOriginRequest } from "./request-guards.ts";

function req(headers: Record<string, string>, url = "https://moriz.example/x") {
  return new Request(url, { method: "POST", headers });
}

test("accepts only an Origin exactly equal to the request origin", () => {
  assert.equal(
    isSameOriginRequest(req({ origin: "https://moriz.example" })),
    true,
  );
  assert.equal(
    isSameOriginRequest(
      req({ origin: "http://127.0.0.1:4398" }, "http://127.0.0.1:4398/a/b"),
    ),
    true,
  );
});

test("rejects missing, null, cross-site and near-miss origins", () => {
  for (const origin of [
    undefined,
    "null",
    "",
    "https://evil.example",
    "http://moriz.example",
    "https://moriz.example:8443",
    "https://moriz.example.evil.example",
    "https://sub.moriz.example",
    "https://moriz.example/",
    "not a url",
  ]) {
    assert.equal(
      isSameOriginRequest(req(origin === undefined ? {} : { origin })),
      false,
      String(origin),
    );
  }
});

test("does not trust forwarded host or protocol headers", () => {
  assert.equal(
    isSameOriginRequest(
      req({
        origin: "https://evil.example",
        "x-forwarded-host": "evil.example",
        "x-forwarded-proto": "https",
        forwarded: "host=evil.example;proto=https",
      }),
    ),
    false,
  );
});

test("accepts application/json with any parameters and case", () => {
  for (const value of [
    "application/json",
    "application/json; charset=utf-8",
    "Application/JSON",
    "  application/json  ;charset=UTF-8",
  ]) {
    assert.equal(hasJsonContentType(req({ "content-type": value })), true, value);
  }
});

test("rejects every other content type, including simple CSRF types", () => {
  for (const value of [
    "text/plain",
    "text/plain;charset=UTF-8",
    "application/x-www-form-urlencoded",
    "multipart/form-data; boundary=x",
    "application/jsonx",
    "application/json5",
    "application/ld+json",
    "text/json",
    "application/x-json",
    "",
  ]) {
    assert.equal(hasJsonContentType(req({ "content-type": value })), false, value);
  }
  assert.equal(hasJsonContentType(req({})), false);
});
