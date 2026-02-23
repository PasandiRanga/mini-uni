import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { VerificationStatus } from '@prisma/client';

@Injectable()
export class TeachersService {
  constructor(private prisma: PrismaService) {}

  async getTeacherProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        teacherProfile: {
          include: {
            verificationDocs: true,
          },
        },
      },
    });

    if (!user || !user.teacherProfile) {
      throw new NotFoundException('Teacher profile not found');
    }

    return user.teacherProfile;
  }

  async getVerificationProgress(userId: string) {
    const profile = await this.getTeacherProfile(userId);
    
    const requiredDocs = ['ID', 'ADDRESS_PROOF', 'BANK_DETAILS'];
    const optionalDocs = ['UNIVERSITY_ID'];
    
    const uploadedDocs = profile.verificationDocs.map(doc => doc.documentType);
    const requiredUploaded = requiredDocs.filter(doc => uploadedDocs.includes(doc));
    const optionalUploaded = optionalDocs.filter(doc => uploadedDocs.includes(doc));
    
    // Base progress: 20% for basic registration
    let progress = 20;
    
    // Each required document adds 20% (3 documents = 60%)
    progress += (requiredUploaded.length / requiredDocs.length) * 60;
    
    // Optional document adds 10%
    if (optionalUploaded.length > 0) {
      progress += 10;
    }
    
    // If all documents are approved, add remaining 10%
    const allApproved = profile.verificationDocs.every(
      doc => doc.status === VerificationStatus.APPROVED
    ) && profile.verificationDocs.length >= requiredDocs.length;
    
    if (allApproved && profile.verificationStatus === VerificationStatus.APPROVED) {
      progress = 100;
    }

    return {
      progress: Math.min(progress, 100),
      requiredDocuments: requiredDocs.map(doc => ({
        type: doc,
        uploaded: uploadedDocs.includes(doc),
        status: profile.verificationDocs.find(d => d.documentType === doc)?.status || 'NOT_UPLOADED',
      })),
      optionalDocuments: optionalDocs.map(doc => ({
        type: doc,
        uploaded: uploadedDocs.includes(doc),
        status: profile.verificationDocs.find(d => d.documentType === doc)?.status || 'NOT_UPLOADED',
      })),
      verificationStatus: profile.verificationStatus,
      canStartClasses: profile.verificationStatus === VerificationStatus.APPROVED,
    };
  }

  async uploadDocument(userId: string, uploadDto: UploadDocumentDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { teacherProfile: true },
    });

    if (!user || !user.teacherProfile) {
      throw new NotFoundException('Teacher profile not found');
    }

    const validDocTypes = ['ID', 'UNIVERSITY_ID', 'ADDRESS_PROOF', 'BANK_DETAILS'];
    if (!validDocTypes.includes(uploadDto.documentType)) {
      throw new BadRequestException('Invalid document type');
    }

    // Check if document of this type already exists
    const existingDoc = await this.prisma.verificationDocument.findFirst({
      where: {
        teacherId: user.teacherProfile.id,
        documentType: uploadDto.documentType,
      },
    });

    if (existingDoc) {
      // Update existing document
      return this.prisma.verificationDocument.update({
        where: { id: existingDoc.id },
        data: {
          documentUrl: uploadDto.documentUrl,
          status: VerificationStatus.PENDING,
          rejectionReason: null,
        },
      });
    }

    // Create new document
    return this.prisma.verificationDocument.create({
      data: {
        teacherId: user.teacherProfile.id,
        documentType: uploadDto.documentType,
        documentUrl: uploadDto.documentUrl,
        status: VerificationStatus.PENDING,
      },
    });
  }

  async checkVerificationStatus(userId: string) {
    const profile = await this.getTeacherProfile(userId);
    return {
      isVerified: profile.verificationStatus === VerificationStatus.APPROVED,
      status: profile.verificationStatus,
      canStartClasses: profile.verificationStatus === VerificationStatus.APPROVED,
    };
  }

  // Public listing of teachers for use by the frontend
  async findPublicTeachers() {
    return this.prisma.user.findMany({
      where: { role: 'TEACHER', isActive: true },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        teacherProfile: {
          select: { bio: true, subjects: true, hourlyRate: true, experience: true, verificationStatus: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
