export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { PAYHERE_LOCAL_CONFIRM, PAYHERE_STATUS, applyPayHereResult, parseOrderId } from "@/lib/payhere";

/**
 * Development-only stand-in for PayHere's notification.
 *
 * PayHere can't reach a notify_url on localhost, which would leave sandbox
 * payments stuck as pending. This marks the order paid without a gateway
 * signature, so it is refused unless PAYHERE_SANDBOX is on *and*
 * PAYHERE_ALLOW_LOCAL_CONFIRM is explicitly set — never enable it in
 * production, where the notification is the only thing that settles a payment.
 */
export async function POST(
    request: Request,
    { params }: { params: { orderId: string } }
) {
    if (!PAYHERE_LOCAL_CONFIRM) {
        return NextResponse.json({ error: "Not available" }, { status: 404 });
    }

    const session = await getSessionFromRequest(request);
    if (!session || !session.sub) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = parseOrderId(params.orderId);
    if (!parsed) {
        return NextResponse.json({ error: "Unknown order" }, { status: 404 });
    }

    // Even in sandbox, only the person who started the payment can confirm it.
    const owned = parsed.purpose === "TOPUP"
        ? await prisma.walletTransaction.findFirst({
            where: { id: parsed.recordId, wallet: { userId: session.sub } },
            select: { id: true },
        })
        : await prisma.payment.findFirst({
            where: { id: parsed.recordId, booking: { studentId: session.sub } },
            select: { id: true },
        });

    if (!owned) {
        return NextResponse.json({ error: "Unknown order" }, { status: 404 });
    }

    try {
        const result = await applyPayHereResult({
            orderId: params.orderId,
            statusCode: PAYHERE_STATUS.SUCCESS,
            method: "SANDBOX",
        });
        return NextResponse.json({ success: true, ...result });
    } catch (error: any) {
        console.error("Error confirming sandbox payment:", error);
        return NextResponse.json({ error: error.message || "Failed to confirm" }, { status: 400 });
    }
}
