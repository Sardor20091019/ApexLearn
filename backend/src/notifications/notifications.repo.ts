import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class NotificationsRepository {
  constructor(private readonly db: DatabaseService) {}

  async findMany(userId: string, offset: number, limit: number) {
    return this.db
      .selectFrom('Notification')
      .selectAll()
      .where('userId', '=', userId)
      .orderBy('createdAt', 'desc')
      .offset(offset)
      .limit(limit)
      .execute();
  }

  async countByUserId(userId: string): Promise<number> {
    const result = await this.db
      .selectFrom('Notification')
      .select((eb) => eb.fn.count('id').as('count'))
      .where('userId', '=', userId)
      .executeTakeFirst();

    return Number(result?.count || 0);
  }

  async markAllAsRead(userId: string) {
    return this.db
      .updateTable('Notification')
      .set({ isRead: true })
      .where('userId', '=', userId)
      .execute();
  }

  async markOneAsRead(userId: string, id: string) {
    return this.db
      .updateTable('Notification')
      .set({ isRead: true })
      .where('id', '=', id)
      .where('userId', '=', userId)
      .returningAll()
      .executeTakeFirst();
  }

  async delete(userId: string, id: string) {
    return this.db
      .deleteFrom('Notification')
      .where('id', '=', id)
      .where('userId', '=', userId)
      .returningAll()
      .executeTakeFirst();
  }

  async create(userId: string, title: string, body: string) {
    return this.db
      .insertInto('Notification')
      .values({
        userId,
        title,
        body,
        isRead: false,
      })
      .returningAll()
      .executeTakeFirst();
  }
}

