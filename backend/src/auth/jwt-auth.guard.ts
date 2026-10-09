import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

//agar user authenticated bo'lmasa, 401 Unauthorized error qaytaradi.
//har bir route uchun agar user authenticated bo'lishini hohlasa, shu guardi route ga qo'shish kerak.