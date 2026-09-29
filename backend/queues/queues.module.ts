import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueuesService } from './queues.service';
import { MailProcessor } from './mail.processor';
import { AudioProcessor } from './audio.processor';
import { DatabaseModule } from '../src/database/database.module';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'mail' },
      { name: 'audio' },
    ),
    DatabaseModule,
  ],
  providers: [QueuesService, MailProcessor, AudioProcessor],
  exports: [QueuesService, BullModule],
})
export class QueuesModule {}