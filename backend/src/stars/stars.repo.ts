import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class StarsRepository {
  constructor(private readonly db: DatabaseService) {}

  async findUserStars(userId: string) {
    return this.db
      .selectFrom('Star')
      .select(['courseId', 'createdAt'])
      .where('userId', '=', userId)
      .execute();
  }

  async findStar(userId: string, courseId: string) {
    return this.db
      .selectFrom('Star')
      .selectAll()
      .where('userId', '=', userId)
      .where('courseId', '=', courseId)
      .executeTakeFirst();
  }

  async deleteStar(userId: string, courseId: string) {
    return this.db
      .deleteFrom('Star')
      .where('userId', '=', userId)
      .where('courseId', '=', courseId)
      .execute();
  }

  async createStar(userId: string, courseId: string) {
    return this.db
      .insertInto('Star')
      .values({
        userId,
        courseId,
      })
      .execute();
  }
}

