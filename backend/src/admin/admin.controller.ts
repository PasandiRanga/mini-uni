import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Get('pending-teachers')
    @ApiOperation({ summary: 'List all teachers with pending verification' })
    async getPendingTeachers() {
        return this.adminService.getPendingTeachers();
    }

    @Post('approve-teacher/:id')
    @ApiOperation({ summary: 'Approve a teacher verification' })
    async approveTeacher(@Param('id') id: string) {
        return this.adminService.approveTeacher(id);
    }

    @Post('reject-teacher/:id')
    @ApiOperation({ summary: 'Reject a teacher verification' })
    async rejectTeacher(@Param('id') id: string, @Body('reason') reason: string) {
        return this.adminService.rejectTeacher(id, reason);
    }
}
