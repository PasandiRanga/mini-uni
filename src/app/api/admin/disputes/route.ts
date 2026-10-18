export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { getDisputesForAdmin } from "@/lib/disputes";

/** Reported classes for the admin console. ?scope=open (default) | resolved. */
export async function GET(request: Request) {
  const session = await getAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const scope = new URL(request.url).searchParams.get("scope") === "resolved" ? "resolved" : "open";
    return NextResponse.json(await getDisputesForAdmin(scope));
  } catch (error) {
    console.error("Error fetching disputes:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
