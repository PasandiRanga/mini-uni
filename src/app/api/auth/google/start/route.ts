export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { buildLoginAuthUrl, isGoogleAuthConfigured } from "@/lib/googleAuth";

/** Sends a user to Google's sign-in consent screen. */
export async function GET(request: Request) {
    const origin = new URL(request.url).origin;
    if (!isGoogleAuthConfigured()) {
        return NextResponse.redirect(`${origin}/auth?error=google_unavailable`);
    }

    const state = crypto.randomBytes(16).toString("hex");
    const res = NextResponse.redirect(buildLoginAuthUrl(origin, state));
    // Short-lived state cookie, checked on callback to block CSRF.
    res.cookies.set("g_login_state", state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 600,
        path: "/",
    });
    return res;
}
