import { Controller, Get, Post, Body, Param, Req } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto, CreateSectionDto, CreateLessonDto } from './dto/course.dto';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user?: {
    sub: string;
    email: string;
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

  @Post()
  createCourse(@Req() req: RequestWithUser, @Body() dto: CreateCourseDto): Promise<any> {
    const userId = req.user?.sub ?? 'temp-user-id'; 
    return this.coursesService.createCourse(userId, dto);
  }

  @Post(':id/sections')
  addSection(@Param('id') courseId: string, @Body() dto: CreateSectionDto): Promise<any> {
    return this.coursesService.addSection(courseId, dto);
  }

  @Post('sections/:sectionId/lessons')
  addLesson(@Param('sectionId') sectionId: string, @Body() dto: CreateLessonDto): Promise<any> {
    return this.coursesService.addLesson(sectionId, dto);
  }
}