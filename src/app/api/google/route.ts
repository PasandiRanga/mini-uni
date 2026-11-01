export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { isGoogleConfigured } from "@/lib/googleCalendar";

/** Whether the signed-in teacher has Google Calendar connected. */
export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const account = await prisma.googleAccount.findUnique({
    where: { userId: session.sub },
    select: { email: true, createdAt: true },
  });

  return NextResponse.json({
    configured: isGoogleConfigured(),
    connected: Boolean(account),
    email: account?.email ?? null,
  });
}

/** Disconnects the teacher's Google account. Future classes won't get a Meet link. */
export async function DELETE(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await prisma.googleAccount.deleteMany({ where: { userId: session.sub } });
  return NextResponse.json({ ok: true });
}
