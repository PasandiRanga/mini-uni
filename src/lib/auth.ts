import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import prisma from "./prisma";

const secretKey = process.env.JWT_SECRET || "default-secret-key-change-me";
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("24h")
        .sign(key);
}

export async function decrypt(input: string): Promise<any> {
    const { payload } = await jwtVerify(input, key, {
        algorithms: ["HS256"],
    });
    return payload;
}

/** Cookie settings for the session token, shared by login, sign-up and password changes. */
export const SESSION_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24, // 1 day, matching the token's expiry
    path: "/",
};

/*
 * Signing out other devices: changing or resetting a password stamps
 * User.passwordChangedAt, and any token issued before that is rejected.
 * The stamp is cached briefly per user so this isn't a query on every request.
 */
const CHANGED_AT_TTL_MS = 60_000;
const changedAtCache = new Map<string, { at: number | null; fetched: number }>();

async function passwordChangedAt(userId: string): Promise<number | null> {
    const hit = changedAtCache.get(userId);
    if (hit && Date.now() - hit.fetched < CHANGED_AT_TTL_MS) return hit.at;
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { passwordChangedAt: true } });
    const at = u?.passwordChangedAt?.getTime() ?? null;
    changedAtCache.set(userId, { at, fetched: Date.now() });
    return at;
}

/** Call after changing a password so this server instance stops trusting older tokens at once. */
export function forgetPasswordChange(userId: string) {
    changedAtCache.delete(userId);
}

async function isRevoked(payload: any): Promise<boolean> {
    if (!payload?.sub || typeof payload.iat !== "number") return false;
    try {
        const changedAt = await passwordChangedAt(String(payload.sub));
        // iat is in whole seconds; a token from the same second as the change still counts.
        return changedAt != null && payload.iat < Math.floor(changedAt / 1000);
    } catch (err) {
        // e.g. the passwordChangedAt column hasn't been added yet: never lock everyone out over it.
        console.error("Session revocation check failed; allowing the session:", err);
        return false;
    }
}

export async function getSession() {
    const token = cookies().get("token")?.value;
    if (!token) return null;
    try {
        return await decrypt(token);
    } catch (err) {
        return null;
    }
}

export async function getSessionFromRequest(request: NextRequest | Request) {
    let token: string | undefined;

    if (request instanceof NextRequest) {
        token = request.cookies.get("token")?.value;
    }

    if (!token) {
        // Plain Request objects don't expose .cookies — parse the header directly
        const cookieHeader = request.headers.get("cookie");
        if (cookieHeader) {
            const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
            if (match) token = decodeURIComponent(match[1]);
        }
    }

    if (!token) {
        const authHeader = request.headers.get("authorization");
        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        }
    }

    if (!token) return null;

    let payload: any;
    try {
        payload = await decrypt(token);
    } catch (err) {
        return null;
    }
    return (await isRevoked(payload)) ? null : payload;
}

export async function updateSession(request: NextRequest) {
    const token = request.cookies.get("token")?.value;
    if (!token) return;

    // Refresh the session so it doesn't expire
    const parsed = await decrypt(token);
    parsed.expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const res = NextResponse.next();
    res.cookies.set({
        name: "token",
        value: await encrypt(parsed),
        httpOnly: true,
        expires: parsed.expires,
    });
    return res;
}
