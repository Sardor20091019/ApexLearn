import { Module } from '@nestjs/common';
import { ProgressController, PublicProgressController } from './progress.controller';
import { ProgressService } from './progress.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ProgressController, PublicProgressController],
  providers: [ProgressService],
})
export class ProgressModule {}