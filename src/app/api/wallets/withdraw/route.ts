export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { getWalletSnapshot, minWithdrawal, requestWithdrawal } from "@/lib/wallet";
import { formatMoney } from "@/lib/currency";

export async function POST(request: Request) {
    const session = await getSessionFromRequest(request);
    if (!session || !session.sub) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.sub },
            select: { role: true, currency: true },
        });

        if (user?.role !== "TEACHER") {
            return NextResponse.json({ error: "Only teachers can withdraw earnings" }, { status: 403 });
        }

        const body = await request.json();
        const amount = new Prisma.Decimal(Number(body?.amount) || 0);
        const currency = user.currency || "LKR";
        const min = minWithdrawal(currency);

        if (!amount.isFinite() || amount.lessThanOrEqualTo(0)) {
            return NextResponse.json({ error: "Enter an amount to withdraw" }, { status: 400 });
        }
        if (amount.lessThan(min)) {
            return NextResponse.json(
                { error: `The minimum withdrawal is ${formatMoney(min, currency)}` },
                { status: 400 }
            );
        }

        // Snapshot first: it clears any escrow that has come due, so a teacher
        // whose class just ended can withdraw straight away.
        const wallet = await getWalletSnapshot(session.sub);

        if (!wallet.hasBankDetails) {
            return NextResponse.json(
                { error: "Add your bank details in Settings before withdrawing" },
                { status: 400 }
            );
        }
        if (amount.greaterThan(wallet.releasedBalance)) {
            return NextResponse.json(
                { error: `You can withdraw up to ${formatMoney(String(wallet.releasedBalance), currency)}` },
                { status: 400 }
            );
        }

        const withdrawal = await requestWithdrawal(session.sub, amount, currency);
        return NextResponse.json(withdrawal, { status: 201 });
    } catch (error: any) {
        if (error?.message === "INSUFFICIENT_FUNDS") {
            return NextResponse.json({ error: "Not enough available balance" }, { status: 400 });
        }
        console.error("Error requesting withdrawal:", error);
        return NextResponse.json({ error: error.message || "Failed to request withdrawal" }, { status: 400 });
    }
}
