import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { getWalletForUser } from "@/lib/wallet";

export async function GET(request: Request) {
    try {
        const session = await getSessionFromRequest(request);

        if (!session || !session.sub) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const wallet = await getWalletForUser(session.sub);
        return NextResponse.json(wallet);
    } catch (error) {
        console.error("Error fetching wallet:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
