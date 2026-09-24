export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

/** Marks one of the user's notifications as read. Scoped to the owner. */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(request);
  if (!session || !session.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // updateMany scoped to the owner so one user can't mark another's read.
    const result = await prisma.notification.updateMany({
      where: { id: params.id, userId: session.sub },
      data: { isRead: true },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error marking notification read:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
