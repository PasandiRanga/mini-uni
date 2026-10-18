export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";
import { encrypt, forgetPasswordChange, getSessionFromRequest, SESSION_COOKIE_OPTIONS } from "@/lib/auth";

export async function PUT(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || !session.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Both current and new password are required" }, { status: 400 });
    }
    if (String(newPassword).length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.sub } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    // Stamping the change signs out every other device (see lib/auth).
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed, passwordChangedAt: new Date() } });
    forgetPasswordChange(user.id);

    // A fresh token keeps this device signed in.
    const response = NextResponse.json({ success: true });
    response.cookies.set("token", await encrypt({ sub: user.id, role: user.role }), SESSION_COOKIE_OPTIONS);
    return response;
  } catch (error) {
    console.error("change-password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
