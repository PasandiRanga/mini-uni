import prisma from "./prisma";
import { encrypt } from "./auth";
import type { GoogleProfile } from "./googleAuth";

const dashboardFor = (role: string) =>
    role === "ADMIN" ? "/admin" : role === "TEACHER" ? "/teacher/dashboard" : "/student/dashboard";

export type GoogleSignInResult =
    | { kind: "inactive" }
    | { kind: "session"; token: string; redirect: string }
    | { kind: "signup"; pending: string; redirect: string };

/**
 * Turns a verified Google profile into a sign-in decision, shared by the OAuth
 * redirect callback and One Tap:
 * - a matching active account  -> a session token (links + verifies the email)
 * - no account yet             -> a short-lived signup token; pick a role next
 * The caller sets the returned token as the right cookie.
 */
export async function resolveGoogleSignIn(profile: GoogleProfile): Promise<GoogleSignInResult> {
    const user = await prisma.user.findUnique({ where: { email: profile.email } });

    if (user) {
        if (!user.isActive) return { kind: "inactive" };
        if (!user.emailVerified) {
            await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } });
        }
        const token = await encrypt({ sub: user.id, role: user.role });
        return { kind: "session", token, redirect: dashboardFor(user.role) };
    }

    const pending = await encrypt({
        kind: "google_signup",
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
    });
    return { kind: "signup", pending, redirect: "/auth/complete" };
}
