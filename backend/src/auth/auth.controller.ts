import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly configService: ConfigService) { }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(@Body() registerDto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(registerDto);
    return { user: result.user };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'User successfully logged in' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(loginDto);

    const jwtExpires = this.configService.get<string>('JWT_EXPIRES_IN') || '7d';
    let maxAge = 7 * 24 * 60 * 60 * 1000;
    if (jwtExpires.endsWith('d')) {
      const days = parseInt(jwtExpires.replace('d', ''), 10);
      if (!isNaN(days)) maxAge = days * 24 * 60 * 60 * 1000;
    } else if (jwtExpires.endsWith('h')) {
      const hours = parseInt(jwtExpires.replace('h', ''), 10);
      if (!isNaN(hours)) maxAge = hours * 60 * 60 * 1000;
    }

    const secure = this.configService.get<string>('NODE_ENV') === 'production';
    const sameSite: any = secure ? 'none' : 'lax';

    res.cookie('access_token', result.token, {
      httpOnly: true,
      secure,
      sameSite,
      maxAge,
    });

    return {
      user: result.user,
      token: result.token
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user and invalidate session' })
  @ApiResponse({ status: 200, description: 'User successfully logged out' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@Req() request: Request, @Res({ passthrough: true }) res: Response) {
    const tokenFromHeader = request.headers.authorization?.replace('Bearer ', '');

    // Also try cookie
    const tokenFromCookie = request.cookies?.access_token as string | undefined;
    const token = tokenFromHeader || tokenFromCookie;

    // blacklist token if present
    await this.authService.logout(token);

    // Clear cookie
    res.clearCookie('access_token');

    return { message: 'Logged out' };
  }
}

