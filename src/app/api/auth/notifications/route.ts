export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

// GET — current notification preferences
export async function GET(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || !session.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { notifyEmail: true, notifyInApp: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json(user);
  } catch (error) {
    console.error("notifications GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT — update notification preferences
export async function PUT(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || !session.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const data: { notifyEmail?: boolean; notifyInApp?: boolean } = {};
    if (typeof body.notifyEmail === "boolean") data.notifyEmail = body.notifyEmail;
    if (typeof body.notifyInApp === "boolean") data.notifyInApp = body.notifyInApp;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No valid preferences to update" }, { status: 400 });
    }

    await prisma.user.update({ where: { id: session.sub }, data });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("notifications PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
