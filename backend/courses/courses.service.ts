import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto, CreateSectionDto, CreateLessonDto } from './dto/course.dto';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async createCourse(userId: string, dto: CreateCourseDto) {
    return this.prisma.course.create({
      data: {
        ...dto,
        authorId: userId,
      },
    });
  }

  async findAllPublished() {
    return this.prisma.course.findMany({
      where: { status: 'PUBLISHED', deletedAt: null },
      include: { 
        category: true, 
        author: { select: { name: true, avatarUrl: true } } 
      },
    });
  }

  async findOne(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        category: true,
        author: { select: { name: true, avatarUrl: true } },
        sections: {
          orderBy: { order: 'asc' },
          include: { 
            lessons: { orderBy: { order: 'asc' } } 
          },
        },
      },
    });
    if (!course || course.deletedAt) throw new NotFoundException('Course not found');
    return course;
  }

  async addSection(courseId: string, dto: CreateSectionDto) {
    return this.prisma.section.create({
      data: { ...dto, courseId },
    });
  }

  async addLesson(sectionId: string, dto: CreateLessonDto) {
    return this.prisma.lesson.create({
      data: { ...dto, sectionId },
    });
  }
}