// Liquid CTA motion, framework-free. The CSS stretches the gap; this widens
// the goo blur while it moves (so the neck stays joined) and tracks the
// pressed state. React components call attachLiquidMotion; plain pages call
// enhanceLiquid() once, after markup like demo/index.html.

const SVG = "http://www.w3.org/2000/svg";
let filterCount = 0;

/**
 * @param {HTMLElement} control The .liquid element.
 * @param {SVGFEGaussianBlurElement} blur Its filter's blur primitive.
 * @returns {() => void} Cleanup.
 */
export function attachLiquidMotion(control, blur) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  let frame = 0;
  let until = 0;

  function update() {
    // A click may navigate away: a detached element's computed style is
    // empty (NaN), which SVG rejects.
    if (!control.isConnected) {
      frame = 0;
      return;
    }
    const cs = getComputedStyle(control);
    const gap = parseFloat(cs.getPropertyValue("--liquid-gap"));
    const open = parseFloat(cs.fontSize) * 1.35;
    const progress = Math.min(1, Math.max(0, (gap - 2) / (open - 2))) || 0;
    blur.setAttribute("stdDeviation", (3.5 + 3.5 * progress).toFixed(2));
    frame = performance.now() < until ? requestAnimationFrame(update) : 0;
  }

  function kick() {
    if (reduced.matches) return;
    until = performance.now() + 900;
    if (!frame) frame = requestAnimationFrame(update);
  }
  function press() {
    control.setAttribute("data-liquid-pressed", "");
    kick();
  }
  function release() {
    if (!control.hasAttribute("data-liquid-pressed")) return;
    control.removeAttribute("data-liquid-pressed");
    kick();
  }
  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    control.removeAttribute("data-liquid-pressed");
    blur.setAttribute("stdDeviation", "3.5");
  }

  const events = ["pointerenter", "pointerleave", "focus", "blur"];
  control.addEventListener("pointerdown", press);
  control.addEventListener("pointerleave", release);
  control.addEventListener("blur", release);
  window.addEventListener("pointerup", release);
  window.addEventListener("pointercancel", release);
  for (const event of events) control.addEventListener(event, kick);
  reduced.addEventListener("change", stop);
  return () => {
    stop();
    control.removeEventListener("pointerdown", press);
    control.removeEventListener("pointerleave", release);
    control.removeEventListener("blur", release);
    window.removeEventListener("pointerup", release);
    window.removeEventListener("pointercancel", release);
    for (const event of events) control.removeEventListener(event, kick);
    reduced.removeEventListener("change", stop);
  };
}

/**
 * Gives every `.liquid` element under `root` its own goo filter and motion.
 * Elements that already have --liquid-filter set are skipped.
 * @param {ParentNode} [root]
 */
export function enhanceLiquid(root = document) {
  for (const control of root.querySelectorAll(".liquid")) {
    if (!(control instanceof HTMLElement)) continue;
    if (control.style.getPropertyValue("--liquid-filter")) continue;
    const id = `liquid-filter-${++filterCount}`;
    const svg = document.createElementNS(SVG, "svg");
    svg.setAttribute("class", "liquid__filter");
    svg.setAttribute("width", "0");
    svg.setAttribute("height", "0");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    svg.innerHTML = filterMarkup(id, 3.5);
    control.before(svg);
    control.style.setProperty("--liquid-filter", `url("#${id}")`);
    const blur = svg.querySelector("feGaussianBlur");
    if (blur && !control.hasAttribute("data-liquid-open")) {
      attachLiquidMotion(control, blur);
    } else if (blur) {
      blur.setAttribute("stdDeviation", "7");
    }
  }
}

/** @param {string} id @param {number} blur */
function filterMarkup(id, blur) {
  return `<defs><filter id="${id}" x="-10%" y="-50%" width="120%" height="200%" color-interpolation-filters="sRGB"><feGaussianBlur in="SourceGraphic" stdDeviation="${blur}" result="blur"/><feColorMatrix in="blur" type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 22 -10" result="goo"/><feComposite in="SourceGraphic" in2="goo" operator="atop"/></filter></defs>`;
}
