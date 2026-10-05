import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCourseDto, CreateSectionDto, CreateLessonDto } from './dto/course.dto';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class CoursesService {
  constructor(private database: DatabaseService) {}


  async createCourse(userId: string, dto: any) {
    const { language, imageUrl, sections, categoryId, price, pricingType, ...rest } = dto;

    const parsedPrice = price !== undefined && price !== null ? Number(price) : 0;
    const computedPricingType = pricingType || (parsedPrice > 0 ? 'PAID' : 'FREE');

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

    const course = await this.database
      .insertInto('Course')
      .values({
        ...rest,
        price: parsedPrice,
        pricingType: computedPricingType,
        categoryId: categoryId || null,
        thumbnailUrl: imageUrl || rest.thumbnailUrl,
        imageUrl: imageUrl || rest.imageUrl,
        language: language || rest.language || 'English',
        authorId,
      })
      .returningAll()
      .executeTakeFirst();

    if (course && sections && Array.isArray(sections)) {
      for (let sIdx = 0; sIdx < sections.length; sIdx++) {
        const sec = sections[sIdx];
        const createdSection = await this.database
          .insertInto('Section')
          .values({
            title: sec.title || `Section ${sIdx + 1}`,
            courseId: course.id,
            order: sIdx,
          })
          .returningAll()
          .executeTakeFirst();

        if (createdSection && sec.lessons && Array.isArray(sec.lessons)) {
          for (let lIdx = 0; lIdx < sec.lessons.length; lIdx++) {
            const les = sec.lessons[lIdx];
            await this.database
              .insertInto('Lesson')
              .values({
                title: les.title || `Lesson ${lIdx + 1}`,
                videoUrl: les.videoUrl || null,
                content: les.content || null,
                freePreview: les.isFreePreview ?? les.freePreview ?? false,
                order: lIdx,
                sectionId: createdSection.id,
              })
              .execute();
          }
        }
      }
    }

    return this.findOne(course!.id);
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

  async addLesson(sectionId: string, dto: CreateLessonDto & { content?: string; isFreePreview?: boolean; freePreview?: boolean }) {
    return this.database
      .insertInto('Lesson')
      .values({
        title: dto.title,
        videoUrl: dto.videoUrl || null,
        content: dto.content || null,
        freePreview: dto.isFreePreview ?? dto.freePreview ?? false,
        sectionId,
        order: dto.order || 0,
      })
      .returningAll()
      .executeTakeFirst();
  }
}