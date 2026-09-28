import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { DatabaseService } from '../../src/database/database.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ResetPasswordService {
  private readonly logger = new Logger(ResetPasswordService.name);

  constructor(private readonly db: DatabaseService) {}

  async execute(email: string, otp: string, newPassword: string) {
    const user = await this.db
      .selectFrom('User' as any)
      .select(['id', 'email', 'resetToken', 'resetTokenExpiry'])
      .where('email', '=', email)
      .executeTakeFirst();

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

    await this.db
      .updateTable('User' as any)
      .set({
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        updatedAt: new Date(),
      })
      .where('id', '=', user.id)
      .execute();

    this.logger.log(`Password successfully reset for user: ${email}`);

    return {
      message: 'Password has been successfully reset. You can now sign in with your new password.',
    };
  }
}