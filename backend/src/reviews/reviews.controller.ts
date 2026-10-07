import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/types';

@Controller('courses/:courseId/reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  async getReviews(@Param('courseId') courseId: string) {
    return this.reviewsService.getReviewsByCourse(courseId);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createOrUpdateReview(
    @Req() req: AuthenticatedRequest,
    @Param('courseId') courseId: string,
    @Body() dto: CreateReviewDto,
  ) {
    const userId = req.user.id || req.user.sub || '';
    return this.reviewsService.upsertReview(userId, courseId, dto);
  }
}