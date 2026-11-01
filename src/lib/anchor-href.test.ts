import assert from "node:assert/strict";
import { test } from "node:test";
import { anchorHref } from "./anchor-href.ts";

test("locale pages gain a prefix and root routes stay put", () => {
  assert.equal(anchorHref("/articles", "he"), "/he/articles");
  assert.equal(anchorHref("/articles", "he", ["#contact"]), "/he/articles");
  assert.equal(anchorHref("/digital-audit", "he"), "/digital-audit");
  assert.equal(anchorHref("#about", "he", ["#contact"]), "/he#about");
  assert.equal(anchorHref("#contact", "he", ["#contact"]), "#contact");
  assert.equal(anchorHref("#about", "he"), "#about");
});
