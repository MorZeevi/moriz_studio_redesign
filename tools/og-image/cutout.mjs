// Removes the lime circle from the blazer portrait and writes a transparent cut-out.
// Run: node tools/og-image/cutout.mjs
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../..");
const source = join(root, "public/digital-audit/mor-profile.png");
const target = join(here, "mor-blazer-cutout.png");

const dataUrl = `data:image/png;base64,${(await readFile(source)).toString("base64")}`;

const browser = await chromium.launch();
const page = await browser.newPage();
const result = await page.evaluate(async (src) => {
  const image = new Image();
  image.src = src;
  await image.decode();
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0);
  const frame = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = frame.data;

  // The key colour is the lime near the top of the circle, above the head.
  const at = (x, y) => (y * canvas.width + x) * 4;
  const sample = at(Math.round(canvas.width / 2), 20);
  const key = [data[sample], data[sample + 1], data[sample + 2]];

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Share of lime in the pixel: lime is the only colour here with green well above red and blue.
    const lime = Math.max(
      0,
      Math.min(1, (g - r) / (key[1] - key[0]), (g - b) / (key[1] - key[2])),
    );
    const alpha = lime > 0.92 ? 0 : lime < 0.08 ? 1 : 1 - lime;
    if (alpha > 0 && alpha < 1) {
      // Take the lime back out of half-covered edge pixels (hair strands).
      const mix = 1 - alpha;
      data[i] = Math.max(0, Math.min(255, (r - mix * key[0]) / alpha));
      data[i + 1] = Math.max(0, Math.min(255, (g - mix * key[1]) / alpha));
      data[i + 2] = Math.max(0, Math.min(255, (b - mix * key[2]) / alpha));
    }
    data[i + 3] = Math.round(data[i + 3] * alpha);
  }
  context.putImageData(frame, 0, 0);
  return { key, png: canvas.toDataURL("image/png") };
}, dataUrl);
await browser.close();

await writeFile(target, Buffer.from(result.png.split(",")[1], "base64"));
console.log(`key colour rgb(${result.key.join(", ")}) -> ${target}`);
