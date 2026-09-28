import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
// Replace with your actual authentication guard (e.g., JwtAuthGuard)
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('enrollments')
@UseGuards(JwtAuthGuard)
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  async createEnrollment(@Req() req: any, @Body() body: { courseId: string }) {
    // Extracts user ID from the decoded JWT payload (req.user.id or req.user.sub)
    const userId = req.user.id || req.user.sub;
    return this.enrollmentsService.enrollFreeCourse(userId, body.courseId);
  }

  @Get('me')
  async getMyEnrollments(@Req() req: any) {
    const userId = req.user.id || req.user.sub;
    return this.enrollmentsService.getMyEnrollments(userId);
  }
}