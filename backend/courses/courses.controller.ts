import { Controller, Get, Post, Body, Param, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto, CreateSectionDto, CreateLessonDto } from './dto/course.dto';
import { Request } from 'express';
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
  findAll(): Promise<any> {
    return this.coursesService.findAllPublished();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<any> {
    return this.coursesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  createCourse(@Req() req: RequestWithUser, @Body() dto: CreateCourseDto): Promise<any> {
    const user = req.user;
    const role = (user?.role || user?.userRole || user?.type || '').toString().toUpperCase();
    const authorized = role === 'INSTRUCTOR' || role === 'ADMIN' || user?.isAdmin || user?.isInstructor;

    if (!authorized) {
      throw new ForbiddenException('Only instructors or admins can create courses.');
    }
    const userId = user?.sub ?? user?.id; 
    return this.coursesService.createCourse(userId as string, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/sections')
  addSection(@Req() req: RequestWithUser, @Param('id') courseId: string, @Body() dto: CreateSectionDto): Promise<any> {
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
  addLesson(@Req() req: RequestWithUser, @Param('sectionId') sectionId: string, @Body() dto: CreateLessonDto & { content?: string }): Promise<any> {
    const user = req.user;
    const role = (user?.role || user?.userRole || user?.type || '').toString().toUpperCase();
    const authorized = role === 'INSTRUCTOR' || role === 'ADMIN' || user?.isAdmin || user?.isInstructor;

    if (!authorized) {
      throw new ForbiddenException('Only instructors or admins can add lessons.');
    }
    return this.coursesService.addLesson(sectionId, dto);
  }
}