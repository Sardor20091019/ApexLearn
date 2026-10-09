import { Controller, Post, Get, UseGuards, Req, Body, Headers, RawBodyRequest } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; 
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { AuthenticatedRequest } from '../common/types';
import { Request } from 'express';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create-checkout-session')
  async createCheckoutSession(
    @Req() req: AuthenticatedRequest,
    @Body() body: { courseId?: string; courseIds?: string[] },
  ) {
    const userId = req.user.id || req.user.sub || '';
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
    @Req() req: AuthenticatedRequest,
    @Body() body: { sessionId: string },
  ) {
    const userId = req.user.id || req.user.sub || '';
    return this.paymentsService.verifyCheckoutSession(body.sessionId, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('history')
  async getPaymentHistory(@Req() req: AuthenticatedRequest) {
    const userId = req.user.id || req.user.sub || '';
    return this.paymentsService.getPaymentHistory(userId);
  }

  @Post('webhook')
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = req.rawBody || (typeof req.body === 'string' ? Buffer.from(req.body) : Buffer.from(JSON.stringify(req.body || {})));
    return this.paymentsService.handleWebhook(rawBody, signature);
  }
}
