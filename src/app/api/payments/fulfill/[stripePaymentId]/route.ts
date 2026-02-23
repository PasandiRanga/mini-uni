import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
    request: Request,
    { params }: { params: { stripePaymentId: string } }
) {
    try {
        const { stripePaymentId } = params;

        const payment = await prisma.payment.findUnique({
            where: { stripePaymentId },
            include: { booking: true },
        });

        if (!payment) {
            return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
        }

        // Update payment status
        await prisma.payment.update({
            where: { id: payment.id },
            data: { status: "COMPLETED" },
        });

        // Update booking status
        await prisma.booking.update({
            where: { id: payment.bookingId },
            data: { status: "CONFIRMED" },
        });

        // Handle wallet logic: increment teacher's pending balance
        const wallet = await prisma.wallet.findUnique({
            where: { userId: payment.booking.teacherId },
        });

        if (wallet) {
            await prisma.wallet.update({
                where: { id: wallet.id },
                data: {
                    pendingBalance: { increment: payment.amount },
                    transactions: {
                        create: {
                            amount: payment.amount,
                            type: "DEPOSIT",
                            status: "COMPLETED",
                            description: `Pending payment for booking ${payment.bookingId}`,
                            bookingId: payment.bookingId,
                        },
                    },
                },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error fulfilling payment:", error);
        return NextResponse.json({ error: error.message || "Failed to fulfill payment" }, { status: 400 });
    }
}
