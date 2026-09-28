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
              // or individual credentials:
              // host: process.env.DB_HOST,
              // port: Number(process.env.DB_PORT),
              // database: process.env.DB_NAME,
              // user: process.env.DB_USER,
              // password: process.env.DB_PASSWORD,
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