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
            const videoUrlVal = les.videoUrl || les.video_url || les.videourl || les.url || null;
            await this.database
              .insertInto('Lesson')
              .values({
                title: les.title || `Lesson ${lIdx + 1}`,
                videoUrl: videoUrlVal,
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

  async addLesson(sectionId: string, dto: CreateLessonDto & { content?: string; isFreePreview?: boolean; freePreview?: boolean; video_url?: string; videourl?: string; url?: string }) {
    const videoUrlVal = dto.videoUrl || dto.video_url || dto.videourl || dto.url || null;
    return this.database
      .insertInto('Lesson')
      .values({
        title: dto.title,
        videoUrl: videoUrlVal,
        content: dto.content || null,
        freePreview: dto.isFreePreview ?? dto.freePreview ?? false,
        sectionId,
        order: dto.order || 0,
      })
      .returningAll()
      .executeTakeFirst();
  }

  async streamLessonVideo(lessonId: string, req: any, res: any) {
    const lesson = await this.database
      .selectFrom('Lesson')
      .selectAll()
      .where('id', '=', lessonId)
      .executeTakeFirst();

    if (!lesson || !lesson.videoUrl) {
      throw new NotFoundException('Lesson or video stream not found.');
    }

    const videoUrl = lesson.videoUrl.trim();

    const fs = await import('fs');
    if (fs.existsSync(videoUrl)) {
      const stat = fs.statSync(videoUrl);
      const fileSize = stat.size;
      const range = req.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = end - start + 1;
        const fileStream = fs.createReadStream(videoUrl, { start, end });

        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': 'video/mp4',
        });
        fileStream.pipe(res);
      } else {
        res.writeHead(200, {
          'Content-Length': fileSize,
          'Content-Type': 'video/mp4',
        });
        fs.createReadStream(videoUrl).pipe(res);
      }
      return;
    }

    try {
      const rangeHeader = req.headers.range || 'bytes=0-';
      const remoteRes = await fetch(videoUrl, {
        headers: { Range: rangeHeader },
      });

      const contentType = remoteRes.headers.get('content-type') || 'video/mp4';
      const contentLength = remoteRes.headers.get('content-length');
      const contentRange = remoteRes.headers.get('content-range');
      const acceptRanges = remoteRes.headers.get('accept-ranges') || 'bytes';

      const headers: Record<string, string> = {
        'Content-Type': contentType,
        'Accept-Ranges': acceptRanges,
      };

      if (contentLength) headers['Content-Length'] = contentLength;
      if (contentRange) headers['Content-Range'] = contentRange;

      const statusCode = remoteRes.status === 206 ? 206 : 200;
      res.writeHead(statusCode, headers);

      if (remoteRes.body) {
        const reader = remoteRes.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (!res.writableEnded) {
            res.write(Buffer.from(value));
          }
        }
        res.end();
      } else {
        res.end();
      }
    } catch (err) {
      console.error('Streaming proxy failed, redirecting to raw URL:', err);
      res.redirect(videoUrl);
    }
  }
}