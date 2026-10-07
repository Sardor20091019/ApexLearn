import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class StarsService {
  constructor(private readonly database: DatabaseService) {}

  async getUserStars(userId: string): Promise<string[]> {
    const stars = await this.database
      .selectFrom('Star')
      .select(['courseId', 'createdAt'])
      .where('userId', '=', userId)
      .execute();
    return stars.map((s) => s.courseId);
  }

  async toggleStar(userId: string, courseId: string): Promise<{ isStarred: boolean; courseId: string }> {
    const existing = await this.database
      .selectFrom('Star')
      .selectAll()
      .where('userId', '=', userId)
      .where('courseId', '=', courseId)
      .executeTakeFirst();

    if (existing) {
      await this.database
        .deleteFrom('Star')
        .where('userId', '=', userId)
        .where('courseId', '=', courseId)
        .execute();
      return { isStarred: false, courseId };
    } else {
      await this.database
        .insertInto('Star')
        .values({
          userId,
          courseId,
        })
        .execute();
      return { isStarred: true, courseId };
    }
  }
}
