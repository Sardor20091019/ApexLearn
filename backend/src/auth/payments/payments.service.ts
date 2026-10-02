import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service'; 
import { CreateCheckoutDto } from './dto/create-checkout.dto';

const Stripe = require('stripe');

@Injectable()
export class PaymentsService {
  private stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

  constructor(private database: DatabaseService) {}

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
}
