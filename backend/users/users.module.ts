import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { DatabaseModule } from '../src/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [UsersController],
})
export class UsersModule {}