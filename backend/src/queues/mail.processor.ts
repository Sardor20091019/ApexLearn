import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Processor('mail', { concurrency: 10 })
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    super();
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
      port: Number(process.env.SMTP_PORT) || 2525,
      auth: {
        user: process.env.SMTP_USER || 'your_smtp_user',
        pass: process.env.SMTP_PASS || 'your_smtp_pass',
      },
    });
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing job ${job.id} of type ${job.name}...`);

    switch (job.name) {
      case 'welcome-email':
        await this.sendWelcomeEmail(job.data);
        break;
      case 'enrollment-email':
        await this.sendEnrollmentEmail(job.data);
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
      this.logger.error(`Failed to send welcome email to ${data.email}`, error.stack);
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
      this.logger.error(`Failed to send enrollment email to ${data.email}`, error.stack);
      throw error;
    }
  }
}