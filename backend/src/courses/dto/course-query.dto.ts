import { IsOptional, IsInt, Min, Max, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CourseQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 12;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  sort?: 'featured' | 'newest' | 'oldest' | 'low' | 'high' | 'rating' = 'newest';

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  tier?: 'all' | 'free' | 'paid' = 'all';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;
}
