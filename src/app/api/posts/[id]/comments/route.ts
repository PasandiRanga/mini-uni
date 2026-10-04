export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

const MAX_COMMENT_LENGTH = 1000;

const commentSelect = {
  id: true,
  content: true,
  createdAt: true,
  user: { select: { id: true, firstName: true, lastName: true, role: true } },
} as const;

/** A post's comments, oldest first. Public, like the post itself. */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const comments = await prisma.comment.findMany({
      where: { postId: params.id },
      select: commentSelect,
      orderBy: { createdAt: "asc" },
      take: 200,
    });
    return NextResponse.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** Adds a comment as the signed-in user. */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(request);
  if (!session || !session.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const content = typeof body?.content === "string" ? body.content.trim() : "";
    if (!content) {
      return NextResponse.json({ error: "Write something first" }, { status: 400 });
    }
    if (content.length > MAX_COMMENT_LENGTH) {
      return NextResponse.json({ error: `Comments can be up to ${MAX_COMMENT_LENGTH} characters` }, { status: 400 });
    }

    const post = await prisma.post.findUnique({ where: { id: params.id }, select: { isActive: true } });
    if (!post || !post.isActive) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const comment = await prisma.comment.create({
      data: { postId: params.id, userId: session.sub, content },
      select: commentSelect,
    });
    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Error adding comment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
