import { Kysely, PostgresDialect, sql } from 'kysely';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const db = new Kysely<any>({
  dialect: new PostgresDialect({
    pool: new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    }),
  }),
});

async function runMigration() {
  console.log('Running direct migration to create SupportMessage table...');
  try {
    await db.schema
      .createTable('SupportMessage')
      .ifNotExists()
      .addColumn('id', 'serial', (col) => col.primaryKey())
      .addColumn('senderId', 'varchar(255)', (col) => col.notNull())
      .addColumn('receiverId', 'varchar(255)')
      .addColumn('message', 'text', (col) => col.notNull())
      .addColumn('isAdmin', 'boolean', (col) => col.defaultTo(false).notNull())
      .addColumn('createdAt', 'timestamp', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull())
      .execute();

    console.log('Table "SupportMessage" created successfully!');

    await sql`ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "content" TEXT;`.execute(db);
    console.log('Column "content" ensured on "Lesson" table.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await db.destroy();
  }
}

runMigration();