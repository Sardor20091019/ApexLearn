import { Controller, Post, UseGuards, Req } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../jwt-auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create-checkout-session')
  async createCheckoutSession(@Req() req: any) {
    const userId = req.user.userId || req.user.id;
    const email = req.user.email;
    return this.paymentsService.createCheckoutSession(userId, email);
  }
}