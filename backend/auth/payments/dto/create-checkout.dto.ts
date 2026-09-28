import { IsString, IsEmail, IsOptional, IsUUID } from 'class-validator';

export class CreateCheckoutDto {
  @IsUUID()
  courseId: string;

  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsEmail()
  @IsOptional()
  email?: string;
}