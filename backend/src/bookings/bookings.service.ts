import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InquiryStatus, BookingStatus, TimeSlotStatus } from '@prisma/client';
import { GoogleMeetService } from '../google-meet/google-meet.service';
import { WalletsService } from '../wallets/wallets.service';

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private googleMeetService: GoogleMeetService,
    private walletsService: WalletsService,
  ) { }

  async findUpcomingForStudent(studentId: string) {
    return this.prisma.booking.findMany({
      where: {
        studentId,
        status: { notIn: [BookingStatus.CANCELLED, BookingStatus.COMPLETED] },
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
      where: { teacherId },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        timeSlot: { select: { startTime: true, endTime: true } },
        inquiry: { include: { post: { select: { title: true, subject: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async createBooking(userId: string, data: { inquiryId: string }) {
    const inquiry = await this.prisma.inquiry.findUnique({
      where: { id: data.inquiryId },
      include: {
        timeSlots: true,
        post: true,
      },
    });

    if (!inquiry) throw new NotFoundException('Inquiry not found');
    if (inquiry.status !== InquiryStatus.ACCEPTED) {
      throw new BadRequestException('Inquiry must be accepted by teacher before booking');
    }

    const timeSlot = inquiry.timeSlots[0];
    if (!timeSlot) throw new BadRequestException('No time slot selected for this inquiry');

    if (timeSlot.status === TimeSlotStatus.BOOKED) {
      throw new BadRequestException('Time slot is already booked');
    }

    // Create booking
    const booking = await this.prisma.booking.create({
      data: {
        inquiryId: inquiry.id,
        studentId: inquiry.senderId,
        teacherId: inquiry.receiverId,
        timeSlotId: timeSlot.id,
        status: BookingStatus.PENDING_PAYMENT,
        fee: inquiry.post.fee || 0,
      },
    });

    // Mark slot as booked
    await this.prisma.timeSlot.update({
      where: { id: timeSlot.id },
      data: { status: TimeSlotStatus.BOOKED },
    });

    return booking;
  }

  async confirmCompletion(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    const updateData: any = {};
    if (booking.studentId === userId) updateData.studentConfirmed = true;
    if (booking.teacherId === userId) updateData.teacherConfirmed = true;

    if (!updateData.studentConfirmed && !updateData.teacherConfirmed) {
      throw new ForbiddenException('Not authorized to confirm this booking');
    }

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
    });

    // If both confirmed, complete the booking and release funds
    if (updated.studentConfirmed && updated.teacherConfirmed && updated.status !== BookingStatus.COMPLETED) {
      const completedBooking = await this.prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      // Release money from escrow
      await this.walletsService.releaseEscrow(
        completedBooking.teacherId,
        completedBooking.fee,
        completedBooking.id
      );

      return completedBooking;
    }

    return updated;
  }
}
