import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../src/database/database.service';

@Injectable()
export class AuthService {
  constructor(
    private database: DatabaseService,
    private jwtService: JwtService,
  ) {}

  async hashData(data: string): Promise<string> {
    console.log('[DEBUG] Hashing data...');
    return bcrypt.hash(data, 10);
  }

  async getTokens(userId: string, email: string): Promise<{ accessToken: string; refreshToken: string }> {
    console.log('[DEBUG] Generating tokens for userId:', userId);
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email },
        { secret: process.env.JWT_SECRET || 'supersecretjwtkey', expiresIn: '15m' },
      ),
      this.jwtService.signAsync(
        { sub: userId, email },
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

    if (existingUser) {
      console.warn('[WARN] Signup failed: Email already exists:', dto.email);
      throw new ForbiddenException('Email already exists');
    }

    const hashedPassword = await this.hashData(dto.password);
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
    const tokens = await this.getTokens(user.id, user.email);
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
      throw new UnauthorizedException('Access Denied');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatches) {
      console.warn('[WARN] Signin failed: Password mismatch');
      throw new UnauthorizedException('Access Denied');
    }

    console.log('[DEBUG] Credentials valid. Issuing tokens...');
    const tokens = await this.getTokens(user.id, user.email);
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);
    return tokens;
  }
}