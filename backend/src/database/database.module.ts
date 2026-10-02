import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Global()
@Module({
  providers: [
    DatabaseService,
    {
      provide: 'DATABASE_CONNECTION',
      useExisting: DatabaseService, 
    },
  ],
  exports: [DatabaseService, 'DATABASE_CONNECTION'],
})
export class DatabaseModule {}