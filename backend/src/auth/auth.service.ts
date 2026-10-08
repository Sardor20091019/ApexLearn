import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private database: DatabaseService,
    private jwtService: JwtService,
    @InjectQueue('mail') private readonly mailQueue: Queue, 
  ) {}

  async hashData(data: string): Promise<string> {
    console.log('[DEBUG] Hashing data...');
    return bcrypt.hash(data, 10);
  }

  async getTokens(userId: string, email: string, role: string): Promise<AuthTokens> {
    console.log('[DEBUG] Generating tokens for userId:', userId);
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email, role },
        { secret: process.env.JWT_SECRET, expiresIn: '15m' },
      ),
      this.jwtService.signAsync(
        { sub: userId, email, role },
        { secret: process.env.JWT_REFRESH_SECRET, expiresIn: '7d' },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  async updateRefreshTokenHash(userId: string, refreshToken: string): Promise<void> {
    console.log('[DEBUG] Updating refresh token hash for userId:', userId);
    const tokenHash = await this.hashData(refreshToken);
    
    await this.database
      .deleteFrom('RefreshToken')
      .where('userId', '=', userId)
      .execute();

    await this.database
      .insertInto('RefreshToken')
      .values({
        userId,
        tokenHash,
      })
      .execute();
  }

  async signup(dto: SignupDto): Promise<AuthTokens> {
    console.log('[DEBUG] AuthService.signup searching for existing user:', dto.email);
    const existingUser = await this.database
      .selectFrom('User')
      .selectAll()
      .where('email', '=', dto.email)
      .executeTakeFirst();

    const hashedPassword = await this.hashData(dto.password);

    if (existingUser) {
      if (existingUser.deletedAt === null) {
        console.warn('[WARN] Signup failed: Email already exists:', dto.email);
        throw new ForbiddenException('Email already exists');
      }

      const reactivatedUser = await this.database
        .updateTable('User')
        .set({
          name: dto.name,
          password: hashedPassword,
          deletedAt: null,
          updatedAt: new Date(),
        })
        .where('id', '=', existingUser.id)
        .returningAll()
        .executeTakeFirstOrThrow();

      const tokens = await this.getTokens(reactivatedUser.id, reactivatedUser.email, reactivatedUser.role);
      await this.updateRefreshTokenHash(reactivatedUser.id, tokens.refreshToken);
      return tokens;
    }

    console.log('[DEBUG] Creating user in database...');
    
    const user = await this.database
      .insertInto('User')
      .values({
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
      })
      .returningAll()
      .executeTakeFirst();

    if (!user) {
      throw new ForbiddenException('User creation failed');
    }

    console.log('[DEBUG] User created successfully with ID:', user.id);

    await this.mailQueue.add('welcome-email', {
      email: user.email,
      name: user.name,
    });

    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);
    return tokens;
  }

  async verifyTurnstile(token?: string): Promise<boolean> {
    const secretKey = process.env.TURNSTILE_SECRET_KEY;
    if (!secretKey) {
      return true;
    }

    if (!token) {
      return false;
    }

    try {
      const formData = new URLSearchParams();
      formData.append('secret', secretKey);
      formData.append('response', token);

      const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      const outcome = (await res.json()) as { success: boolean };
      return outcome.success === true;
    } catch (err) {
      console.error('[ERROR] Cloudflare Turnstile verification failed:', err);
      return false;
    }
  }

  async signin(dto: SigninDto): Promise<AuthTokens> {
    console.log('[DEBUG] AuthService.signin searching for user:', dto.email);

    if (process.env.TURNSTILE_SECRET_KEY) {
      const isValidCaptcha = await this.verifyTurnstile(dto.turnstileToken);
      if (!isValidCaptcha) {
        throw new UnauthorizedException('Captcha validation failed. Please try again.');
      }
    }

    const user = await this.database
      .selectFrom('User')
      .selectAll()
      .where('email', '=', dto.email)
      .executeTakeFirst();

    if (!user) {
      console.warn('[WARN] Signin failed: User not found');
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.deletedAt !== null) {
      console.warn('[WARN] Signin failed: Account was soft-deleted');
      throw new UnauthorizedException('Account was deleted. Please sign up to create a new account.');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatches) {
      console.warn('[WARN] Signin failed: Password mismatch');
      throw new UnauthorizedException('Invalid email or password');
    }

    console.log('[DEBUG] Credentials valid. Issuing tokens...');
    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: string): Promise<{ message: string }> {
    await this.database
      .deleteFrom('RefreshToken')
      .where('userId', '=', userId)
      .execute();
    return { message: 'Successfully logged out' };
  }

  async refreshTokens(userId: string, refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.database
      .selectFrom('User')
      .selectAll()
      .where('id', '=', userId)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();

    if (!user) {
      throw new ForbiddenException('Access Denied: User not found or inactive');
    }

    const storedToken = await this.database
      .selectFrom('RefreshToken')
      .selectAll()
      .where('userId', '=', userId)
      .executeTakeFirst();

    if (!storedToken || !storedToken.tokenHash) {
      throw new ForbiddenException('Access Denied: Invalid refresh token');
    }

    const refreshTokenMatches = await bcrypt.compare(refreshToken, storedToken.tokenHash);
    if (!refreshTokenMatches) {
      throw new ForbiddenException('Access Denied: Invalid refresh token');
    }

    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);
    return tokens;
  }

  async googleLogin(credential: string): Promise<AuthTokens & { user: any }> {
    console.log('[DEBUG] AuthService.googleLogin verifying credential...');
    if (!credential) {
      throw new UnauthorizedException('Google credential is required');
    }

    let payload: { email: string; name?: string; picture?: string; sub: string; email_verified?: string | boolean };

    try {
      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
      if (!response.ok) {
        throw new Error(`Google tokeninfo responded with status ${response.status}`);
      }
      payload = await response.json();
    } catch (err: any) {
      console.error('[ERROR] Failed to verify Google ID token with Google API:', err);
      throw new UnauthorizedException('Invalid Google authentication token');
    }

    if (!payload.email) {
      throw new UnauthorizedException('Google account did not return an email');
    }

    const email = payload.email.toLowerCase().trim();
    const name = payload.name || payload.email.split('@')[0];
    const avatarUrl = payload.picture || null;

    let user = await this.database
      .selectFrom('User')
      .selectAll()
      .where('email', '=', email)
      .executeTakeFirst();

    if (!user) {
      console.log('[DEBUG] Creating new user via Google Auth for email:', email);
      const randomPassword = await this.hashData(Math.random().toString(36).substring(2) + Date.now().toString(36));
      user = await this.database
        .insertInto('User')
        .values({
          email,
          name,
          password: randomPassword,
          avatarUrl,
        })
        .returningAll()
        .executeTakeFirst();

      if (!user) {
        throw new ForbiddenException('Failed to create account with Google');
      }

      try {
        await this.mailQueue.add('welcome-email', {
          email: user.email,
          name: user.name,
        });
      } catch (e) {
        console.warn('[WARN] Could not queue welcome email:', e);
      }
    } else {
      if (user.deletedAt !== null) {
        user = await this.database
          .updateTable('User')
          .set({
            deletedAt: null,
            name: name || user.name,
            avatarUrl: avatarUrl || user.avatarUrl,
            updatedAt: new Date(),
          })
          .where('id', '=', user.id)
          .returningAll()
          .executeTakeFirstOrThrow();
      } else if (!user.avatarUrl && avatarUrl) {
        user = await this.database
          .updateTable('User')
          .set({
            avatarUrl,
            updatedAt: new Date(),
          })
          .where('id', '=', user.id)
          .returningAll()
          .executeTakeFirstOrThrow();
      }
    }

    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  getGoogleAuthUrl(): string {
    const clientId = process.env.GOOGLE_CLIENT_ID ;
    const redirectUri = encodeURIComponent(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/auth/google/callback`);
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid%20email%20profile&access_type=offline&prompt=select_account`;
  }

  async handleGoogleCallback(code: string): Promise<AuthTokens> {
    const clientId = process.env.GOOGLE_CLIENT_ID ;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth client credentials are not configured');
    }
    const redirectUri = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/auth/google/callback`;

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      console.error('[ERROR] Failed to exchange code with Google:', errText);
      throw new UnauthorizedException('Failed to exchange Google OAuth code');
    }

    const data = await tokenResponse.json();
    return this.googleLogin(data.id_token);
  }
}