import { Controller, Get, Patch, Param, Body, UseGuards, Delete } from '@nestjs/common';
import { DatabaseService } from '../src/database/database.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('admin/users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly db: DatabaseService) {}

  @Get()
  async getAllUsers() {
    return this.db
      .selectFrom('User')
      .select(['id', 'name', 'email', 'role'])
      .execute();
  }

  @Patch(':id/role')
  async updateUserRole(@Param('id') id: string, @Body('role') role: string) {
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
      .deleteFrom('User')
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}