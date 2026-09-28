import { Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { Kysely } from 'kysely';
import { DB } from '../database/types';

@Injectable()
export class EnrollmentsService {
  constructor(@Inject('DATABASE_CONNECTION') private db: Kysely<DB>) {}

  async enrollFreeCourse(userId: string, courseId: string) {
    // 1. Check if the course exists and is free
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

    // 2. Check if the user is already enrolled
    const existingEnrollment = await this.db
      .selectFrom('Enrollment')
      .selectAll()
      .where('userId', '=', userId)
      .where('courseId', '=', courseId)
      .executeTakeFirst();

    if (existingEnrollment) {
      throw new HttpException('Already enrolled in this course', HttpStatus.BAD_REQUEST);
    }

    // 3. Insert new enrollment record & increment enrollment count inside a transaction
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
    }));
  }
}