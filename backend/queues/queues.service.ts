import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class QueuesService {
  constructor(
    @InjectQueue('mail') private readonly mailQueue: Queue,
    @InjectQueue('audio') private readonly audioQueue: Queue,
  ) {}

  async addWelcomeEmail(data: { email: string; name: string }) {
    await this.mailQueue.add('welcome-email', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
  }

  async addEnrollmentEmail(data: { email: string; courseTitle: string }) {
    await this.mailQueue.add('enrollment-email', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
  }

  async addAudioProcessingJob(data: { lessonId: string; fileUrl: string }) {
    await this.audioQueue.add('process-audio', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    });
  }
}