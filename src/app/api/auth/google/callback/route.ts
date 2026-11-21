export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { encrypt, SESSION_COOKIE_OPTIONS } from "@/lib/auth";
import { exchangeCodeForProfile } from "@/lib/googleAuth";

const readCookie = (request: Request, name: string) =>
    (request.headers.get("cookie") || "")
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith(`${name}=`))
        ?.slice(name.length + 1);

const dashboardFor = (role: string) =>
    role === "ADMIN" ? "/admin" : role === "TEACHER" ? "/teacher/dashboard" : "/student/dashboard";

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

        const user = await prisma.user.findUnique({ where: { email: profile.email } });

        // Existing account: sign in. Google has verified the email, so link it.
        if (user) {
            if (!user.isActive) return fail("account_inactive");
            if (!user.emailVerified) {
                await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } });
            }
            const token = await encrypt({ sub: user.id, role: user.role });
            const res = NextResponse.redirect(`${origin}${dashboardFor(user.role)}`);
            res.cookies.set("token", token, SESSION_COOKIE_OPTIONS);
            res.cookies.set("g_login_state", "", { maxAge: 0, path: "/" });
            return res;
        }

        // New account: hold the verified profile in a short-lived cookie and let
        // the user choose student or teacher before the account is created.
        const pending = await encrypt({
            kind: "google_signup",
            email: profile.email,
            firstName: profile.firstName,
            lastName: profile.lastName,
        });
        const res = NextResponse.redirect(`${origin}/auth/complete`);
        res.cookies.set("g_signup", pending, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 900, // 15 minutes to pick a role
            path: "/",
        });
        res.cookies.set("g_login_state", "", { maxAge: 0, path: "/" });
        return res;
    } catch (err) {
        console.error("Google login callback failed:", err);
        return fail("google_error");
    }
}
