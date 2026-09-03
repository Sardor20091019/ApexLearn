import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() dto: SignupDto): Promise<any> {
    this.logger.log(`POST /auth/signup triggered for email: ${dto.email}`);
    console.log('[DEBUG] AuthController.signup payload:', { ...dto, password: '[PROTECTED]' });
    
    try {
      const result = await this.authService.signup(dto);
      console.log('[DEBUG] AuthController.signup succeeded');
      return result;
    } catch (error) {
      console.error('[ERROR] AuthController.signup failed:', error);
      throw error;
    }
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signin(@Body() dto: SigninDto): Promise<any> {
    this.logger.log(`POST /auth/signin triggered for email: ${dto.email}`);
    console.log('[DEBUG] AuthController.signin payload:', { email: dto.email });

    try {
      const result = await this.authService.signin(dto);
      console.log('[DEBUG] AuthController.signin succeeded');
      return result;
    } catch (error) {
      console.error('[ERROR] AuthController.signin failed:', error);
      throw error;
    }
  }
}