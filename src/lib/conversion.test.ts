import { test } from "node:test";
import assert from "node:assert/strict";
import { canMeasure, trackConversion } from "./conversion.ts";

test("measurement excludes previews/admin and queues only public contact dimensions", () => {
  const previous = process.env.NODE_ENV;
  const location = {
    hostname: "moriz.studio",
    pathname: "/he/projects/practicalai",
    search: "?private=hidden",
  };
  const target = {
    location,
    dataLayer: [] as unknown[],
    clarity: (..._args: unknown[]) => {},
  };
  Object.defineProperty(globalThis, "window", {
    value: target,
    configurable: true,
  });
  Object.defineProperty(globalThis, "location", {
    value: location,
    configurable: true,
  });
  try {
    Reflect.set(process.env, "NODE_ENV", "production");
    assert.equal(canMeasure(), true);
    trackConversion("contact_click", {
      channel: "whatsapp",
      placement: "project-end",
    });
    const command = Array.from(target.dataLayer[0] as ArrayLike<unknown>);
    assert.deepEqual(command, [
      "event",
      "contact_click",
      {
        page_path: location.pathname,
        channel: "whatsapp",
        placement: "project-end",
      },
    ]);
    assert.equal(JSON.stringify(command).includes("private"), false);
    for (const pathname of [
      "/admin",
      "/admin/projects",
      "/digital-audit/admin",
    ]) {
      location.pathname = pathname;
      trackConversion("contact_click");
      assert.equal(canMeasure(), false);
    }
    location.pathname = "/he";
    location.hostname = "preview.vercel.app";
    assert.equal(canMeasure(), false);
    trackConversion("contact_form_success");
    assert.equal(target.dataLayer.length, 1);
  } finally {
    if (previous === undefined) Reflect.deleteProperty(process.env, "NODE_ENV");
    else Reflect.set(process.env, "NODE_ENV", previous);
    Reflect.deleteProperty(globalThis, "window");
    Reflect.deleteProperty(globalThis, "location");
  }
});
