export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { getAdminSession } from "@/lib/adminAuth";

/** Deletes a comment. Allowed for its author, the post's owner, or an admin. */
export async function DELETE(request: Request, { params }: { params: { id: string; commentId: string } }) {
  const session = await getSessionFromRequest(request);
  if (!session || !session.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const comment = await prisma.comment.findUnique({
      where: { id: params.commentId },
      select: { postId: true, userId: true, post: { select: { userId: true } } },
    });
    if (!comment || comment.postId !== params.id) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const allowed =
      comment.userId === session.sub ||
      comment.post.userId === session.sub ||
      Boolean(await getAdminSession(request));
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.comment.delete({ where: { id: params.commentId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
