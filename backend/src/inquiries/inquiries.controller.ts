import { Controller, Get, Post, Body, Param, Patch, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InquiriesService } from './inquiries.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InquiryStatus } from '@prisma/client';

@ApiTags('inquiries')
@Controller('inquiries')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InquiriesController {
  constructor(private readonly inquiriesService: InquiriesService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new inquiry' })
  async create(@Req() req, @Body() data: { postId: string; message: string; timeSlotId?: string }) {
    return this.inquiriesService.createInquiry(req.user.id, data);
  }

  @Get('teacher/:teacherId')
  @ApiOperation({ summary: 'Get inquiries for a teacher' })
  async findForTeacher(@Param('teacherId') teacherId: string) {
    return this.inquiriesService.findForTeacher(teacherId);
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Get inquiries for a student' })
  async findForStudent(@Param('studentId') studentId: string) {
    return this.inquiriesService.findForStudent(studentId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update inquiry status' })
  async updateStatus(
    @Req() req,
    @Param('id') id: string,
    @Body('status') status: InquiryStatus,
  ) {
    return this.inquiriesService.updateStatus(req.user.id, id, status);
  }
}

