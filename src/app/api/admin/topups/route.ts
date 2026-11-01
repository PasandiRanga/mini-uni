export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { getTopUpRequestsForAdmin } from "@/lib/wallet";

/**
 * Admin wallet top-up queue. Defaults to PENDING; pass ?status=COMPLETED|FAILED|
 * ALL to see the rest.
 */
export async function GET(request: Request) {
  const session = await getAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = (searchParams.get("status") || "PENDING").toUpperCase();
    const items = await getTopUpRequestsForAdmin(status);
    return NextResponse.json({ items, count: items.length });
  } catch (error) {
    console.error("Error listing top-ups for admin:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
