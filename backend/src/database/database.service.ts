import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
@Injectable()
export class DatabaseService extends Kysely<any> implements OnModuleDestroy {
  private pool: Pool;

  constructor() {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    super({
      dialect: new PostgresDialect({
        pool,
      }),
    });

    this.pool = pool;
  }

  async onModuleDestroy() {
    await this.destroy();
    await this.pool.end();
  }
}