import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "mock_key", {
    apiVersion: "2023-10-16" as any,
});

export async function POST(request: Request) {
    const session = await getSessionFromRequest(request);
    if (!session || !session.sub) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { bookingId } = await request.json();

        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: { teacher: true, student: true },
        });

        if (!booking) {
            return NextResponse.json({ error: "Booking not found" }, { status: 404 });
        }

        // Create payment intent
        const intent = await stripe.paymentIntents.create({
            amount: Math.round(Number(booking.fee) * 100), // amount in cents
            currency: "usd",
            metadata: { bookingId },
        });

        // Create payment record in DB
        await prisma.payment.create({
            data: {
                bookingId,
                amount: booking.fee,
                stripePaymentId: intent.id,
                status: "PENDING",
            },
        });

        return NextResponse.json({
            clientSecret: intent.client_secret,
            publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
        });
    } catch (error: any) {
        console.error("Error creating payment intent:", error);
        return NextResponse.json({ error: error.message || "Failed to create payment" }, { status: 400 });
    }
}
