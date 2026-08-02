export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { minTopUp, startTopUp } from "@/lib/wallet";
import {
    PAYHERE_CHECKOUT_URL,
    PAYHERE_CURRENCIES,
    PAYHERE_LOCAL_CONFIRM,
    buildCheckout,
    buildOrderId,
    isPayHereConfigured,
} from "@/lib/payhere";
import { formatMoney } from "@/lib/currency";

/**
 * Starts a wallet top-up. The transaction is created as PENDING and only
 * credits the balance once PayHere confirms the payment at
 * /api/payments/payhere/notify.
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

        const user = await prisma.user.findUnique({
            where: { id: session.sub },
            select: { role: true, currency: true, firstName: true, lastName: true, email: true, phone: true },
        });

        if (user?.role !== "STUDENT") {
            return NextResponse.json({ error: "Only students can top up a wallet" }, { status: 403 });
        }

        const body = await request.json();
        const amount = new Prisma.Decimal(Number(body?.amount) || 0);
        const currency = user.currency || "LKR";
        const min = minTopUp(currency);

        if (!amount.isFinite() || amount.lessThanOrEqualTo(0)) {
            return NextResponse.json({ error: "Enter an amount to add" }, { status: 400 });
        }
        if (amount.lessThan(min)) {
            return NextResponse.json(
                { error: `The minimum top-up is ${formatMoney(min, currency)}` },
                { status: 400 }
            );
        }
        if (!PAYHERE_CURRENCIES.includes(currency)) {
            return NextResponse.json({ error: `PayHere can't charge in ${currency}` }, { status: 400 });
        }

        const transaction = await startTopUp(session.sub, amount);

        const checkout = buildCheckout({
            orderId: buildOrderId("TOPUP", transaction.id),
            amount,
            currency,
            items: "Wallet top-up",
            payer: {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
            },
            origin: new URL(request.url).origin,
            returnPath: "/student/dashboard?tab=wallet",
            cancelPath: "/student/dashboard?tab=wallet",
        });

        return NextResponse.json(
            {
                transactionId: transaction.id,
                orderId: checkout.order_id,
                checkout,
                checkoutUrl: PAYHERE_CHECKOUT_URL,
                localConfirm: PAYHERE_LOCAL_CONFIRM,
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("Error starting wallet top-up:", error);
        return NextResponse.json({ error: error.message || "Failed to start top-up" }, { status: 400 });
    }
}
