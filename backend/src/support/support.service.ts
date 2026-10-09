import { Injectable, ForbiddenException } from '@nestjs/common';
import { SupportRepository } from './support.repo';
import Pusher from 'pusher';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SupportService {
  private pusher: Pusher;

  constructor(private readonly repo: SupportRepository) {
    this.pusher = new Pusher({
      appId: process.env.PUSHER_APP_ID || '',
      key: process.env.PUSHER_KEY || '',
      secret: process.env.PUSHER_SECRET || '',
      cluster: process.env.PUSHER_CLUSTER || 'ap2',
      useTLS: true,
    });
  }

  async getMessagesForUser(userId: string) {
    return this.repo.findUserMessages(userId);
  }

  async getAllConversationsForAdmin(adminRole: string) {
    if (adminRole !== 'ADMIN') {
      throw new ForbiddenException('Admins only');
    }

    const messages = await this.repo.findAllMessagesForAdmin();
    const userIds = [...new Set(messages.map((m) => m.userId))];
    const users = await this.repo.findUsersByIds(userIds);
    const usersById = new Map(users.map((u) => [u.id, u]));

    const conversationMap = new Map<
      string,
      {
        userId: string;
        userEmail: string;
        userFullName: string;
        lastMessage: string;
        lastMessageAt: Date;
      }
    >();

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

    const newMessage = await this.repo.createMessage({
      id: uuidv4(),
      userId: recipientId,
      senderRole,
      message: messageText,
      createdAt: new Date(),
    });

    const payload = {
      id: newMessage.id,
      userId: recipientId,
      sender: senderRole,
      text: newMessage.message,
      timestamp: new Date(newMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    if (senderRole === 'admin') {
      this.repo
        .createNotification(
          recipientId,
          'Support Agent Replied 💬',
          `Admin replied: "${messageText.slice(0, 60)}${messageText.length > 60 ? '...' : ''}"`,
        )
        .catch(console.error);
    }

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
