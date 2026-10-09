import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class ProgressRepository {
  constructor(private readonly db: DatabaseService) {}

  async findCompletedLessons(userId: string, courseId: string) {
    return this.db
      .selectFrom('Progress')
      .innerJoin('Lesson', 'Lesson.id', 'Progress.lessonId')
      .innerJoin('Section', 'Section.id', 'Lesson.sectionId')
      .select(['Progress.lessonId', 'Progress.completed'])
      .where('Progress.userId', '=', userId)
      .where('Section.courseId', '=', courseId)
      .where('Progress.completed', '=', true)
      .execute();
  }

  async upsertLessonProgress(userId: string, lessonId: string, completed: boolean) {
    return this.db
      .insertInto('Progress')
      .values({
        userId,
        lessonId,
        completed,
        completedAt: new Date(),
      })
      .onConflict((oc) =>
        oc.columns(['userId', 'lessonId']).doUpdateSet({
          completed,
          completedAt: new Date(),
        })
      )
      .execute();
  }

  async findCourseWithAuthor(courseIdOrExtractedUuid: string) {
    const courses = await this.db
      .selectFrom('Course')
      .leftJoin('User', 'User.id', 'Course.authorId')
      .select([
        'Course.id',
        'Course.title',
        'Course.description',
        'Course.createdAt',
        'User.name as authorName',
      ])
      .where('Course.deletedAt', 'is', null)
      .execute();

    const target = courseIdOrExtractedUuid.toUpperCase();
    return courses.find((c) => c.id.toUpperCase() === target || c.id === courseIdOrExtractedUuid);
  }
}

