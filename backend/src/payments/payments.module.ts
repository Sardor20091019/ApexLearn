import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentsRepository } from './payments.repo';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { QueuesModule } from '../queues/queues.module';

@Module({
  imports: [AuthModule, DatabaseModule, QueuesModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentsRepository],
  exports: [PaymentsService, PaymentsRepository],
})
export class PaymentsModule {}