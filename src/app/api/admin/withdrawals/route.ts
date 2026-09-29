export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { getWithdrawalsForAdmin } from "@/lib/wallet";

/**
 * Admin withdrawal queue. Defaults to PENDING; pass ?status=PROCESSING|PAID|
 * REJECTED|CANCELLED|ALL to see the rest.
 */
export async function GET(request: Request) {
  const session = await getAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = (searchParams.get("status") || "PENDING").toUpperCase();
    const items = await getWithdrawalsForAdmin(status);
    return NextResponse.json({ items, count: items.length });
  } catch (error) {
    console.error("Error listing withdrawals for admin:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
