import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';

@ApiTags('bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('student/:studentId/upcoming')
  @ApiOperation({ summary: 'Get upcoming bookings for a student (public)' })
  async upcomingForStudent(@Param('studentId') studentId: string) {
    return this.bookingsService.findUpcomingForStudent(studentId);
  }

  @Get('teacher/:teacherId')
  @ApiOperation({ summary: 'Get bookings for a teacher' })
  async findForTeacher(@Param('teacherId') teacherId: string) {
    return this.bookingsService.findForTeacher(teacherId);
  }
}

