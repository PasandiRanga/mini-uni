export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { abandonTopUp } from "@/lib/wallet";

/** Drops a top-up the student closed the checkout on, so it stops showing as pending. */
export async function DELETE(
    request: Request,
    { params }: { params: { transactionId: string } }
) {
    const session = await getSessionFromRequest(request);
    if (!session || !session.sub) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await abandonTopUp(params.transactionId, session.sub);
    return NextResponse.json(result);
}
