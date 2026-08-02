export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { parseOrderId } from "@/lib/payhere";

/**
 * Where a payment has got to, read from our own records. The checkout window
 * closes before PayHere's notification always lands, so the UI polls this for a
 * moment rather than claiming success on its own.
 */
export async function GET(
    request: Request,
    { params }: { params: { orderId: string } }
) {
    const session = await getSessionFromRequest(request);
    if (!session || !session.sub) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = parseOrderId(params.orderId);
    if (!parsed) {
        return NextResponse.json({ error: "Unknown order" }, { status: 404 });
    }

    if (parsed.purpose === "TOPUP") {
        const transaction = await prisma.walletTransaction.findUnique({
            where: { id: parsed.recordId },
            include: { wallet: { select: { userId: true } } },
        });
        if (!transaction || transaction.wallet.userId !== session.sub) {
            return NextResponse.json({ error: "Unknown order" }, { status: 404 });
        }
        return NextResponse.json({ purpose: "TOPUP", status: transaction.status, amount: transaction.amount });
    }

    const payment = await prisma.payment.findUnique({
        where: { id: parsed.recordId },
        include: { booking: { select: { studentId: true, status: true } } },
    });
    if (!payment || payment.booking.studentId !== session.sub) {
        return NextResponse.json({ error: "Unknown order" }, { status: 404 });
    }

    return NextResponse.json({
        purpose: "BOOKING",
        status: payment.status,
        amount: payment.amount,
        bookingStatus: payment.booking.status,
    });
}
