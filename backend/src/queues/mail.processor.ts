import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { createMailTransporter } from '../common/mailer.util';

@Processor('mail', { concurrency: 10 })
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    super();
    this.transporter = createMailTransporter();
  }

  async process(job: Job<Record<string, unknown>, void, string>): Promise<void> {
    this.logger.log(`Processing job ${job.id} of type ${job.name}...`);

    switch (job.name) {
      case 'welcome-email':
        await this.sendWelcomeEmail(job.data as { email: string; name: string });
        break;
      case 'enrollment-email':
        await this.sendEnrollmentEmail(job.data as { email: string; courseTitle: string });
        break;
      case 'password-reset-email':
        await this.sendPasswordResetEmail(job.data as { email: string; otp: string });
        break;
      default:
        this.logger.warn(`Unknown job type: ${job.name}`);
    }
  }

  private async sendWelcomeEmail(data: { email: string; name: string }) {
    this.logger.log(`Sending welcome email to ${data.email}`);

    try {
      await this.transporter.sendMail({
        from: '"Course App" <no-reply@courseapp.com>',
        to: data.email,
        subject: `Welcome to the platform, ${data.name}! 🎉`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #8C6D53;">Welcome, ${data.name}!</h2>
            <p>We are thrilled to have you on board. Your account has been created successfully.</p>
            <p>Explore your dashboard to start learning today!</p>
          </div>
        `,
      });
      this.logger.log(`Welcome email successfully sent to ${data.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send welcome email to ${data.email}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  private async sendEnrollmentEmail(data: { email: string; courseTitle: string }) {
    this.logger.log(`Sending course enrollment confirmation to ${data.email} for ${data.courseTitle}`);

    try {
      await this.transporter.sendMail({
        from: '"Course App" <no-reply@courseapp.com>',
        to: data.email,
        subject: `Enrollment Confirmed: ${data.courseTitle} 🚀`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #34592B;">You're Enrolled!</h2>
            <p>You have successfully enrolled in <strong>${data.courseTitle}</strong>.</p>
            <p>Jump into your dashboard and start your journey.</p>
          </div>
        `,
      });
      this.logger.log(`Enrollment email successfully sent to ${data.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send enrollment email to ${data.email}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  private async sendPasswordResetEmail(data: { email: string; otp: string }) {
    this.logger.log(`Sending password reset OTP email to ${data.email}`);

    try {
      await this.transporter.sendMail({
        from: `"ApexLearn Support" <${process.env.MAIL_FROM || 'no-reply@apexlearn.com'}>`,
        to: data.email,
        subject: 'Password Reset OTP',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #4F46E5;">Password Reset Request</h2>
            <p>You requested a password reset for your account.</p>
            <p>Your One-Time Password (OTP) is:</p>
            <h1 style="color: #4F46E5; letter-spacing: 4px; font-size: 32px;">${data.otp}</h1>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't make this request, you can safely ignore this email.</p>
          </div>
        `,
      });
      this.logger.log(`Password reset OTP email sent to ${data.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${data.email}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }
}