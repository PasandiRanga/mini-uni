import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InquiryStatus } from '@prisma/client';

@Injectable()
export class InquiriesService {
  constructor(private prisma: PrismaService) { }

  async findForTeacher(teacherId: string) {
    return this.prisma.inquiry.findMany({
      where: { receiverId: teacherId },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true } },
        post: { select: { id: true, title: true, subject: true } },
        timeSlots: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async findForStudent(studentId: string) {
    return this.prisma.inquiry.findMany({
      where: { senderId: studentId },
      include: {
        receiver: { select: { id: true, firstName: true, lastName: true } },
        post: { select: { id: true, title: true, subject: true } },
        timeSlots: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async createInquiry(senderId: string, data: { postId: string; message: string; timeSlotId?: string }) {
    const post = await this.prisma.post.findUnique({ where: { id: data.postId } });
    if (!post) throw new NotFoundException('Post not found');

    return this.prisma.inquiry.create({
      data: {
        postId: data.postId,
        senderId,
        receiverId: post.userId,
        message: data.message,
        status: InquiryStatus.PENDING,
        ...(data.timeSlotId && {
          timeSlots: {
            connect: { id: data.timeSlotId },
          },
        }),
      },
    });
  }

  async updateStatus(userId: string, inquiryId: string, status: InquiryStatus) {
    const inquiry = await this.prisma.inquiry.findUnique({
      where: { id: inquiryId },
      include: { post: true }
    });

    if (!inquiry) throw new NotFoundException('Inquiry not found');

    // Only receiver can respond/accept/reject
    if (inquiry.receiverId !== userId && status !== InquiryStatus.CANCELLED) {
      throw new ForbiddenException('Only the receiver can update this inquiry status');
    }

    // Only sender can cancel
    if (status === InquiryStatus.CANCELLED && inquiry.senderId !== userId) {
      throw new ForbiddenException('Only the sender can cancel this inquiry');
    }

    return this.prisma.inquiry.update({
      where: { id: inquiryId },
      data: { status },
    });
  }
}

