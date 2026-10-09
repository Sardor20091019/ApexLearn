import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationsRepository } from './notifications.repo';

@Injectable()
export class NotificationsService {
  constructor(private readonly repo: NotificationsRepository) {}

  async getUserNotifications(userId: string, page = 1, pageSize = 10) {
    const pageNum = Math.max(1, Number(page) || 1);
    const limit = Math.max(1, Math.min(100, Number(pageSize) || 10));
    const offset = (pageNum - 1) * limit;

    const [items, total] = await Promise.all([
      this.repo.findMany(userId, offset, limit),
      this.repo.countByUserId(userId),
    ]);

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
      await this.repo.markAllAsRead(userId);
      return { message: 'All notifications marked as read' };
    }

    const updated = await this.repo.markOneAsRead(userId, notificationId);
    if (!updated) {
      throw new NotFoundException('Notification not found');
    }

    return updated;
  }

  async deleteNotification(userId: string, notificationId: string) {
    const deleted = await this.repo.delete(userId, notificationId);
    if (!deleted) {
      throw new NotFoundException('Notification not found');
    }

    return { message: 'Notification deleted successfully' };
  }

  async createNotification(userId: string, title: string, body: string) {
    return this.repo.create(userId, title, body);
  }
}
