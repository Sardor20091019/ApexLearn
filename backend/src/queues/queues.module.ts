import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueuesService } from './queues.service';
import { MailProcessor } from './mail.processor';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'mail' },
      { name: 'audio' },
    ),
    DatabaseModule,
  ],
  providers: [QueuesService, MailProcessor],
  exports: [QueuesService, BullModule],
})
export class QueuesModule {}