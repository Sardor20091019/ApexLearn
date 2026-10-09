import { IsArray, IsEmail, IsOptional, IsUUID } from 'class-validator';

export class CreateCheckoutDto {
  @IsUUID()
  @IsOptional()
  courseId?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  courseIds?: string[];

  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsEmail()
  @IsOptional()
  email?: string;
}
