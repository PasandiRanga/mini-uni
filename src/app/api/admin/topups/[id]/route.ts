export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/adminAuth";
import { completeTopUp, failTopUp } from "@/lib/wallet";
import { createNotification } from "@/lib/notifications";
import { formatMoney } from "@/lib/currency";
import { sendEmail, buildNoticeEmail } from "@/lib/email";

/**
 * Admin decision on one wallet top-up request.
 * Body: { action: "approve" | "reject", note? }.
 *   - approve → credits the student's wallet (the money was received at the bank)
 *   - reject  → leaves the balance untouched and records the reason (required)
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const action = String(body?.action || "").toLowerCase();

    const tx = await prisma.walletTransaction.findUnique({
      where: { id: params.id },
      include: {
        wallet: {
          select: {
            userId: true,
            user: { select: { currency: true, email: true, notifyEmail: true } },
          },
        },
      },
    });

    if (!tx || tx.type !== "TOP_UP") {
      return NextResponse.json({ error: "Top-up request not found" }, { status: 404 });
    }
    if (tx.status !== "PENDING") {
      return NextResponse.json(
        { error: "This top-up has already been settled and can no longer be changed" },
        { status: 400 }
      );
    }

    const studentId = tx.wallet.userId;
    const currency = tx.wallet.user?.currency || "LKR";
    const amountLabel = formatMoney(tx.amount.toString(), currency);
    const studentEmail = tx.wallet.user?.email;
    const emailOptedIn = tx.wallet.user?.notifyEmail !== false;
    const origin = new URL(request.url).origin;
    const emailStudent = async (subject: string, heading: string, body: string) => {
      if (!studentEmail || !emailOptedIn) return;
      await sendEmail({
        to: studentEmail,
        ...buildNoticeEmail({ subject, heading, body, link: `${origin}/student/dashboard?tab=wallet`, cta: "Open your wallet" }),
      }).catch((e) => console.error("Failed to email top-up decision:", e));
    };

    if (action === "approve") {
      const result = await completeTopUp(tx.id);
      if (!result.credited) {
        return NextResponse.json(
          { error: "This top-up has already been settled and can no longer be changed" },
          { status: 400 }
        );
      }
      await createNotification({
        userId: studentId,
        type: "TOPUP_REVIEWED",
        title: "Top-up approved",
        message: `${amountLabel} has been added to your wallet.`,
      });
      await emailStudent("Top-up approved", "Money added to your wallet", `${amountLabel} has been added to your wallet balance.`);
      return NextResponse.json({ ok: true, credited: true, amount: result.amount });
    }

    if (action === "reject") {
      const note = typeof body?.note === "string" ? body.note.trim() : "";
      if (!note) {
        return NextResponse.json({ error: "A reason is required to reject" }, { status: 400 });
      }
      await failTopUp(tx.id, `Top-up rejected : ${note}`);
      await createNotification({
        userId: studentId,
        type: "TOPUP_REVIEWED",
        title: "Top-up not approved",
        message: `Your ${amountLabel} top-up couldn't be verified: ${note}`,
      });
      await emailStudent("Top-up not approved", "Top-up couldn't be verified", `Your ${amountLabel} top-up couldn't be verified: ${note}`);
      return NextResponse.json({ ok: true, credited: false });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Error reviewing top-up:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
