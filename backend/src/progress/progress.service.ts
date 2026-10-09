import { Injectable, NotFoundException } from '@nestjs/common';
import { ProgressRepository } from './progress.repo';
import { UpdateProgressDto } from './dto/update-progress.dto';

@Injectable()
export class ProgressService {
  constructor(private readonly repo: ProgressRepository) {}

  async getCourseProgress(userId: string, courseId: string) {
    const completedProgress = await this.repo.findCompletedLessons(userId, courseId);

    const completedLessons: Record<string, boolean> = {};
    completedProgress.forEach((p) => {
      completedLessons[p.lessonId] = p.completed;
    });

    return { completedLessons };
  }

  async updateProgress(userId: string, dto: UpdateProgressDto) {
    await this.repo.upsertLessonProgress(userId, dto.lessonId, dto.completed);
    return { success: true, lessonId: dto.lessonId, completed: dto.completed };
  }

  async verifyCertificate(certId: string) {
    if (!certId || typeof certId !== 'string') {
      throw new NotFoundException('Invalid Certificate ID format.');
    }

    const cleanCertId = certId.trim().toUpperCase();
    const extractedUuid = cleanCertId.replace(/^APEX-/, '').trim();

    if (!extractedUuid || extractedUuid.length < 10) {
      throw new NotFoundException(`Certificate ID "${cleanCertId}" is invalid or unrecorded.`);
    }

    const course = await this.repo.findCourseWithAuthor(extractedUuid);
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