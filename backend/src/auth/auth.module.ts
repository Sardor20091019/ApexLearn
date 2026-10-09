import { Module, Global } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { BullModule } from '@nestjs/bullmq';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { DatabaseModule } from '../database/database.module';
import { ForgotPasswordService } from './forgot-password/forgot-password';
import { ResetPasswordService } from './reset-password/reset-password';

@Global()
@Module({
  imports: [
    DatabaseModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),

    BullModule.registerQueue({
      name: 'mail',
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService, 
    JwtStrategy, 
    JwtAuthGuard, 
    ForgotPasswordService,
    ResetPasswordService,
  ],
  exports: [
    JwtModule, 
    PassportModule, 
    JwtAuthGuard, 
    AuthService, 
    ForgotPasswordService,
    ResetPasswordService,
  ],
})
export class AuthModule {}