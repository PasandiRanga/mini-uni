import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InquiriesService } from './inquiries.service';

@ApiTags('inquiries')
@Controller('inquiries')
export class InquiriesController {
  constructor(private readonly inquiriesService: InquiriesService) {}

  @Get('teacher/:teacherId')
  @ApiOperation({ summary: 'Get inquiries for a teacher' })
  async findForTeacher(@Param('teacherId') teacherId: string) {
    return this.inquiriesService.findForTeacher(teacherId);
  }
}

