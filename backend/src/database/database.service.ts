import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { DB } from './types';

@Injectable()
export class DatabaseService extends Kysely<DB> implements OnModuleDestroy {
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