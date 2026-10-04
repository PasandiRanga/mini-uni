export const dynamic = "force-dynamic";
export const maxDuration = 60;
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/adminAuth";
import { blobEnabled, storeImage } from "@/lib/blob";

/**
 * One-off: moves thumbnails still stored inline as data URLs out to Vercel
 * Blob, a few posts per call. Safe to call again; it only picks up posts that
 * still hold a data URL, and reports how many are left.
 */
const BATCH = 10;

export async function POST(request: Request) {
  const session = await getAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!blobEnabled()) {
    return NextResponse.json({ error: "Blob storage isn't connected (BLOB_READ_WRITE_TOKEN missing)" }, { status: 503 });
  }

  try {
    const inline = { thumbnailUrl: { startsWith: "data:" } };
    const posts = await prisma.post.findMany({
      where: inline,
      select: { id: true, userId: true, thumbnailUrl: true },
      take: BATCH,
    });

    const failed: string[] = [];
    for (const post of posts) {
      try {
        const url = await storeImage(post.thumbnailUrl, `thumbnails/${post.userId}`);
        await prisma.post.update({ where: { id: post.id }, data: { thumbnailUrl: url } });
      } catch (err) {
        console.error(`Failed to migrate thumbnail for post ${post.id}:`, err);
        failed.push(post.id);
      }
    }

    const remaining = await prisma.post.count({ where: inline });
    return NextResponse.json({ migrated: posts.length - failed.length, failed, remaining });
  } catch (error) {
    console.error("Error migrating thumbnails:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
