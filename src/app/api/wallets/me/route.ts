export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { getStudentWalletSnapshot, getWalletSnapshot, minTopUp, minWithdrawal } from "@/lib/wallet";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const session = await getSessionFromRequest(request);

        if (!session || !session.sub) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.sub },
            select: { currency: true, role: true },
        });
        const currency = user?.currency || "LKR";

        // A student's wallet holds spendable money; a teacher's holds earnings,
        // and reading it also clears any escrow whose class has finished.
        if (user?.role === "STUDENT") {
            const wallet = await getStudentWalletSnapshot(session.sub);
            return NextResponse.json({ ...wallet, currency, minTopUp: minTopUp(currency) });
        }

        const wallet = await getWalletSnapshot(session.sub);

        return NextResponse.json({ ...wallet, currency, minWithdrawal: minWithdrawal(currency) });
    } catch (error) {
        console.error("Error fetching wallet:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
