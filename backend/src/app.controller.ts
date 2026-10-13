import { Controller, Get, HttpStatus, Res } from "@nestjs/common";
import { DatabaseService } from "./database/database.service";
import { RedisService } from "./redis/redis.service";
import { sql } from "kysely";
import type { Response } from "express";

@Controller()
export class AppController {
  constructor(
    private readonly db: DatabaseService,
    private readonly redisService: RedisService,
  ) {}

  @Get()
  getHello(): string {
    return "ApexLearn API is up and running!";
  }

  @Get('health')
  async checkHealth(@Res() res: Response) {
    let dbStatus = 'down';
    let redisStatus = 'down';

    try {
      await sql`SELECT 1`.execute(this.db);
      dbStatus = 'up';
    } catch {
      dbStatus = 'down';
    }

    try {
      const client = this.redisService.getClient();
      await client.ping();
      redisStatus = 'up';
    } catch {
      redisStatus = 'down';
    }

    const isHealthy = dbStatus === 'up';
    const status = isHealthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;

    return res.status(status).json({
      status: isHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        redis: redisStatus,
      },
    });
  }
}
