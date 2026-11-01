import assert from "node:assert/strict";
import { test } from "node:test";
import { insertAutoCta } from "./remark-insert-cta.mjs";

function tree(children: Array<Record<string, unknown>>) {
  return { children };
}

test("a contact card is inserted before the middle heading", () => {
  const article = tree([
    { type: "yaml", value: 'title: "מאמר"\n' },
    { type: "paragraph", children: [] },
    { type: "heading", depth: 2, children: [] },
    { type: "paragraph", children: [] },
    { type: "heading", depth: 2, children: [] },
    { type: "paragraph", children: [] },
  ]);
  assert.equal(insertAutoCta(article), true);
  const inserted = article.children.find((node) => node.name === "CtaCard");
  assert.ok(inserted);
  assert.equal(article.children.indexOf(inserted), 4);
});

test("an authored card and cta: false both skip insertion", () => {
  const authored = tree([
    { type: "paragraph", children: [] },
    { type: "mdxJsxFlowElement", name: "CtaCard", children: [] },
    { type: "heading", depth: 2, children: [] },
  ]);
  assert.equal(insertAutoCta(authored), false);
  assert.equal(
    authored.children.filter((node) => node.name === "CtaCard").length,
    1,
  );

  const disabled = tree([
    { type: "yaml", value: "cta: false\n" },
    { type: "paragraph", children: [] },
    { type: "heading", depth: 2, children: [] },
  ]);
  assert.equal(insertAutoCta(disabled), false);
});
