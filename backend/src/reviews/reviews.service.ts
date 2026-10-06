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
        'User.avatarUrl as userAvatarUrl',
      ])
      .where('Review.courseId', '=', courseId)
      .where('Review.deletedAt', 'is', null)
      .orderBy('Review.createdAt', 'desc')
      .execute();

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

    const course = await this.db
      .selectFrom('Course')
      .select(['title', 'authorId'])
      .where('id', '=', courseId)
      .executeTakeFirst();

    if (course && course.authorId && course.authorId !== userId) {
      this.db
        .insertInto('Notification')
        .values({
          userId: course.authorId,
          title: 'New Student Review ⭐',
          body: `A student left a ${dto.rating}-star review on your course "${course.title}".`,
          isRead: false,
        } as any)
        .execute()
        .catch(console.error);
    }

    const rev = await this.db
      .selectFrom('Review')
      .innerJoin('User', 'User.id', 'Review.userId')
      .select([
        'Review.id',
        'Review.rating',
        'Review.comment',
        'Review.createdAt',
        'User.name as userName',
        'User.avatarUrl as userAvatarUrl',
      ])
      .where('Review.userId', '=', userId)
      .where('Review.courseId', '=', courseId)
      .executeTakeFirstOrThrow();

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