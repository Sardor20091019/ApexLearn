import { Controller, Get, Patch, Delete, Param, Body, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getProfile(@Req() req: any) {
    const userId = req.user.sub || req.user.id;
    return this.usersService.getUserProfile(userId);
  }

  @Patch()
  async updateProfile(@Req() req: any, @Body() body: { name?: string; email?: string; avatarUrl?: string }) {
    const userId = req.user.sub || req.user.id;
    return this.usersService.updateUserProfile(userId, body);
  }

  @Delete()
  async deleteAccount(@Req() req: any) {
    const userId = req.user.sub || req.user.id;
    return this.usersService.deleteUserProfile(userId);
  }
}

@Controller('admin/users')
@UseGuards(JwtAuthGuard)
export class AdminUsersController {
  constructor(private readonly db: DatabaseService) {}

  @Get()
  async getAllUsers(@Req() req: any) {
    const role = (req.user?.role || '').toUpperCase();
    if (role !== 'ADMIN') throw new ForbiddenException('Admins only');

    return this.db
      .selectFrom('User')
      .select(['id', 'name', 'email', 'role', 'createdAt', 'deletedAt'])
      .execute();
  }

  @Patch(':id/role')
  async updateUserRole(@Req() req: any, @Param('id') id: string, @Body('role') role: string) {
    const userRole = (req.user?.role || '').toUpperCase();
    if (userRole !== 'ADMIN') throw new ForbiddenException('Admins only');

    return this.db
      .updateTable('User')
      .set({ role: role as any })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  @Delete(':id')
  async deleteUser(@Req() req: any, @Param('id') id: string) {
    const userRole = (req.user?.role || '').toUpperCase();
    if (userRole !== 'ADMIN') throw new ForbiddenException('Admins only');

    return this.db
      .updateTable('User')
      .set({ deletedAt: new Date() })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}