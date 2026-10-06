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

  async verifyCertificate(certId: string) {
    const { NotFoundException } = await import('@nestjs/common');
    if (!certId || typeof certId !== 'string') {
      throw new NotFoundException('Invalid Certificate ID format.');
    }

    const cleanCertId = certId.trim().toUpperCase();
    
    // Extract full course UUID by stripping 'APEX-' prefix if present
    const extractedUuid = cleanCertId.replace(/^APEX-/, '').trim();

    if (!extractedUuid || extractedUuid.length < 10) {
      throw new NotFoundException(`Certificate ID "${cleanCertId}" is invalid or unrecorded.`);
    }

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

    const course = courses.find((c) => {
      const dbUuidUpper = c.id.toUpperCase();
      return dbUuidUpper === extractedUuid || c.id === extractedUuid;
    });

    if (!course) {
      throw new NotFoundException(`Certificate ID "${cleanCertId}" is invalid or does not exist.`);
    }

    return {
      valid: true,
      status: 'VERIFIED_OFFICIAL',
      certId: `APEX-${course.id.toUpperCase()}`,
      studentName: 'Certified ApexLearn Student',
      courseName: course.title,
      courseDescription: course.description || 'Mastery of professional software development concepts.',
      instructorName: course.authorName || 'ApexLearn Faculty',
      issueDate: course.createdAt || new Date().toISOString(),
      verifiedAt: new Date().toISOString(),
      issuer: 'ApexLearn Global Academy of Engineering',
    };
  }
}