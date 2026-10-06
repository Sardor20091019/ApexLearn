import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RedisService } from '../redis/redis.service';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly db: DatabaseService,
    private readonly redisService: RedisService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  private async sendOtpEmail(email: string, otp: string, purpose: string) {
    this.logger.log(`[OTP DEBUG] OTP generated for ${email} (${purpose}): ${otp}`);
    console.log(`\n========================================`);
    console.log(`[OTP VERIFICATION CODE]`);
    console.log(`Email: ${email}`);
    console.log(`Purpose: ${purpose}`);
    console.log(`OTP Code: ${otp}`);
    console.log(`========================================\n`);

    try {
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        await this.transporter.sendMail({
          from: `"ApexLearn Security" <${process.env.MAIL_FROM || 'noreply@apexlearn.com'}>`,
          to: email,
          subject: `Security OTP: ${purpose}`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #111;">
              <h2>Security Verification Code</h2>
              <p>You requested an OTP verification code to <strong>${purpose}</strong> for your account.</p>
              <p>Your One-Time Password (OTP) is:</p>
              <h1 style="color: #4F46E5; letter-spacing: 4px;">${otp}</h1>
              <p>This OTP will expire in 10 minutes.</p>
              <p>If you did not request this change, please secure your account immediately.</p>
            </div>
          `,
        });
        this.logger.log(`OTP email sent to ${email} via SMTP.`);
      }
    } catch (err) {
      this.logger.warn(`Could not send SMTP email to ${email}: ${err}`);
    }
  }

  async requestOtp(userId: string) {
    const user = await this.db
      .selectFrom('User')
      .select(['id', 'email'])
      .where('id', '=', userId)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await this.db
      .updateTable('User')
      .set({
        resetToken: otp,
        resetTokenExpiry,
        updatedAt: new Date(),
      })
      .where('id', '=', userId)
      .execute();

    await this.sendOtpEmail(user.email, otp, 'Account Security Change');

    return { message: 'OTP verification code has been sent to your email address.' };
  }

  async getUserProfile(userId: string) {
    const cacheKey = `user:${userId}`;
    const redis = this.redisService.getClient();

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return typeof cached === 'string' ? JSON.parse(cached) : cached;
      }
    } catch (err) {
      console.warn('Redis read failed in getUserProfile:', err);
    }

    const user = await this.db
      .selectFrom('User')
      .select(['id', 'email', 'name', 'role', 'avatarUrl', 'createdAt'])
      .where('id', '=', userId)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    try {
      await redis.set(cacheKey, JSON.stringify(user), { ex: 300 });
    } catch (err) {
      console.warn('Redis write failed in getUserProfile:', err);
    }

    return user;
  }

  async updateUserProfile(
    userId: string,
    data: { name?: string; email?: string; avatarUrl?: string; otp?: string },
  ) {
    const user = await this.db
      .selectFrom('User')
      .select(['id', 'email', 'resetToken', 'resetTokenExpiry'])
      .where('id', '=', userId)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    const updatePayload: Record<string, any> = { updatedAt: new Date() };

    if (data.name) updatePayload.name = data.name;
    if (data.avatarUrl !== undefined) updatePayload.avatarUrl = data.avatarUrl;

    if (data.email && data.email !== user.email) {
      if (!data.otp) {
        throw new BadRequestException('OTP code is required to change your email address. Click "Send OTP" first.');
      }

      if (!user.resetToken || user.resetToken !== data.otp) {
        throw new BadRequestException('Invalid OTP code.');
      }

      if (!user.resetTokenExpiry || new Date() > new Date(user.resetTokenExpiry)) {
        throw new BadRequestException('OTP code has expired. Please request a new OTP code.');
      }

      const existingUser = await this.db
        .selectFrom('User')
        .select('id')
        .where('email', '=', data.email)
        .where('id', '!=', userId)
        .where('deletedAt', 'is', null)
        .executeTakeFirst();

      if (existingUser) {
        throw new BadRequestException('This email is already registered to another account.');
      }

      updatePayload.email = data.email;
      updatePayload.resetToken = null;
      updatePayload.resetTokenExpiry = null;
    }

    const updatedUser = await this.db
      .updateTable('User')
      .set(updatePayload)
      .where('id', '=', userId)
      .where('deletedAt', 'is', null)
      .returning(['id', 'email', 'name', 'role', 'avatarUrl', 'createdAt', 'updatedAt'])
      .executeTakeFirst();

    if (!updatedUser) {
      throw new NotFoundException('User profile not found');
    }

    const redis = this.redisService.getClient();
    try {
      await redis.del(`user:${userId}`);
    } catch (err) {
      console.warn('Redis del failed in updateUserProfile:', err);
    }

    return updatedUser;
  }

  async changePassword(userId: string, data: { newPassword?: string; otp?: string }) {
    if (!data.otp) {
      throw new BadRequestException('OTP code is required to change password. Click "Send OTP" first.');
    }

    if (!data.newPassword || data.newPassword.length < 6) {
      throw new BadRequestException('New password must be at least 6 characters long.');
    }

    const user = await this.db
      .selectFrom('User')
      .select(['id', 'email', 'resetToken', 'resetTokenExpiry'])
      .where('id', '=', userId)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();

    if (!user) {
      throw new NotFoundException('User account not found');
    }

    if (!user.resetToken || user.resetToken !== data.otp) {
      throw new BadRequestException('Invalid OTP code.');
    }

    if (!user.resetTokenExpiry || new Date() > new Date(user.resetTokenExpiry)) {
      throw new BadRequestException('OTP code has expired. Please request a new OTP code.');
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 10);

    await this.db
      .updateTable('User')
      .set({
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        updatedAt: new Date(),
      })
      .where('id', '=', userId)
      .execute();

    const redis = this.redisService.getClient();
    try {
      await redis.del(`user:${userId}`);
    } catch (err) {
      console.warn('Redis del failed in changePassword:', err);
    }

    return { message: 'Password has been updated successfully.' };
  }

  async deleteUserProfile(userId: string) {
    const result = await this.db
      .updateTable('User')
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where('id', '=', userId)
      .returning(['id'])
      .executeTakeFirst();

    if (!result) {
      throw new NotFoundException('User account not found');
    }

    const redis = this.redisService.getClient();
    try {
      await redis.del(`user:${userId}`);
    } catch (err) {
      console.warn('Redis del failed in deleteUserProfile:', err);
    }

    return { message: 'Account soft-deleted successfully' };
  }
}
