import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InquiriesService {
  constructor(private prisma: PrismaService) {}

  async findForTeacher(teacherId: string) {
    return this.prisma.inquiry.findMany({
      where: { receiverId: teacherId },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true } },
        post: { select: { id: true, title: true, subject: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}

