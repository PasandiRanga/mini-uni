export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { SESSION_COOKIE_OPTIONS } from "@/lib/auth";
import { googleClientId, isGoogleAuthConfigured, verifyGoogleIdToken } from "@/lib/googleAuth";
import { resolveGoogleSignIn } from "@/lib/googleSignIn";

const PENDING_COOKIE = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 900,
    path: "/",
};

/** The browser reads the public client id to initialise Google One Tap. */
export async function GET() {
    if (!isGoogleAuthConfigured()) return NextResponse.json({ clientId: null });
    return NextResponse.json({ clientId: googleClientId() });
}

/** One Tap returns a signed ID token; verify it and sign the user in. */
export async function POST(request: Request) {
    const body = await request.json().catch(() => ({}));
    const credential = typeof body?.credential === "string" ? body.credential : "";
    if (!credential) return NextResponse.json({ error: "Missing credential" }, { status: 400 });

    try {
        const profile = await verifyGoogleIdToken(credential);
        if (!profile.emailVerified) return NextResponse.json({ error: "Your Google email isn't verified" }, { status: 400 });

        const result = await resolveGoogleSignIn(profile);
        if (result.kind === "inactive") return NextResponse.json({ error: "This account has been deactivated." }, { status: 403 });

        const res = NextResponse.json({ redirect: result.redirect });
        if (result.kind === "session") {
            res.cookies.set("token", result.token, SESSION_COOKIE_OPTIONS);
        } else {
            res.cookies.set("g_signup", result.pending, PENDING_COOKIE);
        }
        return res;
    } catch (err) {
        console.error("Google One Tap failed:", err);
        return NextResponse.json({ error: "Google sign-in failed" }, { status: 401 });
    }
}
