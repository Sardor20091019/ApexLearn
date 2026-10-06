import { Injectable, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import Pusher = require('pusher');
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SupportService {
  private pusher: Pusher;

  constructor(private readonly db: DatabaseService) {
    this.pusher = new Pusher({
      appId: process.env.PUSHER_APP_ID || '',
      key: process.env.PUSHER_KEY || '',
      secret: process.env.PUSHER_SECRET || '',
      cluster: process.env.PUSHER_CLUSTER || 'ap2',
      useTLS: true,
    });
  }

  async getMessagesForUser(userId: string) {
    return await this.db
      .selectFrom('SupportMessage')
      .selectAll()
      .where('userId', '=', userId)
      .orderBy('createdAt', 'asc')
      .execute();
  }

  async getAllConversationsForAdmin(adminRole: string) {
    if (adminRole !== 'ADMIN') {
      throw new ForbiddenException('Admins only');
    }

    const messages = await this.db
      .selectFrom('SupportMessage')
      .select(['userId', 'message', 'createdAt', 'senderRole'])
      .orderBy('SupportMessage.createdAt', 'desc')
      .execute();

    const userIds = [...new Set(messages.map((message) => message.userId))];
    const users = userIds.length === 0
      ? []
      : await this.db
          .selectFrom('User')
          .select(['id', 'email', 'name'])
          .where('id', 'in', userIds)
          .execute();
    const usersById = new Map(users.map((user) => [user.id, user]));

    const conversationMap = new Map<string, {
      userId: string;
      userEmail: string;
      userFullName: string;
      lastMessage: string;
      lastMessageAt: Date;
    }>();
    for (const m of messages) {
      if (!conversationMap.has(m.userId)) {
        const user = usersById.get(m.userId);
        if (!user) continue;

        conversationMap.set(m.userId, {
          userId: m.userId,
          userEmail: user.email,
          userFullName: user.name || user.email,
          lastMessage: m.message,
          lastMessageAt: m.createdAt,
        });
      }
    }

    return Array.from(conversationMap.values());
  }

  async sendMessage(userId: string, userRole: string, targetUserId: string | undefined, messageText: string) {
    let recipientId = userId;
    let senderRole = 'user';

    if (userRole === 'ADMIN') {
      if (!targetUserId) {
        throw new ForbiddenException('Admin must specify targetUserId to reply');
      }
      recipientId = targetUserId;
      senderRole = 'admin';
    }

    const id = uuidv4();
    const createdAt = new Date();

    const newMessage = await this.db
      .insertInto('SupportMessage')
      .values({
        id,
        userId: recipientId,
        senderRole,
        message: messageText,
        createdAt,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    const payload = {
      id: newMessage.id,
      userId: recipientId,
      sender: senderRole,
      text: newMessage.message,
      timestamp: new Date(newMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Non-blocking trigger to user support channel
    this.pusher.trigger(`support-${recipientId}`, 'new-message', payload).catch((err) => {
      console.error('Pusher trigger error (support channel):', err);
    });

    // Non-blocking trigger to global admin channel for instant inbox update
    this.pusher.trigger('support-admin', 'inbox-update', payload).catch((err) => {
      console.error('Pusher trigger error (support-admin channel):', err);
    });

    return newMessage;
  }
}
