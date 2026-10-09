import { Injectable } from '@nestjs/common';
import { ReviewsRepository } from './reviews.repo';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly repo: ReviewsRepository) {}

  async getReviewsByCourse(courseId: string) {
    const reviews = await this.repo.findByCourseId(courseId);

    return reviews.map((rev) => ({
      id: rev.id,
      userName: rev.userName || 'Anonymous Student',
      userAvatarUrl: rev.userAvatarUrl || null,
      rating: rev.rating,
      comment: rev.comment,
      date: new Date(rev.createdAt).toLocaleDateString(),
    }));
  }

  async upsertReview(userId: string, courseId: string, dto: CreateReviewDto) {
    await this.repo.upsert(userId, courseId, dto.rating, dto.comment || null);

    const course = await this.repo.findCourseAuthor(courseId);
    if (course?.authorId && course.authorId !== userId) {
      this.repo
        .createNotification(
          course.authorId,
          'New Student Review ⭐',
          `A student left a ${dto.rating}-star review on your course "${course.title}".`,
        )
        .catch(console.error);
    }

    const rev = await this.repo.findUserReview(userId, courseId);

    return {
      id: rev.id,
      userName: rev.userName || 'You',
      userAvatarUrl: rev.userAvatarUrl || null,
      rating: rev.rating,
      comment: rev.comment,
      date: 'Just now',
    };
  }
}