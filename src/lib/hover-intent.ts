/**
 * How long the pointer must rest on a card before its hover media is fetched.
 * A video request starts streaming the whole file, so a pointer sweeping across
 * the page must not trigger one per card.
 */
export const HOVER_INTENT_MS = 200;

type Timers = {
  set: (callback: () => void, ms: number) => unknown;
  clear: (handle: unknown) => void;
};

/**
 * Pointer hover that only counts after a dwell. `enter` starts the wait and
 * calls `onIntent` once it elapses; `leave` cancels a pending wait and calls
 * `onLeave` only if the intent had fired. With `immediate` (media already
 * requested) the dwell is skipped, so repeat hovers stay instant.
 */
export function createHoverIntent(
  {
    onIntent,
    onLeave,
    immediate = () => false,
  }: {
    onIntent: () => void;
    onLeave: () => void;
    immediate?: () => boolean;
  },
  delay = HOVER_INTENT_MS,
  timers: Timers = {
    set: (callback, ms) => setTimeout(callback, ms),
    clear: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
  },
) {
  let pending: unknown = null;
  let intended = false;
  function fire() {
    pending = null;
    intended = true;
    onIntent();
  }
  return {
    enter() {
      if (intended || pending !== null) return;
      if (delay <= 0 || immediate()) fire();
      else pending = timers.set(fire, delay);
    },
    leave() {
      if (pending !== null) {
        timers.clear(pending);
        pending = null;
      }
      if (intended) {
        intended = false;
        onLeave();
      }
    },
  };
}
