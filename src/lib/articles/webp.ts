export type ImageSize = { width: number; height: number };

/** Width and height from a WebP buffer, or null when the header is unreadable. */
export function webpSize(buffer: Uint8Array): ImageSize | null {
  if (buffer.length < 30) return null;
  if (
    ascii(buffer, 0, 4) !== "RIFF" ||
    ascii(buffer, 8, 12) !== "WEBP"
  ) {
    return null;
  }
  const chunk = ascii(buffer, 12, 16);
  if (chunk === "VP8X" && buffer.length >= 30) {
    return {
      width: 1 + readUintLE(buffer, 24, 3),
      height: 1 + readUintLE(buffer, 27, 3),
    };
  }
  if (chunk === "VP8 " && buffer.length >= 30) {
    // Lossy keyframe: 14-bit dimensions follow the 3-byte tag and 3-byte start code.
    return {
      width: readUint16LE(buffer, 26) & 0x3fff,
      height: readUint16LE(buffer, 28) & 0x3fff,
    };
  }
  if (chunk === "VP8L" && buffer.length >= 25) {
    const bits = readUint32LE(buffer, 21);
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1,
    };
  }
  return null;
}

function ascii(buffer: Uint8Array, start: number, end: number) {
  return String.fromCharCode(...buffer.subarray(start, end));
}

function readUint16LE(buffer: Uint8Array, offset: number) {
  return buffer[offset] + buffer[offset + 1] * 0x100;
}

function readUint32LE(buffer: Uint8Array, offset: number) {
  return (
    buffer[offset] +
    buffer[offset + 1] * 0x100 +
    buffer[offset + 2] * 0x10000 +
    buffer[offset + 3] * 0x1000000
  );
}

function readUintLE(buffer: Uint8Array, offset: number, bytes: number) {
  let value = 0;
  for (let index = 0; index < bytes; index += 1) {
    value += buffer[offset + index] * 256 ** index;
  }
  return value;
}
