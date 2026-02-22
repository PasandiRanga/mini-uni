import { Controller, Get, Query, Post, Body, UseGuards, Request, Put, Param, Delete, ForbiddenException, Logger, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@ApiTags('posts')
@Controller('posts')
export class PostsController {
  private readonly logger = new Logger(PostsController.name);
  constructor(private readonly postsService: PostsService) { }

  @Get()
  @ApiOperation({ summary: 'Get list of active posts (public)' })
  async findAll(
    @Query('type') type?: string,
    @Query('subject') subject?: string,
    @Query('teacherId') teacherId?: string
  ) {
    return this.postsService.findAll({ type, subject, userId: teacherId });
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
  async create(@Request() req, @Body() createPostDto: CreatePostDto) {
    try {
      return await this.postsService.create(req.user, createPostDto);
    } catch (err) {
      this.logger.error('Error creating post', err as any);
      throw new BadRequestException((err as any)?.message || 'Failed to create post');
    }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a post (owner only)' })
  async update(@Request() req, @Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
    try {
      return await this.postsService.update(req.user, id, updatePostDto);
    } catch (err) {
      this.logger.error('Error updating post', err as any);
      throw new BadRequestException((err as any)?.message || 'Failed to update post');
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a post (owner only)' })
  async remove(@Request() req, @Param('id') id: string) {
    return this.postsService.remove(req.user.id, id);
  }
}

