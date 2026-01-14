import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  async findUpcomingForStudent(studentId: string) {
    return this.prisma.booking.findMany({
      where: {
        studentId,
        status: { not: 'CANCELLED' },
      },
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true } },
        timeSlot: { select: { startTime: true, endTime: true } },
        inquiry: { include: { post: { select: { title: true, subject: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async findForTeacher(teacherId: string) {
    return this.prisma.booking.findMany({
      where: {
        teacherId,
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        timeSlot: { select: { startTime: true, endTime: true } },
        inquiry: { include: { post: { select: { title: true, subject: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}

