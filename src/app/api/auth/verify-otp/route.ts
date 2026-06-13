export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || !session.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code } = await request.json();
    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { id: true, emailVerified: true, emailOtp: true, emailOtpExpiry: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (user.emailVerified) {
      return NextResponse.json({ verified: true });
    }
    if (!user.emailOtp || !user.emailOtpExpiry) {
      return NextResponse.json({ error: "No code requested. Please request a new one." }, { status: 400 });
    }
    if (user.emailOtpExpiry < new Date()) {
      return NextResponse.json({ error: "Code expired. Please request a new one." }, { status: 400 });
    }

    const matches = await bcrypt.compare(code.trim(), user.emailOtp);
    if (!matches) {
      return NextResponse.json({ error: "Incorrect code" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, emailOtp: null, emailOtpExpiry: null },
    });

    return NextResponse.json({ verified: true });
  } catch (error) {
    console.error("verify-otp error:", error);
    return NextResponse.json({ error: "Failed to verify code" }, { status: 500 });
  }
}
