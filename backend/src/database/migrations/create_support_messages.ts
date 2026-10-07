import { Kysely, sql } from 'kysely';
import { DB } from '../types';

export async function up(db: Kysely<DB>): Promise<void> {
  await db.schema
    .createTable('SupportMessage')
    .addColumn('id', 'varchar(36)', (col) => col.primaryKey())
    .addColumn('userId', 'varchar(36)', (col) => col.notNull()) 
    .addColumn('senderRole', 'varchar(20)', (col) => col.notNull()) 
    .addColumn('message', 'text', (col) => col.notNull())
    .addColumn('createdAt', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  await db.schema
    .createIndex('support_message_user_id_idx')
    .on('SupportMessage')
    .columns(['userId'])
    .execute();
}

export async function down(db: Kysely<DB>): Promise<void> {
  await db.schema.dropTable('SupportMessage').execute();
}