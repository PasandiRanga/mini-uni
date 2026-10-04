import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";
import { encrypt } from "@/lib/auth";

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
        });

        // Distinct codes so the login page can point unregistered emails to
        // sign-up instead of a generic failure.
        if (!user) {
            return NextResponse.json(
                { error: "No account found with this email.", code: "ACCOUNT_NOT_FOUND" },
                { status: 404 }
            );
        }
        if (!user.isActive) {
            return NextResponse.json(
                { error: "This account has been deactivated.", code: "ACCOUNT_INACTIVE" },
                { status: 403 }
            );
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return NextResponse.json(
                { error: "Incorrect password.", code: "WRONG_PASSWORD" },
                { status: 401 }
            );
        }

        // Generate JWT token
        const token = await encrypt({
            sub: user.id,
            role: user.role,
        });

        const response = NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
            },
            token,
        }, { status: 200 });

        // Set cookie
        response.cookies.set("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24, // 1 day
            path: "/",
        });

        return response;
    } catch (error: any) {
        console.error("Login error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
