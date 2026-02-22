import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PostType } from '@prisma/client';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) { }

  async findAll(filter?: { type?: string; subject?: string; userId?: string }) {
    const where: any = { isActive: true };
    if (filter?.type) where.type = filter.type;
    if (filter?.subject) where.subject = filter.subject;
    if (filter?.userId) where.userId = filter.userId;

    return this.prisma.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
        timeSlots: true,
      },
      take: 50,
    });
  }

  async findByUser(userId: string) {
    return this.prisma.post.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { timeSlots: true },
    });
  }

  async findById(id: string) {
    return this.prisma.post.findUnique({ where: { id }, include: { timeSlots: true, user: true } });
  }

  async create(user: any, data: any) {
    const { role, id: userId } = user;

    // Infer post type from authenticated user's role and override client-provided type
    let inferredType: PostType;
    if (role === 'STUDENT') inferredType = PostType.STUDENT_REQUEST;
    else if (role === 'TEACHER') inferredType = PostType.TEACHER_OFFERING;
    else inferredType = (data.type as PostType) || PostType.STUDENT_REQUEST;

    // If teacher is creating a TEACHER_OFFERING, ensure teacher is verified
    if (role === 'TEACHER' && inferredType === PostType.TEACHER_OFFERING) {
      const isVerified = await this.isTeacherVerified(userId);
      if (!isVerified) {
        throw new Error('Teacher account not verified to create offerings');
      }
    }

    // Sanitize payload for student requests: remove offering-specific fields
    let payload: any = {
      userId,
      type: inferredType,
      title: data.title,
      description: data.description,
      subject: data.subject,
      isActive: true,
    };

    if (inferredType === PostType.STUDENT_REQUEST) {
      // Students specific fields
      payload.grade = data.grade || null;
      payload.syllabus = data.syllabus || null;
    } else {
      // Teacher specific fields
      payload.fee = data.fee != null ? Number(data.fee) : null;
      payload.experience = data.experience != null ? Number(data.experience) : null;
      payload.locationLat = data.locationLat || null;
      payload.locationLng = data.locationLng || null;
    }

    const post = await this.prisma.post.create({ data: payload });

    // Optionally create timeslots for teacher offerings if provided and valid
    if (inferredType === PostType.TEACHER_OFFERING && data.availabilitySlots && Array.isArray(data.availabilitySlots)) {
      for (const slot of data.availabilitySlots) {
        if (slot.start && slot.end) {
          await this.prisma.timeSlot.create({
            data: {
              postId: post.id,
              startTime: new Date(slot.start),
              endTime: new Date(slot.end)
            }
          });
        }
      }
    }

    return post;
  }

  async update(user: any, postId: string, data: any) {
    const { role, id: userId } = user;

    // ensure ownership
    const existing = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!existing) throw new Error('Post not found');
    if (existing.userId !== userId) throw new Error('Forbidden');

    if (role === 'TEACHER') {
      const isVerified = await this.isTeacherVerified(userId);
      if (!isVerified) throw new Error('Teacher account not verified to modify offerings');
    }

    // Sanitize update data based on role/type
    const updateData: any = { ...data };
    delete updateData.id;
    delete updateData.userId;
    delete updateData.type; // cannot change type
    delete updateData.createdAt;
    delete updateData.updatedAt;

    if (role === 'STUDENT') {
      delete updateData.fee;
      delete updateData.experience;
      delete updateData.locationLat;
      delete updateData.locationLng;
    }

    const updated = await this.prisma.post.update({ where: { id: postId }, data: updateData });
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

