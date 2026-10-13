import { Controller, Get, Post, Patch, Delete, Param, Body, Req, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthenticatedRequest } from '../common/types';
import { Role } from '../database/types';
import { sql } from 'kysely';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getProfile(@Req() req: AuthenticatedRequest) {
    const userId = req.user.sub || req.user.id;
    return this.usersService.getUserProfile(userId);
  }

  @Post('request-otp')
  async requestOtp(@Req() req: AuthenticatedRequest) {
    const userId = req.user.sub || req.user.id;
    return this.usersService.requestOtp(userId);
  }

  @Post('change-password')
  async changePassword(
    @Req() req: AuthenticatedRequest,
    @Body() body: { newPassword?: string; otp?: string },
  ) {
    const userId = req.user.sub || req.user.id;
    return this.usersService.changePassword(userId, body);
  }

  @Patch()
  async updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() body: { name?: string; email?: string; avatarUrl?: string; otp?: string },
  ) {
    const userId = req.user.sub || req.user.id;
    return this.usersService.updateUserProfile(userId, body);
  }

  @Delete()
  async deleteAccount(@Req() req: AuthenticatedRequest) {
    const userId = req.user.sub || req.user.id;
    return this.usersService.deleteUserProfile(userId);
  }
}

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminUsersController {
  constructor(private readonly db: DatabaseService) {}

  @Get()
  async getAllUsers(
    @Query('page') pageRaw?: string,
    @Query('limit') limitRaw?: string,
  ) {
    const page = Math.max(1, Number(pageRaw) || 1);
    const limit = Math.min(100, Math.max(1, Number(limitRaw) || 50));
    const offset = (page - 1) * limit;

    const [users, countResult] = await Promise.all([
      this.db
        .selectFrom('User')
        .select(['id', 'name', 'email', 'role', 'createdAt', 'deletedAt'])
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .offset(offset)
        .execute(),
      this.db
        .selectFrom('User')
        .select(sql<string | number>`count(*)`.as('total'))
        .executeTakeFirst(),
    ]);

    const total = Number(countResult?.total ?? 0);
    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  @Patch(':id/role')
  async updateUserRole(@Param('id') id: string, @Body('role') role: Role) {
    return this.db
      .updateTable('User')
      .set({ role })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    return this.db
      .updateTable('User')
      .set({ deletedAt: new Date() })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}