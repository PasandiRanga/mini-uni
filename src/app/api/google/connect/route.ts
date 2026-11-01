export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSessionFromRequest } from "@/lib/auth";
import { buildAuthUrl, isGoogleConfigured } from "@/lib/googleCalendar";

/** Sends a teacher to Google's consent screen to connect their calendar. */
export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session?.sub || session.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isGoogleConfigured()) {
    return NextResponse.json({ error: "Google Calendar isn't set up yet" }, { status: 503 });
  }

  const origin = new URL(request.url).origin;
  const state = crypto.randomBytes(16).toString("hex");

  const res = NextResponse.redirect(buildAuthUrl(origin, state));
  // Short-lived state cookie, checked on callback to block CSRF.
  res.cookies.set("g_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return res;
}
