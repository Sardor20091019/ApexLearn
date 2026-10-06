import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class AuthService {
  constructor(
    private database: DatabaseService,
    private jwtService: JwtService,
    @InjectQueue('mail') private readonly mailQueue: Queue, // 1. Inject the mail queue here
  ) {}

  async hashData(data: string): Promise<string> {
    console.log('[DEBUG] Hashing data...');
    return bcrypt.hash(data, 10);
  }

  async getTokens(userId: string, email: string, role: string): Promise<{ accessToken: string; refreshToken: string }> {
    console.log('[DEBUG] Generating tokens for userId:', userId);
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email, role },
        { secret: process.env.JWT_SECRET || 'supersecretjwtkey', expiresIn: '15m' },
      ),
      this.jwtService.signAsync(
        { sub: userId, email, role },
        { secret: process.env.JWT_REFRESH_SECRET || 'supersecretrefreshkey', expiresIn: '7d' },
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

  async signup(dto: SignupDto): Promise<any> {
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

  async signin(dto: SigninDto): Promise<any> {
    console.log('[DEBUG] AuthService.signin searching for user:', dto.email);
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
}