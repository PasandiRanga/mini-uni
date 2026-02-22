import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('bookings')
@Controller('bookings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) { }

  @Post()
  @ApiOperation({ summary: 'Create a booking from an inquiry' })
  async create(@Req() req, @Body('inquiryId') inquiryId: string) {
    return this.bookingsService.createBooking(req.user.id, { inquiryId });
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Confirm class completion (by student or teacher)' })
  async confirm(@Req() req, @Param('id') id: string) {
    return this.bookingsService.confirmCompletion(req.user.id, id);
  }

  @Get('student/:studentId/upcoming')
  @ApiOperation({ summary: 'Get upcoming bookings for a student' })
  async upcomingForStudent(@Param('studentId') studentId: string) {
    return this.bookingsService.findUpcomingForStudent(studentId);
  }

  @Get('teacher/:teacherId')
  @ApiOperation({ summary: 'Get bookings for a teacher' })
  async findForTeacher(@Param('teacherId') teacherId: string) {
    return this.bookingsService.findForTeacher(teacherId);
  }
}

