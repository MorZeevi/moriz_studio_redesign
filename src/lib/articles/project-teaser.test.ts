import assert from "node:assert/strict";
import { test } from "node:test";
import { teaserFromProjectsHtml } from "./project-teaser.ts";

const html = `
<a href="/he/projects/guesto">
  <img alt="עמוד הזמנה" src="/media/3b2d7d05-752d-4789-bab3-764a1c78b00c/cover.webp" />
  <h2>GUESTO</h2>
</a>
<a href="/he/projects/other"><h3>אחר</h3></a>
`;

test("a public project card keeps the live title and image", () => {
  const teaser = teaserFromProjectsHtml(html, "guesto", "he");
  assert.deepEqual(teaser, {
    title: "GUESTO",
    href: "/he/projects/guesto",
    image: {
      src: "https://moriz.studio/media/3b2d7d05-752d-4789-bab3-764a1c78b00c/cover.webp",
      alt: "עמוד הזמנה",
    },
  });
  assert.equal(teaserFromProjectsHtml(html, "missing", "he"), null);
});
