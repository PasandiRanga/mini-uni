export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/adminAuth";
import { createNotification } from "@/lib/notifications";
import { sendEmail, buildSuspensionEmail } from "@/lib/email";

/** Lifts a suspension: the teacher is APPROVED again and their classes reappear. Keyed by user id. */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const profile = await prisma.teacherProfile.findUnique({
      where: { userId: params.id },
      select: { id: true, userId: true, verificationStatus: true, user: { select: { email: true, firstName: true, notifyEmail: true } } },
    });
    if (!profile) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }
    if (profile.verificationStatus !== "SUSPENDED") {
      return NextResponse.json({ error: "Only a suspended teacher can be reinstated", code: "NOT_SUSPENDED" }, { status: 409 });
    }

    await prisma.teacherProfile.update({
      where: { id: profile.id },
      data: { verificationStatus: "APPROVED", suspensionReason: null },
    });

    await createNotification({
      userId: profile.userId,
      type: "VERIFICATION_STATUS",
      title: "You're reinstated",
      message: "Your teacher account is active again. Your classes are visible and students can book you.",
      metadata: { status: "APPROVED", reinstated: true },
    });
    if (profile.user.email && profile.user.notifyEmail !== false) {
      const mail = buildSuspensionEmail("REINSTATED", profile.user.firstName);
      sendEmail({ to: profile.user.email, ...mail }).catch((e) => console.error("Failed to send reinstatement email:", e));
    }

    return NextResponse.json({ ok: true, verificationStatus: "APPROVED" });
  } catch (error) {
    console.error("Error reinstating teacher:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
