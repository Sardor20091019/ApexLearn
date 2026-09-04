import { IsNotEmpty, IsOptional, IsInt, IsString, IsBoolean } from 'class-validator';

export class CreateSectionDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsInt()
  order?: number;
}

export class CreateLessonDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsBoolean()
  freePreview?: boolean;

  @IsOptional()
  @IsInt()
  order?: number;
}