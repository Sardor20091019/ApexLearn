import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail()
  email;

  @IsString()
  @Length(6, 6)
  otp;

  @IsString()
  @IsNotEmpty()
  newPassword;
}