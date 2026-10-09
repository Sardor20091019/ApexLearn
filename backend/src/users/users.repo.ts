import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Updateable } from 'kysely';
import { UserTable } from '../database/types';

@Injectable()
export class UsersRepository {
  constructor(private readonly db: DatabaseService) {}

  async findById(id: string) {
    return this.db
      .selectFrom('User')
      .select(['id', 'email', 'name', 'role', 'avatarUrl', 'resetToken', 'resetTokenExpiry', 'createdAt'])
      .where('id', '=', id)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();
  }

  async findProfileById(id: string) {
    return this.db
      .selectFrom('User')
      .select(['id', 'email', 'name', 'role', 'avatarUrl', 'createdAt'])
      .where('id', '=', id)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();
  }

  async findByEmailExcludingId(email: string, excludeId: string) {
    return this.db
      .selectFrom('User')
      .select('id')
      .where('email', '=', email)
      .where('id', '!=', excludeId)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();
  }

  async setResetOtp(userId: string, otp: string, expiry: Date) {
    return this.db
      .updateTable('User')
      .set({
        resetToken: otp,
        resetTokenExpiry: expiry,
        updatedAt: new Date(),
      })
      .where('id', '=', userId)
      .execute();
  }

  async updateProfile(userId: string, payload: Updateable<UserTable>) {
    return this.db
      .updateTable('User')
      .set(payload)
      .where('id', '=', userId)
      .where('deletedAt', 'is', null)
      .returning(['id', 'email', 'name', 'role', 'avatarUrl', 'createdAt', 'updatedAt'])
      .executeTakeFirst();
  }

  async updatePassword(userId: string, hashedPassword: string) {
    return this.db
      .updateTable('User')
      .set({
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        updatedAt: new Date(),
      })
      .where('id', '=', userId)
      .execute();
  }

  async softDelete(userId: string) {
    return this.db
      .updateTable('User')
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where('id', '=', userId)
      .returning(['id'])
      .executeTakeFirst();
  }
}

