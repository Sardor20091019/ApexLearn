import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class SupportRepository {
  constructor(private readonly db: DatabaseService) {}

  async findUserMessages(userId: string) {
    return this.db
      .selectFrom('SupportMessage')
      .selectAll()
      .where('userId', '=', userId)
      .orderBy('createdAt', 'asc')
      .execute();
  }

  async findAllMessagesForAdmin() {
    return this.db
      .selectFrom('SupportMessage')
      .select(['userId', 'message', 'createdAt', 'senderRole'])
      .orderBy('SupportMessage.createdAt', 'desc')
      .execute();
  }

  async findUsersByIds(userIds: string[]) {
    if (userIds.length === 0) return [];
    return this.db
      .selectFrom('User')
      .select(['id', 'email', 'name'])
      .where('id', 'in', userIds)
      .execute();
  }

  async createMessage(data: {
    id: string;
    userId: string;
    senderRole: string;
    message: string;
    createdAt: Date;
  }) {
    return this.db
      .insertInto('SupportMessage')
      .values(data)
      .returningAll()
      .executeTakeFirstOrThrow();
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
}

