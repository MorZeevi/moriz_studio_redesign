// Renders tools/og-image/template.html to public/og-image.png (1200 x 630).
// Run: node tools/og-image/render.mjs
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";
import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../..");
const target = process.argv[2] ?? join(root, "public/og-image.png");

// The mark's outline comes from the logo file, so the image follows the logo.
const logo = await readFile(join(root, "public/logos/moriz-mark.svg"), "utf8");
const outline = logo.match(/<path[^>]*\sd="([^"]+)"/)?.[1];
if (!outline) throw new Error("No path found in public/logos/moriz-mark.svg");

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
});
await page.goto(pathToFileURL(join(here, "template.html")).href);
await page.evaluate((d) => {
  document.getElementById("mark-path").setAttribute("d", d);
}, outline);
await page.evaluate(() => document.fonts.ready);
await page.waitForLoadState("networkidle");
const shot = await page.screenshot({ type: "png", omitBackground: false });
await browser.close();

// The grain makes a full-colour PNG about 1 MB, too heavy for WhatsApp previews.
// A dithered 256-colour palette keeps it near 300 KB with no visible change.
await sharp(shot)
  .png({ palette: true, quality: 70, effort: 10, dither: 1 })
  .toFile(target);
console.log(`wrote ${target}`);
