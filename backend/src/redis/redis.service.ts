import { Injectable, Logger } from '@nestjs/common';
import { Redis } from '@upstash/redis';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;

  constructor() {
    const rawUrl = process.env.UPSTASH_REDIS_REST_URL || 'https://verified-garfish-318327.upstash.io';
    const rawToken = process.env.UPSTASH_REDIS_REST_TOKEN || '';
    const url = rawUrl.replace(/^["']|["']$/g, '').trim();
    const token = rawToken.replace(/^["']|["']$/g, '').trim();

    this.client = new Redis({ url, token });
  }

  getClient(): Redis {
    return this.client;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      return await this.client.get<T>(key);
    } catch (err: any) {
      this.logger.warn(`Redis GET cache miss/error for key "${key}": ${err?.message || err}`);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds: number = 60): Promise<void> {
    try {
      await this.client.set(key, value, { ex: ttlSeconds });
    } catch (err: any) {
      this.logger.warn(`Redis SET cache error for key "${key}": ${err?.message || err}`);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (err: any) {
      this.logger.warn(`Redis DEL error for key "${key}": ${err?.message || err}`);
    }
  }

  async delByPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.client.keys(pattern);
      if (keys && keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (err: any) {
      this.logger.warn(`Redis DEL pattern "${pattern}" error: ${err?.message || err}`);
    }
  }
}