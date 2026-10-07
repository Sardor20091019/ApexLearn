
import { Injectable } from '@nestjs/common';
import { Redis } from '@upstash/redis';

@Injectable()
export class RedisService {
  private readonly client: Redis;

  constructor() {
    this.client = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }

  getClient(): Redis {
    return this.client;
  }
}