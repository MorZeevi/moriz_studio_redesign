// Read-only preview: find large images in the CMS bucket that projects use, download
// them and re-encode them locally the way the editor now does on upload (WebP,
// quality 85, at most 2400px wide). Writes nothing to Supabase; prints the plan and
// the temp folder with originals and compressed files for review. Logos are skipped.
// Uses the Supabase CLI login.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const cli = join(root, "node_modules/.bin/supabase");
const SOURCE = "moriz";
const BUCKET = "project-media";
const MIN_BYTES = 500 * 1024;
const MAX_WIDTH = 2400;
// Same list as cleanupMedia in src/app/admin/actions.ts.
const MEDIA_COLUMNS = [
  "cover_image_url",
  "homepage_image_url",
  "projects_image_url",
  "og_image_url",
  "content",
  "media",
];

function supabase(...args) {
  return execFileSync(cli, args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 64 * 1024 * 1024,
  });
}
function select(query) {
  const output = supabase("db", "query", "--linked", query);
  return JSON.parse(output.slice(output.indexOf("{"))).rows ?? [];
}
const kb = (bytes) => `${Math.round(bytes / 1024)} KB`;

const projects = select(`
  select id, slug, ${MEDIA_COLUMNS.join(", ")}
  from projects where source = '${SOURCE}'`);
const objects = select(`
  select name, (metadata->>'size')::bigint as size from storage.objects
  where bucket_id = '${BUCKET}'
    and metadata->>'mimetype' in ('image/png', 'image/jpeg', 'image/webp')
    and (metadata->>'size')::bigint > ${MIN_BYTES}
  order by size desc`);

const workdir = mkdtempSync(join(tmpdir(), "moriz-compress-media-"));
let before = 0;
let after = 0;
for (const { name, size } of objects) {
  const src = JSON.stringify(`/media/${name}`);
  const using = projects.filter((project) =>
    JSON.stringify(MEDIA_COLUMNS.map((column) => project[column])).includes(src),
  );
  const where = using
    .map(
      (project) =>
        `${project.slug ?? project.id} [${MEDIA_COLUMNS.filter((column) =>
          JSON.stringify(project[column]).includes(src),
        ).join(", ")}]`,
    )
    .join("; ");
  if (!using.length) {
    console.log(`skip  ${name}: not used by any project`);
    continue;
  }
  if (
    using.some((project) =>
      project.media.some(
        (item) => `"${item.src}"` === src && item.role === "logo",
      ),
    )
  ) {
    console.log(`skip  ${name}: logo (${where})`);
    continue;
  }
  const base = join(workdir, name.replace("/", "_").replace(/\.[^.]+$/, ""));
  const original = `${base}.original.${name.split(".").pop()}`;
  supabase("storage", "cp", "--linked", "--experimental", `ss:///${BUCKET}/${name}`, original);
  const { data, info } = await sharp(readFileSync(original))
    .rotate()
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer({ resolveWithObject: true });
  if (data.length >= size) {
    console.log(`skip  ${name}: WebP is not smaller (${where})`);
    continue;
  }
  writeFileSync(`${base}.webp`, data);
  before += size;
  after += data.length;
  console.log(
    `${kb(size).padStart(9)} -> ${kb(data.length).padStart(7)}  ` +
      `${info.width}x${info.height}  ${where}  ${name}`,
  );
}
console.log(`\nTotal ${kb(before)} -> ${kb(after)}`);
console.log(`Originals and compressed files: ${workdir}`);
