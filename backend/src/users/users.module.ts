import { Module } from '@nestjs/common';
import { UserController, AdminUsersController } from './users.controller';
import { UsersService } from './users.service';
import { DatabaseModule } from '../database/database.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [DatabaseModule, RedisModule],
  controllers: [UserController, AdminUsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}