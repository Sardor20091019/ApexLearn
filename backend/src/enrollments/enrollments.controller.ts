import { Controller, Post, Get, Body, Param, Req, UseGuards } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/types';

@Controller('enrollments')
@UseGuards(JwtAuthGuard)
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  async createEnrollment(@Req() req: AuthenticatedRequest, @Body() body: { courseId: string }) {
    const userId = req.user.id || req.user.sub || '';
    return this.enrollmentsService.enrollFreeCourse(userId, body.courseId);
  }

  @Get('me')
  async getMyEnrollments(@Req() req: AuthenticatedRequest) {
    const userId = req.user.id || req.user.sub || '';
    return this.enrollmentsService.getMyEnrollments(userId);
  }

  @Get('progress/:courseId')
  async getCourseProgress(@Req() req: AuthenticatedRequest, @Param('courseId') courseId: string) {
    const userId = req.user.id || req.user.sub || '';
    return this.enrollmentsService.getCourseProgress(userId, courseId);
  }

  @Post('progress')
  async updateLessonProgress(@Req() req: AuthenticatedRequest, @Body() body: { lessonId: string; completed: boolean }) {
    const userId = req.user.id || req.user.sub || '';
    return this.enrollmentsService.updateLessonProgress(userId, body.lessonId, body.completed);
  }
}
