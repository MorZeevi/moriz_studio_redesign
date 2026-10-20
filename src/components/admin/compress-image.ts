/** Wider images are scaled down to this width (2× a full-width 1200px slot). */
const MAX_WIDTH = 2400;
/** Images smaller than this that already fit MAX_WIDTH upload unchanged. */
const MIN_BYTES = 500 * 1024;
const QUALITY = 0.85;
const COMPRESSIBLE = ["image/png", "image/jpeg", "image/webp"];

function encode(
  canvas: HTMLCanvasElement,
  type: string,
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, QUALITY));
}

function opaque(context: CanvasRenderingContext2D): boolean {
  const { width, height } = context.canvas;
  const { data } = context.getImageData(0, 0, width, height);
  for (let i = 3; i < data.length; i += 4) if (data[i] < 255) return false;
  return true;
}

/**
 * Re-encodes a large PNG, JPEG or WebP as WebP no wider than MAX_WIDTH.
 * Browsers that can't write WebP (Safari) get JPEG for opaque images and a
 * resized PNG otherwise. Media is served without next/image optimization, so
 * this is the only compression it gets. Returns the original file when it is
 * already small, can't be decoded, or the result isn't smaller.
 */
export async function compressImage(file: File): Promise<File> {
  if (!COMPRESSIBLE.includes(file.type)) return file;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  try {
    if (file.size < MIN_BYTES && bitmap.width <= MAX_WIDTH) return file;
    const scale = Math.min(1, MAX_WIDTH / bitmap.width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext("2d");
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    let blob = await encode(canvas, "image/webp");
    if (blob && blob.type !== "image/webp" && opaque(context))
      blob = await encode(canvas, "image/jpeg");
    // Canvases past the browser's size limit encode to nothing.
    if (!blob || blob.size >= file.size) return file;
    const extension = blob.type.split("/")[1].replace("jpeg", "jpg");
    return new File([blob], file.name.replace(/\.[^.]*$/, `.${extension}`), {
      type: blob.type,
    });
  } catch {
    return file;
  } finally {
    bitmap.close();
  }
}
