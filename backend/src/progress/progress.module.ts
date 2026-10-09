import { Module } from '@nestjs/common';
import { ProgressController, PublicProgressController } from './progress.controller';
import { ProgressService } from './progress.service';
import { ProgressRepository } from './progress.repo';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ProgressController, PublicProgressController],
  providers: [ProgressService, ProgressRepository],
  exports: [ProgressService, ProgressRepository],
})
export class ProgressModule {}