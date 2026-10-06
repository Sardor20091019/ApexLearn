import { Controller, Post, Get, UseGuards, Req, Body, Headers, RawBodyRequest } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../jwt-auth.guard'; 
import { CreateCheckoutDto } from './dto/create-checkout.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create-checkout-session')
  async createCheckoutSession(
    @Req() req: any,
    @Body() body: { courseId?: string; courseIds?: string[] },
  ) {
    const userId = req.user.userId || req.user.id;
    const email = req.user.email;

    const dto: CreateCheckoutDto = {
      courseId: body.courseId,
      courseIds: body.courseIds,
      userId,
      email,
    };

    return this.paymentsService.createCheckoutSession(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify-session')
  async verifyCheckoutSession(
    @Req() req: any,
    @Body() body: { sessionId: string },
  ) {
    const userId = req.user.userId || req.user.id;
    return this.paymentsService.verifyCheckoutSession(body.sessionId, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('history')
  async getPaymentHistory(@Req() req: any) {
    const userId = req.user.userId || req.user.id;
    return this.paymentsService.getPaymentHistory(userId);
  }

  @Post('webhook')
  async handleWebhook(
    @Req() req: RawBodyRequest<any>,
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = req.rawBody || (typeof req.body === 'string' ? Buffer.from(req.body) : Buffer.from(JSON.stringify(req.body || {})));
    return this.paymentsService.handleWebhook(rawBody, signature);
  }
}
