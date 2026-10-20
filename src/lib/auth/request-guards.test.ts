import assert from "node:assert/strict";
import { test } from "node:test";

import {
  checkAdminRequest,
  hasJsonContentType,
  isSameOriginRequest,
} from "./request-guards.ts";

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

test("checkAdminRequest looks up the owner only after the CSRF checks pass", async () => {
  let lookups = 0;
  const owner = async () => {
    lookups += 1;
    return true;
  };
  const json = { origin: "https://moriz.example", "content-type": "application/json" };

  assert.equal(await checkAdminRequest(req(json), { requireJson: true }, owner), true);
  assert.equal(lookups, 1);

  const hostile: Record<string, string>[] = [
    { ...json, origin: "https://evil.example" },
    { "content-type": "application/json" },
    { ...json, origin: "null" },
    { ...json, "content-type": "text/plain" },
    { origin: "https://moriz.example" },
  ];
  for (const headers of hostile) {
    lookups = 0;
    assert.equal(await checkAdminRequest(req(headers), { requireJson: true }, owner), false);
    assert.equal(lookups, 0);
  }
});

test("checkAdminRequest honours the owner result and optional JSON requirement", async () => {
  const sameOrigin = { origin: "https://moriz.example" };
  assert.equal(await checkAdminRequest(req(sameOrigin), {}, async () => true), true);
  assert.equal(await checkAdminRequest(req(sameOrigin), {}, async () => false), false);
  assert.equal(
    await checkAdminRequest(req(sameOrigin), { requireJson: true }, async () => true),
    false,
  );
});

test("compares Origin to the Host the browser addressed, not to a normalized request.url", () => {
  // Next normalizes request.url (127.0.0.1 becomes localhost); Host stays real.
  const normalized = "http://localhost:4398/digital-audit/api/admin/lead-status";
  assert.equal(
    isSameOriginRequest(
      req({ origin: "http://127.0.0.1:4398", host: "127.0.0.1:4398" }, normalized),
    ),
    true,
  );
  const hostile: Record<string, string>[] = [
    // A cross-site page: its Origin is its own, whatever Host says.
    { origin: "https://evil.example", host: "127.0.0.1:4398" },
    // Right scheme and host, wrong port.
    { origin: "http://127.0.0.1:3000", host: "127.0.0.1:4398" },
    // Wrong scheme for the request.
    { origin: "https://127.0.0.1:4398", host: "127.0.0.1:4398" },
    // Forwarded host headers never help.
    {
      origin: "https://evil.example",
      host: "127.0.0.1:4398",
      "x-forwarded-host": "evil.example",
    },
  ];
  for (const headers of hostile)
    assert.equal(isSameOriginRequest(req(headers, normalized)), false, JSON.stringify(headers));
});
