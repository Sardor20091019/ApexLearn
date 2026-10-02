import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { UpdateProgressDto } from './dto/update-progress.dto';

@Injectable()
export class ProgressService {
  constructor(private readonly db: DatabaseService) {}

  async getCourseProgress(userId: string, courseId: string) {
    const completedProgress = await this.db
      .selectFrom('Progress')
      .innerJoin('Lesson', 'Lesson.id', 'Progress.lessonId')
      .innerJoin('Section', 'Section.id', 'Lesson.sectionId')
      .select(['Progress.lessonId', 'Progress.completed'])
      .where('Progress.userId', '=', userId)
      .where('Section.courseId', '=', courseId)
      .where('Progress.completed', '=', true)
      .execute();

    const completedLessons: Record<string, boolean> = {};
    completedProgress.forEach((p) => {
      completedLessons[p.lessonId] = p.completed;
    });

    return { completedLessons };
  }

  async updateProgress(userId: string, dto: UpdateProgressDto) {
    await this.db
      .insertInto('Progress')
      .values({
        userId,
        lessonId: dto.lessonId,
        completed: dto.completed,
        completedAt: new Date(),
      })
      .onConflict((oc) =>
        oc.columns(['userId', 'lessonId']).doUpdateSet({
          completed: dto.completed,
          completedAt: new Date(),
        })
      )
      .execute();

    return { success: true, lessonId: dto.lessonId, completed: dto.completed };
  }
}