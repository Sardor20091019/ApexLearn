import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { AuthRepository } from './auth.repo';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly repo: AuthRepository,
    private readonly jwtService: JwtService,
    @InjectQueue('mail') private readonly mailQueue: Queue,
  ) {}

  async hashData(data: string): Promise<string> {
    return bcrypt.hash(data, 10);
  }

  async getTokens(userId: string, email: string, role: string): Promise<AuthTokens> {
    const accessSecret = process.env.JWT_SECRET || process.env.JWT_AT_SECRET;
    const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_RT_SECRET || accessSecret;

    if (!accessSecret || !refreshSecret) {
      throw new Error('JWT secrets are not properly configured in environment variables');
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email, role },
        { secret: accessSecret, expiresIn: '15m' },
      ),
      this.jwtService.signAsync(
        { sub: userId, email, role },
        { secret: refreshSecret, expiresIn: '7d' },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  async updateRefreshTokenHash(userId: string, refreshToken: string): Promise<void> {
    const tokenHash = await this.hashData(refreshToken);
    await this.repo.setRefreshToken(userId, tokenHash);
  }

  async signup(dto: SignupDto): Promise<AuthTokens> {
    const existingUser = await this.repo.findUserByEmail(dto.email);
    const hashedPassword = await this.hashData(dto.password);

    if (existingUser) {
      if (existingUser.deletedAt === null) {
        console.warn('[WARN] Signup failed: Email already exists:', dto.email);
        throw new ForbiddenException('Email already exists');
      }

      const reactivatedUser = await this.repo.reactivateUser(existingUser.id, dto.name, hashedPassword);
      const tokens = await this.getTokens(reactivatedUser.id, reactivatedUser.email, reactivatedUser.role);
      await this.updateRefreshTokenHash(reactivatedUser.id, tokens.refreshToken);
      return tokens;
    }

    const user = await this.repo.createUser({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
    });

    if (!user) {
      throw new ForbiddenException('User creation failed');
    }

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
    if (process.env.TURNSTILE_SECRET_KEY) {
      const isValidCaptcha = await this.verifyTurnstile(dto.turnstileToken);
      if (!isValidCaptcha) {
        throw new UnauthorizedException('Captcha validation failed. Please try again.');
      }
    }

    const user = await this.repo.findUserByEmail(dto.email);
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

    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: string): Promise<{ message: string }> {
    await this.repo.deleteRefreshToken(userId);
    return { message: 'Successfully logged out' };
  }

  async refreshTokens(userId: string, refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.repo.findActiveUserById(userId);
    if (!user) {
      throw new ForbiddenException('Access Denied: User not found or inactive');
    }

    const storedToken = await this.repo.findRefreshToken(userId);
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

    let user = await this.repo.findUserByEmail(email);

    if (!user) {
      const randomPassword = await this.hashData(Math.random().toString(36).substring(2) + Date.now().toString(36));
      user = await this.repo.createUser({
        email,
        name,
        password: randomPassword,
        avatarUrl,
      });

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
        user = await this.repo.reactivateGoogleUser(user.id, name || user.name, avatarUrl || user.avatarUrl);
      } else if (!user.avatarUrl && avatarUrl) {
        user = await this.repo.updateUserAvatar(user.id, avatarUrl);
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
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = encodeURIComponent(`${process.env.NEXT_PUBLIC_API_URL}/auth/google/callback`);
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid%20email%20profile&access_type=offline&prompt=select_account`;
  }

  async handleGoogleCallback(code: string): Promise<AuthTokens> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth client credentials are not configured');
    }
    const redirectUri = `${process.env.NEXT_PUBLIC_API_URL}/auth/google/callback`;

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