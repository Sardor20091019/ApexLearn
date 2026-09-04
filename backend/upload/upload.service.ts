import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { UploadType } from '../common/enums';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../src/database/database.service';

@Injectable()
export class UploadService {
  private s3Client: S3Client;

  constructor(private database: DatabaseService ) {
    const minioUrl = new URL(process.env.MINIO_URL || 'http://localhost:9000');
    
    this.s3Client = new S3Client({
      region: 'us-east-1',
      endpoint: minioUrl.origin,
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.MINIO_USER || 'minioadmin',
        secretAccessKey: process.env.MINIO_PASS || 'minioadmin',
      },
    });
  }

  private getBucketName(type: UploadType): string {
    switch (type) {
      case 'VIDEO':
        return process.env.MINIO_BUCKET_VIDEO || 'videos';
      case 'IMAGE':
        return process.env.MINIO_BUCKET_IMAGE || 'images';
      case 'DOCUMENT':
        return process.env.MINIO_BUCKET_DOCUMENT || 'documents';
      default:
        return process.env.MINIO_BUCKET_IMAGE || 'images';
    }
  }

  async uploadFile(userId: string, file: Express.Multer.File, type: UploadType) {
    const bucketName = this.getBucketName(type);
    const fileExtension = file.originalname.split('.').pop();
    const key = `${type.toLowerCase()}/${uuidv4()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    try {
      await this.s3Client.send(command);

      return this.database.insertInto('Upload').values({
        userId,
        key,
        bucket: bucketName,
        type,
        mimeType: file.mimetype,
        sizeBytes: file.size,
      });
    } catch (error) {
      throw new InternalServerErrorException(`Failed to upload file: ${(error as Error).message}`);
    }
  }
}