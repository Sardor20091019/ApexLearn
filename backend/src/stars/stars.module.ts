import { Module } from '@nestjs/common';
import { StarsController } from './stars.controller';
import { StarsService } from './stars.service';
import { StarsRepository } from './stars.repo';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [StarsController],
  providers: [StarsService, StarsRepository],
  exports: [StarsService, StarsRepository],
})
export class StarsModule {}
