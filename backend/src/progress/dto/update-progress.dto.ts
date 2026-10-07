import { IsBoolean, IsUUID } from 'class-validator';

export class UpdateProgressDto {
  @IsUUID()
  lessonId;

  @IsBoolean()
  completed;
}