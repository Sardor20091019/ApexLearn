import { Module, Global } from '@nestjs/common';
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { DB } from './types'; 

@Global() 
@Module({
  providers: [
    {
      provide: 'DATABASE_CONNECTION',
      useFactory: async () => {
        const db = new Kysely<DB>({
          dialect: new PostgresDialect({
            pool: new Pool({
              connectionString: process.env.DATABASE_URL,
            }),
          }),
        });

        return db;
      },
    },
  ],
  exports: ['DATABASE_CONNECTION'],
})
export class DatabaseModule {}