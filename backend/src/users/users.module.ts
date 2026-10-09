import { Module } from '@nestjs/common';
import { UserController, AdminUsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repo';
import { DatabaseModule } from '../database/database.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [DatabaseModule, RedisModule],
  controllers: [UserController, AdminUsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}