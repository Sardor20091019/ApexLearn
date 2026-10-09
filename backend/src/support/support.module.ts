import { Module } from '@nestjs/common';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import { SupportRepository } from './support.repo';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [SupportController],
  providers: [SupportService, SupportRepository],
  exports: [SupportService, SupportRepository],
})
export class SupportModule {}