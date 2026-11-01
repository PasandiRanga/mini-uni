export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { minTopUp, startTopUp } from "@/lib/wallet";
import { storeImage, ImageError } from "@/lib/blob";
import { notifyAdminsOfTopUp } from "@/lib/adminAlerts";
import { formatMoney } from "@/lib/currency";

/**
 * Starts a wallet top-up by bank deposit. The student sends money to the
 * MiniUni account (see lib/bankDeposit) and uploads the slip here. The
 * transaction is created as PENDING and only credits the balance once an admin
 * verifies the amount at /api/admin/topups/[id]. No card gateway is involved.
 */
export async function POST(request: Request) {
    const session = await getSessionFromRequest(request);
    if (!session || !session.sub) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.sub },
            select: { role: true, currency: true, firstName: true, lastName: true },
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

        // The deposit slip proves the money was sent — it's what the admin checks.
        let slipUrl: string | null;
        try {
            slipUrl = await storeImage(body?.slip, `topups/${session.sub}`);
        } catch (err) {
            if (err instanceof ImageError) {
                return NextResponse.json({ error: err.message }, { status: 400 });
            }
            throw err;
        }
        if (!slipUrl) {
            return NextResponse.json({ error: "Upload a photo of your deposit slip" }, { status: 400 });
        }

        const transaction = await startTopUp(session.sub, amount, slipUrl);

        const studentName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "A student";
        await notifyAdminsOfTopUp({ studentName, amount, currency });

        return NextResponse.json(
            { transactionId: transaction.id, status: transaction.status },
            { status: 201 }
        );
    } catch (error: any) {
        if (error?.code === "P2000" || error?.message?.includes("413")) {
            return NextResponse.json({ error: "That image is too large. Try a smaller photo." }, { status: 400 });
        }
        console.error("Error starting wallet top-up:", error);
        return NextResponse.json({ error: error.message || "Failed to start top-up" }, { status: 400 });
    }
}
