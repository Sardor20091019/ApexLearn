import { Controller, Post, Get, Body, Req, Res, Query, UseGuards, HttpCode, HttpStatus, Logger, Headers } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService, AuthTokens } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';
import { JwtAuthGuard } from './jwt-auth.guard'; 
import { ForgotPasswordService } from './forgot-password/forgot-password';
import { ForgotPasswordDto } from './forgot-password/dto/forgot-password.dto';
import { ResetPasswordService } from './reset-password/reset-password';
import { ResetPasswordDto } from './reset-password/dto/reset-password.dto';
import { AuthenticatedRequest, AuthenticatedUser } from '../common/types';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly forgotPasswordService: ForgotPasswordService,
    private readonly resetPasswordService: ResetPasswordService,
  ) {}

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() dto: SignupDto): Promise<AuthTokens> {
    this.logger.log(`POST /auth/signup triggered for email: ${dto.email}`);
    
    
    try {
      const result = await this.authService.signup(dto);
      
      return result;
    } catch (error) {
      console.error('[ERROR] AuthController.signup failed:', error);
      throw error;
    }
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signin(@Body() dto: SigninDto): Promise<AuthTokens> {
    this.logger.log(`POST /auth/signin triggered for email: ${dto.email}`);
    

    try {
      const result = await this.authService.signin(dto);
      
      return result;
    } catch (error) {
      console.error('[ERROR] AuthController.signin failed:', error);
      throw error;
    }
  }

  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @Post('google')
  @HttpCode(HttpStatus.OK)
  async googleAuth(@Body('credential') credential: string) {
    this.logger.log(`POST /auth/google triggered`);
    
    return this.authService.googleLogin(credential);  
  }

  @Get('google')
  googleRedirect(@Res() res: Response) {
    this.logger.log(`GET /auth/google triggered - redirecting to Google OAuth`);
    const url = this.authService.getGoogleAuthUrl();
    return (res as any).redirect(url);
  }

  @Get('google/callback')
  async googleCallback(@Query('code') code: string, @Res() res: Response) {
    this.logger.log(`GET /auth/google/callback triggered with code`);
    try {
      const tokens = await this.authService.handleGoogleCallback(code);
      const frontendUrl = process.env.FRONTEND_URL;

      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return (res as any).redirect(`${frontendUrl}/auth?token=${tokens.accessToken}&refresh=${tokens.refreshToken}`);
    } catch (err: any) {
      console.error('[ERROR] Google OAuth callback failed:', err);
      const frontendUrl = process.env.FRONTEND_URL;
      return (res as any).redirect(`${frontendUrl}/auth?error=${encodeURIComponent(err.message || 'Google authentication failed')}`);
    }
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ message: string }> {
    this.logger.log(`POST /auth/forgot-password triggered for email: ${dto.email}`);
    

    try {
      const result = await this.forgotPasswordService.execute(dto.email);
      
      return result;
    } catch (error) {
      console.error('[ERROR] AuthController.forgotPassword failed:', error);
      throw error;
    }
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
    this.logger.log(`POST /auth/reset-password triggered for email: ${dto.email}`);
    

    try {
      const result = await this.resetPasswordService.execute(dto.email, dto.otp, dto.newPassword);
      
      return result;
    } catch (error) {
      console.error('[ERROR] AuthController.resetPassword failed:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
    @Headers('authorization') authHeader?: string,
  ): Promise<{ message: string }> {
    const userId = req.user.sub || req.user.id;
    const rawHeader = authHeader || req.headers.authorization || '';
    const token = rawHeader.replace(/^Bearer\s+/i, '').trim();

    res.clearCookie('refreshToken', { path: '/' });
    this.logger.log(`POST /auth/logout triggered for userId: ${userId}`);
    return this.authService.logout(userId, token);
  }

  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Body('refreshToken') bodyRefreshToken?: string,
  ): Promise<AuthTokens> {
    const cookieHeader = req.headers.cookie || '';
    const match = cookieHeader.match(/(^|;\s*)refreshToken=([^;]*)/);
    const cookieToken = match ? decodeURIComponent(match[2]) : undefined;

    const token = bodyRefreshToken || cookieToken || '';
    this.logger.log(`POST /auth/refresh triggered`);
    return this.authService.refreshTokens(token);
  }
}