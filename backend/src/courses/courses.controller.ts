import { Controller, Get, Post, Put, Delete, Body, Param, Req, Res, UseGuards, ForbiddenException, Query } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto, CreateSectionDto, CreateLessonDto } from './dto/course.dto';
import { CourseQueryDto } from './dto/course-query.dto';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
 
interface RequestWithUser extends Request {
  user?: {
    sub?: string;
    id?: string;
    email?: string;
    role?: string;
  };
}

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  findAll(@Query() query: CourseQueryDto) {
    return this.coursesService.findAllPublished(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('INSTRUCTOR', 'ADMIN')
  @Get('instructor/mine')
  findMyInstructorCourses(@Req() req: RequestWithUser) {
    const user = req.user;
    const userId = user?.sub ?? user?.id ?? '';
    return this.coursesService.findInstructorCourses(userId);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('lessons/:lessonId/stream')
  async streamLesson(
    @Param('lessonId') lessonId: string,
    @Req() req: RequestWithUser,
    @Res() res: Response,
  ) {
    const userId = req.user?.sub ?? req.user?.id;
    const userRole = req.user?.role;
    return this.coursesService.streamLessonVideo(lessonId, req, res, userId, userRole);
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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('INSTRUCTOR', 'ADMIN')
  @Post()
  createCourse(@Req() req: RequestWithUser, @Body() dto: CreateCourseDto & { [key: string]: unknown }) {
    const user = req.user;
    const userId = user?.sub ?? user?.id ?? ''; 
    return this.coursesService.createCourse(userId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('INSTRUCTOR', 'ADMIN')
  @Post(':id/sections')
  addSection(@Req() req: RequestWithUser, @Param('id') courseId: string, @Body() dto: CreateSectionDto) {
    return this.coursesService.addSection(courseId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('INSTRUCTOR', 'ADMIN')
  @Post('sections/:sectionId/lessons')
  addLesson(@Req() req: RequestWithUser, @Param('sectionId') sectionId: string, @Body() dto: CreateLessonDto & { content?: string }) {
    return this.coursesService.addLesson(sectionId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('INSTRUCTOR', 'ADMIN')
  @Put(':id')
  updateCourse(
    @Req() req: RequestWithUser,
    @Param('id') courseId: string,
    @Body() dto: any,
  ) {
    const user = req.user;
    const role = (user?.role || '').toString().toUpperCase();
    const userId = user?.sub ?? user?.id ?? '';
    const isAdmin = role === 'ADMIN';
    return this.coursesService.updateCourse(userId, courseId, dto, isAdmin);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('INSTRUCTOR', 'ADMIN')
  @Delete(':id')
  deleteCourse(
    @Req() req: RequestWithUser,
    @Param('id') courseId: string,
  ) {
    const user = req.user;
    const role = (user?.role || '').toString().toUpperCase();
    const userId = user?.sub ?? user?.id ?? '';
    const isAdmin = role === 'ADMIN';
    return this.coursesService.deleteCourse(userId, courseId, isAdmin);
  }
}