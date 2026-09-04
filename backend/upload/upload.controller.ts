import { Controller, Post, UploadedFile, UseInterceptors, Body, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { UploadType } from '../common/enums';
import { Request } from 'express';
import 'multer';

interface RequestWithUser extends Request {
  user?: {
    sub: string;
    email: string;
  };
}

@Controller('uploads')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @Req() req: RequestWithUser,
    @UploadedFile() file: Express.Multer.File,
    @Body('type') type: UploadType,
  ): Promise<any> {
    const userId = req.user?.sub ?? 'temp-user-id';
    return this.uploadService.uploadFile(userId, file, type || UploadType.IMAGE);
  }
}