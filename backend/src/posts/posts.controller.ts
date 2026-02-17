import { Controller, Get, Query, Post, Body, UseGuards, Request, Put, Param, Delete, ForbiddenException, Logger, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('posts')
@Controller('posts')
export class PostsController {
  private readonly logger = new Logger(PostsController.name);
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @ApiOperation({ summary: 'Get list of active posts (public)' })
  async findAll(@Query('type') type?: string, @Query('subject') subject?: string) {
    return this.postsService.findAll({ type, subject });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single post by id' })
  async findOne(@Param('id') id: string) {
    return this.postsService.findById(id);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get posts of the authenticated user' })
  async findMine(@Request() req) {
    return this.postsService.findByUser(req.user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a post (authenticated)' })
  async create(@Request() req, @Body() body: any) {
    const user = req.user;

    // Console log to make incoming requests visible in environments where debug logs
    // are not shown by default. This helps debug network reachability issues.
    // eslint-disable-next-line no-console
    console.log('Create post request received', { userId: user?.id, role: user?.role });
    this.logger.debug(`Create post request from user=${user?.id} role=${user?.role}`);
    this.logger.debug(`Request body: ${JSON.stringify(body)}`);

    if (!user || !user.role) {
      throw new ForbiddenException('Unauthorized');
    }

    try {
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

      const created = await this.postsService.create(req.user.id, payload);
      // `create` currently returns a list of posts (findAll) — handle both cases
      if (Array.isArray(created)) {
        this.logger.debug(`Posts created count=${created.length}`);
      } else {
        this.logger.debug(`Post created id=${(created as any)?.id}`);
      }
      return created;
    } catch (err) {
      this.logger.error('Error creating post', err as any);
      // Map known errors to BadRequest for better client messages
      throw new BadRequestException((err as any)?.message || 'Failed to create post');
    }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a post (owner only)' })
  async update(@Request() req, @Param('id') id: string, @Body() body: any) {
    const user = req.user;
    // enforce type based on role
    if (user.role === 'STUDENT') {
      body.type = 'STUDENT_REQUEST';
      // strip offering-only fields
      const { fee, availabilitySlots, experience, hourlyRate, locationLat, locationLng, ...rest } = body;
      body = { ...rest, type: 'STUDENT_REQUEST' };
    } else if (user.role === 'TEACHER') {
      body.type = 'TEACHER_OFFERING';
      // ensure teacher is verified before allowing offering updates
      const isVerified = await this.postsService.isTeacherVerified(user.id);
      if (!isVerified) throw new ForbiddenException('Teacher account not verified to modify offerings');
    }
    return this.postsService.update(req.user.id, id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a post (owner only)' })
  async remove(@Request() req, @Param('id') id: string) {
    return this.postsService.remove(req.user.id, id);
  }
}

