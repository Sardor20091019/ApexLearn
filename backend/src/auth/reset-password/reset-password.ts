import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { AuthRepository } from '../auth.repo';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ResetPasswordService {
  private readonly logger = new Logger(ResetPasswordService.name);

  constructor(private readonly repo: AuthRepository) {}

  async execute(email: string, otp: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.repo.findUserForPasswordReset(email);

    if (!user || !user.resetToken || !user.resetTokenExpiry) {
      throw new BadRequestException('Invalid or expired OTP request.');
    }

    if (user.resetToken !== otp) {
      throw new BadRequestException('Invalid OTP code.');
    }

    if (new Date() > new Date(user.resetTokenExpiry)) {
      throw new BadRequestException('OTP code has expired.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.repo.completePasswordReset(user.id, hashedPassword);

    this.logger.log(`Password successfully reset for user: ${email}`);

    return {
      message: 'Password has been successfully reset. You can now sign in with your new password.',
    };
  }
}