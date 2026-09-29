import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

@Processor('mail', { concurrency: 10 })
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);

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
  }

  private async sendEnrollmentEmail(data: { email: string; courseTitle: string }) {
    this.logger.log(`Sending course enrollment confirmation to ${data.email} for ${data.courseTitle}`);
  }
}