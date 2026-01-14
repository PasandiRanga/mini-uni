import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PostType } from '@prisma/client';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filter?: { type?: string; subject?: string }) {
    const where: any = { isActive: true };
    if (filter?.type) where.type = filter.type;
    if (filter?.subject) where.subject = filter.subject;

    return this.prisma.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
      take: 50,
    });
  }

  async create(userId: string, data: any) {
    // data should include type, title, description, subject, grade, fee, mode, location, availabilitySlots
    const payload: any = {
      userId,
      type: data.type as PostType || 'TEACHER_OFFERING',
      title: data.title,
      description: data.description,
      subject: data.subject,
      grade: data.grade || null,
      syllabus: data.syllabus || null,
      fee: data.fee != null ? Number(data.fee) : null,
      experience: data.experience || null,
      locationLat: data.locationLat || null,
      locationLng: data.locationLng || null,
      isActive: true,
    };

    const post = await this.prisma.post.create({ data: payload });

    // Optionally create timeslots for teacher offerings if provided
    if (data.availabilitySlots && Array.isArray(data.availabilitySlots)) {
      for (const slot of data.availabilitySlots) {
        await this.prisma.timeSlot.create({ data: { postId: post.id, startTime: new Date(slot.start), endTime: new Date(slot.end) } });
      }
    }

    return this.findAll();
  }

  async update(userId: string, postId: string, data: any) {
    // ensure ownership
    const existing = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!existing || existing.userId !== userId) throw new Error('Not found or forbidden');

    const updated = await this.prisma.post.update({ where: { id: postId }, data });
    return updated;
  }

  async remove(userId: string, postId: string) {
    const existing = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!existing || existing.userId !== userId) throw new Error('Not found or forbidden');
    await this.prisma.post.update({ where: { id: postId }, data: { isActive: false } });
    return { success: true };
  }

  // Helper to check whether a given user (teacher) is verified
  async isTeacherVerified(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { teacherProfile: { select: { verificationStatus: true } } },
    });
    return !!(user?.teacherProfile && user.teacherProfile.verificationStatus === 'APPROVED');
  }
}

