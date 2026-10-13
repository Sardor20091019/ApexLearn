import { Kysely, sql } from 'kysely';
import { DB } from '../types';

export async function up(db: Kysely<DB>): Promise<void> {
  // 1. Composite catalog index for default course browsing
  await sql`
    CREATE INDEX IF NOT EXISTS "Course_status_deletedAt_createdAt_idx"
    ON "Course" ("status", "deletedAt", "createdAt" DESC)
  `.execute(db);

  // 2. High performance index for rating sorts (highest rated, featured)
  await sql`
    CREATE INDEX IF NOT EXISTS "Course_rating_stats_idx"
    ON "Course" ("status", "ratingAverage" DESC, "ratingCount" DESC)
  `.execute(db);

  // 3. High performance index for popular/enrollment sort
  await sql`
    CREATE INDEX IF NOT EXISTS "Course_popularity_idx"
    ON "Course" ("status", "enrollmentCount" DESC)
  `.execute(db);

  // 4. Index for pricing filters
  await sql`
    CREATE INDEX IF NOT EXISTS "Course_pricing_idx"
    ON "Course" ("pricingType", "price")
  `.execute(db);

  // 5. Index for fast student enrollment lookups by date
  await sql`
    CREATE INDEX IF NOT EXISTS "Enrollment_userId_createdAt_idx"
    ON "Enrollment" ("userId", "createdAt" DESC)
  `.execute(db);

  // 6. Fast review aggregation index
  await sql`
    CREATE INDEX IF NOT EXISTS "Review_courseId_rating_idx"
    ON "Review" ("courseId", "rating") WHERE "deletedAt" IS NULL
  `.execute(db);

  // 7. Full-text / Trigram search index for fast title searching
  try {
    await sql`CREATE EXTENSION IF NOT EXISTS pg_trgm;`.execute(db);
    await sql`
      CREATE INDEX IF NOT EXISTS "Course_title_trgm_idx"
      ON "Course" USING gin ("title" gin_trgm_ops)
    `.execute(db);
  } catch {
    // If user lacks superuser permissions to install pg_trgm, continue safely
  }
}

export async function down(db: Kysely<DB>): Promise<void> {
  await sql`DROP INDEX IF EXISTS "Course_title_trgm_idx"`.execute(db);
  await sql`DROP INDEX IF EXISTS "Review_courseId_rating_idx"`.execute(db);
  await sql`DROP INDEX IF EXISTS "Enrollment_userId_createdAt_idx"`.execute(db);
  await sql`DROP INDEX IF EXISTS "Course_pricing_idx"`.execute(db);
  await sql`DROP INDEX IF EXISTS "Course_popularity_idx"`.execute(db);
  await sql`DROP INDEX IF EXISTS "Course_rating_stats_idx"`.execute(db);
  await sql`DROP INDEX IF EXISTS "Course_status_deletedAt_createdAt_idx"`.execute(db);
}

