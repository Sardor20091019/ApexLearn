import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from 'ffmpeg-static';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { DatabaseService } from '../database/database.service';

if (ffmpegInstaller) {
  ffmpeg.setFfmpegPath(ffmpegInstaller);
}

export interface AudioJobPayload {
  chapterId: string;
  videoUrl: string;
  outputFilename?: string;
}

@Processor('audio', { concurrency: 5 })
export class AudioProcessor extends WorkerHost {
  private readonly logger = new Logger(AudioProcessor.name);

  constructor(private readonly db: DatabaseService) {
    super();
  }

  async process(job: Job<AudioJobPayload, void, string>): Promise<void> {
    this.logger.log(`[Job ${job.id}] Started processing audio job: ${job.name}`);

    switch (job.name) {
      case 'extract-audio':
      case 'process-audio': {
        await this.handleAudioExtraction(job);
        break;
      }
      default:
        this.logger.warn(`[Job ${job.id}] Unhandled job name: ${job.name}`);
    }
  }

  private async handleAudioExtraction(job: Job<AudioJobPayload>): Promise<void> {
    const { videoUrl, chapterId, outputFilename } = job.data;

    if (!videoUrl) {
      throw new Error(`[Job ${job.id}] Missing 'videoUrl' in job payload.`);
    }

    const tempDir = os.tmpdir();
    const fileName = outputFilename || `audio_${job.id}_${Date.now()}.mp3`;
    const outputPath = path.join(tempDir, fileName);

    this.logger.log(`[Job ${job.id}] Extracting audio from: ${videoUrl}`);

    try {
      // 1. Run FFmpeg extraction
      await new Promise<void>((resolve, reject) => {
        ffmpeg(videoUrl)
          .noVideo()
          .audioCodec('libmp3lame')
          .audioBitrate(128)
          .format('mp3')
          .output(outputPath)
          .on('start', (commandLine) => {
            this.logger.log(`[Job ${job.id}] Executing FFmpeg command: ${commandLine}`);
          })
          .on('progress', (progress) => {
            if (progress.percent) {
              const percent = Math.min(100, Math.max(0, Math.round(progress.percent)));
              job.updateProgress(percent);
            }
          })
          .on('end', () => {
            this.logger.log(`[Job ${job.id}] FFmpeg extraction finished successfully.`);
            resolve();
          })
          .on('error', (err) => {
            this.logger.error(`[Job ${job.id}] FFmpeg error: ${err.message}`, err.stack);
            reject(err);
          })
          .run();
      });

      // NOTE: If you are uploading to Cloud Storage (AWS S3, Cloudinary, etc.),
      // upload `outputPath` here and assign the resulting public URL to `audioUrl`.
      const permanentAudioUrl = outputPath; // Replace with cloud storage URL if applicable

      // 2. Update Database
      if (chapterId) {
        this.logger.log(`[Job ${job.id}] Updating database for chapter: ${chapterId}`);
        await this.db
          .updateTable('sections')
          .set({
            audioUrl: permanentAudioUrl,
            updatedAt: new Date(),
          } as any)
          .where('id', '=', chapterId)
          .execute();
      }

      this.logger.log(`[Job ${job.id}] Completed audio job successfully.`);
    } catch (error: any) {
      this.logger.error(`[Job ${job.id}] Audio extraction failed: ${error.message}`);
      throw error;
    } finally {
      // 3. Clean up temporary local file
      if (fs.existsSync(outputPath)) {
        try {
          fs.unlinkSync(outputPath);
          this.logger.log(`[Job ${job.id}] Cleaned temp file: ${outputPath}`);
        } catch (cleanupErr: any) {
          this.logger.warn(`[Job ${job.id}] Failed deleting temp file: ${cleanupErr.message}`);
        }
      }
    }
  }
}