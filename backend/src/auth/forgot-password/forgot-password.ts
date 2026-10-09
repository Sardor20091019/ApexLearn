import { Injectable, Logger } from '@nestjs/common';
import { AuthRepository } from '../auth.repo';
import * as nodemailer from 'nodemailer';

@Injectable()
export class ForgotPasswordService {
  private readonly logger = new Logger(ForgotPasswordService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly repo: AuthRepository) {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async execute(email: string): Promise<{ message: string }> {
    const user = await this.repo.findUserForPasswordReset(email);

    if (!user) {
      this.logger.warn(`Password reset requested for non-existent email: ${email}`);
      return {
        message: 'If an account with that email exists, an OTP has been sent.',
      };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await this.repo.setResetOtp(user.id, otp, resetTokenExpiry);

    try {
      await this.transporter.sendMail({
        from: `"ApexLearn Support" <${process.env.MAIL_FROM}>`,
        to: email,
        subject: 'Password Reset OTP',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Password Reset Request</h2>
            <p>You requested a password reset for your account.</p>
            <p>Your One-Time Password (OTP) is:</p>
            <h1 style="color: #4F46E5; letter-spacing: 4px;">${otp}</h1>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't make this request, you can safely ignore this email.</p>
          </div>
        `,
      });
      this.logger.log(`Password reset OTP email sent to ${email}`);
    } catch (err) {
      this.logger.error(`Failed to send password reset email to ${email}:`, err);
    }

    return {
      message: 'If an account with that email exists, an OTP has been sent.',
    };
  }
}