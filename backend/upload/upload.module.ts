import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { DatabaseModule } from '../src/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}