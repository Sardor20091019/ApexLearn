import { Injectable, Logger } from '@nestjs/common';
import { AuthRepository } from '../auth.repo';
import { QueuesService } from '../../queues/queues.service';
import { randomInt } from 'crypto';

@Injectable()
export class ForgotPasswordService {
  private readonly logger = new Logger(ForgotPasswordService.name);

  constructor(
    private readonly repo: AuthRepository,
    private readonly queuesService: QueuesService,
  ) {}

  async execute(email: string): Promise<{ message: string }> {
    const user = await this.repo.findUserForPasswordReset(email);

    if (!user) {
      this.logger.warn(`Password reset requested for non-existent email: ${email}`);
      return {
        message: 'If an account with that email exists, an OTP has been sent.',
      };
    }

    const otp = randomInt(100000, 1000000).toString();
    const resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await this.repo.setResetOtp(user.id, otp, resetTokenExpiry);

    try {
      await this.queuesService.addPasswordResetEmail({ email, otp });
      this.logger.log(`Password reset OTP queued for ${email}`);
    } catch (err) {
      this.logger.error(`Failed to queue password reset email for ${email}:`, err);
    }

    return {
      message: 'If an account with that email exists, an OTP has been sent.',
    };
  }
}