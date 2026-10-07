import { Controller, Get, Post, Body, Param, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { SupportService } from './support.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/types';

@Controller('support')
@UseGuards(JwtAuthGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('messages')
  async getMyMessages(@Req() req: AuthenticatedRequest) {
    const userId = req.user.id || req.user.sub || '';
    return await this.supportService.getMessagesForUser(userId);
  }

  @Get('admin/conversations')
  async getAdminConversations(@Req() req: AuthenticatedRequest) {
    const role = (req.user.role || '').toUpperCase();
    return await this.supportService.getAllConversationsForAdmin(role);
  }

  @Get('admin/messages/:userId')
  async getAdminUserMessages(@Req() req: AuthenticatedRequest, @Param('userId') targetUserId: string) {
    const role = (req.user.role || '').toUpperCase();
    if (role !== 'ADMIN') throw new ForbiddenException('Admins only');
    return await this.supportService.getMessagesForUser(targetUserId);
  }

  @Post('messages')
  async sendMessage(@Req() req: AuthenticatedRequest, @Body() body: { message: string; targetUserId?: string }) {
    const userId = req.user.id || req.user.sub || '';
    const role = (req.user.role || '').toUpperCase();
    return await this.supportService.sendMessage(userId, role, body.targetUserId, body.message);
  }
}