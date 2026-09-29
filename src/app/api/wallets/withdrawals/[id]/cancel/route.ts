export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { cancelWithdrawal } from "@/lib/wallet";

export async function POST(request: Request, { params }: { params: { id: string } }) {
    const session = await getSessionFromRequest(request);
    if (!session || !session.sub) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const withdrawal = await cancelWithdrawal(session.sub, params.id);
        return NextResponse.json(withdrawal);
    } catch (error: any) {
        if (error?.message === "NOT_CANCELLABLE") {
            return NextResponse.json(
                { error: "This withdrawal is already being processed and can no longer be cancelled" },
                { status: 400 }
            );
        }
        console.error("Error cancelling withdrawal:", error);
        return NextResponse.json({ error: error.message || "Failed to cancel withdrawal" }, { status: 400 });
    }
}
