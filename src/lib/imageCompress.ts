'use client';

/**
 * Shrinks a photo in the browser before it's uploaded. Images travel to the
 * API as base64 inside JSON, and Vercel rejects request bodies over 4.5 MB
 * (HTTP 413), so a straight-off-the-phone photo (3-5 MB, ~1.33x as base64)
 * fails. Resizing to `maxDimension` and re-encoding as JPEG typically lands
 * at 150-400 KB with no visible loss at the sizes we display.
 */
export async function compressImage(
  file: File,
  { maxDimension = 1600, quality = 0.82 }: { maxDimension?: number; quality?: number } = {}
): Promise<string> {
  const bitmap = await loadBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Couldn't process the image");

  // JPEG has no transparency: paint white first so transparent PNGs don't turn black.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  if ("close" in bitmap) bitmap.close();

  return canvas.toDataURL("image/jpeg", quality);
}

/** Decodes the file, honouring the photo's EXIF rotation where supported. */
async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      /* fall back to an <img> below */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Largest non-image file (e.g. a PDF) we send as-is: 3 MB stays under the 4.5 MB request cap once base64-encoded. */
export const MAX_RAW_UPLOAD_BYTES = 3 * 1024 * 1024;
