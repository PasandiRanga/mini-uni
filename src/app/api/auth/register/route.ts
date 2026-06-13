import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { encrypt } from "@/lib/auth";

export async function POST(request: Request) {
    try {
        const { email, password, firstName, lastName, phone, role } = await request.json();

        // Basic validation
        if (!email || !password || !firstName || !lastName || !role) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "User with this email already exists" },
                { status: 409 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                firstName,
                lastName,
                phone,
                role: role as UserRole,
                isActive: true,
                ...(role === UserRole.TEACHER && {
                    teacherProfile: {
                        create: {
                            verificationStatus: "PENDING",
                        },
                    },
                }),
                ...(role === UserRole.STUDENT && {
                    studentProfile: {
                        create: {},
                    },
                }),
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: true,
                isActive: true,
                createdAt: true,
            },
        });

        // Issue session immediately so the user lands signed-in after sign-up
        const token = await encrypt({
            sub: user.id,
            role: user.role,
        });

        const response = NextResponse.json({ user, token }, { status: 201 });

        response.cookies.set("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24, // 1 day
            path: "/",
        });

        return response;
    } catch (error: any) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
