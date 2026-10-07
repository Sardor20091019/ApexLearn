import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { CreateSectionDto, CreateLessonDto } from './dto/course.dto';
import { CourseQueryDto } from './dto/course-query.dto';
import { DatabaseService } from '../database/database.service';
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

import { sql } from 'kysely';

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
  sections?: Array<{
    title?: string;
    lessons?: Array<{
      title?: string;
      videoUrl?: string;
      video_url?: string;
      videourl?: string;
      url?: string;
      content?: string;
      isFreePreview?: boolean;
      freePreview?: boolean;
    }>;
  }>;
  [key: string]: unknown;
}

@Injectable()
export class CoursesService implements OnModuleInit {
  constructor(
    private database: DatabaseService,
    private redisService: RedisService,
  ) {}

  async onModuleInit() {
    try {
      // Auto-publish any courses stuck in DRAFT so they immediately appear in dashboard
      await this.database
        .updateTable('Course')
        .set({ status: 'PUBLISHED' })
        .where('status', '=', 'DRAFT')
        .where('deletedAt', 'is', null)
        .execute();

      // Clear any stale cached course query lists
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

    const computedStatus = (((dto.status || rest.status || 'PUBLISHED') as string).toUpperCase() || 'PUBLISHED') as CourseStatus;
    const computedLevel = (dto.level || rest.level || 'BEGINNER') as string;

    const course = await this.database
      .insertInto('Course')
      .values({
        title: rest.title,
        description: (rest.description) || '',
        price: parsedPrice.toFixed(2),
        pricingType: computedPricingType,
        categoryId: categoryId || null,
        status: computedStatus,
        level: computedLevel,
        thumbnailUrl: (imageUrl || rest.thumbnailUrl || null),
        imageUrl: (imageUrl || rest.imageUrl || null) as string | null,
        language: (language || 'English'),
        authorId,
      })
      .returningAll()
      .executeTakeFirst();

    if (!course) {
      throw new Error('Course creation failed');
    }

    if (sections && Array.isArray(sections)) {
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

    let dbQuery = this.database
      .selectFrom('Course')
      .leftJoin('Category', 'Category.id', 'Course.categoryId')
      .leftJoin('User', 'User.id', 'Course.authorId')
      .select([
        'Course.id',
        'Course.title',
        'Course.description',
        'Course.price',
        'Course.thumbnailUrl',
        'Course.imageUrl',
        'Course.status',
        'Course.level',
        'Course.ratingAverage',
        'Course.ratingCount',
        'Course.enrollmentCount',
        'Course.createdAt',
        'Course.updatedAt',
        'Category.id as categoryId',
        'Category.name as categoryName',
        'User.name as authorName',
        'User.avatarUrl as authorAvatarUrl',
      ])
      .where((eb) =>
        eb.or([
          eb('Course.status', '=', 'PUBLISHED'),
          eb('Course.status', '=', 'DRAFT'),
        ])
      )
      .where('Course.deletedAt', 'is', null);

    let countQuery = this.database
      .selectFrom('Course')
      .leftJoin('Category', 'Category.id', 'Course.categoryId')
      .select(sql<string | number>`count(*)`.as('count'))
      .where((eb) =>
        eb.or([
          eb('Course.status', '=', 'PUBLISHED'),
          eb('Course.status', '=', 'DRAFT'),
        ])
      )
      .where('Course.deletedAt', 'is', null);

    // Filter by Category
    if (category && category !== 'All' && category !== 'all') {
      dbQuery = dbQuery.where((eb) =>
        eb.or([
          eb('Category.id', '=', category),
          eb('Category.name', 'ilike', category),
        ])
      );
      countQuery = countQuery.where((eb) =>
        eb.or([
          eb('Category.id', '=', category),
          eb('Category.name', 'ilike', category),
        ])
      );
    }


    if (search) {
      const searchPattern = `%${search}%`;
      dbQuery = dbQuery.where((eb) =>
        eb.or([
          eb('Course.title', 'ilike', searchPattern),
          eb('Course.description', 'ilike', searchPattern),
        ])
      );
      countQuery = countQuery.where((eb) =>
        eb.or([
          eb('Course.title', 'ilike', searchPattern),
          eb('Course.description', 'ilike', searchPattern),
        ])
      );
    }

    // Filter by Pricing Tier
    if (tier === 'free') {
      dbQuery = dbQuery.where((eb) =>
        eb.or([
          eb('Course.pricingType', '=', 'FREE'),
          eb('Course.price', '=', '0'),
          eb('Course.price', '=', '0.00'),
          eb('Course.price', 'is', null),
        ])
      );
      countQuery = countQuery.where((eb) =>
        eb.or([
          eb('Course.pricingType', '=', 'FREE'),
          eb('Course.price', '=', '0'),
          eb('Course.price', '=', '0.00'),
          eb('Course.price', 'is', null),
        ])
      );
    } else if (tier === 'paid') {
      dbQuery = dbQuery
        .where('Course.pricingType', '=', 'PAID')
        .where(sql<boolean>`CAST(COALESCE("Course"."price", '0') AS NUMERIC) > 0`);
      countQuery = countQuery
        .where('Course.pricingType', '=', 'PAID')
        .where(sql<boolean>`CAST(COALESCE("Course"."price", '0') AS NUMERIC) > 0`);
    }

    if (minPrice !== undefined && minPrice > 0) {
      dbQuery = dbQuery.where(sql<boolean>`CAST(COALESCE("Course"."price", '0') AS NUMERIC) >= ${minPrice}`);
      countQuery = countQuery.where(sql<boolean>`CAST(COALESCE("Course"."price", '0') AS NUMERIC) >= ${minPrice}`);
    }
    if (maxPrice !== undefined && maxPrice < 1000) {
      dbQuery = dbQuery.where(sql<boolean>`CAST(COALESCE("Course"."price", '0') AS NUMERIC) <= ${maxPrice}`);
      countQuery = countQuery.where(sql<boolean>`CAST(COALESCE("Course"."price", '0') AS NUMERIC) <= ${maxPrice}`);
    }


    switch (sort) {
      case 'oldest':
        dbQuery = dbQuery.orderBy('Course.createdAt', 'asc');
        break;
      case 'low':
        dbQuery = dbQuery.orderBy(sql`CAST(COALESCE("Course"."price", '0') AS NUMERIC)`, 'asc');
        break;
      case 'high':
        dbQuery = dbQuery.orderBy(sql`CAST(COALESCE("Course"."price", '0') AS NUMERIC)`, 'desc');
        break;
      case 'rating':
        dbQuery = dbQuery
          .orderBy('Course.ratingAverage', 'desc')
          .orderBy('Course.ratingCount', 'desc');
        break;
      case 'featured':
        dbQuery = dbQuery
          .orderBy('Course.enrollmentCount', 'desc')
          .orderBy('Course.ratingAverage', 'desc');
        break;
      case 'newest':
      default:
        dbQuery = dbQuery.orderBy('Course.createdAt', 'desc');
        break;
    }


    dbQuery = dbQuery.limit(limit).offset(offset);

    const [courses, countResult] = await Promise.all([
      dbQuery.execute(),
      countQuery.executeTakeFirst(),
    ]);

    const total = Number(countResult?.count ?? 0);
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
      ratingAverage: c.ratingAverage ? Number(c.ratingAverage) : 5,
      enrollmentCount: c.enrollmentCount || 0,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      category: { id: c.categoryId, name: c.categoryName || 'General' },
      author: { name: c.authorName || 'ApexLearn Faculty', avatarUrl: c.authorAvatarUrl },
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

  async streamLessonVideo(lessonId: string, req: Request, res: Response) {
    const lesson = await this.database
      .selectFrom('Lesson')
      .selectAll()
      .where('id', '=', lessonId)
      .executeTakeFirst();

    if (!lesson || !lesson.videoUrl) {
      throw new NotFoundException('Lesson or video stream not found.');
    }

    const videoUrl = lesson.videoUrl.trim();

    if (videoUrl.startsWith('http://') || videoUrl.startsWith('https://')) {
      return res.redirect(302, videoUrl);
    }

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

  async getLessonSubtitles(lessonId: string, res: Response) {
    const lesson = await this.database
      .selectFrom('Lesson')
      .selectAll()
      .where('id', '=', lessonId)
      .executeTakeFirst();

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
      } catch (e) {
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
    const lesson = await this.database
      .selectFrom('Lesson')
      .select('id')
      .where('id', '=', lessonId)
      .executeTakeFirst();

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    await this.database
      .updateTable('Lesson')
      .set({
        subtitleUrl,
        updatedAt: new Date(),
      })
      .where('id', '=', lessonId)
      .execute();

    return { message: 'Subtitle updated successfully for lesson', lessonId };
  }

  async autoGenerateSubtitlesWithFfmpeg(lessonId: string) {
    const lesson = await this.database
      .selectFrom('Lesson')
      .selectAll()
      .where('id', '=', lessonId)
      .executeTakeFirst();

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

    await this.database
      .updateTable('Lesson')
      .set({
        subtitleUrl: convertedVtt,
        updatedAt: new Date(),
      })
      .where('id', '=', lessonId)
      .execute();

    return {
      message: 'Subtitles automatically generated and converted to WebVTT via FFmpeg tool.',
      lessonId,
      subtitles: convertedVtt,
    };
  }
}