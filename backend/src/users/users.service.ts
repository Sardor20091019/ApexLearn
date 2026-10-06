import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly db: DatabaseService,
    private readonly redisService: RedisService,
  ) {}

  async getUserProfile(userId: string) {
    const cacheKey = `user:${userId}`;
    const redis = this.redisService.getClient();

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return typeof cached === 'string' ? JSON.parse(cached) : cached;
      }
    } catch (err) {
      console.warn('Redis read failed in getUserProfile:', err);
    }

    const user = await this.db
      .selectFrom('User')
      .select(['id', 'email', 'name', 'role', 'avatarUrl', 'createdAt'])
      .where('id', '=', userId)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    try {
      await redis.set(cacheKey, JSON.stringify(user), { ex: 300 });
    } catch (err) {
      console.warn('Redis write failed in getUserProfile:', err);
    }

    return user;
  }

  async updateUserProfile(userId: string, data: { name?: string; email?: string; avatarUrl?: string }) {
    const updatePayload: Record<string, any> = { updatedAt: new Date() };
    if (data.name) updatePayload.name = data.name;
    if (data.email) updatePayload.email = data.email;
    if (data.avatarUrl !== undefined) updatePayload.avatarUrl = data.avatarUrl;

    const updatedUser = await this.db
      .updateTable('User')
      .set(updatePayload)
      .where('id', '=', userId)
      .where('deletedAt', 'is', null)
      .returning(['id', 'email', 'name', 'role', 'avatarUrl', 'createdAt', 'updatedAt'])
      .executeTakeFirst();

    if (!updatedUser) {
      throw new NotFoundException('User profile not found');
    }

    const redis = this.redisService.getClient();
    try {
      await redis.del(`user:${userId}`);
    } catch (err) {
      console.warn('Redis del failed in updateUserProfile:', err);
    }

    return updatedUser;
  }

  async deleteUserProfile(userId: string) {
    const result = await this.db
      .updateTable('User')
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where('id', '=', userId)
      .returning(['id'])
      .executeTakeFirst();

    if (!result) {
      throw new NotFoundException('User account not found');
    }

    const redis = this.redisService.getClient();
    try {
      await redis.del(`user:${userId}`);
    } catch (err) {
      console.warn('Redis del failed in deleteUserProfile:', err);
    }

    return { message: 'Account soft-deleted successfully' };
  }
}
