export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { randomInt } from "crypto";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { sendEmail, buildOtpEmail } from "@/lib/email";

const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || !session.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { id: true, email: true, firstName: true, emailVerified: true, emailOtpExpiry: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (user.emailVerified) {
      return NextResponse.json({ error: "Email already verified" }, { status: 400 });
    }

    // One code per minute: the last one was issued OTP_TTL before its expiry.
    if (user.emailOtpExpiry) {
      const issuedAt = user.emailOtpExpiry.getTime() - OTP_TTL_MS;
      const retryAfter = Math.ceil((issuedAt + RESEND_COOLDOWN_MS - Date.now()) / 1000);
      if (retryAfter > 0) {
        return NextResponse.json(
          { error: `Please wait ${retryAfter}s before requesting another code.`, retryAfter },
          { status: 429 }
        );
      }
    }

    // Generate a 6-digit code, store only its hash with a 10-minute expiry
    const code = String(randomInt(100000, 1000000));
    const emailOtp = await bcrypt.hash(code, 10);
    const emailOtpExpiry = new Date(Date.now() + OTP_TTL_MS);

    await prisma.user.update({
      where: { id: user.id },
      data: { emailOtp, emailOtpExpiry },
    });

    const { subject, html, text } = buildOtpEmail(code, user.firstName);
    const delivered = await sendEmail({ to: user.email, subject, html, text });

    if (!delivered && process.env.NODE_ENV === "production") {
      // Never hand the code back to the browser on the live site.
      console.error("send-otp: SMTP is not configured in production");
      return NextResponse.json({ error: "Email isn't available right now. Please try again later." }, { status: 503 });
    }

    return NextResponse.json({
      sent: true,
      retryAfter: RESEND_COOLDOWN_MS / 1000,
      // In local dev with no SMTP configured, surface the code so the flow is testable.
      ...(delivered ? {} : { devCode: code }),
    });
  } catch (error) {
    console.error("send-otp error:", error);
    return NextResponse.json({ error: "Failed to send code" }, { status: 500 });
  }
}
