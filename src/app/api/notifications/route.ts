export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

/**
 * The signed-in user's notifications, newest first, with the unread count for
 * the bell badge. Read-only; marking read is done via the [id]/read and
 * read-all routes.
 */
export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session || !session.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [items, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: session.sub },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prisma.notification.count({
        where: { userId: session.sub, isRead: false },
      }),
    ]);

    return NextResponse.json({ items, unreadCount });
  } catch (error) {
    console.error("Error listing notifications:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
