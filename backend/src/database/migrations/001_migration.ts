import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Create Enums
  await sql`CREATE TYPE "Role" AS ENUM ('USER', 'INSTRUCTOR', 'ADMIN')`.execute(db);
  await sql`CREATE TYPE "CourseStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED')`.execute(db);
  await sql`CREATE TYPE "UploadType" AS ENUM ('VIDEO', 'IMAGE', 'DOCUMENT')`.execute(db);
  await sql`CREATE TYPE "PricingType" AS ENUM ('FREE', 'PAID')`.execute(db);

  // 1. User Table
  await db.schema
    .createTable('User')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('email', 'varchar', (col) => col.unique().notNull())
    .addColumn('password', 'varchar', (col) => col.notNull())
    .addColumn('name', 'varchar', (col) => col.notNull())
    .addColumn('role', sql`"Role"`, (col) => col.defaultTo('USER').notNull())
    .addColumn('avatarUrl', 'varchar')
    .addColumn('createdAt', 'timestamp', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull())
    .addColumn('updatedAt', 'timestamp', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull())
    .addColumn('deletedAt', 'timestamp')
    .execute();

  await db.schema.createIndex('User_role_idx').on('User').column('role').execute();
  await db.schema.createIndex('User_deletedAt_idx').on('User').column('deletedAt').execute();

  // 2. RefreshToken Table
  await db.schema
    .createTable('RefreshToken')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('userId', 'uuid', (col) => col.references('User.id').onDelete('cascade').notNull())
    .addColumn('tokenHash', 'varchar')
    .addColumn('createdAt', 'timestamp', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull())
    .addColumn('updatedAt', 'timestamp', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull())
    .execute();

  await db.schema.createIndex('RefreshToken_userId_idx').on('RefreshToken').column('userId').execute();

  // 3. Category Table
  await db.schema
    .createTable('Category')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('name', 'varchar', (col) => col.unique().notNull())
    .addColumn('imageUrl', 'varchar')
    .addColumn('createdAt', 'timestamp', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull())
    .addColumn('updatedAt', 'timestamp', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull())
    .addColumn('deletedAt', 'timestamp')
    .execute();

  // 4. Course Table
  await db.schema
    .createTable('Course')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('title', 'varchar', (col) => col.notNull())
    .addColumn('description', 'text', (col) => col.notNull())
    .addColumn('thumbnailUrl', 'varchar')
    .addColumn('status', sql`"CourseStatus"`, (col) => col.defaultTo('DRAFT').notNull())
    .addColumn('pricingType', sql`"PricingType"`, (col) => col.defaultTo('FREE').notNull())
    .addColumn('price', sql`decimal(10, 2)`)
    .addColumn('imageUrl', 'text')
    .addColumn('language', 'text')
    .addColumn('currency', 'varchar', (col) => col.defaultTo('USD').notNull())
    .addColumn('authorId', 'uuid', (col) => col.references('User.id').notNull())
    .addColumn('categoryId', 'uuid', (col) => col.references('Category.id').onDelete('set null'))
    .addColumn('enrollmentCount', 'integer', (col) => col.defaultTo(0).notNull())
    .addColumn('ratingAverage', 'real', (col) => col.defaultTo(0).notNull())
    .addColumn('ratingCount', 'integer', (col) => col.defaultTo(0).notNull())
    .addColumn('createdAt', 'timestamp', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull())
    .addColumn('updatedAt', 'timestamp', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull())
    .addColumn('deletedAt', 'timestamp')
    .addColumn('level', 'varchar')
    .execute();

  await db.schema.createIndex('Course_authorId_idx').on('Course').column('authorId').execute();
  await db.schema.createIndex('Course_categoryId_idx').on('Course').column('categoryId').execute();
  await db.schema.createIndex('Course_status_idx').on('Course').column('status').execute();
  await db.schema.createIndex('Course_deletedAt_idx').on('Course').column('deletedAt').execute();
  await db.schema.createIndex('Course_title_idx').on('Course').column('title').execute();

  // 5. Section Table
  await db.schema
    .createTable('Section')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('title', 'varchar', (col) => col.notNull())
    .addColumn('order', 'integer', (col) => col.defaultTo(0).notNull())
    .addColumn('courseId', 'uuid', (col) => col.references('Course.id').onDelete('cascade').notNull())
    .addColumn('createdAt', 'timestamp', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull())
    .addColumn('updatedAt', 'timestamp', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull())
    .addColumn('deletedAt', 'timestamp')
    .execute();

  await db.schema.createIndex('Section_courseId_idx').on('Section').column('courseId').execute();

  // 6. Lesson Table
  await db.schema
    .createTable('Lesson')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('title', 'varchar', (col) => col.notNull())
    .addColumn('videoUrl', 'varchar')
    .addColumn('freePreview', 'boolean', (col) => col.defaultTo(false).notNull())
    .addColumn('order', 'integer', (col) => col.defaultTo(0).notNull())
    .addColumn('sectionId', 'uuid', (col) => col.references('Section.id').onDelete('cascade').notNull())
    .addColumn('createdAt', 'timestamp', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull())
    .addColumn('updatedAt', 'timestamp', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull())
    .addColumn('deletedAt', 'timestamp')
    .execute();

  await db.schema.createIndex('Lesson_sectionId_idx').on('Lesson').column('sectionId').execute();

  // 7. Enrollment Table
  await db.schema
    .createTable('Enrollment')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('userId', 'uuid', (col) => col.references('User.id').onDelete('cascade').notNull())
    .addColumn('courseId', 'uuid', (col) => col.references('Course.id').onDelete('cascade').notNull())
    .addColumn('pricePaid', sql`decimal(10, 2)`)
    .addColumn('createdAt', 'timestamp', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull())
    .addUniqueConstraint('Enrollment_userId_courseId_key', ['userId', 'courseId'])
    .execute();

  await db.schema.createIndex('Enrollment_courseId_idx').on('Enrollment').column('courseId').execute();

  // 8. Review Table
  await db.schema
    .createTable('Review')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('userId', 'uuid', (col) => col.references('User.id').onDelete('cascade').notNull())
    .addColumn('courseId', 'uuid', (col) => col.references('Course.id').onDelete('cascade').notNull())
    .addColumn('rating', 'integer', (col) => col.notNull())
    .addColumn('comment', 'text')
    .addColumn('createdAt', 'timestamp', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull())
    .addColumn('updatedAt', 'timestamp', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull())
    .addColumn('deletedAt', 'timestamp')
    .addUniqueConstraint('Review_userId_courseId_key', ['userId', 'courseId'])
    .execute();

  await db.schema.createIndex('Review_courseId_idx').on('Review').column('courseId').execute();

  // 9. Star Table
  await db.schema
    .createTable('Star')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('userId', 'uuid', (col) => col.references('User.id').onDelete('cascade').notNull())
    .addColumn('courseId', 'uuid', (col) => col.references('Course.id').onDelete('cascade').notNull())
    .addColumn('createdAt', 'timestamp', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull())
    .addUniqueConstraint('Star_userId_courseId_key', ['userId', 'courseId'])
    .execute();

  await db.schema.createIndex('Star_courseId_idx').on('Star').column('courseId').execute();

  // 10. Comment Table
  await db.schema
    .createTable('Comment')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('userId', 'uuid', (col) => col.references('User.id').onDelete('cascade').notNull())
    .addColumn('lessonId', 'uuid', (col) => col.references('Lesson.id').onDelete('cascade').notNull())
    .addColumn('body', 'text', (col) => col.notNull())
    .addColumn('createdAt', 'timestamp', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull())
    .addColumn('deletedAt', 'timestamp')
    .execute();

  await db.schema.createIndex('Comment_lessonId_idx').on('Comment').column('lessonId').execute();

  // 11. Progress Table
  await db.schema
    .createTable('Progress')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('userId', 'uuid', (col) => col.references('User.id').onDelete('cascade').notNull())
    .addColumn('lessonId', 'uuid', (col) => col.references('Lesson.id').onDelete('cascade').notNull())
    .addColumn('completed', 'boolean', (col) => col.defaultTo(true).notNull())
    .addColumn('completedAt', 'timestamp', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull())
    .addUniqueConstraint('Progress_userId_lessonId_key', ['userId', 'lessonId'])
    .execute();

  await db.schema.createIndex('Progress_lessonId_idx').on('Progress').column('lessonId').execute();

  // 12. Upload Table
  await db.schema
    .createTable('Upload')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('userId', 'uuid', (col) => col.references('User.id').notNull())
    .addColumn('key', 'varchar', (col) => col.notNull())
    .addColumn('bucket', 'varchar', (col) => col.notNull())
    .addColumn('type', sql`"UploadType"`, (col) => col.notNull())
    .addColumn('mimeType', 'varchar')
    .addColumn('sizeBytes', 'integer')
    .addColumn('createdAt', 'timestamp', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull())
    .execute();

  await db.schema.createIndex('Upload_userId_idx').on('Upload').column('userId').execute();

  // 13. Notification Table
  await db.schema
    .createTable('Notification')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('userId', 'uuid', (col) => col.references('User.id').onDelete('cascade').notNull())
    .addColumn('title', 'varchar', (col) => col.notNull())
    .addColumn('body', 'text', (col) => col.notNull())
    .addColumn('isRead', 'boolean', (col) => col.defaultTo(false).notNull())
    .addColumn('createdAt', 'timestamp', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull())
    .execute();

  await db.schema.createIndex('Notification_userId_isRead_idx').on('Notification').columns(['userId', 'isRead']).execute();

  // 14. Conversation Table
  await db.schema
    .createTable('Conversation')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('userId', 'uuid', (col) => col.references('User.id').onDelete('cascade').notNull())
    .addColumn('adminId', 'uuid', (col) => col.references('User.id'))
    .addColumn('createdAt', 'timestamp', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull())
    .addColumn('updatedAt', 'timestamp', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull())
    .execute();

  await db.schema.createIndex('Conversation_userId_idx').on('Conversation').column('userId').execute();
  await db.schema.createIndex('Conversation_adminId_idx').on('Conversation').column('adminId').execute();

  // 15. Message Table
  await db.schema
    .createTable('Message')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('conversationId', 'uuid', (col) => col.references('Conversation.id').onDelete('cascade').notNull())
    .addColumn('senderId', 'uuid', (col) => col.references('User.id').notNull())
    .addColumn('body', 'text', (col) => col.notNull())
    .addColumn('createdAt', 'timestamp', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull())
    .execute();

  await db.schema.createIndex('Message_conversationId_idx').on('Message').column('conversationId').execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop tables in reverse order to respect foreign key dependencies
  await db.schema.dropTable('Message').execute();
  await db.schema.dropTable('Conversation').execute();
  await db.schema.dropTable('Notification').execute();
  await db.schema.dropTable('Upload').execute();
  await db.schema.dropTable('Progress').execute();
  await db.schema.dropTable('Comment').execute();
  await db.schema.dropTable('Star').execute();
  await db.schema.dropTable('Review').execute();
  await db.schema.dropTable('Enrollment').execute();
  await db.schema.dropTable('Lesson').execute();
  await db.schema.dropTable('Section').execute();
  await db.schema.dropTable('Course').execute();
  await db.schema.dropTable('Category').execute();
  await db.schema.dropTable('RefreshToken').execute();
  await db.schema.dropTable('User').execute();

  // Drop Enums
  await sql`DROP TYPE IF EXISTS "PricingType"`.execute(db);
  await sql`DROP TYPE IF EXISTS "UploadType"`.execute(db);
  await sql`DROP TYPE IF EXISTS "CourseStatus"`.execute(db);
  await sql`DROP TYPE IF EXISTS "Role"`.execute(db);
}