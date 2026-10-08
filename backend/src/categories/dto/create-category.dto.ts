import { IsString, IsNotEmpty, IsOptional, IsUrl } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name;

  @IsString()
  @IsOptional()
  @IsUrl()
  imageUrl?: string;
}