import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TeachersService } from './teachers.service';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('teachers')
@Controller('teachers')
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  // Public: list teachers
  @Get()
  @ApiOperation({ summary: 'Get public list of teachers' })
  async findAllPublic() {
    return this.teachersService.findPublicTeachers();
  }

  // Protected: profile and verification routes
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get teacher profile' })
  async getProfile(@Request() req) {
    return this.teachersService.getTeacherProfile(req.user.id);
  }

  @Get('verification-progress')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get verification progress' })
  async getVerificationProgress(@Request() req) {
    return this.teachersService.getVerificationProgress(req.user.id);
  }

  @Post('upload-document')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload verification document' })
  async uploadDocument(@Request() req, @Body() uploadDto: UploadDocumentDto) {
    return this.teachersService.uploadDocument(req.user.id, uploadDto);
  }

  @Get('verification-status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check verification status' })
  async checkVerificationStatus(@Request() req) {
    return this.teachersService.checkVerificationStatus(req.user.id);
  }
}
