"""Offline asset preparation; never imported by the website.

Usage: python prepare-assets.py ALPHA_WEBM OUTPUT_DIRECTORY --ffmpeg /path/to/ffmpeg
Requires Pillow, FFmpeg with libvpx-vp9, and macOS/Xcode command-line tools.
HEVC alpha uses AVAssetWriter, then is verified in WebKit.
The input is the Magnific isolated rotation loop, not an opaque preview.
"""

import argparse
from pathlib import Path
import subprocess
import tempfile

from PIL import Image

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("source", type=Path)
parser.add_argument("output", type=Path)
parser.add_argument("--ffmpeg", default="ffmpeg")
args = parser.parse_args()
args.output.mkdir(parents=True, exist_ok=True)


def run(*options):
    subprocess.run([args.ffmpeg, "-hide_banner", "-loglevel", "error", "-y", *map(str, options)], check=True)


with tempfile.TemporaryDirectory(prefix="party-frames-") as directory:
    directory = Path(directory)
    # Sample the whole loop so the constant crop never clips moving edges.
    run("-c:v", "libvpx-vp9", "-i", args.source, "-vf", "fps=2", directory / "%03d.png")
    bounds = []
    for path in sorted(directory.glob("*.png")):
        image = Image.open(path).convert("RGBA")
        bounds.append(image.getchannel("A").point(lambda value: 255 if value > 8 else 0).getbbox())
    if not bounds or any(box is None for box in bounds):
        raise ValueError("Missing subject or alpha channel")
    left = min(box[0] for box in bounds)
    top = min(box[1] for box in bounds)
    right = max(box[2] for box in bounds)
    bottom = max(box[3] for box in bounds)
    side = max(right - left, bottom - top) + 4
    # Even coordinates keep subsampled chroma and the two encoders aligned.
    side += side % 2
    x = max(0, round(((left + right) - side) / 4) * 2)
    y = max(0, round(((top + bottom) - side) / 4) * 2)
    first = Image.open(directory / "001.png").convert("RGBA")
    first.crop((x, y, x + side, y + side)).resize((640, 640), Image.Resampling.LANCZOS).save(
        args.output / "disco-ball.webp", quality=88, method=6
    )

encoder = Path(__file__).with_name("encode-alpha.swift")

for size, suffix, bitrate, quality in [(640, "", "650000", "43"), (320, "-mobile", "160000", "44")]:
    filters = f"crop={side}:{side}:{x}:{y},scale={size}:{size}:flags=lanczos"
    common = ["-c:v", "libvpx-vp9", "-i", args.source, "-t", "12", "-r", "24", "-an"]
    run(*common, "-vf", filters + ",format=yuva420p", "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", quality,
        "-row-mt", "1", "-auto-alt-ref", "0", "-metadata:s:v:0", "alpha_mode=1",
        args.output / f"disco-ball{suffix}.webm")
    with tempfile.TemporaryDirectory(prefix="party-alpha-") as frames:
        run(*common, "-vf", filters + ",format=rgba", Path(frames) / "%03d.png")
        subprocess.run([
            "xcrun", "swift", "-module-cache-path", str(Path(frames) / "swift-cache"),
            str(encoder), frames, str(args.output / f"disco-ball{suffix}.mov"), str(size), bitrate,
        ], check=True)


for path in sorted(args.output.glob("disco-ball*")):
    print(f"{path.name}: {path.stat().st_size:,} bytes")
