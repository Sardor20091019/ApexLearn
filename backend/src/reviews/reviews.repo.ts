import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { sql } from 'kysely';

@Injectable()
export class ReviewsRepository {
  constructor(private readonly db: DatabaseService) {}

  async isUserEnrolled(userId: string, courseId: string): Promise<boolean> {
    const enrollment = await this.db
      .selectFrom('Enrollment')
      .select('id')
      .where('userId', '=', userId)
      .where('courseId', '=', courseId)
      .executeTakeFirst();
    return !!enrollment;
  }

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
    return this.db.transaction().execute(async (trx) => {
      await trx
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

      const stats = await trx
        .selectFrom('Review')
        .select([
          sql<string | number>`count(*)`.as('reviewCount'),
          sql<string | number>`coalesce(round(avg(rating)::numeric, 1), 0)`.as('avgRating'),
        ])
        .where('courseId', '=', courseId)
        .where('deletedAt', 'is', null)
        .executeTakeFirst();

      const ratingCount = Number(stats?.reviewCount ?? 0);
      const ratingAverage = Number(stats?.avgRating ?? 0);

      await trx
        .updateTable('Course')
        .set({
          ratingAverage,
          ratingCount,
          updatedAt: new Date(),
        })
        .where('id', '=', courseId)
        .execute();
    });
  }

  async findCourseAuthor(courseId: string) {
    return this.db
      .selectFrom('Course')
      .select(['title', 'authorId'])
      .where('id', '=', courseId)
      .executeTakeFirst();
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

