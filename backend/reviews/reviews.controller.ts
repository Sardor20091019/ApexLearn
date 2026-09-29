import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('courses/:courseId/reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Req() req, @Param('courseId') courseId: string, @Body() dto: CreateReviewDto) {
    const userId = req.user.id;
    return this.reviewsService.create(userId, courseId, dto);
  }

  @Get()
  findAll(@Param('courseId') courseId: string) {
    return this.reviewsService.findByCourse(courseId);
  }
}

@Controller('reviews')
export class ReviewManagementController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Req() req, @Param('id') id: string, @Body() dto: UpdateReviewDto) {
    const userId = req.user.id;
    return this.reviewsService.update(id, userId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Req() req, @Param('id') id: string) {
    const userId = req.user.id;
    return this.reviewsService.remove(id, userId);
  }
}