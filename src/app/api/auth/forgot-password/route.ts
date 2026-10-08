export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEmail, buildPasswordResetEmail } from "@/lib/email";
import { createResetToken, RESET_COOLDOWN_MS, RESET_TTL_MS } from "@/lib/passwordReset";

/** Emails a password-reset link (valid 30 minutes, one request per minute). */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    if (!email) {
      return NextResponse.json({ error: "Enter your email" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true, email: true, firstName: true, isActive: true, emailOtp: true, emailOtpExpiry: true },
    });
    // The login page already says when an email has no account, so this matches it.
    if (!user) {
      return NextResponse.json({ error: "No account found with this email.", code: "ACCOUNT_NOT_FOUND" }, { status: 404 });
    }
    if (!user.isActive) {
      return NextResponse.json({ error: "This account has been deactivated.", code: "ACCOUNT_INACTIVE" }, { status: 403 });
    }

    // One link per minute, so the form can't be used to flood someone's inbox.
    if (user.emailOtp?.startsWith("reset:") && user.emailOtpExpiry) {
      const issuedAt = user.emailOtpExpiry.getTime() - RESET_TTL_MS;
      const retryAfter = Math.ceil((issuedAt + RESET_COOLDOWN_MS - Date.now()) / 1000);
      if (retryAfter > 0) {
        return NextResponse.json({ error: `Please wait ${retryAfter}s before requesting another link.`, retryAfter }, { status: 429 });
      }
    }

    const { token, stored } = createResetToken();
    await prisma.user.update({
      where: { id: user.id },
      data: { emailOtp: stored, emailOtpExpiry: new Date(Date.now() + RESET_TTL_MS) },
    });

    const link = `${new URL(request.url).origin}/reset-password?uid=${encodeURIComponent(user.id)}&token=${token}`;
    const delivered = await sendEmail({ to: user.email, ...buildPasswordResetEmail(link, user.firstName) });

    if (!delivered && process.env.NODE_ENV === "production") {
      console.error("forgot-password: SMTP is not configured in production");
      return NextResponse.json({ error: "Email isn't available right now. Please try again later." }, { status: 503 });
    }

    return NextResponse.json({
      sent: true,
      retryAfter: RESET_COOLDOWN_MS / 1000,
      // Local dev without SMTP: hand back the link so the flow is testable.
      ...(delivered ? {} : { devLink: link }),
    });
  } catch (error) {
    console.error("forgot-password error:", error);
    return NextResponse.json({ error: "Couldn't send the reset link" }, { status: 500 });
  }
}
