import { Controller, Get, Post, Body, Param, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { SupportService } from './support.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('support')
@UseGuards(JwtAuthGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('messages')
  async getMyMessages(@Req() req: any) {
    const userId = req.user.id || req.user.userId;
    return await this.supportService.getMessagesForUser(userId);
  }

  @Get('admin/conversations')
  async getAdminConversations(@Req() req: any) {
    const role = (req.user.role || '').toUpperCase();
    return await this.supportService.getAllConversationsForAdmin(role);
  }

  @Get('admin/messages/:userId')
  async getAdminUserMessages(@Req() req: any, @Param('userId') targetUserId: string) {
    const role = (req.user.role || '').toUpperCase();
    if (role !== 'ADMIN') throw new ForbiddenException('Admins only');
    return await this.supportService.getMessagesForUser(targetUserId);
  }

  @Post('messages')
  async sendMessage(@Req() req: any, @Body() body: { message: string; targetUserId?: string }) {
    const userId = req.user.id || req.user.userId;
    const role = (req.user.role || '').toUpperCase();
    return await this.supportService.sendMessage(userId, role, body.targetUserId, body.message);
  }
}