import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

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
  async getProgress(@Req() req: any, @Param('courseId') courseId: string) {
    const userId = req.user.id;
    return this.progressService.getCourseProgress(userId, courseId);
  }

  @Post()
  async postProgress(@Req() req: any, @Body() dto: UpdateProgressDto) {
    const userId = req.user.id;
    return this.progressService.updateProgress(userId, dto);
  }
}