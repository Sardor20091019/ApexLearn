import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3001',
    credentials: true,
  });

  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/queues');

  const mailQueue = app.get<Queue>(getQueueToken('mail'));
  const audioQueue = app.get<Queue>(getQueueToken('audio'));

  createBullBoard({
    queues: [
      new BullMQAdapter(mailQueue), 
      new BullMQAdapter(audioQueue),
    ],
    serverAdapter: serverAdapter,
  });

  app.use('/queues', serverAdapter.getRouter());

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api/v1`);
  console.log(`Bull Board Dashboard available at: http://localhost:${port}/queues`);
}
bootstrap();
