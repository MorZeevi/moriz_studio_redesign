import assert from "node:assert/strict";
import { test } from "node:test";
import { createHoverIntent, HOVER_INTENT_MS } from "./hover-intent.ts";

/** A manual clock so the dwell is exercised without real time. */
function clock() {
  let now = 0;
  let next = 1;
  const waiting = new Map<number, { at: number; run: () => void }>();
  return {
    timers: {
      set: (run: () => void, ms: number) => {
        const id = next++;
        waiting.set(id, { at: now + ms, run });
        return id;
      },
      clear: (handle: unknown) => {
        waiting.delete(handle as number);
      },
    },
    tick(ms: number) {
      now += ms;
      for (const [id, timer] of [...waiting])
        if (timer.at <= now) {
          waiting.delete(id);
          timer.run();
        }
    },
    get pending() {
      return waiting.size;
    },
  };
}

function setup(immediate = false) {
  const log: string[] = [];
  const time = clock();
  const intent = createHoverIntent(
    {
      onIntent: () => log.push("intent"),
      onLeave: () => log.push("leave"),
      immediate: () => immediate,
    },
    HOVER_INTENT_MS,
    time.timers,
  );
  return { log, time, intent };
}

test("a pointer sweeping through a card requests nothing", () => {
  const { log, time, intent } = setup();
  intent.enter();
  time.tick(HOVER_INTENT_MS - 1);
  intent.leave();
  time.tick(1000);
  assert.deepEqual(log, []);
  assert.equal(time.pending, 0);
});

test("a pointer that rests on the card requests once after the dwell", () => {
  const { log, time, intent } = setup();
  intent.enter();
  intent.enter(); // pointer jitter must not restart or duplicate the wait
  time.tick(HOVER_INTENT_MS);
  assert.deepEqual(log, ["intent"]);
  intent.leave();
  assert.deepEqual(log, ["intent", "leave"]);
});

test("a second visit after the first request skips the dwell", () => {
  const { log, intent } = setup(true);
  intent.enter();
  assert.deepEqual(log, ["intent"]);
  intent.leave();
  assert.deepEqual(log, ["intent", "leave"]);
});

test("leaving and re-entering restarts the dwell", () => {
  const { log, time, intent } = setup();
  intent.enter();
  time.tick(200);
  intent.leave();
  intent.enter();
  time.tick(200);
  assert.deepEqual(log, []);
  time.tick(100);
  assert.deepEqual(log, ["intent"]);
});
