import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";

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

        return NextResponse.json({ user }, { status: 201 });
    } catch (error: any) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
