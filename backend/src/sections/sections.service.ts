import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateSectionDto, CreateLessonDto } from './dto/section.dto';

@Injectable()
export class SectionsService {
  constructor(private database: DatabaseService) {}

  async createSection(courseId: string, dto: CreateSectionDto) {
    const course = await this.database
      .selectFrom('Course')
      .select(['id'])
      .where('id', '=', courseId)
      .executeTakeFirst();

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return this.database
      .insertInto('Section')
      .values({
        title: dto.title,
        courseId,
        order: dto.order || 0,
      })
      .returningAll()
      .executeTakeFirst();
  }

  async createLesson(sectionId: string, dto: CreateLessonDto) {
    const section = await this.database
      .selectFrom('Section')
      .select(['id'])
      .where('id', '=', sectionId)
      .executeTakeFirst();

    if (!section) {
      throw new NotFoundException('Section not  found');
    }

    return this.database
      .insertInto('Lesson')
      .values({
        title: dto.title,
        videoUrl: dto.videoUrl,
        sectionId,
        order: dto.order || 0,
      })
      .returningAll()
      .executeTakeFirst();
  }
}