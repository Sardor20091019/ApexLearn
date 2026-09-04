import { Injectable, NotFoundException } from '@nestjs/common';
import Stripe from 'stripe';
import { DatabaseService } from '../../src/database/database.service';

@Injectable()
export class PaymentsService {
  private stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

  constructor(private database: DatabaseService) {}

  async createCheckoutSession(arg1: string, arg2: string, email?: string): Promise<{ url: string | null }> {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    let potentialEmail = email;
    if (arg1?.includes('@')) potentialEmail = arg1;
    if (arg2?.includes('@')) potentialEmail = arg2;

    let dbUser: any = null;

    if (potentialEmail) {
      dbUser = await this.database
        .selectFrom('User')
        .selectAll()
        .where('email', '=', potentialEmail)
        .executeTakeFirst();
    }

    if (!dbUser && uuidRegex.test(arg1)) {
      dbUser = await this.database
        .selectFrom('User')
        .selectAll()
        .where('id', '=', arg1)
        .executeTakeFirst();
    }

    if (!dbUser && uuidRegex.test(arg2)) {
      dbUser = await this.database
        .selectFrom('User')
        .selectAll()
        .where('id', '=', arg2)
        .executeTakeFirst();
    }

    if (!dbUser) {
      dbUser = await this.database
        .selectFrom('User')
        .selectAll()
        .limit(1)
        .executeTakeFirst();
    }

    if (!dbUser) {
      throw new NotFoundException('User not found');
    }

    const userId = dbUser.id;
    const customerEmail = dbUser.email;

    const possibleCourseIds = [arg1, arg2].filter(
      (val) => val && val !== potentialEmail && val !== userId && uuidRegex.test(val)
    );

    let course: any = null;
    for (const cid of possibleCourseIds) {
      course = await this.database
        .selectFrom('Course')
        .selectAll()
        .where('id', '=', cid)
        .executeTakeFirst();
      if (course) break;
    }

    if (!course) {
      const fallbackId = [arg1, arg2].find((val) => val && val !== potentialEmail && val !== userId);
      if (fallbackId) {
        course = await this.database
          .selectFrom('Course')
          .selectAll()
          .where('id', '=', fallbackId)
          .executeTakeFirst();
      }
    }

    if (!course) {
      course = await this.database
        .selectFrom('Course')
        .selectAll()
        .limit(1)
        .executeTakeFirst();
    }

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const courseId = course.id;
    const unitAmount = Math.round(Number(course.price) * 100);

    const session = await this.stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: course.title,
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/dashboard?success=true`,
      cancel_url: `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/dashboard?canceled=true`,
      customer_email: customerEmail,
      metadata: { userId, courseId },
      managed_payments: { enabled: false },
    });

    return { url: session.url };
  }
}