import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

//agar user authenticated bo'lmasa, 401 Unauthorized error qaytaradi.