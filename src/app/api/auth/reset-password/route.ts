export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";
import { sendEmail, buildPasswordChangedEmail } from "@/lib/email";
import { MIN_PASSWORD_LENGTH, resetTokenMatches } from "@/lib/passwordReset";

const findUser = (uid: unknown) =>
  typeof uid === "string" && uid
    ? prisma.user.findUnique({
        where: { id: uid },
        select: { id: true, email: true, firstName: true, emailOtp: true, emailOtpExpiry: true, notifyEmail: true },
      })
    : null;

/** GET ?uid&token — whether a reset link is still usable, so the page can say so up front. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const user = await findUser(searchParams.get("uid"));
  const valid = Boolean(user && resetTokenMatches(user.emailOtp, user.emailOtpExpiry, searchParams.get("token") || ""));
  return NextResponse.json({ valid });
}

/** POST { uid, token, password } — sets the new password and uses up the link. */
export async function POST(request: Request) {
  try {
    const { uid, token, password } = await request.json().catch(() => ({}));
    if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json({ error: `Use at least ${MIN_PASSWORD_LENGTH} characters` }, { status: 400 });
    }

    const user = await findUser(uid);
    if (!user || !resetTokenMatches(user.emailOtp, user.emailOtpExpiry, token)) {
      return NextResponse.json(
        { error: "This reset link has expired or was already used. Request a new one.", code: "INVALID_LINK" },
        { status: 400 }
      );
    }

    // Clearing the stored token makes the link single-use. Opening it proves
    // the person controls the inbox, so the email counts as verified too.
    await prisma.user.update({
      where: { id: user.id },
      data: { password: await bcrypt.hash(password, 10), emailOtp: null, emailOtpExpiry: null, emailVerified: true },
    });

    sendEmail({ to: user.email, ...buildPasswordChangedEmail(user.firstName) }).catch((e) =>
      console.error("Failed to send password-changed email:", e)
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("reset-password error:", error);
    return NextResponse.json({ error: "Couldn't reset your password" }, { status: 500 });
  }
}
