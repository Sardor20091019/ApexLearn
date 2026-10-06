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

    await db.schema
      .createTable('Payment')
      .ifNotExists()
      .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
      .addColumn('userId', 'uuid', (col) => col.references('User.id').onDelete('cascade').notNull())
      .addColumn('stripeSessionId', 'varchar(255)', (col) => col.unique().notNull())
      .addColumn('stripePaymentIntentId', 'varchar(255)')
      .addColumn('amount', sql`decimal(10, 2)`, (col) => col.notNull())
      .addColumn('currency', 'varchar(10)', (col) => col.defaultTo('usd').notNull())
      .addColumn('status', 'varchar(50)', (col) => col.defaultTo('COMPLETED').notNull())
      .addColumn('courseIds', 'text', (col) => col.notNull())
      .addColumn('createdAt', 'timestamp', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull())
      .execute();
    console.log('Table "Payment" created successfully!');

    await db.schema
      .createIndex('Payment_userId_idx')
      .ifNotExists()
      .on('Payment')
      .column('userId')
      .execute();

    await sql`ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "content" TEXT;`.execute(db);
    console.log('Column "content" ensured on "Lesson" table.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await db.destroy();
  }
}

runMigration();