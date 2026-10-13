import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { EnrollmentsRepository } from './enrollments.repo';

@Injectable()
export class EnrollmentsService {
  constructor(private readonly repo: EnrollmentsRepository) {}

  async enrollFreeCourse(userId: string, courseId: string) {
    const course = await this.repo.findCourseById(courseId);

    if (!course) {
      throw new HttpException('Course not found', HttpStatus.NOT_FOUND);
    }

    if (course.pricingType !== 'FREE' && Number(course.price ?? 0) > 0) {
      throw new HttpException(
        'This course is paid. Please use the Stripe/checkout payment session.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const existingEnrollment = await this.repo.findEnrollment(userId, courseId);
    if (existingEnrollment) {
      throw new HttpException('Already enrolled in this course', HttpStatus.BAD_REQUEST);
    }

    const result = await this.repo.createEnrollmentWithTransaction(userId, courseId, course.title);

    return {
      message: 'Successfully enrolled in free course',
      enrollment: result,
    };
  }

  async getMyEnrollments(userId: string) {
    const enrollments = await this.repo.findUserEnrollments(userId);
    if (!enrollments || enrollments.length === 0) {
      return [];
    }

    const courseIds = enrollments.map((e) => e.course_id);
    const [progressRows, lessonCounts] = await Promise.all([
      this.repo.findUserCompletedLessons(userId),
      this.repo.countLessonsByCourseIds(courseIds),
    ]);

    const completedByCourse = new Map<string, number>();
    progressRows.forEach((row) =>
      completedByCourse.set(row.courseId, (completedByCourse.get(row.courseId) || 0) + 1),
    );

    const totalByCourse = new Map<string, number>();
    lessonCounts.forEach((row) =>
      totalByCourse.set(row.courseId, Number(row.totalCount || 0)),
    );

    return enrollments.map((e) => {
      const totalLessons = totalByCourse.get(e.course_id) || 0;
      const completed = completedByCourse.get(e.course_id) || 0;
      const progress = totalLessons > 0 ? Math.min(100, Math.round((completed / totalLessons) * 100)) : 0;

      return {
        id: e.enrollment_id,
        createdAt: e.enrollment_created_at,
        course: {
          id: e.course_id,
          title: e.title,
          description: e.description,
          thumbnailUrl: e.thumbnailUrl,
          pricingType: e.pricingType,
          price: e.price,
          currency: e.currency,
          level: e.level,
        },
        progress,
      };
    });
  }
}

