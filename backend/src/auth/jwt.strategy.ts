import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthRepository } from './auth.repo';
import { RedisService } from '../redis/redis.service';
import { Request } from 'express';

interface JwtPayload {
  sub: string;
  email: string;
  role?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private userCache = new Map<string, { user: any; expiresAt: number }>();

  constructor(
    private readonly repo: AuthRepository,
    private readonly redisService: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: Request) => {
          const cookieHeader = req?.headers?.cookie || '';
          const match = cookieHeader.match(/(?:^|;\s*)(?:accessToken|access_token)=([^;]*)/);
          return match ? decodeURIComponent(match[1]) : null;
        },
      ]),
      ignoreExpiration: false,
      passReqToCallback: true,
      secretOrKey:
        process.env.JWT_SECRET ??
        (() => {
          throw new Error('JWT_SECRET is not configured');
        })(),
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    if (!payload || !payload.sub) {
      throw new UnauthorizedException();
    }

    const authHeader = req.headers.authorization || '';
    let token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      const cookieHeader = req?.headers?.cookie || '';
      const match = cookieHeader.match(/(?:^|;\s*)(?:accessToken|access_token)=([^;]*)/);
      token = match ? decodeURIComponent(match[1]) : '';
    }

    if (token) {
      const isBlacklisted = await this.redisService.get(`blacklist:token:${token}`);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }
    }

    const now = Date.now();
    const cached = this.userCache.get(payload.sub);
    if (cached && cached.expiresAt > now) {
      return cached.user;
    }

    const user = await this.repo.findUserForJwt(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }

    // Cache valid user for 30 seconds to minimize DB round-trips
    this.userCache.set(payload.sub, { user, expiresAt: now + 30000 });

    // Clean up expired cache items if map grows large
    if (this.userCache.size > 1000) {
      for (const [key, value] of this.userCache.entries()) {
        if (value.expiresAt <= now) {
          this.userCache.delete(key);
        }
      }
    }

    return user;
  }
}