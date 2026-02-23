import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { VerificationStatus } from '@prisma/client';

@Injectable()
export class VerifiedTeacherGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    if (user.role !== 'TEACHER') {
      throw new ForbiddenException('This endpoint is only available for teachers');
    }

    // Check if teacher is verified
    const teacherProfile = await this.prisma.teacherProfile.findUnique({
      where: { userId: user.id },
    });

    if (!teacherProfile) {
      throw new ForbiddenException('Teacher profile not found');
    }

    if (teacherProfile.verificationStatus !== VerificationStatus.APPROVED) {
      throw new ForbiddenException(
        'Your account is not yet verified. Please complete the verification process before performing this action.',
      );
    }

    return true;
  }
}

