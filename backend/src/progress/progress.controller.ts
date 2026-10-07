import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/types';

@Controller('progress')
export class PublicProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get('verify-certificate/:certId')
  async verifyCertificate(@Param('certId') certId: string) {
    return this.progressService.verifyCertificate(certId);
  }
}

@UseGuards(JwtAuthGuard)
@Controller('courses/:courseId/progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get()
  async getProgress(@Req() req: AuthenticatedRequest, @Param('courseId') courseId: string): Promise<{ completedLessons: Record<string, boolean> }> {
    const userId = req.user.id || req.user.sub || '';
    return this.progressService.getCourseProgress(userId, courseId);
  }

  @Post()
  async postProgress(@Req() req: AuthenticatedRequest, @Body() dto: UpdateProgressDto): Promise<{ success: boolean; lessonId: string; completed: boolean }> {
    const userId = req.user.id || req.user.sub || '';
    return this.progressService.updateProgress(userId, dto);
  }
}