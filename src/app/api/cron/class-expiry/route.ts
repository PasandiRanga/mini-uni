export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { remindExpiringClasses } from "@/lib/classExpiry";

/**
 * Daily job (see vercel.json "crons"): reminds teachers whose classes are
 * about to stop, or have just stopped, being bookable.
 *
 * Vercel sends `Authorization: Bearer $CRON_SECRET` when CRON_SECRET is set,
 * which is then required. Without it, only Vercel's cron runner is accepted;
 * reminders are sent once per class either way.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorized = secret
    ? request.headers.get("authorization") === `Bearer ${secret}`
    : (request.headers.get("user-agent") || "").startsWith("vercel-cron");
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await remindExpiringClasses(new URL(request.url).origin);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Class expiry job failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
