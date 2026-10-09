import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthRepository } from './auth.repo';

interface JwtPayload {
  sub: string;
  email: string;
  role?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly repo: AuthRepository) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_SECRET ??
        (() => {
          throw new Error('JWT_SECRET is not configured');
        })(),
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload || !payload.sub) {
      throw new UnauthorizedException();
    }

    const user = await this.repo.findUserForJwt(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}