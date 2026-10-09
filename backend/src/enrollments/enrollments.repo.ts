import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

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

  async findAllActiveLessonsByCourse() {
    return this.db
      .selectFrom('Lesson')
      .innerJoin('Section', 'Section.id', 'Lesson.sectionId')
      .select(['Section.courseId as courseId'])
      .where('Lesson.deletedAt', 'is', null)
      .where('Section.deletedAt', 'is', null)
      .execute();
  }

  async findCompletedLessonIds(userId: string, courseId: string) {
    const rows = await this.db
      .selectFrom('Progress')
      .innerJoin('Lesson', 'Lesson.id', 'Progress.lessonId')
      .innerJoin('Section', 'Section.id', 'Lesson.sectionId')
      .select('Progress.lessonId')
      .where('Progress.userId', '=', userId)
      .where('Section.courseId', '=', courseId)
      .where('Progress.completed', '=', true)
      .execute();

    return rows.map((r) => r.lessonId);
  }

  async removeProgress(userId: string, lessonId: string) {
    return this.db
      .deleteFrom('Progress')
      .where('userId', '=', userId)
      .where('lessonId', '=', lessonId)
      .execute();
  }

  async upsertCompletedProgress(userId: string, lessonId: string) {
    return this.db
      .insertInto('Progress')
      .values({ userId, lessonId, completed: true })
      .onConflict((oc) =>
        oc.columns(['userId', 'lessonId']).doUpdateSet({
          completed: true,
          completedAt: new Date(),
        })
      )
      .execute();
  }
}

