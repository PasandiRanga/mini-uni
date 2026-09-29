export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

/** Marks all of the user's unread notifications as read. */
export async function POST(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session || !session.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await prisma.notification.updateMany({
      where: { userId: session.sub, isRead: false },
      data: { isRead: true },
    });
    return NextResponse.json({ ok: true, updated: result.count });
  } catch (error) {
    console.error("Error marking all notifications read:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
