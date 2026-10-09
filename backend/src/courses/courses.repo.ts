import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CourseStatus } from '../database/types';
import { CourseQueryDto } from './dto/course-query.dto';
import { sql } from 'kysely';

export interface CreateCourseData {
  title: string;
  description: string;
  price: string;
  pricingType: 'FREE' | 'PAID';
  categoryId: string | null;
  status: CourseStatus;
  level: string;
  thumbnailUrl: string | null;
  imageUrl: string | null;
  language: string;
  authorId: string;
}

export interface LessonData {
  title: string;
  videoUrl?: string | null;
  video_url?: string | null;
  videourl?: string | null;
  url?: string | null;
  content?: string | null;
  freePreview?: boolean;
  isFreePreview?: boolean;
  order?: number;
}

export interface SectionData {
  title?: string;
  lessons?: LessonData[];
}

@Injectable()
export class CoursesRepository {
  constructor(private readonly db: DatabaseService) {}

  async publishDrafts() {
    return this.db
      .updateTable('Course')
      .set({ status: 'PUBLISHED' })
      .where('status', '=', 'DRAFT')
      .where('deletedAt', 'is', null)
      .execute();
  }

  async ensureAuthorExists(authorId: string) {
    const existing = await this.db
      .selectFrom('User')
      .select('id')
      .where('id', '=', authorId)
      .executeTakeFirst();

    if (!existing) {
      await this.db
        .insertInto('User')
        .values({
          id: authorId,
          email: 'instructor@apexlearn.com',
          name: 'Instructor',
          password: 'hashed_password_placeholder',
          role: 'INSTRUCTOR',
        })
        .onConflict((oc) => oc.column('id').doNothing())
        .execute();
    }
  }

  async createCourse(data: CreateCourseData) {
    return this.db
      .insertInto('Course')
      .values(data)
      .returningAll()
      .executeTakeFirst();
  }

  async createSection(courseId: string, title: string, order: number) {
    return this.db
      .insertInto('Section')
      .values({
        title,
        courseId,
        order,
      })
      .returningAll()
      .executeTakeFirst();
  }

  async createLesson(sectionId: string, lesson: {
    title: string;
    videoUrl: string | null;
    content: string | null;
    freePreview: boolean;
    order: number;
  }) {
    return this.db
      .insertInto('Lesson')
      .values({
        title: lesson.title,
        videoUrl: lesson.videoUrl,
        content: lesson.content,
        freePreview: lesson.freePreview,
        order: lesson.order,
        sectionId,
      })
      .returningAll()
      .executeTakeFirst();
  }

  async findPublishedCourses(query: CourseQueryDto | undefined, limit: number, offset: number) {
    const category = query?.category?.trim() || query?.categoryId?.trim() || 'All';
    const sort = query?.sort || 'newest';
    const search = query?.search?.trim() || '';
    const tier = query?.tier || 'all';
    const minPrice = query?.minPrice !== undefined ? Number(query.minPrice) : undefined;
    const maxPrice = query?.maxPrice !== undefined ? Number(query.maxPrice) : undefined;

    let dbQuery = this.db
      .selectFrom('Course')
      .leftJoin('Category', 'Category.id', 'Course.categoryId')
      .leftJoin('User', 'User.id', 'Course.authorId')
      .select([
        'Course.id',
        'Course.title',
        'Course.description',
        'Course.price',
        'Course.thumbnailUrl',
        'Course.imageUrl',
        'Course.status',
        'Course.level',
        'Course.ratingAverage',
        'Course.ratingCount',
        'Course.enrollmentCount',
        'Course.createdAt',
        'Course.updatedAt',
        'Category.id as categoryId',
        'Category.name as categoryName',
        'User.name as authorName',
        'User.avatarUrl as authorAvatarUrl',
      ])
      .where((eb) =>
        eb.or([
          eb('Course.status', '=', 'PUBLISHED'),
          eb('Course.status', '=', 'DRAFT'),
        ])
      )
      .where('Course.deletedAt', 'is', null);

    let countQuery = this.db
      .selectFrom('Course')
      .leftJoin('Category', 'Category.id', 'Course.categoryId')
      .select(sql<string | number>`count(*)`.as('count'))
      .where((eb) =>
        eb.or([
          eb('Course.status', '=', 'PUBLISHED'),
          eb('Course.status', '=', 'DRAFT'),
        ])
      )
      .where('Course.deletedAt', 'is', null);

    if (category && category !== 'All' && category !== 'all') {
      dbQuery = dbQuery.where((eb) =>
        eb.or([
          eb('Category.id', '=', category),
          eb('Category.name', 'ilike', category),
        ])
      );
      countQuery = countQuery.where((eb) =>
        eb.or([
          eb('Category.id', '=', category),
          eb('Category.name', 'ilike', category),
        ])
      );
    }

    if (search) {
      const searchPattern = `%${search}%`;
      dbQuery = dbQuery.where((eb) =>
        eb.or([
          eb('Course.title', 'ilike', searchPattern),
          eb('Course.description', 'ilike', searchPattern),
        ])
      );
      countQuery = countQuery.where((eb) =>
        eb.or([
          eb('Course.title', 'ilike', searchPattern),
          eb('Course.description', 'ilike', searchPattern),
        ])
      );
    }

    if (tier === 'free') {
      dbQuery = dbQuery.where((eb) =>
        eb.or([
          eb('Course.pricingType', '=', 'FREE'),
          eb('Course.price', '=', '0'),
          eb('Course.price', '=', '0.00'),
          eb('Course.price', 'is', null),
        ])
      );
      countQuery = countQuery.where((eb) =>
        eb.or([
          eb('Course.pricingType', '=', 'FREE'),
          eb('Course.price', '=', '0'),
          eb('Course.price', '=', '0.00'),
          eb('Course.price', 'is', null),
        ])
      );
    } else if (tier === 'paid') {
      dbQuery = dbQuery
        .where('Course.pricingType', '=', 'PAID')
        .where(sql<boolean>`CAST(COALESCE("Course"."price", '0') AS NUMERIC) > 0`);
      countQuery = countQuery
        .where('Course.pricingType', '=', 'PAID')
        .where(sql<boolean>`CAST(COALESCE("Course"."price", '0') AS NUMERIC) > 0`);
    }

    if (minPrice !== undefined && minPrice > 0) {
      dbQuery = dbQuery.where(sql<boolean>`CAST(COALESCE("Course"."price", '0') AS NUMERIC) >= ${minPrice}`);
      countQuery = countQuery.where(sql<boolean>`CAST(COALESCE("Course"."price", '0') AS NUMERIC) >= ${minPrice}`);
    }
    if (maxPrice !== undefined && maxPrice < 1000) {
      dbQuery = dbQuery.where(sql<boolean>`CAST(COALESCE("Course"."price", '0') AS NUMERIC) <= ${maxPrice}`);
      countQuery = countQuery.where(sql<boolean>`CAST(COALESCE("Course"."price", '0') AS NUMERIC) <= ${maxPrice}`);
    }

    switch (sort) {
      case 'oldest':
        dbQuery = dbQuery.orderBy('Course.createdAt', 'asc');
        break;
      case 'low':
        dbQuery = dbQuery.orderBy(sql`CAST(COALESCE("Course"."price", '0') AS NUMERIC)`, 'asc');
        break;
      case 'high':
        dbQuery = dbQuery.orderBy(sql`CAST(COALESCE("Course"."price", '0') AS NUMERIC)`, 'desc');
        break;
      case 'rating':
        dbQuery = dbQuery
          .orderBy('Course.ratingAverage', 'desc')
          .orderBy('Course.ratingCount', 'desc');
        break;
      case 'featured':
        dbQuery = dbQuery
          .orderBy('Course.enrollmentCount', 'desc')
          .orderBy('Course.ratingAverage', 'desc');
        break;
      case 'newest':
      default:
        dbQuery = dbQuery.orderBy('Course.createdAt', 'desc');
        break;
    }

    dbQuery = dbQuery.limit(limit).offset(offset);

    const [courses, countResult] = await Promise.all([
      dbQuery.execute(),
      countQuery.executeTakeFirst(),
    ]);

    return {
      courses,
      total: Number(countResult?.count ?? 0),
    };
  }

  async findCourseWithDetails(id: string) {
    return this.db
      .selectFrom('Course')
      .leftJoin('Category', 'Category.id', 'Course.categoryId')
      .leftJoin('User', 'User.id', 'Course.authorId')
      .select([
        'Course.id',
        'Course.title',
        'Course.description',
        'Course.price',
        'Course.thumbnailUrl',
        'Course.status',
        'Course.level',
        'Course.deletedAt',
        'Course.createdAt',
        'Course.updatedAt',
        'Category.id as categoryId',
        'Category.name as categoryName',
        'User.name as authorName',
        'User.avatarUrl as authorAvatarUrl',
      ])
      .where('Course.id', '=', id)
      .executeTakeFirst();
  }

  async findSectionsWithLessons(courseId: string) {
    const sections = await this.db
      .selectFrom('Section')
      .selectAll()
      .where('courseId', '=', courseId)
      .orderBy('order', 'asc')
      .execute();

    return Promise.all(
      sections.map(async (section) => {
        const lessons = await this.db
          .selectFrom('Lesson')
          .selectAll()
          .where('sectionId', '=', section.id)
          .orderBy('order', 'asc')
          .execute();

        return {
          ...section,
          lessons,
        };
      }),
    );
  }

  async findLessonById(lessonId: string) {
    return this.db
      .selectFrom('Lesson')
      .selectAll()
      .where('id', '=', lessonId)
      .executeTakeFirst();
  }

  async updateLessonSubtitle(lessonId: string, subtitleUrl: string) {
    return this.db
      .updateTable('Lesson')
      .set({
        subtitleUrl,
        updatedAt: new Date(),
      })
      .where('id', '=', lessonId)
      .execute();
  }

  async findInstructorCourses(userId: string) {
    return this.db
      .selectFrom('Course')
      .leftJoin('Category', 'Category.id', 'Course.categoryId')
      .select([
        'Course.id',
        'Course.title',
        'Course.description',
        'Course.price',
        'Course.thumbnailUrl',
        'Course.imageUrl',
        'Course.status',
        'Course.level',
        'Course.ratingAverage',
        'Course.ratingCount',
        'Course.enrollmentCount',
        'Course.createdAt',
        'Course.updatedAt',
        'Category.id as categoryId',
        'Category.name as categoryName',
      ])
      .where('Course.authorId', '=', userId)
      .where('Course.deletedAt', 'is', null)
      .orderBy('Course.createdAt', 'desc')
      .execute();
  }

  async findCourseById(id: string) {
    return this.db
      .selectFrom('Course')
      .selectAll()
      .where('id', '=', id)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();
  }

  async updateCourse(courseId: string, payload: any) {
    return this.db
      .updateTable('Course')
      .set(payload)
      .where('id', '=', courseId)
      .execute();
  }

  async replaceSections(courseId: string, sections: SectionData[]) {
    const existingSections = await this.db
      .selectFrom('Section')
      .select('id')
      .where('courseId', '=', courseId)
      .execute();

    const sectionIds = existingSections.map((s) => s.id);
    if (sectionIds.length > 0) {
      await this.db.deleteFrom('Lesson').where('sectionId', 'in', sectionIds).execute();
      await this.db.deleteFrom('Section').where('courseId', '=', courseId).execute();
    }

    for (let sIdx = 0; sIdx < sections.length; sIdx++) {
      const sec = sections[sIdx];
      const createdSection = await this.db
        .insertInto('Section')
        .values({
          title: sec.title || `Section ${sIdx + 1}`,
          courseId,
          order: sIdx,
        })
        .returningAll()
        .executeTakeFirst();

      if (createdSection && sec.lessons && Array.isArray(sec.lessons)) {
        for (let lIdx = 0; lIdx < sec.lessons.length; lIdx++) {
          const les = sec.lessons[lIdx];
          const videoUrlVal = les.videoUrl || les.video_url || les.videourl || les.url || null;
          await this.db
            .insertInto('Lesson')
            .values({
              title: les.title || `Lesson ${lIdx + 1}`,
              videoUrl: videoUrlVal,
              content: les.content || null,
              freePreview: les.isFreePreview ?? les.freePreview ?? false,
              order: lIdx,
              sectionId: createdSection.id,
            })
            .execute();
        }
      }
    }
  }

  async softDeleteCourse(courseId: string) {
    return this.db
      .updateTable('Course')
      .set({
        deletedAt: new Date(),
        status: 'ARCHIVED',
        updatedAt: new Date(),
      })
      .where('id', '=', courseId)
      .execute();
  }
}

