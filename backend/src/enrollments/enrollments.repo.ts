import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { sql } from 'kysely';

@Injectable()
export class EnrollmentsRepository {
  constructor(private readonly db: DatabaseService) {}

  async findCourseById(courseId: string) {
    return this.db
      .selectFrom('Course')
      .selectAll()
      .where('id', '=', courseId)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();
  }

  async findEnrollment(userId: string, courseId: string) {
    return this.db
      .selectFrom('Enrollment')
      .selectAll()
      .where('userId', '=', userId)
      .where('courseId', '=', courseId)
      .executeTakeFirst();
  }

  async createEnrollmentWithTransaction(userId: string, courseId: string, courseTitle: string) {
    return this.db.transaction().execute(async (trx) => {
      const newEnrollment = await trx
        .insertInto('Enrollment')
        .values({
          userId,
          courseId,
          pricePaid: '0.00',
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      await trx
        .updateTable('Course')
        .set((eb) => ({
          enrollmentCount: eb('enrollmentCount', '+', 1),
        }))
        .where('id', '=', courseId)
        .execute();

      await trx
        .insertInto('Notification')
        .values({
          userId,
          title: 'Course Enrolled! 📚',
          body: `You have successfully enrolled in "${courseTitle}". Start learning now!`,
          isRead: false,
        })
        .execute();

      return newEnrollment;
    });
  }

  async findUserEnrollments(userId: string) {
    return this.db
      .selectFrom('Enrollment')
      .innerJoin('Course', 'Course.id', 'Enrollment.courseId')
      .select([
        'Enrollment.id as enrollment_id',
        'Enrollment.createdAt as enrollment_created_at',
        'Course.id as course_id',
        'Course.title',
        'Course.description',
        'Course.thumbnailUrl',
        'Course.pricingType',
        'Course.price',
        'Course.currency',
        'Course.level',
      ])
      .where('Enrollment.userId', '=', userId)
      .execute();
  }

  async findUserCompletedLessons(userId: string) {
    return this.db
      .selectFrom('Progress')
      .innerJoin('Lesson', 'Lesson.id', 'Progress.lessonId')
      .innerJoin('Section', 'Section.id', 'Lesson.sectionId')
      .select(['Section.courseId as courseId', 'Progress.lessonId as lessonId'])
      .where('Progress.userId', '=', userId)
      .where('Progress.completed', '=', true)
      .execute();
  }

  async countLessonsByCourseIds(courseIds: string[]) {
    if (!courseIds || courseIds.length === 0) return [];
    return this.db
      .selectFrom('Section')
      .innerJoin('Lesson', 'Lesson.sectionId', 'Section.id')
      .select([
        'Section.courseId as courseId',
        sql<string | number>`count("Lesson"."id")`.as('totalCount'),
      ])
      .where('Section.courseId', 'in', courseIds)
      .where('Lesson.deletedAt', 'is', null)
      .where('Section.deletedAt', 'is', null)
      .groupBy('Section.courseId')
      .execute();
  }

  async findAllActiveLessonsByCourse() {
    return this.db
      .selectFrom('Lesson')
      .innerJoin('Section', 'Section.id', 'Lesson.sectionId')
      .select(['Section.courseId as courseId'])
      .where('Lesson.deletedAt', 'is', null)
      .where('Section.deletedAt', 'is', null)
      .execute();
  }
}


