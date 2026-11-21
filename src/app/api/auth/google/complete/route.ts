export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { encrypt, decrypt, SESSION_COOKIE_OPTIONS } from "@/lib/auth";
import { sendEmail, buildNoticeEmail } from "@/lib/email";

const readCookie = (request: Request, name: string) =>
    (request.headers.get("cookie") || "")
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith(`${name}=`))
        ?.slice(name.length + 1);

/** Reads the pending Google sign-up (set by the callback), or null. */
async function pendingSignup(request: Request) {
    const raw = readCookie(request, "g_signup");
    if (!raw) return null;
    try {
        const p = await decrypt(decodeURIComponent(raw));
        if (p?.kind !== "google_signup" || !p.email) return null;
        return p as { email: string; firstName?: string; lastName?: string };
    } catch {
        return null;
    }
}

/** The role-chooser page reads the name to greet and confirm a sign-up is in progress. */
export async function GET(request: Request) {
    const pending = await pendingSignup(request);
    if (!pending) return NextResponse.json({ error: "No sign-up in progress" }, { status: 401 });
    return NextResponse.json({ email: pending.email, firstName: pending.firstName ?? "" });
}

/** Creates the Google account with the chosen role, then signs the user in. */
export async function POST(request: Request) {
    const origin = new URL(request.url).origin;
    const pending = await pendingSignup(request);
    if (!pending) {
        return NextResponse.json({ error: "Your sign-up expired. Please start again with Google." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const wanted = String(body?.role || "").toUpperCase();
    if (wanted !== "STUDENT" && wanted !== "TEACHER") {
        return NextResponse.json({ error: "Choose student or teacher" }, { status: 400 });
    }
    const role = wanted as UserRole;

    // Guard a race: the email may have been registered since the callback.
    const existing = await prisma.user.findUnique({ where: { email: pending.email } });
    if (existing) {
        return NextResponse.json({ error: "An account with this email already exists. Try signing in." }, { status: 409 });
    }

    const user = await prisma.user.create({
        data: {
            email: pending.email,
            password: null, // Google-only account
            firstName: pending.firstName || "User",
            lastName: pending.lastName || "",
            role,
            emailVerified: true,
            ...(role === UserRole.TEACHER
                ? { teacherProfile: { create: { verificationStatus: "PENDING" } } }
                : { studentProfile: { create: {} } }),
        },
    });

    const dash = role === UserRole.TEACHER ? "/teacher/dashboard" : "/student/dashboard";
    const token = await encrypt({ sub: user.id, role: user.role });
    const res = NextResponse.json({
        user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
        redirect: dash,
    });
    res.cookies.set("token", token, SESSION_COOKIE_OPTIONS);
    res.cookies.set("g_signup", "", { maxAge: 0, path: "/" });

    sendEmail({
        to: user.email,
        ...buildNoticeEmail({
            subject: "Welcome to MiniUni",
            heading: `Welcome, ${user.firstName}!`,
            body:
                role === UserRole.TEACHER
                    ? "Your account is ready. Complete your teaching profile to start offering classes."
                    : "Your account is ready. Browse teachers and book your first class whenever you like.",
            link: `${origin}${dash}`,
            cta: "Open MiniUni",
        }),
    }).catch((err) => console.error("Welcome email failed:", err));

    return res;
}
