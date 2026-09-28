import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../src/database/database.service';
import * as nodemailer from 'nodemailer';

@Injectable()
export class ForgotPasswordService {
  private readonly logger = new Logger(ForgotPasswordService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly db: DatabaseService) {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async execute(email: string) {
    const user = await this.db
      .selectFrom('User' as any)
      .select(['id', 'email'])
      .where('email', '=', email)
      .executeTakeFirst();

    // Security: Prevent email enumeration
    if (!user) {
      this.logger.warn(`Password reset requested for non-existent email: ${email}`);
      return { 
        message: 'If an account with that email exists, an OTP has been sent.' 
      };
    }

    // Generate a 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    await this.db
      .updateTable('User' as any)
      .set({
        resetToken: otp,
        resetTokenExpiry: resetTokenExpiry,
        updatedAt: new Date(),
      })
      .where('id', '=', user.id)
      .execute();

    // Send the email via Gmail SMTP
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
            <p>If you did not request this, please ignore this email.</p>
          </div>
        `,
      });
      this.logger.log(`Password reset OTP email sent successfully to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}`, error);
      throw new Error('Failed to send email. Please try again later.');
    }

    return { 
      message: 'Password reset OTP has been sent to your email.' 
    };
  }
}