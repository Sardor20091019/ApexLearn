import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class AuthRepository {
  constructor(private readonly db: DatabaseService) {}

  async findUserByEmail(email: string) {
    return this.db
      .selectFrom('User')
      .selectAll()
      .where('email', '=', email)
      .executeTakeFirst();
  }

  async findActiveUserById(id: string) {
    return this.db
      .selectFrom('User')
      .selectAll()
      .where('id', '=', id)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();
  }

  async findUserForJwt(id: string) {
    return this.db
      .selectFrom('User')
      .select(['id', 'email', 'role'])
      .where('id', '=', id)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();
  }

  async createUser(data: {
    name: string;
    email: string;
    password: string;
    avatarUrl?: string | null;
  }) {
    return this.db
      .insertInto('User')
      .values({
        name: data.name,
        email: data.email,
        password: data.password,
        avatarUrl: data.avatarUrl ?? null,
      })
      .returningAll()
      .executeTakeFirst();
  }

  async reactivateUser(id: string, name: string, passwordHash: string) {
    return this.db
      .updateTable('User')
      .set({
        name,
        password: passwordHash,
        deletedAt: null,
        updatedAt: new Date(),
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async reactivateGoogleUser(id: string, name?: string, avatarUrl?: string | null) {
    return this.db
      .updateTable('User')
      .set({
        deletedAt: null,
        name: name || undefined,
        avatarUrl: avatarUrl ?? undefined,
        updatedAt: new Date(),
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async updateUserAvatar(id: string, avatarUrl: string) {
    return this.db
      .updateTable('User')
      .set({
        avatarUrl,
        updatedAt: new Date(),
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async setRefreshToken(userId: string, tokenHash: string) {
    await this.db
      .deleteFrom('RefreshToken')
      .where('userId', '=', userId)
      .execute();

    await this.db
      .insertInto('RefreshToken')
      .values({
        userId,
        tokenHash,
      })
      .execute();
  }

  async deleteRefreshToken(userId: string) {
    return this.db
      .deleteFrom('RefreshToken')
      .where('userId', '=', userId)
      .execute();
  }

  async findRefreshToken(userId: string) {
    return this.db
      .selectFrom('RefreshToken')
      .selectAll()
      .where('userId', '=', userId)
      .executeTakeFirst();
  }

  async findUserForPasswordReset(email: string) {
    return this.db
      .selectFrom('User')
      .select(['id', 'email', 'resetToken', 'resetTokenExpiry'])
      .where('email', '=', email)
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

  async completePasswordReset(userId: string, hashedPassword: string) {
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
}

