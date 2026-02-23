import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

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
        const authHeader = request.headers.get("authorization");
        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        }
    }

    if (!token) return null;

    try {
        return await decrypt(token);
    } catch (err) {
        return null;
    }
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
