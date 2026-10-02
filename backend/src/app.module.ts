import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { BullModule } from "@nestjs/bullmq";
import { BullBoardModule } from "@bull-board/nestjs";
import { ExpressAdapter } from "@bull-board/express";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import Redis from "ioredis";

import { AppController } from "./app.controller";
import { AuthModule } from "./auth/auth.module";
import { CoursesModule } from "./courses/courses.module";
import { UploadModule } from "./upload/upload.module";
import { PaymentsModule } from "./auth/payments/payments.module";
import { CategoriesModule } from "./categories/categories.module";
import { DatabaseModule } from "./database/database.module";
import { UsersModule } from "./users/users.module";
import { EnrollmentsModule } from "./enrollments/enrollments.module";
import { RedisModule } from "./redis/redis.module";
import { QueuesModule } from "./queues/queues.module";
import { ReviewsModule } from "./reviews/reviews.module";
import { SupportModule } from "./support/support.module";
import { ProgressModule } from "./progress/progress.module";


const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const isTls = redisUrl.startsWith("rediss://");

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),


    BullModule.forRoot({
      connection: new Redis(redisUrl, {
        ...(isTls ? { tls: {} } : {}),
        maxRetriesPerRequest: null,
      }),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000, 
        },
      },
    }),


    BullModule.registerQueue(
      { name: "mail" },
      { name: "audio" },
    ),


    BullBoardModule.forRoot({
      route: "/queues",
      adapter: ExpressAdapter,
    }),
    BullBoardModule.forFeature(
      { name: "mail", adapter: BullMQAdapter },
      { name: "audio", adapter: BullMQAdapter },
    ),

    DatabaseModule,
    AuthModule,
    CoursesModule,
    UploadModule,
    PaymentsModule,
    CategoriesModule,
    UsersModule,
    EnrollmentsModule,
    RedisModule,
    QueuesModule,
    ReviewsModule,
    SupportModule,
    ProgressModule
  ],
  controllers: [AppController],
})
export class AppModule {}