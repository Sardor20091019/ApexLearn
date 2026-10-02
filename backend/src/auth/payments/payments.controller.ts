import { Controller, Post, UseGuards, Req, Body } from '@nestjs/common';
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
}
