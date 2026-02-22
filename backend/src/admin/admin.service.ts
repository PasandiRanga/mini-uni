import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VerificationStatus, UserRole } from '@prisma/client';

@Injectable()
export class AdminService {
    constructor(private prisma: PrismaService) { }

    async getPendingTeachers() {
        return this.prisma.user.findMany({
            where: {
                role: UserRole.TEACHER,
                teacherProfile: {
                    verificationStatus: VerificationStatus.PENDING,
                },
            },
            include: {
                teacherProfile: {
                    include: {
                        verificationDocs: true,
                    },
                },
            },
        });
    }

    async approveTeacher(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { teacherProfile: true },
        });

        if (!user || !user.teacherProfile) {
            throw new NotFoundException('Teacher profile not found');
        }

        // Update teacher profile status
        await this.prisma.teacherProfile.update({
            where: { id: user.teacherProfile.id },
            data: { verificationStatus: VerificationStatus.APPROVED },
        });

        // Also approve all pending documents
        await this.prisma.verificationDocument.updateMany({
            where: {
                teacherId: user.teacherProfile.id,
                status: VerificationStatus.PENDING
            },
            data: { status: VerificationStatus.APPROVED },
        });

        return { success: true, message: 'Teacher approved successfully' };
    }

    async rejectTeacher(userId: string, reason: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { teacherProfile: true },
        });

        if (!user || !user.teacherProfile) {
            throw new NotFoundException('Teacher profile not found');
        }

        await this.prisma.teacherProfile.update({
            where: { id: user.teacherProfile.id },
            data: { verificationStatus: VerificationStatus.REJECTED },
        });

        // Mark pending docs as rejected
        await this.prisma.verificationDocument.updateMany({
            where: {
                teacherId: user.teacherProfile.id,
                status: VerificationStatus.PENDING
            },
            data: {
                status: VerificationStatus.REJECTED,
                rejectionReason: reason
            },
        });

        return { success: true, message: 'Teacher rejected' };
    }
}
