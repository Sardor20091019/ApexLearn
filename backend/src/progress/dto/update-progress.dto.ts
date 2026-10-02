import { IsBoolean, IsUUID } from 'class-validator';

export class UpdateProgressDto {
  @IsUUID()
  lessonId: string;

  @IsBoolean()
  completed: boolean;
}