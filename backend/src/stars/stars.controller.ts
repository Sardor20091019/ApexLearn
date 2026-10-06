import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { StarsService } from './stars.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('stars')
@UseGuards(JwtAuthGuard)
export class StarsController {
  constructor(private readonly starsService: StarsService) {}

  @Get('me')
  async getMyStars(@Req() req: any) {
    const userId = req.user.id || req.user.userId;
    return this.starsService.getUserStars(userId);
  }

  @Post('toggle')
  async toggleStar(@Req() req: any, @Body() body: { courseId: string }) {
    const userId = req.user.id || req.user.userId;
    return this.starsService.toggleStar(userId, body.courseId);
  }
}
