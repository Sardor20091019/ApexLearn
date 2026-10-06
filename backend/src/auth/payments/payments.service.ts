import { Injectable, NotFoundException, BadRequestException, Optional, Inject } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service'; 
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { QueuesService } from '../../queues/queues.service';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

  constructor(
    private database: DatabaseService,
    @Optional() @Inject(QueuesService) private queuesService?: QueuesService,
  ) {}

  async createCheckoutSession(dto: CreateCheckoutDto): Promise<{ url: string | null }> {
    const { courseId, courseIds, userId, email } = dto;
    const requestedCourseIds = [...new Set(courseIds?.length ? courseIds : courseId ? [courseId] : [])];
    if (requestedCourseIds.length === 0) {
      throw new BadRequestException('Select at least one course before checkout.');
    }

    if (!userId && !email) {
      throw new BadRequestException('Either userId or email must be provided.');
    }

    let dbUser = null;
    if (userId) {
      dbUser = await this.database
        .selectFrom('User')
        .selectAll()
        .where('id', '=', userId)
        .executeTakeFirst();
    } else if (email) {
      dbUser = await this.database
        .selectFrom('User')
        .selectAll()
        .where('email', '=', email)
        .executeTakeFirst();
    }

    if (!dbUser) {
      throw new NotFoundException('User not found.');
    }

    const courses = await this.database
      .selectFrom('Course')
      .selectAll()
      .where('id', 'in', requestedCourseIds)
      .execute();

    if (courses.length !== requestedCourseIds.length) {
      throw new NotFoundException('One or more courses were not found.');
    }

    const session = await this.stripe.checkout.sessions.create({
      line_items: courses.map((course) => ({
        price_data: {
          currency: (course.currency || 'usd').toLowerCase(),
          product_data: {
            name: course.title,
            description: course.description || undefined,
            images: course.thumbnailUrl ? [course.thumbnailUrl] : [],
            tax_code: 'txcd_10000000', 
          },
          unit_amount: Math.round(Number(course.price ?? 0) * 100),
        },
        quantity: 1,
      })),
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/dashboard?canceled=true`,
      customer_email: dbUser.email,
      metadata: { 
        userId: dbUser.id, 
        courseIds: requestedCourseIds.join(',')
      },
    });

    return { url: session.url };
  }

  async fulfillCheckoutSession(session: Stripe.Checkout.Session) {
    if (session.payment_status !== 'paid') {
      return null;
    }

    const sessionId = session.id;

    const existingPayment = await this.database
      .selectFrom('Payment')
      .selectAll()
      .where('stripeSessionId', '=', sessionId)
      .executeTakeFirst();

    if (existingPayment) {
      return existingPayment;
    }

    let userId = session.metadata?.userId;
    let courseIds = session.metadata?.courseIds ? session.metadata.courseIds.split(',').filter(Boolean) : [];


    if (!userId && (session.customer_email || session.customer_details?.email)) {
      const email = session.customer_email || session.customer_details?.email;
      const user = await this.database
        .selectFrom('User')
        .select('id')
        .where('email', '=', email!)
        .executeTakeFirst();
      if (user) userId = user.id;
    }

    if (!userId) {
      throw new BadRequestException('User not identified for session.');
    }

    const totalAmount = ((session.amount_total ?? 0) / 100).toFixed(2);
    const currency = session.currency || 'usd';
    const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : null;


    const payment = await this.database
      .insertInto('Payment')
      .values({
        userId,
        stripeSessionId: sessionId,
        stripePaymentIntentId: paymentIntentId,
        amount: totalAmount,
        currency,
        status: 'COMPLETED',
        courseIds: courseIds.join(','),
      } as any)
      .returningAll()
      .executeTakeFirstOrThrow();

    await this.database
      .insertInto('Notification')
      .values({
        userId,
        title: 'Payment Completed! 🎉',
        body: `Payment of $${totalAmount} ${currency.toUpperCase()} was processed. Course access unlocked!`,
        isRead: false,
      } as any)
      .execute();


    for (const courseId of courseIds) {
      const existingEnrollment = await this.database
        .selectFrom('Enrollment')
        .selectAll()
        .where('userId', '=', userId)
        .where('courseId', '=', courseId)
        .executeTakeFirst();

      if (!existingEnrollment) {
        const course = await this.database
          .selectFrom('Course')
          .selectAll()
          .where('id', '=', courseId)
          .executeTakeFirst();

        await this.database.transaction().execute(async (trx) => {
          await trx
            .insertInto('Enrollment')
            .values({
              userId,
              courseId,
              pricePaid: course?.price ?? '0.00',
            } as any)
            .execute();

          await trx
            .updateTable('Course')
            .set((eb) => ({
              enrollmentCount: eb('enrollmentCount', '+', 1),
            }))
            .where('id', '=', courseId)
            .execute();
        });

        if (this.queuesService && course) {
          const user = await this.database
            .selectFrom('User')
            .select('email')
            .where('id', '=', userId)
            .executeTakeFirst();
          if (user?.email) {
            try {
              await this.queuesService.addEnrollmentEmail({
                email: user.email,
                courseTitle: course.title,
              });
            } catch (err) {
              console.error('Failed to add enrollment email job:', err);
            }
          }
        }
      }
    }

    return payment;
  }

  async verifyCheckoutSession(sessionId: string, userId: string) {
    if (!sessionId) {
      throw new BadRequestException('Session ID is required');
    }
    const session = await this.stripe.checkout.sessions.retrieve(sessionId);
    if (!session || session.payment_status !== 'paid') {
      throw new BadRequestException('Payment was not completed.');
    }
    if (session.metadata?.userId && session.metadata.userId !== userId) {
      throw new BadRequestException('Session does not belong to this user.');
    }

    const payment = await this.fulfillCheckoutSession(session);
    const courseIds = session.metadata?.courseIds ? session.metadata.courseIds.split(',') : [];
    return {
      success: true,
      message: 'Payment verified and course(s) added to My Learning',
      payment,
      courseIds,
    };
  }

  async getPaymentHistory(userId: string) {
    const payments = await this.database
      .selectFrom('Payment')
      .selectAll()
      .where('userId', '=', userId)
      .orderBy('createdAt', 'desc')
      .execute();

    const allCourseIds = new Set<string>();
    payments.forEach((p) => {
      const ids = p.courseIds ? p.courseIds.split(',').filter(Boolean) : [];
      ids.forEach((id) => allCourseIds.add(id));
    });

    const coursesList = allCourseIds.size > 0
      ? await this.database
          .selectFrom('Course')
          .select(['id', 'title', 'thumbnailUrl', 'price', 'pricingType', 'currency'])
          .where('id', 'in', Array.from(allCourseIds))
          .execute()
      : [];

    const coursesMap = new Map(coursesList.map((c) => [c.id, c]));

    return payments.map((p) => {
      const ids = p.courseIds ? p.courseIds.split(',').filter(Boolean) : [];
      const courses = ids.map((id) => coursesMap.get(id)).filter(Boolean);
      return {
        id: p.id,
        stripeSessionId: p.stripeSessionId,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        createdAt: p.createdAt,
        courses,
      };
    });
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event: Stripe.Event;
    if (webhookSecret && signature) {
      try {
        event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
      } catch (err: any) {
        throw new BadRequestException(`Webhook Error: ${err.message}`);
      }
    } else {
      try {
        event = JSON.parse(rawBody.toString());
      } catch {
        throw new BadRequestException('Invalid webhook body');
      }
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      await this.fulfillCheckoutSession(session);
    }
    return { received: true };
  }
}
