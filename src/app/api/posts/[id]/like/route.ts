export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

/**
 * Toggles the signed-in user's like on a post and returns the new state.
 * The (postId, userId) unique key makes a double-tap harmless.
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(request);
  if (!session || !session.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const postId = params.id;
    const userId = session.sub;

    const post = await prisma.post.findUnique({ where: { id: postId }, select: { isActive: true } });
    if (!post || !post.isActive) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const removed = await prisma.postLike.deleteMany({ where: { postId, userId } });
    let liked = false;
    if (removed.count === 0) {
      try {
        await prisma.postLike.create({ data: { postId, userId } });
      } catch (err) {
        // A concurrent request already liked it; that's the state we wanted.
        if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002")) throw err;
      }
      liked = true;
    }

    const likeCount = await prisma.postLike.count({ where: { postId } });
    return NextResponse.json({ liked, likeCount });
  } catch (error) {
    console.error("Error toggling like:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
