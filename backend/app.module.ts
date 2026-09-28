import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { CoursesModule } from './courses/courses.module';
import { UploadModule } from './upload/upload.module';
import { PaymentsModule } from './auth/payments/payments.module';
import { CategoriesModule } from './categories/categories.module';
import { DatabaseModule } from './src/database/database.module';
import { UsersModule } from './users/users.module'; 
import { EnrollmentsModule } from './enrollments/enrollments.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    CoursesModule,
    UploadModule,
    PaymentsModule,
    CategoriesModule,
    UsersModule,
    EnrollmentsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}