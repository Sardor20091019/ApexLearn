import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly db: DatabaseService) {}

  async getUserNotifications(userId: string, page = 1, pageSize = 10) {
    const pageNum = Math.max(1, Number(page) || 1);
    const limit = Math.max(1, Math.min(100, Number(pageSize) || 10));
    const offset = (pageNum - 1) * limit;

    const [items, totalResult] = await Promise.all([
      this.db
        .selectFrom('Notification')
        .selectAll()
        .where('userId', '=', userId)
        .orderBy('createdAt', 'desc')
        .offset(offset)
        .limit(limit)
        .execute(),
      this.db
        .selectFrom('Notification')
        .select((eb) => eb.fn.count('id').as('count'))
        .where('userId', '=', userId)
        .executeTakeFirst(),
    ]);

    const total = Number(totalResult?.count || 0);

    return {
      items,
      meta: {
        page: pageNum,
        pageSize: limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async markAsRead(userId: string, notificationId: string) {
    if (notificationId === 'all') {
      await this.db
        .updateTable('Notification')
        .set({ isRead: true })
        .where('userId', '=', userId)
        .execute();
      return { message: 'All notifications marked as read' };
    }

    const updated = await this.db
      .updateTable('Notification')
      .set({ isRead: true })
      .where('id', '=', notificationId)
      .where('userId', '=', userId)
      .returningAll()
      .executeTakeFirst();

    if (!updated) {
      throw new NotFoundException('Notification not found');
    }

    return updated;
  }

  async deleteNotification(userId: string, notificationId: string) {
    const deleted = await this.db
      .deleteFrom('Notification')
      .where('id', '=', notificationId)
      .where('userId', '=', userId)
      .returningAll()
      .executeTakeFirst();

    if (!deleted) {
      throw new NotFoundException('Notification not found');
    }

    return { message: 'Notification deleted successfully' };
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
      .returningAll()
      .executeTakeFirst();
  }
}
