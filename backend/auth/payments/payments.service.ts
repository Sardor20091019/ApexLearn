import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../src/database/database.service'; 
import { CreateCheckoutDto } from './dto/create-checkout.dto';

const Stripe = require('stripe');

@Injectable()
export class PaymentsService {
  private stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

  constructor(private database: DatabaseService) {}

  async createCheckoutSession(dto: CreateCheckoutDto): Promise<{ url: string | null }> {
    const { courseId, userId, email } = dto;

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


    const course = await this.database
      .selectFrom('Course')
      .selectAll()
      .where('id', '=', courseId)
      .executeTakeFirst();

    if (!course) {
      throw new NotFoundException('Course not found.');
    }


    const unitAmount = Math.round(Number(course.price ?? 0) * 100);


    const session = await this.stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: (course.currency || 'usd').toLowerCase(),
            product_data: {
              name: course.title,
              description: course.description || undefined,
              images: course.thumbnailUrl ? [course.thumbnailUrl] : [],
              tax_code: 'txcd_10000000', 
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/dashboard?canceled=true`,
      customer_email: dbUser.email,
      metadata: { 
        userId: dbUser.id, 
        courseId: course.id 
      },
    });

    return { url: session.url };
  }
}