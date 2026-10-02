import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, IsBoolean, Min } from 'class-validator';
import { PricingType } from '../../common/enums';
export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsNotEmpty()
  categoryId!: string;

  @IsOptional()
  @IsEnum(PricingType)
  pricingType?: PricingType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;
}

export class CreateSectionDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsNumber()
  order!: number;
}

export class CreateLessonDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsBoolean()
  freePreview?: boolean;

  @IsNumber()
  order!: number;
}