import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TeachersService } from './teachers.service';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('teachers')
@Controller('teachers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get teacher profile' })
  async getProfile(@Request() req) {
    return this.teachersService.getTeacherProfile(req.user.id);
  }

  @Get('verification-progress')
  @ApiOperation({ summary: 'Get verification progress' })
  async getVerificationProgress(@Request() req) {
    return this.teachersService.getVerificationProgress(req.user.id);
  }

  @Post('upload-document')
  @ApiOperation({ summary: 'Upload verification document' })
  async uploadDocument(@Request() req, @Body() uploadDto: UploadDocumentDto) {
    return this.teachersService.uploadDocument(req.user.id, uploadDto);
  }

  @Get('verification-status')
  @ApiOperation({ summary: 'Check verification status' })
  async checkVerificationStatus(@Request() req) {
    return this.teachersService.checkVerificationStatus(req.user.id);
  }
}
