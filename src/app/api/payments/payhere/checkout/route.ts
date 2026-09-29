export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import {
  PAYHERE_CHECKOUT_URL,
  PAYHERE_CURRENCIES,
  PAYHERE_LOCAL_CONFIRM,
  buildCheckout,
  buildOrderId,
  isPayHereConfigured,
} from "@/lib/payhere";

/**
 * Starts a PayHere checkout for a class. Returns the signed payment object the
 * browser hands to `payhere.startPayment` — the booking is only marked paid
 * once PayHere notifies us at /api/payments/payhere/notify.
 */
export async function POST(request: Request) {
    const session = await getSessionFromRequest(request);
    if (!session || !session.sub) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        if (!isPayHereConfigured()) {
            return NextResponse.json({ error: "Payments aren't set up yet" }, { status: 503 });
        }

        const { bookingId } = await request.json();

        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                payment: true,
                student: true,
                inquiry: { select: { post: { select: { title: true, subject: true } } } },
            },
        });

        if (!booking) {
            return NextResponse.json({ error: "Booking not found" }, { status: 404 });
        }
        if (booking.studentId !== session.sub) {
            return NextResponse.json({ error: "This booking isn't yours" }, { status: 403 });
        }
        if (booking.status === "CANCELLED") {
            return NextResponse.json({ error: "This class has been cancelled" }, { status: 400 });
        }
        if (booking.payment?.status === "COMPLETED") {
            return NextResponse.json({ error: "This class has already been paid for" }, { status: 400 });
        }

        const currency = booking.student.currency || "LKR";
        if (!PAYHERE_CURRENCIES.includes(currency)) {
            return NextResponse.json({ error: `PayHere can't charge in ${currency}` }, { status: 400 });
        }

        const amount = new Prisma.Decimal(booking.fee);

        // One payment row per booking, reused across retries — its id is the
        // order id PayHere reports back with.
        const payment = await prisma.payment.upsert({
            where: { bookingId: booking.id },
            create: { bookingId: booking.id, amount, currency, status: "PENDING" },
            update: { amount, currency, status: "PENDING" },
        });

        const checkout = buildCheckout({
            orderId: buildOrderId("BOOKING", payment.id),
            amount,
            currency,
            items: booking.inquiry?.post?.title || booking.inquiry?.post?.subject || "Class booking",
            payer: {
                firstName: booking.student.firstName,
                lastName: booking.student.lastName,
                email: booking.student.email,
                phone: booking.student.phone,
            },
            origin: new URL(request.url).origin,
            returnPath: "/student/dashboard?tab=classes",
            cancelPath: "/student/dashboard?tab=classes",
        });

        return NextResponse.json(
            {
                paymentId: payment.id,
                orderId: checkout.order_id,
                checkout,
                checkoutUrl: PAYHERE_CHECKOUT_URL,
                localConfirm: PAYHERE_LOCAL_CONFIRM,
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("Error starting PayHere checkout:", error);
        return NextResponse.json({ error: error.message || "Failed to start payment" }, { status: 400 });
    }
}
