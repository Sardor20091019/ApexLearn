import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class ReviewsRepository {
  constructor(private readonly db: DatabaseService) {}

  async findByCourseId(courseId: string) {
    return this.db
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
  }

  async upsert(userId: string, courseId: string, rating: number, comment: string | null) {
    return this.db
      .insertInto('Review')
      .values({
        userId,
        courseId,
        rating,
        comment,
        updatedAt: new Date(),
      })
      .onConflict((oc) =>
        oc.columns(['userId', 'courseId']).doUpdateSet({
          rating,
          comment,
          updatedAt: new Date(),
        })
      )
      .execute();
  }

  async findCourseAuthor(courseId: string) {
    return this.db
      .selectFrom('Course')
      .select(['title', 'authorId'])
      .where('id', '=', courseId)
      .executeTakeFirst();
  }

  async createNotification(userId: string, title: string, body: string) {
    return this.db
      .insertInto('Notification')
      .values({
        userId,
        title,
        body,
        isRead: false,
      })
      .execute();
  }

  async findUserReview(userId: string, courseId: string) {
    return this.db
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
  }
}

