# Disco-ball assets

Generated through the owner's Magnific account on 2026-10-07 for this project. Real mirrored tiles rotate around the vertical suspension axis; the website does not rotate a flat bitmap.

## Provenance

- [Studio still, Seedream 5 Pro](https://www.magnific.com/app/creation/KLR5RFskqp): 2048 × 2048, 75 credits.
- [Isolated still](https://www.magnific.com/app/creation/ksZKTIe16B): 3 credits; inspected as the initial cutout.
- [Rotation, Seedance 2.5](https://www.magnific.com/app/creation/LwnjBZSswO): 12 seconds, 24fps, 960 × 960, no audio, 5,280 credits. The same supplied still was used for start/end framing.
- [Isolated video, BiRefNet video background removal](https://www.magnific.com/app/creation/vQwhWRZa47): heavy/refined foreground, maximum-quality VP9 alpha, 132 credits. This is the preparation source. The opaque H.264 preview is not the alpha source.

Total generation/preparation: 5,490 credits. Creation links allow the owner to retrieve sources without committing expiring signed URLs or credentials.

## Files

- `disco-ball.webp`: 640px transparent first-frame poster.
- `disco-ball.webm` / `disco-ball-mobile.webm`: 640px / 320px VP9 alpha loops.
- `disco-ball.mov` / `disco-ball-mobile.mov`: 640px / 320px native Apple HEVC alpha loops.
- Desktop budget: ≤2MB per selected source; compact budget: ≤750KB per selected source. The refined ball renders at up to 154px/77px, preserving retina sharpness. The original media is unchanged.

Final sizes: poster 68,650 bytes; desktop WebM 1,751,085 bytes; desktop MOV 1,536,492 bytes; compact WebM 560,846 bytes; compact MOV 507,353 bytes.

The union of sampled alpha bounds determines a constant square crop with a small edge margin. No baked-in background, fake geometric mask or starburst is added. The cable is CSS outside the asset. First/quarter/half/last frames and light/dark compositing were inspected.

## Offline preparation

Requires Python/Pillow, FFmpeg with libvpx-vp9, and Apple's Xcode command-line tools. These are asset-production tools, not project/runtime dependencies.

```sh
python tools/party-mode/prepare-assets.py isolated-source.webm public/party-mode --ffmpeg /path/to/ffmpeg
```

VP9 is decoded with libvpx to retain its alpha plane. The script prepares the poster and responsive WebM loops, then creates RGBA frames and runs `encode-alpha.swift`. The Swift tool uses AVAssetWriter's HEVCWithAlpha codec and premultiplied BGRA buffers. Native alpha decoding and WebKit canvas sampling verify alpha 0 in the corner and opaque ball center. Generic FFmpeg HEVC alpha output failed the Apple decoder and was discarded.

## Still prompt

Photorealistic studio product photograph of ONE real silver mirrored disco ball, isolated on a perfectly uniform matte white background. The entire spherical ball and a tiny metal suspension eyelet at its north pole are visible, centered, occupying 88% of the square image; do not include any cable. Real small square glass mirror tiles follow accurate latitude bands over the sphere, crisp dark seams, slightly imperfect tangible glass, metallic silver reflections with a few soft pale ivory/yellow highlights. Camera directly in front at ball equator, 85mm product lens, orthographic-like perspective. Fixed softbox illumination from upper left and soft fill right. Reflect a neutral studio environment, no room visible. Natural contrast and sharp tile edges. No illustration, no vector, no cartoon, no neon, no blue/purple/red/rainbow reflections, no lens flares, no star-shaped sparkles, no cast shadow, no floor, no text or watermark. Physical mirror material, not smooth chrome.

## Rotation prompt

A single continuous locked-camera photorealistic product shot. The real silver square-mirror disco ball in the start image completes EXACTLY ONE slow full 360 degree rotation about its VERTICAL suspension axis over 12 seconds and returns to the identical start orientation in the end frame. The sphere stays perfectly fixed in position and size, its little suspension eyelet stays at the top. Only the mirror tile grid and reflected softboxes move smoothly around its surface; do not spin the flat image in the screen plane. Preserve the existing accurately spherical tile geometry and realistic glass materials. Stationary white studio, constant neutral lighting, small restrained pale ivory highlights. Keep the perfectly uniform white background absolutely still for clean background removal. Seamless loop with constant rotational speed, no startup or slowdown. No camera motion, wobbling, morphing, sparkling starbursts, exposure pulses, flare, text, colored nightclub lighting, people, new objects, cable, music, speech or audio.
