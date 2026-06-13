export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { sendEmail, buildOtpEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || !session.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { id: true, email: true, firstName: true, emailVerified: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (user.emailVerified) {
      return NextResponse.json({ error: "Email already verified" }, { status: 400 });
    }

    // Generate a 6-digit code, store only its hash with a 10-minute expiry
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const emailOtp = await bcrypt.hash(code, 10);
    const emailOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { emailOtp, emailOtpExpiry },
    });

    const { subject, html, text } = buildOtpEmail(code, user.firstName);
    const delivered = await sendEmail({ to: user.email, subject, html, text });

    return NextResponse.json({
      sent: true,
      // In dev with no SMTP configured, surface the code so the flow is testable.
      ...(delivered ? {} : { devCode: code }),
    });
  } catch (error) {
    console.error("send-otp error:", error);
    return NextResponse.json({ error: "Failed to send code" }, { status: 500 });
  }
}
