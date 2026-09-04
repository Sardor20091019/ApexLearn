import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCourseDto, CreateSectionDto, CreateLessonDto } from './dto/course.dto';
import { DatabaseService } from '../src/database/database.service';

@Injectable()
export class CoursesService {
  constructor(private database: DatabaseService) {}


  async createCourse(userId: string, dto: any) {
  const { language, imageUrl, sections, categoryId, ...rest } = dto;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  let authorId = userId;
  
  if (!authorId || !uuidRegex.test(authorId)) {
    authorId = '00000000-0000-0000-0000-000000000000';
    
    const existingUser = await this.database
      .selectFrom('User')
      .select('id')
      .where('id', '=', authorId)
      .executeTakeFirst();

    if (!existingUser) {
      await this.database
        .insertInto('User')
        .values({
          id: authorId,
          email: 'instructor@apexlearn.com',
          name: 'Instructor',
          password: 'hashed_password_placeholder',
          role: 'INSTRUCTOR',
        })
        .onConflict((oc) => oc.column('id').doNothing())
        .execute();
    }
  }

  return this.database
    .insertInto('Course')
    .values({
      ...rest,
      categoryId: categoryId || null,
      thumbnailUrl: imageUrl || rest.thumbnailUrl,
      authorId,
    })
    .returningAll()
    .executeTakeFirst();
}
  
  async findAllPublished() {
    const courses = await this.database
      .selectFrom('Course')
      .leftJoin('Category', 'Category.id', 'Course.categoryId')
      .leftJoin('User', 'User.id', 'Course.authorId')
      .select([
        'Course.id',
        'Course.title',
        'Course.description',
        'Course.price',
        'Course.thumbnailUrl',
        'Course.status',
        'Course.level',
        'Course.createdAt',
        'Course.updatedAt',
        'Category.id as categoryId',
        'Category.name as categoryName',
        'User.name as authorName',
        'User.avatarUrl as authorAvatarUrl',
      ])
      .where('Course.status', '=', 'PUBLISHED')
      .where('Course.deletedAt', 'is', null)
      .execute();

    return courses.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      price: c.price,
      thumbnailUrl: c.thumbnailUrl,
      status: c.status,
      level: c.level,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      category: { id: c.categoryId, name: c.categoryName },
      author: { name: c.authorName, avatarUrl: c.authorAvatarUrl },
    }));
  }

  async findOne(id: string) {
    const course = await this.database
      .selectFrom('Course')
      .leftJoin('Category', 'Category.id', 'Course.categoryId')
      .leftJoin('User', 'User.id', 'Course.authorId')
      .select([
        'Course.id',
        'Course.title',
        'Course.description',
        'Course.price',
        'Course.thumbnailUrl',
        'Course.status',
        'Course.level',
        'Course.deletedAt',
        'Course.createdAt',
        'Course.updatedAt',
        'Category.id as categoryId',
        'Category.name as categoryName',
        'User.name as authorName',
        'User.avatarUrl as authorAvatarUrl',
      ])
      .where('Course.id', '=', id)
      .executeTakeFirst();

    if (!course || course.deletedAt) {
      throw new NotFoundException('Course not found');
    }

    const sections = await this.database
      .selectFrom('Section')
      .selectAll()
      .where('courseId', '=', id)
      .orderBy('order', 'asc')
      .execute();

    const sectionsWithLessons = await Promise.all(
      sections.map(async (section) => {
        const lessons = await this.database
          .selectFrom('Lesson')
          .selectAll()
          .where('sectionId', '=', section.id)
          .orderBy('order', 'asc')
          .execute();

        return {
          ...section,
          lessons,
        };
      }),
    );

    return {
      id: course.id,
      title: course.title,
      description: course.description,
      price: course.price,
      thumbnailUrl: course.thumbnailUrl,
      status: course.status,
      level: course.level,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      category: { id: course.categoryId, name: course.categoryName },
      author: { name: course.authorName, avatarUrl: course.authorAvatarUrl },
      sections: sectionsWithLessons,
    };
  }

  async addSection(courseId: string, dto: CreateSectionDto) {
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

  async addLesson(sectionId: string, dto: CreateLessonDto) {
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