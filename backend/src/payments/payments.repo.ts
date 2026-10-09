import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class PaymentsRepository {
  constructor(private readonly db: DatabaseService) {}

  async findUserById(id: string) {
    return this.db
      .selectFrom('User')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }

  async findUserByEmail(email: string) {
    return this.db
      .selectFrom('User')
      .selectAll()
      .where('email', '=', email)
      .executeTakeFirst();
  }

  async findCoursesByIds(courseIds: string[]) {
    if (courseIds.length === 0) return [];
    return this.db
      .selectFrom('Course')
      .selectAll()
      .where('id', 'in', courseIds)
      .execute();
  }

  async findPaymentBySessionId(sessionId: string) {
    return this.db
      .selectFrom('Payment')
      .selectAll()
      .where('stripeSessionId', '=', sessionId)
      .executeTakeFirst();
  }

  async createPayment(data: {
    userId: string;
    stripeSessionId: string;
    stripePaymentIntentId: string | null;
    amount: string;
    currency: string;
    status: string;
    courseIds: string;
  }) {
    return this.db
      .insertInto('Payment')
      .values(data)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async createNotification(userId: string, title: string, body: string) {
    return this.db
      .insertInto('Notification')
      .values({
        userId,
        title,
        body,
        isRead: false,
      })
      .execute();
  }

  async findEnrollment(userId: string, courseId: string) {
    return this.db
      .selectFrom('Enrollment')
      .selectAll()
      .where('userId', '=', userId)
      .where('courseId', '=', courseId)
      .executeTakeFirst();
  }

  async findCourseById(courseId: string) {
    return this.db
      .selectFrom('Course')
      .selectAll()
      .where('id', '=', courseId)
      .executeTakeFirst();
  }

  async enrollUserInCourse(userId: string, courseId: string, pricePaid: string) {
    return this.db.transaction().execute(async (trx) => {
      await trx
        .insertInto('Enrollment')
        .values({
          userId,
          courseId,
          pricePaid,
        })
        .execute();

      await trx
        .updateTable('Course')
        .set((eb) => ({
          enrollmentCount: eb('enrollmentCount', '+', 1),
        }))
        .where('id', '=', courseId)
        .execute();
    });
  }

  async findUserPayments(userId: string) {
    return this.db
      .selectFrom('Payment')
      .selectAll()
      .where('userId', '=', userId)
      .orderBy('createdAt', 'desc')
      .execute();
  }

  async findCoursesSummaries(courseIds: string[]) {
    if (courseIds.length === 0) return [];
    return this.db
      .selectFrom('Course')
      .select(['id', 'title', 'thumbnailUrl', 'price', 'pricingType', 'currency'])
      .where('id', 'in', courseIds)
      .execute();
  }
}

