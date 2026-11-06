import assert from "node:assert/strict";
import { test } from "node:test";
import {
  parseMediaWidth,
  mediaVariant,
  mediaSrcSet,
} from "./media-variants.ts";
const src =
  "/media/d9e6d3ec-a181-4045-b416-56138fc3857c/7c954aa4-def1-4896-b77d-3713ef6ee540.webp";
test("width presets reject unbounded and ambiguous transformations", () => {
  assert.equal(parseMediaWidth(null), null);
  assert.equal(parseMediaWidth("750"), 750);
  for (const value of ["0", "99999", "750.0", "0750", "750&quality=100", ""])
    assert.throws(() => parseMediaWidth(value));
});
test("variants preserve private route and leave video and SVG untouched", () => {
  assert.equal(mediaVariant(src, 700), `${src}?w=750`);
  assert.equal(mediaVariant(src, 4000), `${src}?w=2400`);
  for (const value of [
    src.replace("webp", "mp4"),
    src.replace("webp", "svg"),
    "https://example.com/a.webp",
  ]) {
    assert.equal(mediaVariant(value, 750), value);
    assert.equal(mediaSrcSet(value), undefined);
  }
});
