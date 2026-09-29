import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DatabaseService } from '../src/database/database.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { sql } from 'kysely';

@Injectable()
export class ReviewsService {
  constructor(private readonly db: DatabaseService) {}

  async create(userId: string, courseId: string, dto: CreateReviewDto) {
    return await this.db.transaction().execute(async (trx) => {
      try {
        const review = await trx
          .insertInto('Review')
          .values({
            userId,
            courseId,
            rating: dto.rating,
            comment: dto.comment,
          })
          .returningAll()
          .executeTakeFirstOrThrow();


        await this.updateCourseStats(trx, courseId);

        return review;
      } catch (error) {

        if (error?.code === '23505') {
          throw new ConflictException('You have already reviewed this course');
        }
        throw error;
      }
    });
  }

  async findByCourse(courseId: string) {
    return await this.db
      .selectFrom('Review')
      .selectAll()
      .where('courseId', '=', courseId)
      .where('deletedAt', 'is', null)
      .execute();
  }

  async update(id: string, userId: string, dto: UpdateReviewDto) {
    return await this.db.transaction().execute(async (trx) => {
      const review = await trx
        .updateTable('Review')
        .set({
          ...dto,
          updatedAt: new Date(),
        })
        .where('id', '=', id)
        .where('userId', '=', userId)
        .where('deletedAt', 'is', null)
        .returningAll()
        .executeTakeFirst();

      if (!review) {
        throw new NotFoundException('Review not found or unauthorized');
      }

      if (dto.rating !== undefined) {
        await this.updateCourseStats(trx, review.courseId);
      }

      return review;
    });
  }

  async remove(id: string, userId: string) {
    return await this.db.transaction().execute(async (trx) => {
      const review = await trx
        .deleteFrom('Review')
        .where('id', '=', id)
        .where('userId', '=', userId)
        .returningAll()
        .executeTakeFirst();

      if (!review) {
        throw new NotFoundException('Review not found or unauthorized');
      }

      await this.updateCourseStats(trx, review.courseId);

      return { message: 'Review deleted successfully' };
    });
  }

  private async updateCourseStats(trx: any, courseId: string) {
    const stats = await trx
      .selectFrom('Review')
      .select([
        sql<number>`count(*)::int`.as('count'),
        sql<number>`coalesce(avg(rating), 0)::real`.as('average'),
      ])
      .where('courseId', '=', courseId)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();

    await trx
      .updateTable('Course')
      .set({
        ratingCount: stats?.count ?? 0,
        ratingAverage: stats?.average ?? 0,
      })
      .where('id', '=', courseId)
      .execute();
  }
}