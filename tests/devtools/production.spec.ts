import { expect, test } from "@playwright/test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

test("production includes no inspector markup, source annotations or inspector chunks", async ({
  page,
}) => {
  const response = await page.goto("/he");
  const html = await response?.text();
  expect(html).not.toContain("data-inspector-file");
  expect(html).not.toContain("data-devtools-owned");
  await expect(
    page.getByRole("button", { name: "Developer tools", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator("[data-inspector-file]")).toHaveCount(0);
  await page.locator(".hero-projects-link").click();
  await expect(page).toHaveURL(/#projects$/);
  await page.goto("/he/fonts");
  await expect(page.locator("[data-devtools-owned]")).toHaveCount(0);
  function inspectDirectory(directory: string) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const filename = join(directory, entry.name);
      if (entry.isDirectory()) inspectDirectory(filename);
      else if (/\.(js|css)$/.test(filename)) {
        const content = readFileSync(filename, "utf8");
        expect(content, filename).not.toContain(
          "Clipboard unavailable. Select and copy",
        );
        expect(content, filename).not.toContain("data-inspector-overlay");
        expect(content, filename).not.toContain("data-devtools-owned");
      }
    }
  }
  inspectDirectory(".next/static");
  const manifest = readFileSync(
    ".next/server/app/[locale]/page_client-reference-manifest.js",
    "utf8",
  );
  expect(manifest).not.toContain("devtools/developer-toolbar");
});
