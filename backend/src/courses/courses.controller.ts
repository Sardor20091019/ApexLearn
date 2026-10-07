import { Controller, Get, Post, Body, Param, Req, Res, UseGuards, ForbiddenException, Query } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto, CreateSectionDto, CreateLessonDto } from './dto/course.dto';
import { CourseQueryDto } from './dto/course-query.dto';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
 
interface RequestWithUser extends Request {
  user?: {
    sub?: string;
    id?: string;
    email?: string;
    role?: string;
    userRole?: string;
    type?: string;
    isAdmin?: boolean;
    isInstructor?: boolean;
  };
}

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  findAll(@Query() query: CourseQueryDto) {
    return this.coursesService.findAllPublished(query);
  }

  @Get('lessons/:lessonId/stream')
  async streamLesson(
    @Param('lessonId') lessonId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.coursesService.streamLessonVideo(lessonId, req, res);
  }

  @Get('lessons/:lessonId/subtitles')
  async getLessonSubtitles(
    @Param('lessonId') lessonId: string,
    @Res() res: Response,
  ) {
    return this.coursesService.getLessonSubtitles(lessonId, res);
  }

  @UseGuards(JwtAuthGuard)
  @Post('lessons/:lessonId/subtitles')
  async updateLessonSubtitle(
    @Param('lessonId') lessonId: string,
    @Body('subtitleUrl') subtitleUrl: string,
  ) {
    return this.coursesService.updateLessonSubtitle(lessonId, subtitleUrl);
  }

  @UseGuards(JwtAuthGuard)
  @Post('lessons/:lessonId/auto-generate-subtitles')
  async autoGenerateSubtitles(@Param('lessonId') lessonId: string) {
    return this.coursesService.autoGenerateSubtitlesWithFfmpeg(lessonId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  createCourse(@Req() req: RequestWithUser, @Body() dto: CreateCourseDto & { [key: string]: unknown }) {
    const user = req.user;
    const role = (user?.role || user?.userRole || user?.type || '').toString().toUpperCase();
    const authorized = role === 'INSTRUCTOR' || role === 'ADMIN' || user?.isAdmin || user?.isInstructor;

    if (!authorized) {
      throw new ForbiddenException('Only instructors or admins can create courses.');
    }
    const userId = user?.sub ?? user?.id ?? ''; 
    return this.coursesService.createCourse(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/sections')
  addSection(@Req() req: RequestWithUser, @Param('id') courseId: string, @Body() dto: CreateSectionDto) {
    const user = req.user;
    const role = (user?.role || user?.userRole || user?.type || '').toString().toUpperCase();
    const authorized = role === 'INSTRUCTOR' || role === 'ADMIN' || user?.isAdmin || user?.isInstructor;

    if (!authorized) {
      throw new ForbiddenException('Only instructors or admins can add sections.');
    }
    return this.coursesService.addSection(courseId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('sections/:sectionId/lessons')
  addLesson(@Req() req: RequestWithUser, @Param('sectionId') sectionId: string, @Body() dto: CreateLessonDto & { content?: string }) {
    const user = req.user;
    const role = (user?.role || user?.userRole || user?.type || '').toString().toUpperCase();
    const authorized = role === 'INSTRUCTOR' || role === 'ADMIN' || user?.isAdmin || user?.isInstructor;

    if (!authorized) {
      throw new ForbiddenException('Only instructors or admins can add lessons.');
    }
    return this.coursesService.addLesson(sectionId, dto);
  }
}