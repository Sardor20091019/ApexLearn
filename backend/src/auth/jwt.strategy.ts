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

    const user = await this.repo.findUserForJwt(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}