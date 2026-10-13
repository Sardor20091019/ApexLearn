import { Module, Global } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { QueuesModule } from '../queues/queues.module';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repo';
import { AuthController } from './auth.controller';
import { DatabaseModule } from '../database/database.module';
import { RedisModule } from '../redis/redis.module';
import { ForgotPasswordService } from './forgot-password/forgot-password';
import { ResetPasswordService } from './reset-password/reset-password';

@Global()
@Module({
  imports: [
    DatabaseModule,
    RedisModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule,
    QueuesModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthRepository,
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    OptionalJwtAuthGuard,
    ForgotPasswordService,
    ResetPasswordService,
  ],
  exports: [
    AuthRepository,
    JwtModule,
    PassportModule,
    JwtAuthGuard,
    OptionalJwtAuthGuard,
    AuthService,
    ForgotPasswordService,
    ResetPasswordService,
  ],
})
export class AuthModule {}