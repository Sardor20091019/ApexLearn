import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

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
    @Req() req: any,
    @Param('courseId') courseId: string,
    @Body() dto: CreateReviewDto,
  ) {
    const userId = req.user.id;
    return this.reviewsService.upsertReview(userId, courseId, dto);
  }
}