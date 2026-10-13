import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { AuthRepository } from '../auth.repo';
import { RedisService } from '../../redis/redis.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ResetPasswordService {
  private readonly logger = new Logger(ResetPasswordService.name);

  constructor(
    private readonly repo: AuthRepository,
    private readonly redisService: RedisService,
  ) {}

  async execute(email: string, otp: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.repo.findUserForPasswordReset(email);

    if (!user || !user.resetToken || !user.resetTokenExpiry) {
      throw new BadRequestException('Invalid or expired OTP request.');
    }

    const attemptKey = `otp_attempts:${email.toLowerCase().trim()}`;
    const rawAttempts = await this.redisService.get<number | string>(attemptKey);
    const attempts = Number(rawAttempts || 0) + 1;

    if (attempts > 5) {
      await this.repo.clearResetOtp(user.id);
      await this.redisService.del(attemptKey);
      throw new BadRequestException('Too many failed OTP attempts. Your OTP has been invalidated for security reasons. Please request a new code.');
    }

    if (new Date() > new Date(user.resetTokenExpiry)) {
      await this.repo.clearResetOtp(user.id);
      await this.redisService.del(attemptKey);
      throw new BadRequestException('OTP code has expired.');
    }

    if (user.resetToken !== otp) {
      await this.redisService.set(attemptKey, attempts, 600);
      const remaining = Math.max(0, 5 - attempts);
      throw new BadRequestException(`Invalid OTP code. ${remaining} attempt(s) remaining.`);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.repo.completePasswordReset(user.id, hashedPassword);
    await this.redisService.del(attemptKey);

    this.logger.log(`Password successfully reset for user: ${email}`);

    return {
      message: 'Password has been successfully reset. You can now sign in with your new password.',
    };
  }
}