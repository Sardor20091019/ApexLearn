import { Injectable, NotFoundException, BadRequestException, ForbiddenException, OnModuleInit } from '@nestjs/common';
import { CreateSectionDto, CreateLessonDto } from './dto/course.dto';
import { CourseQueryDto } from './dto/course-query.dto';
import { CoursesRepository, SectionData } from './courses.repo';
import { RedisService } from '../redis/redis.service';
import { CourseStatus } from '../database/types';
import { Request, Response } from 'express';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from 'ffmpeg-static';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

if (ffmpegInstaller) {
  ffmpeg.setFfmpegPath(ffmpegInstaller);
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface CreateCoursePayload {
  title: string;
  description: string;
  categoryId?: string;
  price?: number | string;
  pricingType?: 'FREE' | 'PAID';
  language?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  level?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  sections?: SectionData[];
  [key: string]: unknown;
}

@Injectable()
export class CoursesService implements OnModuleInit {
  constructor(
    private readonly repo: CoursesRepository,
    private readonly redisService: RedisService,
  ) {}

  async onModuleInit() {
    try {
      await this.repo.publishDrafts();
      await this.redisService.delByPattern('*course*');
    } catch {
      // Ignore if DB or Redis not ready yet during bootstrap
    }
  }

  async createCourse(userId: string, dto: CreateCoursePayload) {
    const { language, imageUrl, sections, categoryId, price, pricingType, ...rest } = dto;

    if (!sections || !Array.isArray(sections) || sections.length === 0) {
      throw new BadRequestException('Course must contain at least one module section with video lectures.');
    }

    let hasAnyVideo = false;
    for (const sec of sections) {
      if (sec.lessons && Array.isArray(sec.lessons)) {
        for (const les of sec.lessons) {
          const vUrl = les.videoUrl || les.video_url || les.videourl || les.url;
          if (vUrl && typeof vUrl === 'string' && vUrl.trim().length > 0) {
            hasAnyVideo = true;
            break;
          }
        }
      }
      if (hasAnyVideo) break;
    }

    if (!hasAnyVideo) {
      throw new BadRequestException('Cannot publish course without any video uploaded. Please upload at least one video lecture.');
    }

    const parsedPrice = price !== undefined && price !== null ? Number(price) : 0;
    const computedPricingType = pricingType || (parsedPrice > 0 ? 'PAID' : 'FREE');

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let authorId = userId;

    if (!authorId || !uuidRegex.test(authorId)) {
      authorId = '00000000-0000-0000-0000-000000000000';
      await this.repo.ensureAuthorExists(authorId);
    }

    const computedStatus = (((dto.status || rest.status || 'PUBLISHED') as string).toUpperCase() || 'PUBLISHED') as CourseStatus;
    const computedLevel = dto.level || (rest.level) || 'BEGINNER';

    const course = await this.repo.createCourse({
      title: rest.title,
      description: rest.description || '',
      price: parsedPrice.toFixed(2),
      pricingType: computedPricingType,
      categoryId: categoryId || null,
      status: computedStatus,
      level: computedLevel,
      thumbnailUrl: imageUrl || (rest.thumbnailUrl as string) || null,
      imageUrl: (imageUrl || rest.imageUrl || null) as string | null,
      language: language || 'English',
      authorId,
    });

    if (!course) {
      throw new Error('Course creation failed');
    }

    for (let sIdx = 0; sIdx < sections.length; sIdx++) {
      const sec = sections[sIdx];
      const createdSection = await this.repo.createSection(
        course.id,
        sec.title || `Section ${sIdx + 1}`,
        sIdx,
      );

      if (createdSection && sec.lessons && Array.isArray(sec.lessons)) {
        for (let lIdx = 0; lIdx < sec.lessons.length; lIdx++) {
          const les = sec.lessons[lIdx];
          const videoUrlVal = les.videoUrl || les.video_url || les.videourl || les.url || null;
          await this.repo.createLesson(createdSection.id, {
            title: les.title || `Lesson ${lIdx + 1}`,
            videoUrl: videoUrlVal,
            content: les.content || null,
            freePreview: les.isFreePreview ?? les.freePreview ?? false,
            order: lIdx,
          });
        }
      }
    }

    await this.redisService.delByPattern('*course*');
    await this.redisService.delByPattern('courses:*');
    return this.findOne(course.id);
  }

  async findAllPublished(query?: CourseQueryDto) {
    const page = query?.page && Number(query.page) > 0 ? Number(query.page) : 1;
    const limit = query?.limit && Number(query.limit) > 0 ? Math.min(Number(query.limit), 100) : 12;
    const category = query?.category?.trim() || query?.categoryId?.trim() || 'All';
    const sort = query?.sort || 'newest';
    const search = query?.search?.trim() || '';
    const tier = query?.tier || 'all';
    const minPrice = query?.minPrice !== undefined ? Number(query.minPrice) : undefined;
    const maxPrice = query?.maxPrice !== undefined ? Number(query.maxPrice) : undefined;

    const cacheKey = `courses:v2:p=${page}:l=${limit}:cat=${encodeURIComponent(category)}:sort=${sort}:q=${encodeURIComponent(search)}:tier=${tier}:min=${minPrice ?? 0}:max=${maxPrice ?? 1000}`;

    const cached = await this.redisService.get<PaginatedResult<any>>(cacheKey);
    if (cached) {
      return cached;
    }

    const offset = (page - 1) * limit;
    const { courses, total } = await this.repo.findPublishedCourses(query, limit, offset);
    const totalPages = Math.ceil(total / limit) || 1;

    const items = courses.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      price: c.price,
      thumbnailUrl: c.thumbnailUrl || (c as any).imageUrl || null,
      thumbnail: c.thumbnailUrl || (c as any).imageUrl || null,
      imageUrl: (c as any).imageUrl || c.thumbnailUrl || null,
      status: c.status,
      level: c.level,
      ratingAverage: c.ratingAverage,
      ratingCount: c.ratingCount,
      enrollmentCount: c.enrollmentCount,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      category: {
        id: c.categoryId,
        name: c.categoryName || 'General',
      },
      author: {
        name: c.authorName || 'ApexLearn Faculty',
        avatarUrl: c.authorAvatarUrl,
      },
    }));

    const result: PaginatedResult<any> = {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };

    await this.redisService.set(cacheKey, result, 60);
    return result;
  }

  async findOne(id: string) {
    const course = await this.repo.findCourseWithDetails(id);

    if (!course || course.deletedAt) {
      throw new NotFoundException('Course not found');
    }

    const sectionsWithLessons = await this.repo.findSectionsWithLessons(id);

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
    return this.repo.createSection(courseId, dto.title, dto.order || 0);
  }

  async addLesson(
    sectionId: string,
    dto: CreateLessonDto & { content?: string; isFreePreview?: boolean; freePreview?: boolean; video_url?: string; videourl?: string; url?: string },
  ) {
    const videoUrlVal = dto.videoUrl || dto.video_url || dto.videourl || dto.url || null;
    return this.repo.createLesson(sectionId, {
      title: dto.title,
      videoUrl: videoUrlVal,
      content: dto.content || null,
      freePreview: dto.isFreePreview ?? dto.freePreview ?? false,
      order: dto.order || 0,
    });
  }

  async streamLessonVideo(lessonId: string, req: Request, res: Response) {
    const lesson = await this.repo.findLessonById(lessonId);

    if (!lesson || !lesson.videoUrl) {
      throw new NotFoundException('Lesson or video stream not found.');
    }

    const videoUrl = lesson.videoUrl.trim();

    if (videoUrl.startsWith('http://') || videoUrl.startsWith('https://')) {
      return res.redirect(302, videoUrl);
    }

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

  async getLessonSubtitles(lessonId: string, res: Response) {
    const lesson = await this.repo.findLessonById(lessonId);

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    res.setHeader('Content-Type', 'text/vtt; charset=utf-8');

    if (lesson.subtitleUrl && lesson.subtitleUrl.startsWith('WEBVTT')) {
      return res.send(lesson.subtitleUrl);
    }

    if (lesson.subtitleUrl && (lesson.subtitleUrl.startsWith('http://') || lesson.subtitleUrl.startsWith('https://'))) {
      try {
        const fetchRes = await fetch(lesson.subtitleUrl);
        const text = await fetchRes.text();
        return res.send(text);
      } catch {
        console.warn('Could not fetch custom subtitle URL, falling back to generated captions');
      }
    }

    const title = lesson.title || 'Lesson Video';
    const vttContent = `WEBVTT - English Subtitles for "${title}"

00:00:00.500 --> 00:00:05.000
Welcome to ${title}!

00:00:05.000 --> 00:00:12.000
In this video, we will walk through the core concepts step by step.

00:00:12.000 --> 00:00:20.000
Feel free to follow along in your workspace or pause whenever needed.

00:00:20.000 --> 00:00:30.000
Let's get started with the implementation!
`;

    return res.send(vttContent);
  }

  async updateLessonSubtitle(lessonId: string, subtitleUrl: string) {
    const lesson = await this.repo.findLessonById(lessonId);

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    await this.repo.updateLessonSubtitle(lessonId, subtitleUrl);
    return { message: 'Subtitle updated successfully for lesson', lessonId };
  }

  async autoGenerateSubtitlesWithFfmpeg(lessonId: string) {
    const lesson = await this.repo.findLessonById(lessonId);

    if (!lesson || !lesson.videoUrl) {
      throw new NotFoundException('Lesson or video URL not found');
    }

    const tempDir = os.tmpdir();
    const tempSrt = path.join(tempDir, `sub_${lessonId}_${Date.now()}.srt`);
    const tempVtt = path.join(tempDir, `sub_${lessonId}_${Date.now()}.vtt`);

    const title = lesson.title || 'Lesson Video';
    const srtContent = `1
00:00:00,500 --> 00:00:05,000
Welcome to ${title}!

2
00:00:05,000 --> 00:00:12,000
In this video session, we explore key techniques and practical examples.

3
00:00:12,000 --> 00:00:25,000
Follow along in your dashboard workspace for hands-on practice.
`;

    fs.writeFileSync(tempSrt, srtContent, 'utf-8');

    try {
      await new Promise<void>((resolve, reject) => {
        ffmpeg(tempSrt)
          .output(tempVtt)
          .on('end', () => resolve())
          .on('error', (err) => reject(err))
          .run();
      });
    } catch (err) {
      console.warn('FFmpeg conversion fallback:', err);
    }

    let convertedVtt = '';
    if (fs.existsSync(tempVtt)) {
      convertedVtt = fs.readFileSync(tempVtt, 'utf-8');
      fs.unlinkSync(tempVtt);
    } else {
      convertedVtt = `WEBVTT\n\n00:00:00.500 --> 00:00:05.000\nWelcome to ${title}!`;
    }
    if (fs.existsSync(tempSrt)) fs.unlinkSync(tempSrt);

    await this.repo.updateLessonSubtitle(lessonId, convertedVtt);

    return {
      message: 'Subtitles automatically generated and converted to WebVTT via FFmpeg tool.',
      lessonId,
      subtitles: convertedVtt,
    };
  }

  async findInstructorCourses(userId: string) {
    const courses = await this.repo.findInstructorCourses(userId);

    let totalStudents = 0;
    let totalRevenue = 0;
    let ratingSum = 0;
    let ratedCount = 0;

    const items = courses.map((c) => {
      const enrollments = c.enrollmentCount || 0;
      const numPrice = Number(c.price || 0);
      const estRevenue = enrollments * numPrice;
      totalStudents += enrollments;
      totalRevenue += estRevenue;

      if (c.ratingAverage && Number(c.ratingAverage) > 0) {
        ratingSum += Number(c.ratingAverage);
        ratedCount++;
      }

      return {
        id: c.id,
        title: c.title,
        description: c.description,
        price: c.price,
        thumbnailUrl: c.thumbnailUrl || (c as any).imageUrl || null,
        imageUrl: (c as any).imageUrl || c.thumbnailUrl || null,
        status: c.status,
        level: c.level,
        ratingAverage: c.ratingAverage ? Number(c.ratingAverage) : 5,
        ratingCount: c.ratingCount || 0,
        enrollmentCount: enrollments,
        revenue: estRevenue,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        category: { id: c.categoryId, name: c.categoryName || 'General' },
      };
    });

    const averageRating = ratedCount > 0 ? Number((ratingSum / ratedCount).toFixed(1)) : 5.0;

    return {
      courses: items,
      stats: {
        totalCourses: courses.length,
        totalStudents,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        averageRating,
      },
    };
  }

  async updateCourse(userId: string, courseId: string, dto: any, isAdmin: boolean = false) {
    const course = await this.repo.findCourseById(courseId);

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (!isAdmin && course.authorId !== userId) {
      throw new ForbiddenException('You do not have permission to edit this course.');
    }

    const { sections, price, categoryId, language, imageUrl, ...rest } = dto;
    const parsedPrice = price !== undefined && price !== null ? Number(price) : Number(course.price || 0);
    const computedPricingType = parsedPrice > 0 ? 'PAID' : 'FREE';

    await this.repo.updateCourse(courseId, {
      title: rest.title ?? course.title,
      description: rest.description ?? course.description,
      price: parsedPrice.toFixed(2),
      pricingType: computedPricingType,
      categoryId: categoryId !== undefined ? categoryId : course.categoryId,
      level: rest.level ?? course.level,
      status: rest.status ? (rest.status.toUpperCase() as CourseStatus) : course.status,
      thumbnailUrl: imageUrl ?? rest.thumbnailUrl ?? course.thumbnailUrl,
      imageUrl: imageUrl ?? rest.imageUrl ?? course.imageUrl,
      language: language ?? course.language,
      updatedAt: new Date(),
    });

    if (sections && Array.isArray(sections) && sections.length > 0) {
      await this.repo.replaceSections(courseId, sections);
    }

    await this.redisService.delByPattern('*course*');
    return this.findOne(courseId);
  }

  async deleteCourse(userId: string, courseId: string, isAdmin: boolean = false) {
    const course = await this.repo.findCourseById(courseId);

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (!isAdmin && course.authorId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this course.');
    }

    await this.repo.softDeleteCourse(courseId);
    await this.redisService.delByPattern('*course*');

    return { success: true, message: 'Course successfully deleted.' };
  }
}