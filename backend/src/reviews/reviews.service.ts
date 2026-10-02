import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly db: DatabaseService) {}

  async getReviewsByCourse(courseId: string) {
    const reviews = await this.db
      .selectFrom('Review')
      .innerJoin('User', 'User.id', 'Review.userId')
      .select([
        'Review.id',
        'Review.rating',
        'Review.comment',
        'Review.createdAt',
        'User.name as userName',
      ])
      .where('Review.courseId', '=', courseId)
      .where('Review.deletedAt', 'is', null)
      .orderBy('Review.createdAt', 'desc')
      .execute();

    return reviews.map((rev) => ({
      id: rev.id,
      userName: rev.userName || 'Anonymous Student',
      rating: rev.rating,
      comment: rev.comment,
      date: new Date(rev.createdAt).toLocaleDateString(),
    }));
  }

  async upsertReview(userId: string, courseId: string, dto: CreateReviewDto) {
    await this.db
      .insertInto('Review')
      .values({
        userId,
        courseId,
        rating: dto.rating,
        comment: dto.comment || null,
        updatedAt: new Date(),
      })
      .onConflict((oc) =>
        oc.columns(['userId', 'courseId']).doUpdateSet({
          rating: dto.rating,
          comment: dto.comment || null,
          updatedAt: new Date(),
        })
      )
      .execute();

    return this.db
      .selectFrom('Review')
      .innerJoin('User', 'User.id', 'Review.userId')
      .select([
        'Review.id',
        'Review.rating',
        'Review.comment',
        'Review.createdAt',
        'User.name as userName',
      ])
      .where('Review.userId', '=', userId)
      .where('Review.courseId', '=', courseId)
      .executeTakeFirstOrThrow();
  }
}