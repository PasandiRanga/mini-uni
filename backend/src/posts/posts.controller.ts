import { Controller, Get, Query, Post, Body, UseGuards, Request, Put, Param, Delete, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @ApiOperation({ summary: 'Get list of active posts (public)' })
  async findAll(@Query('type') type?: string, @Query('subject') subject?: string) {
    return this.postsService.findAll({ type, subject });
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a post (authenticated)' })
  async create(@Request() req, @Body() body: any) {
    const user = req.user;

    if (!user || !user.role) {
      throw new ForbiddenException('Unauthorized');
    }

    // Infer post type from authenticated user's role and override client-provided type
    let inferredType: string;
    if (user.role === 'STUDENT') inferredType = 'STUDENT_REQUEST';
    else if (user.role === 'TEACHER') inferredType = 'TEACHER_OFFERING';
    else inferredType = body.type || 'STUDENT_REQUEST';

    // If teacher is creating a TEACHER_OFFERING, ensure teacher is verified
    if (user.role === 'TEACHER' && inferredType === 'TEACHER_OFFERING') {
      const isVerified = await this.postsService.isTeacherVerified(user.id);
      if (!isVerified) {
        throw new ForbiddenException('Teacher account not verified to create offerings');
      }
    }

    // Sanitize payload for student requests: remove offering-specific fields
    let payload: any = { ...body, type: inferredType };
    if (inferredType === 'STUDENT_REQUEST') {
      // Students should not be able to set offering-only fields
      const { fee, availabilitySlots, experience, hourlyRate, isActive, ...rest } = payload;
      payload = { ...rest, type: inferredType };
    }

    return this.postsService.create(req.user.id, payload);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a post (owner only)' })
  async update(@Request() req, @Param('id') id: string, @Body() body: any) {
    return this.postsService.update(req.user.id, id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a post (owner only)' })
  async remove(@Request() req, @Param('id') id: string) {
    return this.postsService.remove(req.user.id, id);
  }
}

