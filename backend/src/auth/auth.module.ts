import { Module, Global } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { BullModule } from '@nestjs/bullmq';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repo';
import { AuthController } from './auth.controller';
import { DatabaseModule } from '../database/database.module';
import { ForgotPasswordService } from './forgot-password/forgot-password';
import { ResetPasswordService } from './reset-password/reset-password';

@Global()
@Module({
  imports: [
    DatabaseModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule,
    BullModule.registerQueue({
      name: 'mail',
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthRepository,
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    ForgotPasswordService,
    ResetPasswordService,
  ],
  exports: [
    AuthRepository,
    JwtModule,
    PassportModule,
    JwtAuthGuard,
    AuthService,
    ForgotPasswordService,
    ResetPasswordService,
  ],
})
export class AuthModule {}