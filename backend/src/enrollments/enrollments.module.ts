import { Module } from '@nestjs/common';
import { EnrollmentsController } from './enrollments.controller';
import { EnrollmentsService } from './enrollments.service';
import { EnrollmentsRepository } from './enrollments.repo';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService, EnrollmentsRepository],
  exports: [EnrollmentsService, EnrollmentsRepository],
})
export class EnrollmentsModule {}