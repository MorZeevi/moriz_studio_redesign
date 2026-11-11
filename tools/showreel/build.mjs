// Cuts the homepage showreel from tools/showreel/shots.json.
//   node tools/showreel/build.mjs            → tools/showreel/out/showreel.mp4 + posters
//   node tools/showreel/build.mjs --publish  → also copies them into public/videos/
// Sources live in tools/showreel/src/ (git-ignored); see docs/hero-video.md.
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const edit = JSON.parse(readFileSync(join(here, "shots.json"), "utf8"));
const { width: W, height: H, fps, bitrate } = edit;
const srcDir = join(here, "src");
const outDir = join(here, "out");
const segDir = join(outDir, "segments");
rmSync(segDir, { recursive: true, force: true });
mkdirSync(segDir, { recursive: true });

const run = (bin, args) => execFileSync(bin, args, { stdio: ["ignore", "pipe", "inherit"] }).toString();
const ffmpeg = (args) => run("ffmpeg", ["-y", "-v", "error", ...args]);
const isVideo = (file) => [".mp4", ".mov", ".webm"].includes(extname(file));

const sizes = new Map();
const sizeOf = (file) => {
  if (!sizes.has(file)) {
    const probe = run("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", file]);
    sizes.set(file, probe.trim().split(",").map(Number));
  }
  return sizes.get(file);
};

const eases = {
  linear: (p) => p,
  // Fast start, hard settle: the "snap" zoom.
  snap: (p) => `(1-pow(2\\,-10*${p}))`,
  inout: (p) => `(0.5-0.5*cos(PI*${p}))`,
};

// One source → one panel of pw×ph. `crop`/`to` are [centerX, centerY, width] in source pixels.
const inputArgs = (shot) => {
  const file = join(srcDir, shot.src);
  return isVideo(file) ? ["-ss", String(shot.at ?? 0), "-i", file] : ["-loop", "1", "-framerate", String(fps), "-i", file];
};

const chain = (shot, pw, ph, frames) => {
  const file = join(srcDir, shot.src);
  const [iw, ih] = sizeOf(file);
  const ratio = ph / pw;
  const fullWidth = Math.min(iw, ih / ratio);
  const from = shot.crop ?? [iw / 2, ih / 2, fullWidth];
  const to = shot.to ?? from;
  for (const [cx, cy, w] of [from, to]) {
    const h = w * ratio;
    if (cx - w / 2 < -1 || cy - h / 2 < -1 || cx + w / 2 > iw + 1 || cy + h / 2 > ih + 1) {
      throw new Error(`${shot.src}: crop ${[cx, cy, w]} leaves the ${iw}×${ih} frame`);
    }
  }
  const timing = isVideo(file) ? `setpts=(PTS-STARTPTS)/${shot.speed ?? 1},fps=${fps},` : "";
  const seconds = frames / fps;
  const e = eases[shot.ease ?? "snap"](`min(t/${seconds}\\,1)`);
  const lerp = (a, b) => (a === b ? `${a}` : `(${a}+(${b - a})*${e})`);
  const scale = `(${pw}/${lerp(from[2], to[2])})`;
  return (
    `${timing}scale=w=ceil(iw*${scale}/2)*2:h=ceil(ih*${scale}/2)*2:eval=frame:flags=lanczos,` +
    `crop=${pw}:${ph}:x=${lerp(from[0], to[0])}*${scale}-${pw / 2}:y=${lerp(from[1], to[1])}*${scale}-${ph / 2},setsar=1`
  );
};

const segments = [];
let total = 0;
edit.shots.forEach((shot, index) => {
  const out = join(segDir, `${String(index).padStart(2, "0")}.mp4`);
  const panels = shot.split ?? [shot];
  const pw = W / panels.length;
  const graph =
    panels.map((panel, i) => `[${i}:v]${chain(panel, pw, H, shot.frames)}[p${i}]`).join(";") +
    (panels.length > 1 ? `;${panels.map((_, i) => `[p${i}]`).join("")}hstack=inputs=${panels.length}[v]` : ";[p0]null[v]");
  ffmpeg([
    ...panels.flatMap(inputArgs),
    "-filter_complex", graph, "-map", "[v]",
    "-frames:v", String(shot.frames), "-r", String(fps), "-an",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "12", "-pix_fmt", "yuv420p",
    out,
  ]);
  segments.push(out);
  total += shot.frames;
  console.log(`${String(index).padStart(2, "0")} ${String(shot.frames).padStart(3)}f  ${shot.note ?? panels.map((p) => p.src).join(" | ")}`);
});

const list = join(segDir, "list.txt");
writeFileSync(list, segments.map((file) => `file '${file}'`).join("\n"));
const joined = join(segDir, "joined.mp4");
ffmpeg(["-f", "concat", "-safe", "0", "-i", list, "-c", "copy", joined]);

const video = join(outDir, "showreel.mp4");
const encode = ["-i", joined, "-an", "-c:v", "libx264", "-preset", "slow", "-profile:v", "high", "-pix_fmt", "yuv420p", "-b:v", bitrate, "-passlogfile", join(segDir, "pass")];
ffmpeg([...encode, "-pass", "1", "-f", "null", "/dev/null"]);
ffmpeg([...encode, "-pass", "2", "-movflags", "+faststart", video]);

// Posters are the frame at 0.5 s, so they match what plays. ffmpeg here has no WebP encoder, so sharp writes them.
const frame = join(segDir, "poster.png");
ffmpeg(["-ss", "0.5", "-i", joined, "-frames:v", "1", frame]);
const poster = async (name, w, h, format, quality) => {
  const file = join(outDir, name);
  await sharp(frame).resize(w, h)[format]({ quality }).toFile(file);
  return file;
};
const outputs = [
  video,
  await poster("showreel-poster.jpg", 1200, 800, "jpeg", 82),
  await poster("showreel-poster.webp", 1200, 800, "webp", 80),
  await poster("showreel-poster-mobile.webp", 600, 400, "webp", 78),
];

console.log(`\n${total} frames = ${(total / fps).toFixed(2)} s, ${(statSync(video).size / 1e6).toFixed(2)} MB\n${video}`);

if (process.argv.includes("--publish")) {
  for (const file of outputs) {
    const target = join(root, "public/videos", `hero-${file.slice(outDir.length + 1)}`);
    copyFileSync(file, target);
    console.log(`published ${target}`);
  }
}
