import { del, put } from "@vercel/blob";

/**
 * Class thumbnails live in Vercel Blob rather than in the database. The post
 * form still sends the picked image as a data URL; the API hands it here, and
 * only the resulting https URL is stored on the post. That keeps rows small
 * (Explore was downloading every image inline) and keeps images out of the
 * database's storage quota.
 *
 * Without BLOB_READ_WRITE_TOKEN (local dev, or before the Blob store is
 * connected) images fall back to being stored inline, as before.
 */

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const blobEnabled = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

const isBlobUrl = (url: string) => /^https:\/\/[^/]+\.blob\.vercel-storage\.com\//.test(url);

export class ImageError extends Error {}

/**
 * Takes whatever the client sent for an image field and returns what to store:
 * an existing URL is kept as-is, a data URL is uploaded to Blob, and an empty
 * value clears the field. Throws ImageError for anything that isn't a
 * supported image.
 */
export async function storeImage(value: unknown, folder: string): Promise<string | null> {
  if (value == null || value === "") return null;
  if (typeof value !== "string") throw new ImageError("Invalid image");
  if (!value.startsWith("data:")) {
    if (/^https?:\/\//.test(value)) return value;
    throw new ImageError("Invalid image");
  }

  const match = value.match(/^data:([^;,]+);base64,(.+)$/);
  const ext = match ? IMAGE_TYPES[match[1]] : undefined;
  if (!match || !ext) throw new ImageError("Use a JPG, PNG or WebP image");

  const bytes = Buffer.from(match[2], "base64");
  if (bytes.length > MAX_IMAGE_BYTES) throw new ImageError("Image must be 5 MB or smaller");

  if (!blobEnabled()) return value;

  const blob = await put(`${folder}/image.${ext}`, bytes, {
    access: "public",
    contentType: match[1],
    addRandomSuffix: true,
  });
  return blob.url;
}

/** Deletes an image we uploaded earlier. Never throws; a stray file is harmless. */
export async function deleteImage(url: string | null | undefined) {
  if (!url || !isBlobUrl(url) || !blobEnabled()) return;
  try {
    await del(url);
  } catch (err) {
    console.error("Failed to delete blob:", err);
  }
}
