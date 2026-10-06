import { Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { Kysely } from 'kysely';
import { DB } from '../database/types';

@Injectable()
export class EnrollmentsService {
  constructor(@Inject('DATABASE_CONNECTION') private db: Kysely<DB>) {}

  async enrollFreeCourse(userId: string, courseId: string) {
    const course = await this.db
      .selectFrom('Course')
      .selectAll()
      .where('id', '=', courseId)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();

    if (!course) {
      throw new HttpException('Course not found', HttpStatus.NOT_FOUND);
    }

    if (course.pricingType !== 'FREE' && Number(course.price ?? 0) > 0) {
      throw new HttpException(
        'This course is paid. Please use the Stripe/checkout payment session.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const existingEnrollment = await this.db
      .selectFrom('Enrollment')
      .selectAll()
      .where('userId', '=', userId)
      .where('courseId', '=', courseId)
      .executeTakeFirst();

    if (existingEnrollment) {
      throw new HttpException('Already enrolled in this course', HttpStatus.BAD_REQUEST);
    }

    const result = await this.db.transaction().execute(async (trx) => {
      const newEnrollment = await trx
        .insertInto('Enrollment')
        .values({
          userId,
          courseId,
          pricePaid: '0.00',
        } as any)
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
          body: `You have successfully enrolled in "${course.title}". Start learning now!`,
          isRead: false,
        } as any)
        .execute();

      return newEnrollment;
    });

    return {
      message: 'Successfully enrolled in free course',
      enrollment: result,
    };
  }

  async getMyEnrollments(userId: string) {
    const enrollments = await this.db
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

    const progressRows = await this.db
      .selectFrom('Progress')
      .innerJoin('Lesson', 'Lesson.id', 'Progress.lessonId')
      .innerJoin('Section', 'Section.id', 'Lesson.sectionId')
      .select(['Section.courseId as courseId', 'Progress.lessonId as lessonId'])
      .where('Progress.userId', '=', userId)
      .where('Progress.completed', '=', true)
      .execute();

    const completedByCourse = new Map<string, number>();
    progressRows.forEach((row) => completedByCourse.set(row.courseId, (completedByCourse.get(row.courseId) || 0) + 1));

    const lessonRows = await this.db
      .selectFrom('Lesson')
      .innerJoin('Section', 'Section.id', 'Lesson.sectionId')
      .select(['Section.courseId as courseId'])
      .where('Lesson.deletedAt', 'is', null)
      .where('Section.deletedAt', 'is', null)
      .execute();
    const totalByCourse = new Map<string, number>();
    lessonRows.forEach((row) => totalByCourse.set(row.courseId, (totalByCourse.get(row.courseId) || 0) + 1));

    return enrollments.map((e) => ({
      id: e.enrollment_id,
      createdAt: e.enrollment_created_at,
      course: {
        id: e.course_id,
        title: e.title,
        description: e.description,
        thumbnailUrl: e.thumbnailUrl,
        pricingType: e.pricingType,
        price: e.price,
        currency: e.currency,
        level: e.level,
      },
      progress: totalByCourse.get(e.course_id)
        ? Math.round(((completedByCourse.get(e.course_id) || 0) / (totalByCourse.get(e.course_id) || 1)) * 100)
        : 0,
    }));
  }

  async getCourseProgress(userId: string, courseId: string) {
    const rows = await this.db
      .selectFrom('Progress')
      .innerJoin('Lesson', 'Lesson.id', 'Progress.lessonId')
      .innerJoin('Section', 'Section.id', 'Lesson.sectionId')
      .select('Progress.lessonId')
      .where('Progress.userId', '=', userId)
      .where('Section.courseId', '=', courseId)
      .where('Progress.completed', '=', true)
      .execute();
    return { completedLessonIds: rows.map((row) => row.lessonId) };
  }

  async updateLessonProgress(userId: string, lessonId: string, completed: boolean) {
    if (!completed) {
      await this.db.deleteFrom('Progress').where('userId', '=', userId).where('lessonId', '=', lessonId).execute();
      return { lessonId, completed: false };
    }

    await this.db
      .insertInto('Progress')
      .values({ userId, lessonId, completed: true } as any)
      .onConflict((oc) => oc.columns(['userId', 'lessonId']).doUpdateSet({ completed: true, completedAt: new Date() }))
      .execute();
    return { lessonId, completed: true };
  }
}
