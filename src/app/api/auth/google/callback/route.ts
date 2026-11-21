export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { SESSION_COOKIE_OPTIONS } from "@/lib/auth";
import { exchangeCodeForProfile } from "@/lib/googleAuth";
import { resolveGoogleSignIn } from "@/lib/googleSignIn";

const readCookie = (request: Request, name: string) =>
    (request.headers.get("cookie") || "")
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith(`${name}=`))
        ?.slice(name.length + 1);

const PENDING_COOKIE = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 900, // 15 minutes to pick a role
    path: "/",
};

/** Google redirects the user back here with a one-time code. */
export async function GET(request: Request) {
    const origin = new URL(request.url).origin;
    const fail = (reason: string) => NextResponse.redirect(`${origin}/auth?error=${reason}`);

    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const cookieState = readCookie(request, "g_login_state");

    if (url.searchParams.get("error")) return fail("google_denied");
    if (!code || !state || !cookieState || state !== cookieState) return fail("google_error");

    try {
        const profile = await exchangeCodeForProfile(code, origin);
        if (!profile.emailVerified) return fail("google_unverified");

        const result = await resolveGoogleSignIn(profile);
        if (result.kind === "inactive") return fail("account_inactive");

        const res = NextResponse.redirect(`${origin}${result.redirect}`);
        res.cookies.set("g_login_state", "", { maxAge: 0, path: "/" });
        if (result.kind === "session") {
            res.cookies.set("token", result.token, SESSION_COOKIE_OPTIONS);
        } else {
            res.cookies.set("g_signup", result.pending, PENDING_COOKIE);
        }
        return res;
    } catch (err) {
        console.error("Google login callback failed:", err);
        return fail("google_error");
    }
}
