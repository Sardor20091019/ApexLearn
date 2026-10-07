import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { StarsService } from './stars.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/types';

@Controller('stars')
@UseGuards(JwtAuthGuard)
export class StarsController {
  constructor(private readonly starsService: StarsService) {}

  @Get('me')
  async getMyStars(@Req() req: AuthenticatedRequest): Promise<string[]> {
    const userId = req.user.id || req.user.sub || '';
    return this.starsService.getUserStars(userId);
  }

  @Post('toggle')
  async toggleStar(@Req() req: AuthenticatedRequest, @Body() body: { courseId: string }): Promise<{ isStarred: boolean; courseId: string }> {
    const userId = req.user.id || req.user.sub || '';
    return this.starsService.toggleStar(userId, body.courseId);
  }
}
