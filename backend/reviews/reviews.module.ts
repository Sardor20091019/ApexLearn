import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController, ReviewManagementController } from './reviews.controller';

@Module({
  controllers: [ReviewsController, ReviewManagementController],
  providers: [ReviewsService],
})
export class ReviewsModule {}